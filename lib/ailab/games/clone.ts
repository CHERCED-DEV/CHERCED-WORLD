import { adamStep, argmax, backward, createGrads, createTrace, forward, seededRandom, zeroGrads, type Adam, type Net } from './net'
import type { RallyState } from './physics'
import { ACTIONS, SENSES, actionFromMove, senses } from './policy'

export type Demonstration = { inputs: Float32Array; actions: Uint8Array }

export type ImitateOptions = { epochs: number; lr: number; batch: number; holdout: number; seed: number }

export const IMITATE_DEFAULTS: ImitateOptions = { epochs: 24, lr: 0.01, batch: 48, holdout: 0.2, seed: 11 }

export const CLONE_RECORD_RALLIES = 3

export const CLONE_MIN_SAMPLES = 120

export const CLONE_MAX_SAMPLES = 3000

export const CLASS_BALANCE = 0.5

export type ImitateResult = { similarity: number; curve: number[]; samples: number; loss: number }

export type DemoRecorder = { inputs: number[]; actions: number[]; pending: Float32Array | null; lastV: number }

export function resetRecorder(recorder: DemoRecorder): void {
  recorder.inputs = []
  recorder.actions = []
  recorder.pending = null
}

export function createDemoRecorder(): DemoRecorder {
  return { inputs: [], actions: [], pending: null, lastV: 0 }
}

export function recordMove(recorder: DemoRecorder, state: RallyState): void {
  const v = state.paddles.player.v
  if (recorder.pending && state.phase === 'play' && recorder.actions.length < CLONE_MAX_SAMPLES) {
    for (let i = 0; i < SENSES; i += 1) recorder.inputs.push(recorder.pending[i]!)
    recorder.actions.push(actionFromMove(v - recorder.lastV))
  }
  recorder.pending = state.phase === 'play' ? senses(state, 'player') : null
  recorder.lastV = v
}

export function recordedSamples(recorder: DemoRecorder): number {
  return recorder.actions.length
}

export function demoFromRecorder(recorder: DemoRecorder): Demonstration {
  return { inputs: Float32Array.from(recorder.inputs), actions: Uint8Array.from(recorder.actions) }
}

export function shuffled(count: number, seed: number): number[] {
  const random = seededRandom(seed)
  const order = Array.from({ length: count }, (_, index) => index)
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = order[i]!
    order[i] = order[j]!
    order[j] = swap
  }
  return order
}

export function splitDemo(count: number, holdout: number, seed: number): { train: number[]; test: number[] } {
  const order = shuffled(count, seed)
  const testSize = count < 10 ? 0 : Math.max(1, Math.round(count * holdout))
  return { test: order.slice(0, testSize), train: order.slice(testSize) }
}

export function agreement(net: Net, demo: Demonstration, indices?: readonly number[]): number {
  const trace = createTrace(net)
  const list = indices ?? Array.from({ length: demo.actions.length }, (_, index) => index)
  if (list.length === 0) return 0
  let same = 0
  for (const index of list) {
    forward(net, demo.inputs.subarray(index * SENSES, (index + 1) * SENSES), trace)
    if (argmax(trace.probs) === demo.actions[index]) same += 1
  }
  return same / list.length
}

export function classWeights(actions: Uint8Array): Float32Array {
  const counts = new Float32Array(ACTIONS)
  for (const action of actions) counts[action] = counts[action]! + 1
  const weights = new Float32Array(ACTIONS)
  for (let c = 0; c < ACTIONS; c += 1) weights[c] = counts[c]! > 0 ? (actions.length / (ACTIONS * counts[c]!)) ** CLASS_BALANCE : 0
  let mean = 0
  for (const action of actions) mean += weights[action]!
  mean = actions.length > 0 ? mean / actions.length : 1
  for (let c = 0; c < ACTIONS; c += 1) weights[c] = weights[c]! / (mean || 1)
  return weights
}

export async function imitate(
  net: Net,
  adam: Adam,
  demo: Demonstration,
  options: ImitateOptions = IMITATE_DEFAULTS,
  hooks: { checkpoint?: () => void | Promise<void>; onEpoch?: (epoch: number, similarity: number) => void } = {},
): Promise<ImitateResult> {
  const count = demo.actions.length
  const { train, test } = splitDemo(count, options.holdout, options.seed)
  const weights = classWeights(demo.actions)
  const trace = createTrace(net)
  const grads = createGrads(net)
  const scratch = net.sizes.map((size) => new Float32Array(size))
  const dLogits = new Float32Array(ACTIONS)
  const curve: number[] = []
  const evaluateOn = test.length > 0 ? test : train
  let loss = 0
  curve.push(agreement(net, demo, evaluateOn))
  for (let epoch = 0; epoch < options.epochs; epoch += 1) {
    await hooks.checkpoint?.()
    const order = shuffled(train.length, options.seed + epoch + 1).map((index) => train[index]!)
    loss = 0
    for (let start = 0; start < order.length; start += options.batch) {
      zeroGrads(grads)
      const batch = order.slice(start, start + options.batch)
      for (const index of batch) {
        forward(net, demo.inputs.subarray(index * SENSES, (index + 1) * SENSES), trace)
        const target = demo.actions[index]!
        const weight = weights[target]!
        loss -= weight * Math.log(trace.probs[target]! + 1e-9)
        for (let j = 0; j < ACTIONS; j += 1) dLogits[j] = weight * (trace.probs[j]! - (j === target ? 1 : 0))
        backward(net, trace, dLogits, grads, scratch)
      }
      adamStep(net, grads, adam, options.lr, 1 / batch.length)
    }
    loss /= Math.max(1, order.length)
    curve.push(agreement(net, demo, evaluateOn))
    hooks.onEpoch?.(epoch + 1, curve[curve.length - 1]!)
  }
  return { similarity: curve[curve.length - 1] ?? 0, curve, samples: count, loss }
}
