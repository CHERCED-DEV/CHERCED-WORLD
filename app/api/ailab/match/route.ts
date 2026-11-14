import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { agentMode, geminiKey } from '@/lib/ai/gemini'
import { GeminiError } from '@/lib/ai/generate'
import { analyzeVacancy } from '@/lib/ai/match/analyze'
import { MATCH_DAILY_KEY, VACANCY_MAX, VACANCY_MIN, type MatchMode, type MatchReply } from '@/lib/ai/match/config'
import { simulateMatch } from '@/lib/ai/match/simulator'
import { getRepos } from '@/lib/data'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { buildSearchIndex } from '@/lib/search/build-index'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const PRIVATE = { 'cache-control': 'private, no-store' }

function reply(body: MatchReply, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE })
}

export async function GET(): Promise<NextResponse> {
  const status: { mode: MatchMode } = { mode: agentMode() }
  return NextResponse.json(status, { headers: PRIVATE })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('origin') !== request.nextUrl.origin) return reply({ error: 'forbidden' }, 403)
  const mode = agentMode()
  const key = geminiKey()
  if (mode === 'off') return reply({ error: 'off' }, 503)

  const body = (await request.json().catch(() => null)) as { lang?: unknown; vacancy?: unknown } | null
  const requested = body?.lang
  const lang = typeof requested === 'string' && isLocale(requested) ? requested : defaultLocale
  const vacancy = typeof body?.vacancy === 'string' ? body.vacancy.trim() : ''
  if (vacancy.length > VACANCY_MAX) return reply({ error: 'too_long' }, 413)
  if (vacancy.length < VACANCY_MIN) return reply({ error: 'invalid' }, 400)

  const index = await buildSearchIndex(lang)
  if (mode === 'local' || !key) return reply(simulateMatch(vacancy, index))

  if (process.env.NODE_ENV !== 'development') {
    const repo = getRepos().rateLimits
    const now = new Date()
    const limit = await hitRateLimit(repo, 'match', await requestIpHash(), now)
    if (!limit.allowed) return reply({ error: 'rate_limited' }, 429)
    const daily = await hitRateLimit(repo, 'matchDaily', MATCH_DAILY_KEY, now)
    if (!daily.allowed) return reply({ error: 'daily_cap' }, 429)
  }

  try {
    return reply(await analyzeVacancy({ key, vacancy, index }))
  } catch (error) {
    logServerError('ailab.match', error instanceof Error ? error.message : error)
    if (error instanceof GeminiError && error.unavailable) return reply({ error: 'unavailable' }, 503)
    return reply({ error: 'failed' }, 502)
  }
}
