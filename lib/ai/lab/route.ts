import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { agentMode, geminiKey } from '@/lib/ai/gemini'
import { GeminiError } from '@/lib/ai/generate'
import { getRepos } from '@/lib/data'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit, type RateLimitAction } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'

export const PRIVATE = { 'cache-control': 'private, no-store' }

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE })
}

export type GeminiGate =
  | { ok: false; response: NextResponse }
  | { ok: true; mode: 'live' | 'local'; key: string | null; lang: Locale; body: Record<string, unknown> }

export async function geminiGate(request: NextRequest, limits: { visitor: RateLimitAction; daily: RateLimitAction }): Promise<GeminiGate> {
  if (request.headers.get('origin') !== request.nextUrl.origin) return { ok: false, response: json({ error: 'forbidden' }, 403) }
  const mode = agentMode()
  if (mode === 'off') return { ok: false, response: json({ error: 'off' }, 503) }
  const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>
  const lang = typeof body.lang === 'string' && isLocale(body.lang) ? body.lang : defaultLocale
  const key = geminiKey()
  if (mode === 'live' && key && process.env.NODE_ENV !== 'development') {
    const repo = getRepos().rateLimits
    const now = new Date()
    const visitor = await hitRateLimit(repo, limits.visitor, await requestIpHash(), now)
    if (!visitor.allowed) return { ok: false, response: json({ error: 'rate_limited' }, 429) }
    const daily = await hitRateLimit(repo, limits.daily, 'global', now)
    if (!daily.allowed) return { ok: false, response: json({ error: 'daily_cap' }, 429) }
  }
  return { ok: true, mode: mode === 'live' && key ? 'live' : 'local', key: mode === 'live' ? key : null, lang, body }
}

export function geminiFailure(scope: string, error: unknown): NextResponse {
  logServerError(scope, error instanceof Error ? error.message : error)
  if (error instanceof GeminiError && error.unavailable) return json({ error: 'unavailable' }, 503)
  return json({ error: 'failed' }, 502)
}
