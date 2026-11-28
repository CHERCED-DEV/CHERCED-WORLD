import { costUsd, reservationCostUsd } from './cost'
import { modelFor } from './models'
import { PAID_PROVIDERS, type ModelTask, type PaidProviderId, type ProviderAttempt, type ProviderId, type TokenUsage } from './types'

export type RouteCandidate = { provider: PaidProviderId; model: string; estimateUsd: number; reserveUsd: number }

export type RoutePlan = { candidates: RouteCandidate[]; skipped: ProviderAttempt[] }

export type RouteRequest = {
  task: ModelTask
  estimate: TokenUsage
  prefer?: ProviderId
  exclude?: readonly ProviderId[]
}

export const REASON_NO_KEY = 'sin llave'

export const REASON_NO_PRICE = 'sin precio en la tabla: no se llama'

function skipped(provider: PaidProviderId, model: string, reason: string): ProviderAttempt {
  return { provider, requestedModel: model, model: null, outcome: 'skipped', reason, latencyMs: 0, usage: null, costUsd: 0 }
}

export type ModelResolver = (provider: PaidProviderId, task: ModelTask) => string

export function planRoute(request: RouteRequest, available: readonly PaidProviderId[], modelOf: ModelResolver = modelFor): RoutePlan {
  const excluded = new Set(request.exclude ?? [])
  const candidates: RouteCandidate[] = []
  const skips: ProviderAttempt[] = []
  for (const provider of PAID_PROVIDERS) {
    if (excluded.has(provider)) continue
    const model = modelOf(provider, request.task)
    if (!available.includes(provider)) {
      skips.push(skipped(provider, model, REASON_NO_KEY))
      continue
    }
    const estimateUsd = costUsd(model, request.estimate)
    const reserveUsd = reservationCostUsd(model, request.estimate)
    if (estimateUsd === null || reserveUsd === null) {
      skips.push(skipped(provider, model, REASON_NO_PRICE))
      continue
    }
    candidates.push({ provider, model, estimateUsd, reserveUsd })
  }
  candidates.sort((a, b) => a.estimateUsd - b.estimateUsd || PAID_PROVIDERS.indexOf(a.provider) - PAID_PROVIDERS.indexOf(b.provider))
  const preferred = candidates.findIndex((candidate) => candidate.provider === request.prefer)
  if (preferred > 0) candidates.unshift(...candidates.splice(preferred, 1))
  return { candidates, skipped: skips }
}

export function estimateRouteUsd(request: RouteRequest, available: readonly PaidProviderId[]): number | null {
  const [first] = planRoute(request, available).candidates
  return first ? first.reserveUsd : null
}
