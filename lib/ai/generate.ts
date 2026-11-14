import 'server-only'
import { parseUsage, type LiveUsage } from '@/lib/ai/agent/usage'
import { GEMINI_API_BASE } from '@/lib/ai/gemini'

export const GENERATE_TIMEOUT_MS = 25_000

export class GeminiError extends Error {
  constructor(
    readonly status: number,
    reason = '',
  ) {
    super(`Gemini respondió ${status}${reason ? `: ${reason}` : ''}`)
  }

  get unavailable(): boolean {
    return this.status === 402 || this.status === 403 || this.status === 429
  }
}

export async function googleReason(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: unknown } } | null
  const message = body?.error?.message
  return typeof message === 'string' ? message.replace(/AIza[\w-]+|AQ\.[\w-]+/g, '[clave]').slice(0, 200) : ''
}

export type GenerateJsonRequest = {
  key: string
  model: string
  system: string
  prompt: string
  schema: unknown
  temperature?: number
  maxOutputTokens?: number
  timeoutMs?: number
}

export type GenerateJsonReply = { text: string; usage: LiveUsage | null; finishReason: string | null }

type Json = Record<string, unknown>

function record(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined
}

export function generateJsonBody(request: GenerateJsonRequest) {
  return {
    systemInstruction: { parts: [{ text: request.system }] },
    contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: request.schema,
      temperature: request.temperature ?? 0.2,
      maxOutputTokens: request.maxOutputTokens ?? 4096,
    },
  }
}

export async function generateJson(request: GenerateJsonRequest, fetcher: typeof fetch = fetch): Promise<GenerateJsonReply> {
  const model = request.model.replace(/^models\//, '')
  const response = await fetcher(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': request.key },
    body: JSON.stringify(generateJsonBody(request)),
    signal: AbortSignal.timeout(request.timeoutMs ?? GENERATE_TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!response.ok) throw new GeminiError(response.status, await googleReason(response))
  const data = record(await response.json().catch(() => null))
  if (!data) throw new GeminiError(502, 'respuesta vacía')
  const blocked = record(data.promptFeedback)?.blockReason
  if (typeof blocked === 'string') throw new GeminiError(400, `bloqueado: ${blocked}`)
  const candidate = Array.isArray(data.candidates) ? record(data.candidates[0]) : undefined
  const parts = record(candidate?.content)?.parts
  const text = Array.isArray(parts)
    ? parts
        .map((part) => record(part))
        .filter((part) => part && part.thought !== true && typeof part.text === 'string')
        .map((part) => part!.text as string)
        .join('')
    : ''
  const finishReason = typeof candidate?.finishReason === 'string' ? candidate.finishReason : null
  return { text, usage: parseUsage(data.usageMetadata, 'text'), finishReason }
}
