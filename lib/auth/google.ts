import 'server-only'
import { repoBackend } from '@/lib/data/mongo/register'
import { getRepos } from '@/lib/data'
import type { AccountProfile } from '@/lib/data/types'
import { logServerError } from '@/lib/security/log'
import { startAccountSession } from './accounts'
import { GOOGLE_TOKEN_URL } from './oauth'

export const GOOGLE_CLIENT_ID_ENV = 'GOOGLE_CLIENT_ID'

export const GOOGLE_CLIENT_SECRET_ENV = 'GOOGLE_CLIENT_SECRET'

const TOKEN_TIMEOUT_MS = 8000

export type GoogleClient = { clientId: string; clientSecret: string }

export type SignInMode = 'google' | 'local' | 'off'

export function googleClient(env: Record<string, string | undefined> = process.env): GoogleClient | null {
  const clientId = env[GOOGLE_CLIENT_ID_ENV]?.trim()
  const clientSecret = env[GOOGLE_CLIENT_SECRET_ENV]?.trim()
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

export function signInMode(env: Record<string, string | undefined> = process.env): SignInMode {
  if (googleClient(env)) return 'google'
  return repoBackend(env) === 'memory' ? 'local' : 'off'
}

export async function exchangeCode(client: GoogleClient, code: string, verifier: string, redirect: string): Promise<unknown> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: redirect,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!response.ok) {
    logServerError('auth.google.token', new Error(`token endpoint ${response.status}`))
    return null
  }
  const body = (await response.json()) as { id_token?: unknown }
  return body.id_token ?? null
}

export async function completeSignIn(profile: AccountProfile, now: Date): Promise<'ok' | 'blocked'> {
  const account = await getRepos().accounts.upsertFromGoogle(profile, now)
  if (account.blockedAt) return 'blocked'
  await startAccountSession(account.id, now)
  return 'ok'
}
