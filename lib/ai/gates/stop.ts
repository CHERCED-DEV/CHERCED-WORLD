import { blockers, counted } from './merge'
import type { GateRound, MergedFinding, Recommendation, StopReason } from './schema'

export const GATE_RUN_CAP_USD = 0.05

export const MAX_AUTO_ROUNDS = 2

export const FAIL_CLOSED_STOPS: readonly StopReason[] = ['revision-no-disponible', 'no-es-software']

export type StopState = {
  round: number
  findings: readonly MergedFinding[]
  previousBlockers: number | null
  spentUsd: number
  nextEstimateUsd: number
  budgetOk: boolean
}

export function shouldStop(state: StopState): StopReason | null {
  const standing = counted(state.findings)
  if (!standing.some((item) => item.gravity !== 'menor')) return 'limpia'
  if (state.previousBlockers !== null && blockers(state.findings) > state.previousBlockers) return 'empeoro'
  if (state.round > MAX_AUTO_ROUNDS) return 'ronda-pedida'
  if (state.round === MAX_AUTO_ROUNDS) return 'dos-rondas'
  if (overCap(state.spentUsd, state.nextEstimateUsd)) return 'tope-corrida'
  if (!state.budgetOk) return 'sin-presupuesto'
  return null
}

export function recommend(findings: readonly MergedFinding[]): Recommendation {
  const standing = counted(findings)
  if (standing.some((item) => item.gravity === 'bloqueante')) return 'no-lista'
  if (standing.some((item) => item.gravity === 'importante')) return 'con-reservas'
  return 'lista'
}

export function recommendRun(round: Pick<GateRound, 'findings' | 'reviewed'>, stop: StopReason): Recommendation {
  if (FAIL_CLOSED_STOPS.includes(stop) || !round.reviewed) return 'no-lista'
  return recommend(round.findings)
}

export function overCap(spentUsd: number, nextUsd: number, capUsd = GATE_RUN_CAP_USD): boolean {
  return spentUsd + nextUsd > capUsd + 1e-12
}
