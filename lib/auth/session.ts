import 'server-only'
import { randomBytes } from 'node:crypto'
import { SESSION_IDLE_MS, type AdminRepo, type AdminSession } from '@/lib/data/types'
import { sha256Hex } from '@/lib/security/keys'

export const SESSION_COOKIE = 'cw-admin'

export const SESSION_TOKEN_BYTES = 32

export const SESSION_TOUCH_INTERVAL_MS = 60_000

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
} as const

export function newSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString('base64url')
}

export function hashSessionToken(token: string): string {
  return sha256Hex(token)
}

export function isWellFormedToken(token: string | null | undefined): token is string {
  return typeof token === 'string' && TOKEN_PATTERN.test(token)
}

export async function startSession(admin: AdminRepo, now: Date): Promise<{ token: string; session: AdminSession }> {
  const token = newSessionToken()
  const session: AdminSession = {
    tokenHash: hashSessionToken(token),
    createdAt: now,
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + SESSION_IDLE_MS),
  }
  await admin.createSession(session)
  return { token, session }
}

export async function resolveSession(
  admin: AdminRepo,
  token: string | null | undefined,
  now: Date,
  options: { touch: boolean },
): Promise<AdminSession | null> {
  if (!isWellFormedToken(token)) return null
  const tokenHash = hashSessionToken(token)
  const session = await admin.getSession(tokenHash)
  if (!session) return null
  if (session.expiresAt.getTime() <= now.getTime()) {
    await admin.deleteSession(tokenHash)
    return null
  }
  if (options.touch && now.getTime() - session.lastActivityAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
    await admin.touchSession(tokenHash, now)
    return { ...session, lastActivityAt: now, expiresAt: new Date(now.getTime() + SESSION_IDLE_MS) }
  }
  return session
}

export async function endSession(admin: AdminRepo, token: string | null | undefined): Promise<void> {
  if (!isWellFormedToken(token)) return
  await admin.deleteSession(hashSessionToken(token))
}
