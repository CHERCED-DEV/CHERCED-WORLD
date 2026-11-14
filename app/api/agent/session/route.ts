import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { AGENT_DAILY_KEY, AGENT_MODEL, type AgentSessionReply, type AgentStatus } from '@/lib/ai/agent/config'
import { agentInstruction } from '@/lib/ai/agent/knowledge'
import { createLiveToken, LiveTokenError } from '@/lib/ai/agent/session'
import { agentMode, geminiKey } from '@/lib/ai/gemini'
import { getRepos } from '@/lib/data'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'cache-control': 'private, no-store' }

function reply(body: AgentSessionReply, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE })
}

export async function GET(): Promise<NextResponse> {
  const status: AgentStatus = { mode: agentMode() }
  return NextResponse.json(status, { headers: PRIVATE })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('origin') !== request.nextUrl.origin) return reply({ error: 'forbidden' }, 403)
  const mode = agentMode()
  const key = geminiKey()
  if (mode !== 'live' || !key) return reply({ mode: mode === 'live' ? 'off' : mode })

  const body = (await request.json().catch(() => null)) as { lang?: unknown } | null
  const requested = body?.lang
  const lang = typeof requested === 'string' && isLocale(requested) ? requested : defaultLocale
  const now = new Date()
  if (process.env.NODE_ENV !== 'development') {
    const repo = getRepos().rateLimits
    const limit = await hitRateLimit(repo, 'agent', await requestIpHash(), now)
    if (!limit.allowed) return reply({ error: 'rate_limited' }, 429)
    const daily = await hitRateLimit(repo, 'agentDaily', AGENT_DAILY_KEY, now)
    if (!daily.allowed) return reply({ error: 'daily_cap' }, 429)
  }

  try {
    const { token, expiresAt } = await createLiveToken(key, await agentInstruction(lang), now)
    return reply({ mode: 'live', token, model: AGENT_MODEL, expiresAt })
  } catch (error) {
    logServerError('agent.session', error instanceof LiveTokenError ? error.message : error)
    if (error instanceof LiveTokenError && error.unavailable) return reply({ error: 'unavailable' }, 503)
    return reply({ error: 'failed' }, 502)
  }
}
