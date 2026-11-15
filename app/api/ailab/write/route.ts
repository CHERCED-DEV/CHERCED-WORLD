import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { streamText } from '@/lib/ai/generate'
import { geminiFailure, geminiGate, json, PRIVATE } from '@/lib/ai/lab/route'
import { GEMINI_MODELS } from '@/lib/ai/models'
import { isWriteTool, simulateWrite, WRITE_LIMITS, writeSystem } from '@/lib/ai/write/prompts'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const TEXT = { ...PRIVATE, 'content-type': 'text/plain; charset=utf-8' }

export async function POST(request: NextRequest) {
  const gate = await geminiGate(request, { visitor: 'write', daily: 'writeDaily' })
  if (!gate.ok) return gate.response
  const tool = gate.body.tool
  if (!isWriteTool(tool)) return json({ error: 'invalid' }, 400)
  const input = typeof gate.body.input === 'string' ? gate.body.input.trim() : ''
  if (input.length < 3) return json({ error: 'invalid' }, 400)
  if (input.length > WRITE_LIMITS[tool]) return json({ error: 'too_long' }, 413)
  if (gate.mode === 'local' || !gate.key) return new Response(simulateWrite(tool, input, gate.lang), { headers: TEXT })
  try {
    const stream = await streamText({ key: gate.key, model: GEMINI_MODELS.text, system: writeSystem(tool, gate.lang), prompt: input, maxOutputTokens: tool === 'spec' ? 4096 : 1500 })
    return new Response(stream, { headers: TEXT })
  } catch (error) {
    return geminiFailure('ailab.write', error)
  }
}
