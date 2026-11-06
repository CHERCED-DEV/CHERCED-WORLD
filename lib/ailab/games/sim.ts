import { CLONE_MIN_SAMPLES, CLONE_RECORD_RALLIES, demoFromRecorder, imitate, recordedSamples } from './clone'
import { Match } from './match'
import { NET_SIZES, createAdam, createNet, seededRandom, type Adam, type Net } from './net'
import { COURT, forecastV, type RallyState } from './physics'
import { towardTarget } from './policy'
import { REINFORCE_DEFAULTS, evaluateReturns, reinforce, type ReinforceOptions } from './rival'

export type TrainingRun = {
  before: number
  after: number
  curve: Array<number | null>
  rallies: number
  net: Net
  adam: Adam
}

export type TrainingRunOptions = {
  rallies?: number
  seed?: number
  coachSkill?: number
  options?: ReinforceOptions
  net?: Net
  adam?: Adam
  evaluation?: { serves?: number; seed?: number }
  maxTicks?: number
}

export function trainingRun(run: TrainingRunOptions = {}): TrainingRun {
  const seed = run.seed ?? 3
  const net = run.net ?? createNet(NET_SIZES, seededRandom(seed))
  const adam = run.adam ?? createAdam(net)
  const rallies = run.rallies ?? 20
  const options = run.options ?? REINFORCE_DEFAULTS
  const match = new Match({ seed, net, rivalDriver: 'net', playerDriver: 'coach', learn: true, coachSkill: run.coachSkill ?? 0.9 })
  const before = evaluateReturns(net, run.evaluation)
  const curve: Array<number | null> = []
  const limit = run.maxTicks ?? rallies * 60 * 60
  for (let tick = 0; tick < limit && curve.length < rallies; tick += 1) {
    match.tick()
    for (const outcome of match.takeOutcomes()) {
      reinforce(net, adam, outcome.episodes, options)
      curve.push(outcome.rate)
    }
  }
  return { before, after: evaluateReturns(net, run.evaluation), curve, rallies: curve.length, net, adam }
}

export function meanRate(values: ReadonlyArray<number | null>): number | null {
  const known = values.filter((value): value is number => value !== null)
  if (known.length === 0) return null
  return known.reduce((sum, value) => sum + value, 0) / known.length
}

export type Style = (state: RallyState) => number

const HALF = COURT.width / 2

function track(state: RallyState, fallback: number): number {
  return forecastV(state.ball, 'player') ?? fallback
}

export const STYLES: Record<'chaser' | 'top' | 'bottom', Style> = {
  chaser: (state) => towardTarget(state.paddles.player.v, state.phase === 'play' ? track(state, HALF) : HALF),
  top: (state) => {
    const arrival = state.phase === 'play' ? forecastV(state.ball, 'player') : null
    const target = arrival !== null && arrival < HALF ? arrival : COURT.width * 0.2
    return towardTarget(state.paddles.player.v, target)
  },
  bottom: (state) => {
    const arrival = state.phase === 'play' ? forecastV(state.ball, 'player') : null
    const target = arrival !== null && arrival > HALF ? arrival : COURT.width * 0.8
    return towardTarget(state.paddles.player.v, target)
  },
}

export type CloneRun = { similarity: number; curve: number[]; samples: number; humanMean: number; cloneMean: number; net: Net }

export async function cloneRun({ style, seed = 5, rallies = CLONE_RECORD_RALLIES }: { style: Style; seed?: number; rallies?: number }): Promise<CloneRun> {
  const match = new Match({ seed, rivalDriver: 'coach', playerDriver: 'human', record: true })
  let played = 0
  let sum = 0
  let count = 0
  for (let tick = 0; tick < 60 * 60 * 10 && (played < rallies || recordedSamples(match.recorder) < CLONE_MIN_SAMPLES); tick += 1) {
    match.human.intent = style(match.state)
    if (match.state.phase === 'play') {
      sum += match.state.paddles.player.v
      count += 1
    }
    match.tick()
    played += match.takeOutcomes().length
  }
  const net = createNet(NET_SIZES, seededRandom(seed + 100))
  const result = await imitate(net, createAdam(net), demoFromRecorder(match.recorder))
  const rematch = new Match({ seed: seed + 1, net, rivalDriver: 'net', playerDriver: 'coach' })
  let cloneSum = 0
  let cloneCount = 0
  for (let tick = 0; tick < 60 * 90; tick += 1) {
    rematch.tick()
    if (rematch.state.phase === 'play') {
      cloneSum += rematch.state.paddles.rival.v
      cloneCount += 1
    }
  }
  return {
    similarity: result.similarity,
    curve: result.curve,
    samples: result.samples,
    humanMean: sum / Math.max(1, count),
    cloneMean: cloneSum / Math.max(1, cloneCount),
    net,
  }
}
