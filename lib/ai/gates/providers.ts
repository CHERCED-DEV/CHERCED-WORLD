import { costUsd } from '@/lib/ai/providers/cost'
import { modelFor } from '@/lib/ai/providers/models'
import { PAID_PROVIDERS, type ModelTask, type PaidProviderId, type ProviderId, type TokenUsage } from '@/lib/ai/providers/types'
import type { MergedFinding } from './schema'

export const WRITER_TASK: ModelTask = 'balanced'

export const REVIEWER_TASK: ModelTask = 'balanced'

export const VERIFIER_TASK: ModelTask = 'cheap'

export const MAX_REVIEWERS = 2

export const VERIFY_CONFIDENCE_BELOW = 0.6

export const STEP_ESTIMATES: Readonly<Record<'redactar' | 'corregir' | 'revisar' | 'verificar', TokenUsage>> = {
  redactar: { inputTokens: 1800, outputTokens: 1500 },
  corregir: { inputTokens: 2500, outputTokens: 1500 },
  revisar: { inputTokens: 2800, outputTokens: 700 },
  verificar: { inputTokens: 1500, outputTokens: 300 },
}

export function isPaid(provider: ProviderId | 'deterministic' | null | undefined): provider is PaidProviderId {
  return provider !== null && provider !== undefined && (PAID_PROVIDERS as readonly string[]).includes(provider)
}

export function seatsFrom(available: readonly ProviderId[]): PaidProviderId[] {
  return PAID_PROVIDERS.filter((provider) => available.includes(provider))
}

export function seatUsd(seat: PaidProviderId, task: ModelTask, estimate: TokenUsage): number {
  return costUsd(modelFor(seat, task), estimate) ?? Number.POSITIVE_INFINITY
}

function byPrice(seats: readonly PaidProviderId[], task: ModelTask, estimate: TokenUsage): PaidProviderId[] {
  return [...seats].sort((a, b) => seatUsd(a, task, estimate) - seatUsd(b, task, estimate) || PAID_PROVIDERS.indexOf(a) - PAID_PROVIDERS.indexOf(b))
}

export function pickWriter(available: readonly ProviderId[]): PaidProviderId | null {
  return byPrice(seatsFrom(available), WRITER_TASK, STEP_ESTIMATES.redactar)[0] ?? null
}

export function pickReviewers(available: readonly ProviderId[], writer: ProviderId): PaidProviderId[] {
  const others = seatsFrom(available).filter((seat) => seat !== writer)
  return byPrice(others, REVIEWER_TASK, STEP_ESTIMATES.revisar).slice(0, MAX_REVIEWERS)
}

export function pickVerifier(available: readonly ProviderId[], reporters: readonly ProviderId[]): PaidProviderId | null {
  const others = seatsFrom(available).filter((seat) => !reporters.includes(seat))
  return byPrice(others, VERIFIER_TASK, STEP_ESTIMATES.verificar)[0] ?? null
}

export function reportersOf(finding: MergedFinding): PaidProviderId[] {
  const seats = new Set<PaidProviderId>()
  for (const reporter of finding.reporters) {
    seats.add(reporter.seat)
    if (isPaid(reporter.provider)) seats.add(reporter.provider)
  }
  return PAID_PROVIDERS.filter((provider) => seats.has(provider))
}

export function needsVerification(finding: MergedFinding): boolean {
  if (finding.origin !== 'revisor' || finding.carried || finding.verification) return false
  if (finding.gravity === 'bloqueante') return true
  return !finding.seenByBoth && finding.confidence < VERIFY_CONFIDENCE_BELOW
}
