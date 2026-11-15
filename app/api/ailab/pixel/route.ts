import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { geminiFailure, geminiGate, json } from '@/lib/ai/lab/route'
import { pixelate, PixelRefused } from '@/lib/ai/pixel/generate'
import { PIXEL_PHOTO_MAX_CHARS, PIXEL_PHOTO_TYPES } from '@/lib/ai/pixel/model'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

export async function POST(request: NextRequest) {
  const gate = await geminiGate(request, { visitor: 'pixel', daily: 'pixelDaily' })
  if (!gate.ok) return gate.response
  const photo = gate.body.photo as { mimeType?: unknown; data?: unknown } | undefined
  const mimeType = typeof photo?.mimeType === 'string' ? photo.mimeType : ''
  const data = typeof photo?.data === 'string' ? photo.data : ''
  if (!(PIXEL_PHOTO_TYPES as readonly string[]).includes(mimeType) || data.length < 64 || !BASE64.test(data)) return json({ error: 'invalid' }, 400)
  if (data.length > PIXEL_PHOTO_MAX_CHARS) return json({ error: 'too_large' }, 413)
  if (gate.mode === 'local' || !gate.key) return json({ simulated: true })
  try {
    return json({ image: await pixelate({ key: gate.key, photo: { mimeType, data } }), simulated: false })
  } catch (error) {
    if (error instanceof PixelRefused) return json({ error: 'refused' }, 422)
    return geminiFailure('ailab.pixel', error)
  }
}
