import 'server-only'
import { parseUsage, type LiveUsage } from '@/lib/ai/agent/usage'
import { GEMINI_API_BASE } from '@/lib/ai/gemini'
import { GeminiError, googleReason } from '@/lib/ai/generate'
import { nativeFor, toolNameMap, type ToolsReply, type ToolsRequest } from './adapter'
import { servedCostUsd } from './cost'
import { asProviderError, kindFromStatus, ProviderCallError } from './errors'
import { jsonSchemaOf, toGeminiSchema } from './schema'
import type { PortMessage, TokenUsage, ToolCall } from './types'

export const GEMINI_REFUSAL_FINISH = ['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'IMAGE_SAFETY'] as const

export const GEMINI_SYNTHETIC_CALL = 'call-gemini-'

export type GeminiPart = Record<string, unknown>

export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] }

type Json = Record<string, unknown>

function record(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined
}

export function geminiTokens(usage: LiveUsage | null): TokenUsage {
  if (!usage) return { inputTokens: 0, outputTokens: 0 }
  return {
    inputTokens: usage.input.text + usage.input.audio + usage.input.image,
    outputTokens: usage.output.text + usage.output.audio + usage.output.image,
  }
}

export function geminiFailure(error: unknown): ProviderCallError {
  if (error instanceof GeminiError) {
    if (error.status === 400 && error.message.includes('bloqueado')) return new ProviderCallError('refusal', error.message)
    return new ProviderCallError(kindFromStatus(error.status), error.message)
  }
  return asProviderError(error, 'Gemini')
}

export function geminiFinish(finishReason: string | null, usage: TokenUsage, model: string): { truncated: boolean } {
  if (finishReason && (GEMINI_REFUSAL_FINISH as readonly string[]).includes(finishReason)) {
    throw new ProviderCallError('refusal', `Gemini se negó a responder (${finishReason})`, usage, model)
  }
  if (finishReason === 'MALFORMED_FUNCTION_CALL') throw new ProviderCallError('invalid', 'Gemini devolvió una llamada mal formada', usage, model)
  return { truncated: finishReason === 'MAX_TOKENS' }
}

export function geminiContents(messages: readonly PortMessage[]): GeminiContent[] {
  const names = toolNameMap(messages)
  const nativeIds = new Set<string>()
  const contents: GeminiContent[] = []
  for (const message of messages) {
    if (message.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: message.text }] })
    } else if (message.role === 'assistant') {
      const native = nativeFor<GeminiPart[]>(message, 'gemini')
      if (native) {
        for (const call of message.toolCalls) if (!call.id.startsWith(GEMINI_SYNTHETIC_CALL)) nativeIds.add(call.id)
        contents.push({ role: 'model', parts: native })
        continue
      }
      const parts: GeminiPart[] = message.text ? [{ text: message.text }] : []
      for (const call of message.toolCalls) parts.push({ functionCall: { name: call.name, args: record(call.args) ?? {} } })
      contents.push({ role: 'model', parts })
    } else {
      contents.push({
        role: 'user',
        parts: message.results.map((result) => ({
          functionResponse: {
            ...(nativeIds.has(result.callId) ? { id: result.callId } : {}),
            name: names.get(result.callId) ?? result.callId,
            response: result.isError ? { error: result.content } : { result: result.content },
          },
        })),
      })
    }
  }
  return contents
}

export function geminiToolsBody(request: ToolsRequest): Json {
  return {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: geminiContents(request.messages),
    tools: [
      {
        functionDeclarations: request.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: toGeminiSchema(jsonSchemaOf(tool.inputSchema)),
        })),
      },
    ],
    toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: toGeminiSchema(jsonSchemaOf(request.schema)),
      maxOutputTokens: request.maxOutputTokens,
    },
  }
}

export function readGeminiTurn(data: unknown, model: string): ToolsReply {
  const body = record(data) ?? {}
  const usage = geminiTokens(parseUsage(body.usageMetadata, 'text'))
  const blocked = record(body.promptFeedback)?.blockReason
  if (typeof blocked === 'string') throw new ProviderCallError('refusal', `Gemini bloqueó el pedido (${blocked})`, usage, model)
  const candidate = Array.isArray(body.candidates) ? record(body.candidates[0]) : undefined
  const parts = (record(candidate?.content)?.parts as GeminiPart[] | undefined) ?? []
  const finishReason = typeof candidate?.finishReason === 'string' ? candidate.finishReason : null
  const { truncated } = geminiFinish(finishReason, usage, model)
  const visible = parts.filter((part) => part.thought !== true)
  const text = visible.map((part) => (typeof part.text === 'string' ? part.text : '')).join('')
  const toolCalls: ToolCall[] = visible.flatMap((part, index) => {
    const call = record(part.functionCall)
    if (!call || typeof call.name !== 'string') return []
    const id = typeof call.id === 'string' && call.id ? call.id : `${GEMINI_SYNTHETIC_CALL}${index}`
    return [{ id, name: call.name, args: call.args ?? {} }]
  })
  const served = typeof body.modelVersion === 'string' && body.modelVersion ? body.modelVersion : model
  return {
    text,
    toolCalls,
    model: served,
    usage,
    costUsd: servedCostUsd(served, model, usage),
    truncated,
    native: { provider: 'gemini', model: served, content: parts },
  }
}

export async function geminiTools(key: string, request: ToolsRequest, fetcher: typeof fetch = fetch): Promise<ToolsReply> {
  const model = request.model.replace(/^models\//, '')
  let response: Response
  try {
    response = await fetcher(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(geminiToolsBody(request)),
      signal: AbortSignal.timeout(request.timeoutMs),
      cache: 'no-store',
    })
  } catch (error) {
    throw geminiFailure(error)
  }
  if (!response.ok) throw geminiFailure(new GeminiError(response.status, await googleReason(response)))
  const data = await response.json().catch(() => null)
  if (!data) throw new ProviderCallError('server', 'Gemini devolvió una respuesta vacía')
  return readGeminiTurn(data, model)
}
