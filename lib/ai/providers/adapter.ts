import type { z } from 'zod'
import type { ModelTask, NativeTurn, PaidProviderId, PortMessage, PortTool, TokenUsage, ToolCall } from './types'

export type JsonRequest = {
  model: string
  task: ModelTask
  system: string
  prompt: string
  schema: z.ZodType<unknown>
  schemaName: string
  maxOutputTokens: number
  timeoutMs: number
}

export type JsonReply = {
  text: string
  model: string
  usage: TokenUsage
  costUsd: number
  truncated: boolean
}

export type ToolsRequest = Omit<JsonRequest, 'prompt'> & {
  messages: readonly PortMessage[]
  tools: readonly PortTool[]
}

export type ToolsReply = JsonReply & {
  toolCalls: ToolCall[]
  native: NativeTurn
}

export interface ProviderAdapter {
  readonly id: PaidProviderId
  json(request: JsonRequest): Promise<JsonReply>
  tools(request: ToolsRequest): Promise<ToolsReply>
}

export type AdapterLoader = (provider: PaidProviderId, key: string) => Promise<ProviderAdapter>

export const SCHEMA_NAME = 'respuesta'

export function toolNameMap(messages: readonly PortMessage[]): Map<string, string> {
  const names = new Map<string, string>()
  for (const message of messages) if (message.role === 'assistant') for (const call of message.toolCalls) names.set(call.id, call.name)
  return names
}

export function nativeFor<T>(message: PortMessage, provider: PaidProviderId): T | null {
  return message.role === 'assistant' && message.native?.provider === provider ? (message.native.content as T) : null
}
