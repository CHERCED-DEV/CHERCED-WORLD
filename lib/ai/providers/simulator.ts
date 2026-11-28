import type { z } from 'zod'
import { schemaIssues } from './schema'
import { SimulatorMissingError, type GenerateJsonResult, type ProviderAttempt, type TokenUsage } from './types'

export const SIMULATOR_MODEL = 'simulador'

const NO_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 }

export function simulatorAttempt(latencyMs = 0): ProviderAttempt {
  return { provider: 'simulator', requestedModel: SIMULATOR_MODEL, model: SIMULATOR_MODEL, outcome: 'ok', reason: null, latencyMs, usage: NO_USAGE, costUsd: 0 }
}

export function simulateReply<T>(input: { simulate?: () => T; schema: z.ZodType<T> }): GenerateJsonResult<T> {
  if (!input.simulate) throw new SimulatorMissingError()
  const started = performance.now()
  const parsed = input.schema.safeParse(input.simulate())
  if (!parsed.success) throw new Error(`El simulador devolvió algo que ${schemaIssues(parsed.error)}`)
  const latencyMs = Math.round(performance.now() - started)
  return {
    data: parsed.data,
    text: JSON.stringify(parsed.data),
    provider: 'simulator',
    model: SIMULATOR_MODEL,
    usage: NO_USAGE,
    latencyMs,
    costUsd: 0,
    attempts: [simulatorAttempt(latencyMs)],
  }
}
