import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { completeSignIn, exchangeCode, googleClient } from '@/lib/auth/google'
import { accountPath, OAUTH_COOKIE, openFlow, profileFromIdToken, redirectUri, sameSecret } from '@/lib/auth/oauth'
import { getRepos } from '@/lib/data'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { serverKey } from '@/lib/security/keys'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const CODE_MAX = 2048

function finish(request: NextRequest, path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, request.nextUrl.origin), 303)
  response.headers.set('cache-control', 'private, no-store, max-age=0')
  response.cookies.delete({ name: OAUTH_COOKIE, path: '/api/auth' })
  return response
}

function failed(request: NextRequest, lang: Locale, error: string): NextResponse {
  return finish(request, `${accountPath(lang)}?error=${error}`)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const now = new Date()
  const params = request.nextUrl.searchParams
  const flow = openFlow(request.cookies.get(OAUTH_COOKIE)?.value, serverKey(), now)
  if (!flow) return failed(request, defaultLocale, 'expired')
  if (params.get('error')) return failed(request, flow.lang, 'cancelled')

  const state = params.get('state') ?? ''
  const code = params.get('code') ?? ''
  if (!sameSecret(state, flow.state) || !code || code.length > CODE_MAX) return failed(request, flow.lang, 'expired')

  const client = googleClient()
  if (!client) return failed(request, flow.lang, 'unconfigured')

  try {
    const limit = await hitRateLimit(getRepos().rateLimits, 'account', await requestIpHash(), now)
    if (!limit.allowed) return failed(request, flow.lang, 'rate_limited')
    const idToken = await exchangeCode(client, code, flow.verifier, redirectUri(request.nextUrl.origin))
    const profile = profileFromIdToken(idToken, { clientId: client.clientId, nonce: flow.nonce, now })
    if (!profile) return failed(request, flow.lang, 'failed')
    if ((await completeSignIn(profile, now)) === 'blocked') return failed(request, flow.lang, 'blocked')
  } catch (error) {
    logServerError('auth.google.callback', error)
    return failed(request, flow.lang, 'failed')
  }
  return finish(request, flow.next)
}
