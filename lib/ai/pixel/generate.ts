import 'server-only'
import { GEMINI_API_BASE } from '@/lib/ai/gemini'
import { GeminiError, googleReason } from '@/lib/ai/generate'
import { GEMINI_MODELS } from '@/lib/ai/models'

export const PIXEL_TIMEOUT_MS = 50_000

export const PIXEL_STYLE = [
  'Turn the person in this photo into a chibi pixel art character in the style of "Mini Cherced":',
  'a big head and a small body, 32-bit pixel art with crisp square pixels and no anti-aliasing,',
  'a thin bright green (#25ED9E) outline around the character, full body, facing forward, friendly expression,',
  'standing on a pure black CRT screen background with faint horizontal scanlines.',
  'Keep what makes the person recognizable: hair, beard, glasses, skin tone and the colors of their clothes.',
  'No text, no letters, no logos, no watermark. Square image.',
].join(' ')

export const AUTHOR_LOOK =
  'This sample photo is black and white. The real colors of this person: fair white skin, light brown (dirty blond) hair and beard with about 35% gray hairs, salt and pepper. Do not draw black hair.'

export class PixelRefused extends Error {}

export type PixelImage = { mimeType: string; data: string }

type Json = Record<string, unknown>

function record(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined
}

export function pixelBody(photo: PixelImage, sized: boolean, sample = false) {
  return {
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: photo.mimeType, data: photo.data } }, { text: sample ? `${PIXEL_STYLE} ${AUTHOR_LOOK}` : PIXEL_STYLE }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: sized ? { aspectRatio: '1:1', imageSize: '512' } : { aspectRatio: '1:1' },
    },
  }
}

export function pixelFromReply(data: unknown): PixelImage {
  const body = record(data)
  if (typeof record(body?.promptFeedback)?.blockReason === 'string') throw new PixelRefused('bloqueada')
  const candidate = Array.isArray(body?.candidates) ? record(body!.candidates[0]) : undefined
  const parts = record(candidate?.content)?.parts
  const inline = Array.isArray(parts)
    ? parts.map((part) => record(record(part)?.inlineData)).find((part) => typeof part?.data === 'string' && String(part?.mimeType ?? '').startsWith('image/'))
    : undefined
  if (!inline) throw new PixelRefused(typeof candidate?.finishReason === 'string' ? candidate.finishReason : 'sin imagen')
  return { mimeType: String(inline.mimeType), data: String(inline.data) }
}

async function call(key: string, photo: PixelImage, sized: boolean, fetcher: typeof fetch, sample: boolean): Promise<Response> {
  return fetcher(`${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODELS.image)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(pixelBody(photo, sized, sample)),
    signal: AbortSignal.timeout(PIXEL_TIMEOUT_MS),
    cache: 'no-store',
  })
}

export async function pixelate(input: { key: string; photo: PixelImage; sample?: boolean }, fetcher: typeof fetch = fetch): Promise<PixelImage> {
  const sample = input.sample === true
  let response = await call(input.key, input.photo, true, fetcher, sample)
  if (response.status === 400) {
    const reason = await googleReason(response)
    if (!/image_?size|imageConfig/i.test(reason)) throw new GeminiError(400, reason)
    response = await call(input.key, input.photo, false, fetcher, sample)
  }
  if (!response.ok) throw new GeminiError(response.status, await googleReason(response))
  return pixelFromReply(await response.json().catch(() => null))
}
