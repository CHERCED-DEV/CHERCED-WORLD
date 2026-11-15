import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { AGENT_MODEL } from '@/lib/ai/agent/config'
import { createLiveToken, LiveTokenError } from '@/lib/ai/agent/session'
import { geminiGate, json } from '@/lib/ai/lab/route'
import { interpreterInstruction, isSubtitleDirection, subtitlesSetup, SUBTITLES_MINUTES } from '@/lib/ai/subtitles/model'
import { logServerError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const gate = await geminiGate(request, { visitor: 'subtitles', daily: 'subtitlesDaily' })
  if (!gate.ok) return gate.response
  const direction = gate.body.direction
  if (!isSubtitleDirection(direction)) return json({ error: 'invalid' }, 400)
  if (gate.mode === 'local' || !gate.key) return json({ mode: 'local' })
  try {
    const instruction = interpreterInstruction(direction)
    const { token, expiresAt } = await createLiveToken(gate.key, instruction, new Date(), fetch, SUBTITLES_MINUTES, subtitlesSetup(instruction, AGENT_MODEL))
    return json({ mode: 'live', token, model: AGENT_MODEL, expiresAt })
  } catch (error) {
    logServerError('ailab.subtitles', error instanceof LiveTokenError ? error.message : error)
    if (error instanceof LiveTokenError && error.unavailable) return json({ error: 'unavailable' }, 503)
    return json({ error: 'failed' }, 502)
  }
}
