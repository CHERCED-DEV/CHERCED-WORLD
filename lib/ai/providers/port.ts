import 'server-only'
import { assertBudget } from '@/lib/ai/budget/ledger'
import { notifyAuthor } from '@/lib/ai/budget/notify'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'
import { SCHEMA_NAME } from './adapter'
import { loadAdapter, PORT_TIMEOUT_MS } from './adapters'
import { callContext, elapsed, estimateUsage, keyFor, maxOutputFor, record, recordFailure, routeFor, runAttempt, totalCost, type PortDeps } from './core'
import { failsOver } from './errors'
import { keyedProviders, providerKeys, providersMode as envMode } from './mode'
import { parseStructured, retryNote } from './schema'
import { simulateReply } from './simulator'
import { runCallTools } from './tools'
import { ProviderRequestError, ProvidersUnavailableError, type CallToolsInput, type CallToolsResult, type GenerateJsonInput, type GenerateJsonResult, type ProviderId, type ProvidersMode } from './types'

export * from './types'
export type { PortDeps } from './core'

export const OFF_MESSAGE = 'off: no hay llaves de proveedores ni base local'

async function runGenerateJson<T>(deps: PortDeps, input: GenerateJsonInput<T>): Promise<GenerateJsonResult<T>> {
  const mode = deps.mode()
  if (mode === 'local') return simulateReply(input)
  if (mode === 'off') throw new ProvidersUnavailableError([], OFF_MESSAGE)
  const maxOutputTokens = maxOutputFor(input.task, input.maxOutputTokens)
  const estimate = input.estimate ?? estimateUsage(input.system + input.prompt, input.schema, maxOutputTokens)
  const { plan, keys } = routeFor(deps, input, estimate)
  const ctx = callContext(deps, input.line)
  ctx.attempts.push(...plan.skipped)
  for (const candidate of plan.candidates) {
    const adapter = await deps.adapter(candidate.provider, keyFor(keys, candidate.provider))
    let prompt = input.prompt
    for (let round = 0; round < 2; round++) {
      const result = await runAttempt(ctx, candidate, () =>
        adapter.json({ model: candidate.model, task: input.task, system: input.system, prompt, schema: input.schema, schemaName: SCHEMA_NAME, maxOutputTokens, timeoutMs: deps.timeoutMs }),
      )
      if (!result.ok) {
        recordFailure(ctx, candidate, result)
        if (!failsOver(result.error.kind)) throw new ProviderRequestError(ctx.attempts)
        break
      }
      const { reply } = result
      const parsed = parseStructured(reply.text, input.schema)
      if (parsed.ok) {
        record(ctx, candidate, { model: reply.model, outcome: 'ok', reason: reply.truncated ? 'salida cortada por maxOutputTokens' : null, latencyMs: result.latencyMs, usage: reply.usage, costUsd: reply.costUsd })
        return {
          data: parsed.data,
          text: reply.text,
          provider: candidate.provider,
          model: reply.model,
          usage: reply.usage,
          latencyMs: elapsed(ctx),
          costUsd: totalCost(ctx.attempts),
          attempts: ctx.attempts,
        }
      }
      const reason = reply.truncated ? `${parsed.reason}; salida cortada por maxOutputTokens` : parsed.reason
      record(ctx, candidate, { model: reply.model, outcome: 'invalid', reason, latencyMs: result.latencyMs, usage: reply.usage, costUsd: reply.costUsd })
      prompt = input.prompt + retryNote(parsed.reason)
    }
  }
  throw new ProvidersUnavailableError(ctx.attempts)
}

export function createPort(deps: PortDeps) {
  return {
    generateJson: <T>(input: GenerateJsonInput<T>) => runGenerateJson(deps, input),
    callTools: <T>(input: CallToolsInput<T>) => runCallTools(deps, input),
    availableProviders: (): ProviderId[] => {
      const mode = deps.mode()
      if (mode === 'local') return ['simulator']
      return mode === 'off' ? [] : keyedProviders(deps.keys())
    },
    providersMode: (): ProvidersMode => deps.mode(),
    assertMonthlyBudget: (estimateUsd: number) => assertBudget(deps.budget(), estimateUsd, deps.now()),
  }
}

export type Port = ReturnType<typeof createPort>

export const defaultPortDeps: PortDeps = {
  mode: () => envMode(),
  keys: () => providerKeys(),
  adapter: loadAdapter,
  budget: () => getRepos().budget,
  notify: (event) => notifyAuthor(getRepos().messages, event),
  now: () => new Date(),
  timeoutMs: PORT_TIMEOUT_MS,
  onError: (scope, error) => logServerError(scope, error),
}

const port = createPort(defaultPortDeps)

export function generateJson<T>(input: GenerateJsonInput<T>): Promise<GenerateJsonResult<T>> {
  return port.generateJson(input)
}

export function callTools<T>(input: CallToolsInput<T>): Promise<CallToolsResult<T>> {
  return port.callTools(input)
}

export function availableProviders(): ProviderId[] {
  return port.availableProviders()
}

export function providersMode(): ProvidersMode {
  return port.providersMode()
}

export function assertMonthlyBudget(estimateUsd: number): Promise<void> {
  return port.assertMonthlyBudget(estimateUsd)
}
