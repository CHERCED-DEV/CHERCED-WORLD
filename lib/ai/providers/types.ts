import type { z } from 'zod'
import type { BudgetLine, BudgetProvider } from '@/lib/data/types'

export type { BudgetLine }

export type ProviderId = 'gemini' | 'claude' | 'openai' | 'simulator'

export type PaidProviderId = BudgetProvider

export const PAID_PROVIDERS: readonly PaidProviderId[] = ['gemini', 'claude', 'openai']

export const MODEL_TASKS = ['cheap', 'balanced', 'strong'] as const

export type ModelTask = (typeof MODEL_TASKS)[number]

export type TokenUsage = { inputTokens: number; outputTokens: number }

export type GenerateJsonInput<T> = {
  task: ModelTask
  line: BudgetLine
  system: string
  prompt: string
  schema: z.ZodType<T>
  prefer?: ProviderId
  exclude?: readonly ProviderId[]
  maxOutputTokens?: number
  estimate?: TokenUsage
  simulate?: () => T
}

export const ATTEMPT_OUTCOMES = ['ok', 'error', 'refusal', 'invalid', 'skipped'] as const

export type AttemptOutcome = (typeof ATTEMPT_OUTCOMES)[number]

export type ProviderAttempt = {
  provider: ProviderId
  requestedModel: string
  model: string | null
  outcome: AttemptOutcome
  reason: string | null
  latencyMs: number
  usage: TokenUsage | null
  costUsd: number
}

export type GenerateJsonResult<T> = {
  data: T
  text: string
  provider: ProviderId
  model: string
  usage: TokenUsage
  latencyMs: number
  costUsd: number
  attempts: ProviderAttempt[]
}

export type PortTool = { name: string; description: string; inputSchema: z.ZodType<unknown> }

export type ToolCall = { id: string; name: string; args: unknown }

export type NativeTurn = { provider: ProviderId; model: string; content: unknown }

export type PortMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; toolCalls: ToolCall[]; native?: NativeTurn }
  | { role: 'tool'; results: Array<{ callId: string; content: string; isError?: boolean }> }

export type AssistantMessage = Extract<PortMessage, { role: 'assistant' }>

export type CallToolsInput<T> = Omit<GenerateJsonInput<T>, 'prompt'> & {
  messages: readonly PortMessage[]
  tools: readonly PortTool[]
}

export type CallToolsResult<T> = Omit<GenerateJsonResult<T>, 'data'> & {
  data: T | null
  toolCalls: ToolCall[]
  turn: PortMessage & { role: 'assistant' }
}

export type ProvidersMode = 'live' | 'local' | 'off'

export class BudgetExhaustedError extends Error {
  constructor(
    readonly month: string,
    readonly capUsd: number,
  ) {
    super(`El techo mensual de ${capUsd} USD de ${month} ya se alcanzó`)
    this.name = 'BudgetExhaustedError'
  }
}

export class BudgetUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('No pude reservar el gasto en el libro mensual: el puerto no llama a nadie', { cause })
    this.name = 'BudgetUnavailableError'
  }
}

export class ProvidersUnavailableError extends Error {
  constructor(
    readonly attempts: ProviderAttempt[],
    message = 'Ningún proveedor pudo responder',
  ) {
    super(message)
    this.name = 'ProvidersUnavailableError'
  }
}

export class ProviderRequestError extends Error {
  constructor(
    readonly attempts: ProviderAttempt[],
    message = 'El proveedor rechazó el pedido por un error del pedido (400): no se prueba con otro',
  ) {
    super(message)
    this.name = 'ProviderRequestError'
  }
}

export class SimulatorMissingError extends Error {
  constructor() {
    super('El modo local responde con el simulador y este pedido no trae simulate()')
    this.name = 'SimulatorMissingError'
  }
}
