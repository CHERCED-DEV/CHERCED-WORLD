import 'server-only'
import '@/lib/data/mongo/register'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { getRepos } from '@/lib/data'
import type { AdminSession } from '@/lib/data/types'
import { endSession, resolveSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS, startSession } from './session'

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  return resolveSession(getRepos().admin, await readSessionToken(), new Date(), { touch: true })
})

export async function requireAdmin(options: { touch?: boolean } = {}): Promise<AdminSession> {
  const session =
    options.touch === false
      ? await resolveSession(getRepos().admin, await readSessionToken(), new Date(), { touch: false })
      : await getAdminSession()
  if (!session) throw new UnauthorizedError()
  return session
}

export async function signIn(now: Date): Promise<void> {
  const { token } = await startSession(getRepos().admin, now)
  ;(await cookies()).set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
}

export async function signOut(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  store.delete({ name: SESSION_COOKIE, ...SESSION_COOKIE_OPTIONS })
  await endSession(getRepos().admin, token)
}

export async function rotateSession(now: Date): Promise<void> {
  const token = await readSessionToken()
  await endSession(getRepos().admin, token)
  await signIn(now)
}
