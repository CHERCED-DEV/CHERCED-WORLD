import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { googleClient } from '@/lib/auth/google'
import { accountPath, authorizeUrl, newOAuthFlow, OAUTH_COOKIE, OAUTH_FLOW_MAX_AGE_S, redirectUri, safeNext, sealFlow } from '@/lib/auth/oauth'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { serverKey } from '@/lib/security/keys'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest): NextResponse {
  const params = request.nextUrl.searchParams
  const requested = params.get('lang')
  const lang = isLocale(requested) ? requested : defaultLocale
  const client = googleClient()
  if (!client) return NextResponse.redirect(new URL(`${accountPath(lang)}?error=unconfigured`, request.nextUrl.origin), 303)

  const flow = newOAuthFlow(safeNext(params.get('next'), lang), lang, new Date())
  const response = NextResponse.redirect(authorizeUrl({ clientId: client.clientId, redirect: redirectUri(request.nextUrl.origin), flow }), 303)
  response.headers.set('cache-control', 'private, no-store, max-age=0')
  response.cookies.set(OAUTH_COOKIE, sealFlow(flow, serverKey()), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: OAUTH_FLOW_MAX_AGE_S,
  })
  return response
}
