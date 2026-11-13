import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { AccountProfile } from '@/lib/data/types'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'] as const

export const OAUTH_COOKIE = 'cw-oauth'

export const OAUTH_FLOW_MAX_AGE_S = 10 * 60

export const CALLBACK_PATH = '/api/auth/google/callback'

const CLOCK_SKEW_S = 60

const NAME_MAX = 80

export type OAuthFlow = { state: string; verifier: string; nonce: string; next: string; lang: Locale; createdAt: number }

function token(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function newOAuthFlow(next: string, lang: Locale, now: Date): OAuthFlow {
  return { state: token(), verifier: token(48), nonce: token(), next, lang, createdAt: now.getTime() }
}

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier, 'ascii').digest('base64url')
}

function signature(payload: string, key: Buffer): string {
  return createHmac('sha256', key).update(`oauth:${payload}`, 'utf8').digest('base64url')
}

export function sealFlow(flow: OAuthFlow, key: Buffer): string {
  const payload = Buffer.from(JSON.stringify(flow), 'utf8').toString('base64url')
  return `${payload}.${signature(payload, key)}`
}

export function openFlow(value: string | null | undefined, key: Buffer, now: Date): OAuthFlow | null {
  if (!value) return null
  const [payload, mac, extra] = value.split('.')
  if (!payload || !mac || extra !== undefined) return null
  const expected = Buffer.from(signature(payload, key))
  const actual = Buffer.from(mac)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null
  try {
    const flow = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<OAuthFlow>
    if (typeof flow.state !== 'string' || typeof flow.verifier !== 'string' || typeof flow.nonce !== 'string') return null
    if (typeof flow.next !== 'string' || !isLocale(flow.lang) || typeof flow.createdAt !== 'number') return null
    const age = now.getTime() - flow.createdAt
    if (age < 0 || age > OAUTH_FLOW_MAX_AGE_S * 1000) return null
    return { state: flow.state, verifier: flow.verifier, nonce: flow.nonce, next: safeNext(flow.next, flow.lang), lang: flow.lang, createdAt: flow.createdAt }
  } catch {
    return null
  }
}

export function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function accountPath(lang: Locale): string {
  return `/${lang}/account`
}

export function safeNext(value: unknown, lang: Locale = defaultLocale): string {
  if (typeof value !== 'string' || value.length > 300) return accountPath(lang)
  if (!/^\/(es|en)(\/[A-Za-z0-9\-._~%/]*)?$/.test(value) || value.includes('//') || value.includes('/..')) return accountPath(lang)
  return value
}

export function redirectUri(origin: string): string {
  return `${origin}${CALLBACK_PATH}`
}

export function authorizeUrl({ clientId, redirect, flow }: { clientId: string; redirect: string; flow: OAuthFlow }): string {
  const url = new URL(GOOGLE_AUTHORIZE_URL)
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: 'openid email profile',
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: pkceChallenge(flow.verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
    hl: flow.lang,
  }).toString()
  return url.toString()
}

export function displayName(name: unknown, email: string): string {
  const clean = typeof name === 'string' ? name.replace(/[\u0000-\u001f\u007f<>]/g, '').trim() : ''
  return (clean || email.split('@')[0] || email).slice(0, NAME_MAX)
}

export function profileFromIdToken(idToken: unknown, { clientId, nonce, now }: { clientId: string; nonce: string; now: Date }): AccountProfile | null {
  if (typeof idToken !== 'string') return null
  const parts = idToken.split('.')
  if (parts.length !== 3) return null
  let claims: Record<string, unknown>
  try {
    claims = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return null
  }
  const seconds = Math.floor(now.getTime() / 1000)
  if (!GOOGLE_ISSUERS.includes(claims.iss as (typeof GOOGLE_ISSUERS)[number])) return null
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (!audience.includes(clientId)) return null
  if (Array.isArray(claims.aud) && claims.aud.length > 1 && claims.azp !== clientId) return null
  if (typeof claims.exp !== 'number' || claims.exp + CLOCK_SKEW_S < seconds) return null
  if (typeof claims.iat === 'number' && claims.iat - CLOCK_SKEW_S > seconds) return null
  if (typeof claims.nonce !== 'string' || !sameSecret(claims.nonce, nonce)) return null
  if (typeof claims.sub !== 'string' || claims.sub.length === 0 || claims.sub.length > 255) return null
  if (typeof claims.email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(claims.email) || claims.email.length > 254) return null
  if (claims.email_verified !== true && claims.email_verified !== 'true') return null
  const email = claims.email.trim().toLowerCase()
  return { googleSub: claims.sub, email, name: displayName(claims.name, email) }
}
