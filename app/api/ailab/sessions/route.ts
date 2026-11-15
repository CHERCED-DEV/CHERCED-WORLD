import '@/lib/data/mongo/register'
import { after, NextResponse, type NextRequest } from 'next/server'
import { hasLabConsent, labRecordFrom, labSessionInput, summarizeConversation } from '@/lib/ai/lab/traces'
import { geminiKey } from '@/lib/ai/gemini'
import { getAccountState } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'cache-control': 'private, no-store' }

const MAX_BODY = 40_000

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
    const limit = await hitRateLimit(repos.rateLimits, 'labSave', state.account.id, now)
    if (!limit.allowed) return reply({ error: 'rate_limited' }, 429)
    const parsed = labSessionInput.safeParse(JSON.parse(raw))
    if (!parsed.success) return reply({ error: 'invalid' }, 400)
    const record = labRecordFrom(parsed.data, state.account.id, now)
    await repos.lab.saveSession(record)
    const key = geminiKey()
    if (key && record.turns.some((turn) => turn.who === 'you'))
      after(async () => {
        try {
          const summary = await summarizeConversation(key, record.turns, new Date())
          if (summary) await repos.lab.setSummary(record.id, summary)
        } catch (error) {
          logServerError('lab.summary', error)
        }
      })
    return reply({ ok: true, id: record.id })
  } catch (error) {
    logServerError('lab.save', error)
    return reply({ error: 'unavailable' }, 503)
  }
}
