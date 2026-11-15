import 'server-only'
import type { LabConsent, LabRepo, LabSessionRecord, LabSummary } from '../types'
import { clone } from './ids'

export function createMemoryLabRepo(): LabRepo {
  const sessions = new Map<string, LabSessionRecord>()
  const consents = new Map<string, LabConsent>()
  const alive = (now = new Date()) => [...sessions.values()].filter((record) => record.expiresAt.getTime() > now.getTime())
  const newest = (a: LabSessionRecord, b: LabSessionRecord) => b.createdAt.getTime() - a.createdAt.getTime()

  return {
    async saveSession(record) {
      sessions.set(record.id, clone(record))
    },
    async setSummary(id, summary: LabSummary) {
      const record = sessions.get(id)
      if (record) record.summary = clone(summary)
    },
    async listByAccount(accountId, limit) {
      return alive()
        .filter((record) => record.accountId === accountId)
        .sort(newest)
        .slice(0, limit)
        .map((record) => clone(record))
    },
    async listRecent(limit) {
      return alive()
        .sort(newest)
        .slice(0, limit)
        .map((record) => clone(record))
    },
    async removeSession(accountId, id) {
      const record = sessions.get(id)
      if (!record || record.accountId !== accountId) return false
      return sessions.delete(id)
    },
    async removeAllFor(accountId) {
      for (const [id, record] of sessions) if (record.accountId === accountId) sessions.delete(id)
      consents.delete(accountId)
    },
    async getConsent(accountId) {
      const consent = consents.get(accountId)
      return consent ? clone(consent) : null
    },
    async setConsent(accountId, version, now) {
      consents.set(accountId, { accountId, version, acceptedAt: new Date(now), revokedAt: null })
    },
    async revokeConsent(accountId, now) {
      const consent = consents.get(accountId)
      if (consent) consent.revokedAt = new Date(now)
      for (const [id, record] of sessions) if (record.accountId === accountId) sessions.delete(id)
    },
  }
}
