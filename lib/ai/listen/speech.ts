import 'server-only'
import { GEMINI_API_BASE } from '@/lib/ai/gemini'
import { GeminiError, googleReason } from '@/lib/ai/generate'
import { GEMINI_MODELS } from '@/lib/ai/models'

export const SPEECH_TIMEOUT_MS = 30_000

export const DEFAULT_PCM_RATE = 24_000

export type SpeechAudio = { wav: Uint8Array; seconds: number }

type Json = Record<string, unknown>

function record(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined
}

export function pcmRate(mime: string): number {
  const match = /rate=(\d+)/.exec(mime)
  const rate = match ? Number(match[1]) : DEFAULT_PCM_RATE
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_PCM_RATE
}

export function wavFromPcm(pcm: Uint8Array, rate: number): Uint8Array {
  const wav = new Uint8Array(44 + pcm.length)
  const view = new DataView(wav.buffer)
  const ascii = (at: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(at + i, text.charCodeAt(i))
  }
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, pcm.length, true)
  wav.set(pcm, 44)
  return wav
}

export function speechBody(text: string, voice: string) {
  return {
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  }
}

export async function synthesizeSpeech(
  request: { key: string; text: string; voice: string; model?: string },
  fetcher: typeof fetch = fetch,
): Promise<SpeechAudio> {
  const model = (request.model ?? GEMINI_MODELS.tts).replace(/^models\//, '')
  const response = await fetcher(`${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': request.key },
    body: JSON.stringify(speechBody(request.text, request.voice)),
    signal: AbortSignal.timeout(SPEECH_TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!response.ok) throw new GeminiError(response.status, await googleReason(response))
  const data = record(await response.json().catch(() => null))
  const candidate = Array.isArray(data?.candidates) ? record(data!.candidates[0]) : undefined
  const parts = record(candidate?.content)?.parts
  const inline = Array.isArray(parts) ? parts.map((part) => record(record(part)?.inlineData)).find((part) => typeof part?.data === 'string') : undefined
  if (!inline) throw new GeminiError(502, 'sin audio')
  const pcm = Uint8Array.from(Buffer.from(inline.data as string, 'base64'))
  if (pcm.length < 2) throw new GeminiError(502, 'audio vacío')
  const rate = pcmRate(typeof inline.mimeType === 'string' ? inline.mimeType : '')
  return { wav: wavFromPcm(pcm, rate), seconds: pcm.length / 2 / rate }
}
