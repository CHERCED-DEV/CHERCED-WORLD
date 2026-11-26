import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { eventRecords, labEventsInput } from '@/lib/ai/lab/events'
import { hasLabConsent } from '@/lib/ai/lab/traces'
import { getAccountState } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'cache-control': 'private, no-store' }

const MAX_BODY = 6_000

function reply(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('origin') !== request.nextUrl.origin) return reply({ error: 'forbidden' }, 403)
  const raw = await request.text().catch(() => '')
  if (!raw || raw.length > MAX_BODY) return reply({ error: 'invalid' }, 400)
  try {
    const state = await getAccountState()
    if (!state) return reply({ error: 'unauthorized' }, 401)
    const repos = getRepos()
    if (!(await hasLabConsent(repos.lab, state.account.id))) return reply({ error: 'no_consent' }, 403)
    const now = new Date()
    if (!(await hitRateLimit(repos.rateLimits, 'labEvents', state.account.id, now)).allowed) return reply({ error: 'rate_limited' }, 429)
    const parsed = labEventsInput.safeParse(JSON.parse(raw))
    if (!parsed.success) return reply({ error: 'invalid' }, 400)
    await repos.lab.addEvents(eventRecords(parsed.data.events, state.account.id, now))
    return reply({ ok: true, saved: parsed.data.events.length })
  } catch (error) {
    logServerError('lab.events', error)
    return reply({ error: 'unavailable' }, 503)
  }
}
