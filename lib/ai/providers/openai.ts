import 'server-only'
import { APIConnectionError, APIConnectionTimeoutError, APIError } from 'openai/core/error'
import { zodResponsesFunction, zodTextFormat } from 'openai/helpers/zod'
import { toResponseInputItems } from 'openai/lib/responses/ResponseInputItems'
import type {
  FunctionTool,
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseFormatTextJSONSchemaConfig,
  ResponseInputItem,
  ResponseOutputItem,
} from 'openai/resources/responses/responses'
import type { z } from 'zod'
import { nativeFor, type JsonReply, type JsonRequest, type ProviderAdapter, type ToolsReply, type ToolsRequest } from './adapter'
import { servedCostUsd } from './cost'
import { asProviderError, kindFromStatus, ProviderCallError } from './errors'
import { TASK_EFFORT } from './models'
import type { PortMessage, PortTool, TokenUsage, ToolCall } from './types'

export type OpenAICreate = (body: ResponseCreateParamsNonStreaming) => Promise<Response>

export const OPENAI_ERROR_PREFIX = 'Error: '

export function openaiFormat(schema: z.ZodType<unknown>, name: string): ResponseFormatTextJSONSchemaConfig {
  const format = zodTextFormat(schema, name)
  return { type: 'json_schema', name: format.name, strict: true, schema: format.schema }
}

export function openaiTools(tools: readonly PortTool[]): FunctionTool[] {
  return tools.map((tool) => {
    const built = zodResponsesFunction({ name: tool.name, parameters: tool.inputSchema, description: tool.description })
    return { type: 'function', name: built.name, description: tool.description, parameters: built.parameters, strict: true }
  })
}

export function openaiInput(messages: readonly PortMessage[]): ResponseInputItem[] {
  const out: ResponseInputItem[] = []
  for (const message of messages) {
    if (message.role === 'user') {
      out.push({ role: 'user', content: message.text })
    } else if (message.role === 'assistant') {
      const native = nativeFor<ResponseOutputItem[]>(message, 'openai')
      if (native) {
        out.push(...toResponseInputItems(native))
        continue
      }
      if (message.text) out.push({ role: 'assistant', content: message.text })
      for (const call of message.toolCalls) out.push({ type: 'function_call', call_id: call.id, name: call.name, arguments: JSON.stringify(call.args ?? {}) })
    } else {
      for (const result of message.results) {
        out.push({ type: 'function_call_output', call_id: result.callId, output: result.isError ? `${OPENAI_ERROR_PREFIX}${result.content}` : result.content })
      }
    }
  }
  return out
}

export function openaiBody(request: JsonRequest | ToolsRequest, input: string | ResponseInputItem[], tools?: readonly PortTool[]): ResponseCreateParamsNonStreaming {
  return {
    model: request.model,
    instructions: request.system,
    input,
    max_output_tokens: request.maxOutputTokens,
    reasoning: { effort: TASK_EFFORT[request.task] },
    text: { format: openaiFormat(request.schema, request.schemaName) },
    store: false,
    ...(tools?.length ? { tools: openaiTools(tools), tool_choice: 'auto' as const, parallel_tool_calls: true, include: ['reasoning.encrypted_content' as const] } : {}),
  }
}

export function openaiUsage(response: Response): TokenUsage {
  return { inputTokens: response.usage?.input_tokens ?? 0, outputTokens: response.usage?.output_tokens ?? 0 }
}

function parseArgs(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export function readOpenAI(response: Response, requested: string): JsonReply & { toolCalls: ToolCall[] } {
  const usage = openaiUsage(response)
  const model = response.model || requested
  const costUsd = servedCostUsd(model, requested, usage)
  if (response.status === 'failed') {
    throw new ProviderCallError('server', `OpenAI no completó la respuesta: ${response.error?.message ?? 'sin detalle'}`, usage, model)
  }
  const refused = response.output.some((item) => item.type === 'message' && item.content.some((part) => part.type === 'refusal'))
  if (refused || response.incomplete_details?.reason === 'content_filter') {
    throw new ProviderCallError('refusal', 'OpenAI se negó a responder', usage, model)
  }
  const toolCalls = response.output.flatMap((item) => (item.type === 'function_call' ? [{ id: item.call_id, name: item.name, args: parseArgs(item.arguments) }] : []))
  const truncated = response.status === 'incomplete' && response.incomplete_details?.reason === 'max_output_tokens'
  return { text: outputText(response), toolCalls, model, usage, costUsd, truncated }
}

export function outputText(response: Response): string {
  return response.output
    .flatMap((item) => (item.type === 'message' && item.phase !== 'commentary' ? item.content : []))
    .flatMap((part) => (part.type === 'output_text' ? [part.text] : []))
    .join('')
}

export function openaiFailure(error: unknown): ProviderCallError {
  if (error instanceof ProviderCallError) return error
  if (error instanceof APIConnectionTimeoutError) return new ProviderCallError('timeout', 'OpenAI: tiempo agotado')
  if (error instanceof APIConnectionError) return new ProviderCallError('network', `OpenAI: ${error.message}`)
  if (error instanceof APIError && typeof error.status === 'number') return new ProviderCallError(kindFromStatus(error.status), `OpenAI respondió ${error.status}: ${error.message}`)
  return asProviderError(error, 'OpenAI')
}

export function createOpenAIAdapter(create: OpenAICreate): ProviderAdapter {
  const call = async (body: ResponseCreateParamsNonStreaming): Promise<Response> => {
    try {
      return await create(body)
    } catch (error) {
      throw openaiFailure(error)
    }
  }
  return {
    id: 'openai',
    async json(request) {
      const response = await call(openaiBody(request, request.prompt))
      const { toolCalls: _calls, ...reply } = readOpenAI(response, request.model)
      return reply
    },
    async tools(request): Promise<ToolsReply> {
      const response = await call(openaiBody(request, openaiInput(request.messages), request.tools))
      const reply = readOpenAI(response, request.model)
      return { ...reply, native: { provider: 'openai', model: reply.model, content: response.output } }
    },
  }
}

export async function openaiCreateFor(key: string, timeoutMs: number): Promise<OpenAICreate> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: key, maxRetries: 0, timeout: timeoutMs })
  return (body) => client.responses.create(body)
}
