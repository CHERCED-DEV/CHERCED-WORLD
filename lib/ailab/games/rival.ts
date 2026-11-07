import {
  adamStep,
  backward,
  createGrads,
  createTrace,
  forward,
  sample,
  seededRandom,
  zeroGrads,
  type Adam,
  type Net,
  type Random,
} from './net'
import { BALL_RADIUS, COURT, MAX_SPEED, PADDLE, SERVE_SPEED, contactU, createRally, step, type RallyState } from './physics'
import { ACTIONS, DECIDE_EVERY, SENSES, intentOf, senses } from './policy'

export type Episode = { inputs: Float32Array; actions: Uint8Array; rewards: Float32Array }

export type ReinforceOptions = { gamma: number; lr: number; epochs: number; entropy: number }

export const REINFORCE_DEFAULTS: ReinforceOptions = { gamma: 0.6, lr: 0.008, epochs: 3, entropy: 0.003 }

export const HIT_REWARD = 1

export const MISS_PENALTY = -1

export const SHAPING = 4

export type ReinforceStats = { samples: number; meanReturn: number; entropy: number }

export function discountedReturns(rewards: ArrayLike<number>, gamma: number): Float32Array {
  const out = new Float32Array(rewards.length)
  let running = 0
  for (let t = rewards.length - 1; t >= 0; t -= 1) {
    running = rewards[t]! + gamma * running
    out[t] = running
  }
  return out
}

export function reinforce(net: Net, adam: Adam, episodes: readonly Episode[], options: ReinforceOptions = REINFORCE_DEFAULTS): ReinforceStats {
  const usable = episodes.filter((episode) => episode.actions.length > 0)
  const total = usable.reduce((sum, episode) => sum + episode.actions.length, 0)
  if (total === 0) return { samples: 0, meanReturn: 0, entropy: 0 }
  const advantages = new Float32Array(total)
  let offset = 0
  for (const episode of usable) {
    advantages.set(discountedReturns(episode.rewards, options.gamma), offset)
    offset += episode.actions.length
  }
  let mean = 0
  for (let i = 0; i < total; i += 1) mean += advantages[i]!
  mean /= total
  let variance = 0
  for (let i = 0; i < total; i += 1) variance += (advantages[i]! - mean) ** 2
  const std = Math.sqrt(variance / total) || 1
  for (let i = 0; i < total; i += 1) advantages[i] = (advantages[i]! - mean) / std

  const trace = createTrace(net)
  const grads = createGrads(net)
  const scratch = net.sizes.map((size) => new Float32Array(size))
  const dLogits = new Float32Array(ACTIONS)
  let entropy = 0
  for (let epoch = 0; epoch < options.epochs; epoch += 1) {
    zeroGrads(grads)
    entropy = 0
    let index = 0
    for (const episode of usable) {
      for (let t = 0; t < episode.actions.length; t += 1) {
        forward(net, episode.inputs.subarray(t * SENSES, (t + 1) * SENSES), trace)
        const probs = trace.probs
        let h = 0
        for (let j = 0; j < ACTIONS; j += 1) h -= probs[j]! * Math.log(probs[j]! + 1e-9)
        entropy += h
        const advantage = advantages[index]!
        const action = episode.actions[t]!
        for (let j = 0; j < ACTIONS; j += 1) {
          const p = probs[j]!
          const policy = advantage * (p - (j === action ? 1 : 0))
          const spread = options.entropy * p * (Math.log(p + 1e-9) + h)
          dLogits[j] = policy + spread
        }
        backward(net, trace, dLogits, grads, scratch)
        index += 1
      }
    }
    adamStep(net, grads, adam, options.lr, 1 / total)
  }
  return { samples: total, meanReturn: mean, entropy: entropy / total }
}

export type EpisodeBuilder = {
  inputs: number[]
  actions: number[]
  rewards: number[]
  pending: { phi: number; context: number } | null
  bonus: number
  shaping: number
}

export function createEpisodeBuilder(shaping: number = SHAPING): EpisodeBuilder {
  return { inputs: [], actions: [], rewards: [], pending: null, bonus: 0, shaping }
}

export function recordDecision(builder: EpisodeBuilder, input: ArrayLike<number>, action: number, phi: number, context: number): void {
  const { pending } = builder
  if (pending) builder.rewards.push(builder.bonus + (pending.context === context ? builder.shaping * (phi - pending.phi) : 0))
  builder.bonus = 0
  for (let i = 0; i < SENSES; i += 1) builder.inputs.push(input[i] ?? 0)
  builder.actions.push(action)
  builder.pending = { phi, context }
}

export function rewardEvent(builder: EpisodeBuilder, value: number): void {
  builder.bonus += value
}

export function finishEpisode(builder: EpisodeBuilder): Episode | null {
  if (builder.pending) builder.rewards.push(builder.bonus)
  const episode =
    builder.actions.length === 0
      ? null
      : { inputs: Float32Array.from(builder.inputs), actions: Uint8Array.from(builder.actions), rewards: Float32Array.from(builder.rewards) }
  builder.inputs = []
  builder.actions = []
  builder.rewards = []
  builder.pending = null
  builder.bonus = 0
  return episode
}

export type EvaluateOptions = { serves?: number; seed?: number }

export function incomingBall(state: RallyState, random: Random): void {
  const speed = SERVE_SPEED + random() * (MAX_SPEED * 0.85 - SERVE_SPEED)
  const angle = (random() * 2 - 1) * 0.8
  state.phase = 'play'
  state.ball.u = 0.25 + random() * 0.1
  state.ball.v = BALL_RADIUS + random() * (COURT.width - 2 * BALL_RADIUS)
  state.ball.du = speed * Math.cos(angle)
  state.ball.dv = speed * Math.sin(angle)
  state.paddles.rival.v = PADDLE.half + random() * (COURT.width - 2 * PADDLE.half)
  state.hits = { player: 0, rival: 0 }
  state.chances = { player: 0, rival: 1 }
}

export function evaluateReturns(net: Net, options: EvaluateOptions = {}): number {
  const serves = options.serves ?? 80
  const random = seededRandom(options.seed ?? 7)
  const trace = createTrace(net)
  const input = new Float32Array(SENSES)
  let returned = 0
  for (let n = 0; n < serves; n += 1) {
    const state = createRally(n + 1)
    incomingBall(state, random)
    let intent = 0
    for (let tick = 0; tick < 600; tick += 1) {
      if (tick % DECIDE_EVERY === 0) {
        forward(net, senses(state, 'rival', input), trace)
        intent = intentOf(sample(trace.probs, random))
      }
      const events = step(state, { player: 0, rival: intent })
      if (events.hit === 'rival') {
        returned += 1
        break
      }
      if (events.point || state.ball.u > contactU('rival') + BALL_RADIUS * 4) break
    }
  }
  return returned / serves
}
