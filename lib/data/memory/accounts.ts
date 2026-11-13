import 'server-only'
import { SESSION_IDLE_MS, type AccountRecord, type AccountRepo, type AccountSession, type TeamGrant } from '../types'
import { normalizeEmail } from '@/lib/accounts/permissions'
import { clone, newId } from './ids'

export function createMemoryAccountRepo(): AccountRepo {
  const accounts = new Map<string, AccountRecord>()
  const grants = new Map<string, TeamGrant>()
  const sessions = new Map<string, AccountSession>()

  return {
    async upsertFromGoogle(profile, now) {
      const existing = [...accounts.values()].find((account) => account.googleSub === profile.googleSub)
      const record: AccountRecord = existing
        ? { ...existing, email: normalizeEmail(profile.email), name: profile.name, lastLoginAt: new Date(now) }
        : {
            id: newId(),
            googleSub: profile.googleSub,
            email: normalizeEmail(profile.email),
            name: profile.name,
            createdAt: new Date(now),
            lastLoginAt: new Date(now),
            blockedAt: null,
          }
      accounts.set(record.id, record)
      return clone(record)
    },
    async get(id) {
      const account = accounts.get(id)
      return account ? clone(account) : null
    },
    async list() {
      return [...accounts.values()].sort((a, b) => b.lastLoginAt.getTime() - a.lastLoginAt.getTime()).map(clone)
    },
    async setBlocked(id, blockedAt) {
      const account = accounts.get(id)
      if (!account) return false
      account.blockedAt = blockedAt ? new Date(blockedAt) : null
      return true
    },
    async remove(id) {
      return accounts.delete(id)
    },
    async getGrant(email) {
      const grant = grants.get(normalizeEmail(email))
      return grant ? clone(grant) : null
    },
    async listGrants() {
      return [...grants.values()].sort((a, b) => a.email.localeCompare(b.email)).map(clone)
    },
    async setGrant(email, permissions, now) {
      const key = normalizeEmail(email)
      const existing = grants.get(key)
      grants.set(key, { email: key, permissions: [...permissions], createdAt: existing?.createdAt ?? new Date(now), updatedAt: new Date(now) })
    },
    async removeGrant(email) {
      return grants.delete(normalizeEmail(email))
    },
    async createSession(s) {
      sessions.set(s.tokenHash, clone(s))
    },
    async getSession(tokenHash) {
      const session = sessions.get(tokenHash)
      return session ? clone(session) : null
    },
    async touchSession(tokenHash, now) {
      const session = sessions.get(tokenHash)
      if (!session) return
      session.lastActivityAt = new Date(now)
      session.expiresAt = new Date(now.getTime() + SESSION_IDLE_MS)
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash)
    },
    async deleteSessionsFor(accountId) {
      for (const [hash, session] of sessions) if (session.accountId === accountId) sessions.delete(hash)
    },
  }
}
