import 'server-only'
import { APIConnectionError, APIConnectionTimeoutError, APIError } from '@anthropic-ai/sdk/core/error'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type {
  BetaContentBlock,
  BetaContentBlockParam,
  BetaMessage,
  BetaMessageParam,
  BetaTool,
  MessageCreateParamsNonStreaming,
} from '@anthropic-ai/sdk/resources/beta/messages/messages'
import type { z } from 'zod'
import { nativeFor, type JsonReply, type JsonRequest, type ProviderAdapter, type ToolsReply, type ToolsRequest } from './adapter'
import { servedCostUsd } from './cost'
import { asProviderError, kindFromStatus, ProviderCallError } from './errors'
import { CLAUDE_SERVER_FALLBACK_BETA, TASK_EFFORT, usesServerFallback } from './models'
import type { PortMessage, PortTool, TokenUsage, ToolCall } from './types'

export type ClaudeCreate = (body: MessageCreateParamsNonStreaming) => Promise<BetaMessage>

type ObjectSchema = BetaTool.InputSchema

function objectSchema(schema: z.ZodType<unknown>): ObjectSchema {
  return zodOutputFormat(schema).schema as ObjectSchema
}

export function claudeTools(tools: readonly PortTool[]): BetaTool[] {
  return tools.map((tool) => ({ name: tool.name, description: tool.description, input_schema: objectSchema(tool.inputSchema), strict: true }))
}

export function claudeMessages(messages: readonly PortMessage[]): BetaMessageParam[] {
  const out: BetaMessageParam[] = []
  for (const message of messages) {
    if (message.role === 'user') {
      out.push({ role: 'user', content: message.text })
    } else if (message.role === 'assistant') {
      const native = nativeFor<BetaContentBlockParam[]>(message, 'claude')
      if (native) {
        out.push({ role: 'assistant', content: native })
        continue
      }
      const content: BetaContentBlockParam[] = message.text ? [{ type: 'text', text: message.text }] : []
      for (const call of message.toolCalls) content.push({ type: 'tool_use', id: call.id, name: call.name, input: call.args ?? {} })
      out.push({ role: 'assistant', content })
    } else {
      out.push({
        role: 'user',
        content: message.results.map((result) => ({ type: 'tool_result', tool_use_id: result.callId, content: result.content, ...(result.isError ? { is_error: true } : {}) })),
      })
    }
  }
  return out
}

export function claudeBody(request: JsonRequest | ToolsRequest, messages: BetaMessageParam[], tools?: readonly PortTool[]): MessageCreateParamsNonStreaming {
  return {
    model: request.model,
    max_tokens: request.maxOutputTokens,
    system: request.system,
    messages,
    output_config: { effort: TASK_EFFORT[request.task], format: { type: 'json_schema', schema: objectSchema(request.schema) } },
    ...(usesServerFallback(request.model) ? { betas: [CLAUDE_SERVER_FALLBACK_BETA], fallbacks: 'default' as const } : {}),
    ...(tools?.length ? { tools: claudeTools(tools), tool_choice: { type: 'auto' as const } } : {}),
  }
}

export function claudeUsage(message: BetaMessage): TokenUsage {
  const usage = message.usage
  return {
    inputTokens: usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0),
    outputTokens: usage.output_tokens,
  }
}

export function claudeCost(message: BetaMessage, requested: string): number {
  const iterations = message.usage.iterations ?? []
  const billed = iterations.filter((entry) => entry.type === 'message' || entry.type === 'fallback_message')
  if (billed.length === 0) return servedCostUsd(message.model, requested, claudeUsage(message))
  return billed.reduce((sum, entry) => {
    const usage = {
      inputTokens: entry.input_tokens + entry.cache_creation_input_tokens + entry.cache_read_input_tokens,
      outputTokens: entry.output_tokens,
    }
    return sum + servedCostUsd(entry.model ?? requested, requested, usage)
  }, 0)
}

export function claudeFailure(error: unknown): ProviderCallError {
  if (error instanceof ProviderCallError) return error
  if (error instanceof APIConnectionTimeoutError) return new ProviderCallError('timeout', 'Claude: tiempo agotado')
  if (error instanceof APIConnectionError) return new ProviderCallError('network', `Claude: ${error.message}`)
  if (error instanceof APIError && typeof error.status === 'number') return new ProviderCallError(kindFromStatus(error.status), `Claude respondió ${error.status}: ${error.message}`)
  return asProviderError(error, 'Claude')
}

export function readClaude(message: BetaMessage, requested: string): JsonReply & { toolCalls: ToolCall[]; content: BetaContentBlock[] } {
  const usage = claudeUsage(message)
  const costUsd = claudeCost(message, requested)
  if (message.stop_reason === 'refusal') {
    const category = message.stop_details?.category ?? 'sin categoría'
    throw new ProviderCallError('refusal', `Claude se negó a responder (${category})`, usage, message.model)
  }
  const text = message.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('')
  const toolCalls = message.content.flatMap((block) => (block.type === 'tool_use' ? [{ id: block.id, name: block.name, args: block.input }] : []))
  const truncated = message.stop_reason === 'max_tokens' || message.stop_reason === 'model_context_window_exceeded'
  return { text, toolCalls, model: message.model, usage, costUsd, truncated, content: message.content }
}

export function createClaudeAdapter(create: ClaudeCreate): ProviderAdapter {
  const call = async (body: MessageCreateParamsNonStreaming): Promise<BetaMessage> => {
    try {
      return await create(body)
    } catch (error) {
      throw claudeFailure(error)
    }
  }
  return {
    id: 'claude',
    async json(request) {
      const message = await call(claudeBody(request, [{ role: 'user', content: request.prompt }]))
      const { toolCalls: _calls, content: _content, ...reply } = readClaude(message, request.model)
      return reply
    },
    async tools(request): Promise<ToolsReply> {
      const message = await call(claudeBody(request, claudeMessages(request.messages), request.tools))
      const { content, ...reply } = readClaude(message, request.model)
      return { ...reply, native: { provider: 'claude', model: message.model, content } }
    },
  }
}

export async function claudeCreateFor(key: string, timeoutMs: number): Promise<ClaudeCreate> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: key, maxRetries: 0, timeout: timeoutMs })
  return (body) => client.beta.messages.create(body)
}
