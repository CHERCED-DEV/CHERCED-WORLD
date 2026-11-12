import 'server-only'
import { SESSION_IDLE_MS, type AdminCredential, type AdminRepo, type AdminSession, type SetupCode } from '../types'
import { clone } from './ids'

export function createMemoryAdminRepo(): AdminRepo {
  let credential: AdminCredential | null = null
  let setupCode: SetupCode | null = null
  const sessions = new Map<string, AdminSession>()

  return {
    async getCredential() {
      return credential ? clone(credential) : null
    },
    async createCredential(c) {
      if (credential) return false
      credential = clone(c)
      return true
    },
    async updateCredential(c) {
      credential = clone(c)
    },
    async getSetupCode() {
      return setupCode ? clone(setupCode) : null
    },
    async saveSetupCode(c) {
      setupCode = clone(c)
    },
    async deleteSetupCode() {
      setupCode = null
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
    async deleteAllSessions() {
      sessions.clear()
    },
  }
}
