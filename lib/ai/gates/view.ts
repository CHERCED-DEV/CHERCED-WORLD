import type { GateRun, GateStep } from './schema'

export const REPLAY_STEP_MS = 700

export function canRequestChanges(run: Pick<GateRun, 'rounds' | 'stop'>): boolean {
  const last = run.rounds.at(-1)
  return Boolean(last && last.round < 3 && last.reviewed && run.stop !== 'no-es-software' && run.stop !== 'revision-no-disponible')
}

export function roundEnds(steps: readonly GateStep[]): Map<number, number> {
  const ends = new Map<number, number>()
  steps.forEach((step, index) => ends.set(step.round, index + 1))
  return ends
}

export function roundVisible(run: Pick<GateRun, 'steps'>, round: number, shown: number): boolean {
  const end = roundEnds(run.steps).get(round)
  return end === undefined ? shown >= run.steps.length : shown >= end
}

export function replayMs(run: Pick<GateRun, 'steps'>, stepMs = REPLAY_STEP_MS): number {
  return run.steps.length * stepMs
}

export function standingCounts(run: Pick<GateRun, 'rounds'>): { findings: number; knockedDown: number } {
  const all = run.rounds.flatMap((round) => round.findings.filter((item) => !item.carried))
  return { findings: all.length, knockedDown: all.filter((item) => item.verification?.result === 'se-cae').length }
}
