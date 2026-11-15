import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { geminiFailure, geminiGate, json } from '@/lib/ai/lab/route'
import { analyzeShot } from '@/lib/ai/shot/analyze'
import { SHOT_IMAGE_MAX_CHARS, SHOT_MIME_TYPES, simulatedShot } from '@/lib/ai/shot/model'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

export async function POST(request: NextRequest) {
  const gate = await geminiGate(request, { visitor: 'shot', daily: 'shotDaily' })
  if (!gate.ok) return gate.response
  const image = gate.body.image as { mimeType?: unknown; data?: unknown } | undefined
  const mimeType = typeof image?.mimeType === 'string' ? image.mimeType : ''
  const data = typeof image?.data === 'string' ? image.data : ''
  if (!(SHOT_MIME_TYPES as readonly string[]).includes(mimeType) || data.length < 64 || !BASE64.test(data)) return json({ error: 'invalid' }, 400)
  if (data.length > SHOT_IMAGE_MAX_CHARS) return json({ error: 'too_large' }, 413)
  if (gate.mode === 'local' || !gate.key) return json({ result: simulatedShot(gate.lang), simulated: true })
  try {
    return json({ result: await analyzeShot({ key: gate.key, lang: gate.lang, image: { mimeType, data } }), simulated: false })
  } catch (error) {
    return geminiFailure('ailab.shot', error)
  }
}
