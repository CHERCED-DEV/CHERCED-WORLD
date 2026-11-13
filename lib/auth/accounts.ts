import 'server-only'
import '@/lib/data/mongo/register'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { can, teamPermissions, type PanelActor } from '@/lib/accounts/permissions'
import { getRepos } from '@/lib/data'
import { SESSION_IDLE_MS, SESSION_MAX_AGE_MS, type AccountRecord, type AccountRepo, type Permission } from '@/lib/data/types'
import { READER_HINT_COOKIE, READER_HINT_OPTIONS } from './reader-hint'
import { getAdminSession, UnauthorizedError } from './guard'
import { hashSessionToken, isWellFormedToken, newSessionToken, SESSION_COOKIE_OPTIONS, SESSION_TOUCH_INTERVAL_MS } from './session'

export const ACCOUNT_COOKIE = 'cw-account'

export type AccountState = { account: AccountRecord; permissions: Permission[] }

export async function resolveAccount(repo: AccountRepo, token: string | null | undefined, now: Date): Promise<AccountRecord | null> {
  if (!isWellFormedToken(token)) return null
  const tokenHash = hashSessionToken(token)
  const session = await repo.getSession(tokenHash)
  if (!session) return null
  if (session.expiresAt.getTime() <= now.getTime() || now.getTime() - session.createdAt.getTime() >= SESSION_MAX_AGE_MS) {
    await repo.deleteSession(tokenHash)
    return null
  }
  const account = await repo.get(session.accountId)
  if (!account || account.blockedAt) {
    await repo.deleteSession(tokenHash)
    return null
  }
  if (now.getTime() - session.lastActivityAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) await repo.touchSession(tokenHash, now)
  return account
}

export const getAccountState = cache(async (): Promise<AccountState | null> => {
  const repo = getRepos().accounts
  const account = await resolveAccount(repo, (await cookies()).get(ACCOUNT_COOKIE)?.value, new Date())
  if (!account) return null
  return { account, permissions: teamPermissions(account, await repo.getGrant(account.email)) }
})

export const getPanelActor = cache(async (): Promise<PanelActor | null> => {
  if (await getAdminSession()) return { kind: 'owner' }
  const state = await getAccountState()
  if (!state || state.permissions.length === 0) return null
  return { kind: 'team', account: state.account, permissions: state.permissions }
})

export async function requirePermission(permission: Permission): Promise<PanelActor> {
  const actor = await getPanelActor()
  if (!actor || !can(actor, permission)) throw new UnauthorizedError()
  return actor
}

export async function startAccountSession(accountId: string, now: Date): Promise<void> {
  const token = newSessionToken()
  await getRepos().accounts.createSession({
    tokenHash: hashSessionToken(token),
    accountId,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + SESSION_IDLE_MS),
  })
  const store = await cookies()
  store.set(ACCOUNT_COOKIE, token, SESSION_COOKIE_OPTIONS)
  store.set(READER_HINT_COOKIE, '1', READER_HINT_OPTIONS)
}

export async function endAccountSession(): Promise<void> {
  const store = await cookies()
  const token = store.get(ACCOUNT_COOKIE)?.value
  store.delete({ name: ACCOUNT_COOKIE, ...SESSION_COOKIE_OPTIONS })
  store.delete({ name: READER_HINT_COOKIE, ...READER_HINT_OPTIONS })
  if (isWellFormedToken(token)) await getRepos().accounts.deleteSession(hashSessionToken(token))
}
