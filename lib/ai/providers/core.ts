import type { z } from 'zod'
import type { BudgetRepo } from '@/lib/data/types'
import { fromMicroUsd } from '@/lib/ai/budget/config'
import { reserveBudget, settleBudget, type BudgetNotifier, type Ledger } from '@/lib/ai/budget/ledger'
import type { AdapterLoader } from './adapter'
import { estimateTokens, roundUsd, servedCostUsd } from './cost'
import { asProviderError, ProviderCallError, type FailureKind } from './errors'
import { keyedProviders, type ProviderKeys } from './mode'
import { TASK_MAX_OUTPUT_TOKENS } from './models'
import { planRoute, type ModelResolver, type RouteCandidate, type RoutePlan } from './router'
import { jsonSchemaOf } from './schema'
import type { AttemptOutcome, BudgetLine, ModelTask, PaidProviderId, ProviderAttempt, ProviderId, ProvidersMode, TokenUsage } from './types'

export type PortDeps = {
  mode: () => ProvidersMode
  keys: () => ProviderKeys
  adapter: AdapterLoader
  budget: () => BudgetRepo
  notify?: BudgetNotifier
  now: () => Date
  timeoutMs: number
  onError?: (scope: string, error: unknown) => void
  models?: ModelResolver
}

export type CallContext = { deps: PortDeps; ledger: Ledger; line: BudgetLine; attempts: ProviderAttempt[]; started: number }

export function callContext(deps: PortDeps, line: BudgetLine): CallContext {
  return { deps, ledger: { repo: deps.budget(), notify: deps.notify, onError: deps.onError }, line, attempts: [], started: performance.now() }
}

export function maxOutputFor(task: ModelTask, requested?: number): number {
  return requested && requested > 0 ? Math.floor(requested) : TASK_MAX_OUTPUT_TOKENS[task]
}

export function estimateUsage(text: string, schema: z.ZodType<unknown>, maxOutputTokens: number): TokenUsage {
  return { inputTokens: estimateTokens(text + JSON.stringify(jsonSchemaOf(schema))), outputTokens: maxOutputTokens }
}

export function routeFor(deps: PortDeps, request: { task: ModelTask; prefer?: ProviderId; exclude?: readonly ProviderId[] }, estimate: TokenUsage): { plan: RoutePlan; keys: ProviderKeys } {
  const keys = deps.keys()
  return { plan: planRoute({ ...request, estimate }, keyedProviders(keys), deps.models), keys }
}

export function outcomeFor(kind: FailureKind): AttemptOutcome {
  if (kind === 'refusal') return 'refusal'
  if (kind === 'invalid') return 'invalid'
  return 'error'
}

export function record(ctx: CallContext, candidate: RouteCandidate, attempt: Omit<ProviderAttempt, 'provider' | 'requestedModel'>): void {
  ctx.attempts.push({ provider: candidate.provider, requestedModel: candidate.model, ...attempt, costUsd: roundUsd(attempt.costUsd) })
}

export type AttemptResult<R> = { ok: true; reply: R; latencyMs: number } | { ok: false; error: ProviderCallError; latencyMs: number; costUsd: number }

export async function runAttempt<R extends { usage: TokenUsage; costUsd: number; model: string }>(ctx: CallContext, candidate: RouteCandidate, call: () => Promise<R>): Promise<AttemptResult<R>> {
  const reservation = await reserveBudget(ctx.ledger, candidate.reserveUsd, ctx.deps.now())
  const started = performance.now()
  try {
    const reply = await call()
    const latencyMs = Math.round(performance.now() - started)
    await settleBudget(ctx.ledger, reservation, reply.costUsd, candidate.provider, ctx.line, ctx.deps.now())
    return { ok: true, reply, latencyMs }
  } catch (caught) {
    const latencyMs = Math.round(performance.now() - started)
    const error = caught instanceof ProviderCallError ? caught : asProviderError(caught, candidate.provider)
    const costUsd = error.usage ? servedCostUsd(error.model, candidate.model, error.usage) : error.kind === 'timeout' ? fromMicroUsd(reservation.microUsd) : 0
    await settleBudget(ctx.ledger, reservation, costUsd, candidate.provider, ctx.line, ctx.deps.now())
    return { ok: false, error, latencyMs, costUsd }
  }
}

export function recordFailure(ctx: CallContext, candidate: RouteCandidate, result: Extract<AttemptResult<unknown>, { ok: false }>): void {
  record(ctx, candidate, {
    model: result.error.model,
    outcome: outcomeFor(result.error.kind),
    reason: result.error.message,
    latencyMs: result.latencyMs,
    usage: result.error.usage,
    costUsd: result.costUsd,
  })
}

export function totalCost(attempts: readonly ProviderAttempt[]): number {
  return roundUsd(attempts.reduce((sum, attempt) => sum + attempt.costUsd, 0))
}

export function elapsed(ctx: CallContext): number {
  return Math.round(performance.now() - ctx.started)
}

export function keyFor(keys: ProviderKeys, provider: PaidProviderId): string {
  const key = keys[provider]
  if (!key) throw new Error(`Falta la llave de ${provider}`)
  return key
}
