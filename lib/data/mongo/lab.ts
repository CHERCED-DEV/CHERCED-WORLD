import 'server-only'
import type { Collection, Db } from 'mongodb'
import { LAB_END_REASONS, LAB_INTENTS, type LabConsent, type LabEndReason, type LabIntent, type LabRepo, type LabSessionRecord, type LabSummary } from '@/lib/data/types'
import type { DbProvider } from './collections'
import { TTL_INDEX_NAME } from './indexes'

export const LAB_SESSIONS = 'lab_sessions'

export const LAB_CONSENTS = 'lab_consents'

type SessionDoc = Omit<LabSessionRecord, 'id'> & { _id: string }

type ConsentDoc = { _id: string; version: string; acceptedAt: Date; revokedAt: Date | null; updatedAt: Date }

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function date(value: unknown): Date {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date(0)
}

function summaryOf(value: unknown): LabSummary | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  return {
    points: strings(raw.points),
    intent: oneOf<LabIntent>(LAB_INTENTS, raw.intent, 'otro'),
    topic: typeof raw.topic === 'string' ? raw.topic : '',
    unanswered: strings(raw.unanswered),
    model: typeof raw.model === 'string' ? raw.model : '',
    costUsd: typeof raw.costUsd === 'number' ? raw.costUsd : 0,
    createdAt: date(raw.createdAt),
  }
}

export function toLabRecord(doc: SessionDoc): LabSessionRecord {
  return {
    id: doc._id,
    accountId: doc.accountId,
    experiment: 'V5',
    lang: doc.lang === 'en' ? 'en' : 'es',
    mode: doc.mode === 'local' ? 'local' : 'live',
    interview: typeof doc.interview === 'string' ? doc.interview : null,
    startedAt: date(doc.startedAt),
    endedAt: date(doc.endedAt),
    endReason: oneOf<LabEndReason>(LAB_END_REASONS, doc.endReason, 'hangup'),
    turns: Array.isArray(doc.turns)
      ? doc.turns.flatMap((turn) => (turn && (turn.who === 'you' || turn.who === 'agent') && typeof turn.text === 'string' ? [{ who: turn.who, text: turn.text }] : []))
      : [],
    trace: doc.trace ?? null,
    summary: summaryOf(doc.summary),
    createdAt: date(doc.createdAt),
    expiresAt: date(doc.expiresAt),
  }
}

let indexed: Promise<unknown> | null = null

function ensureLabIndexes(db: Db): Promise<unknown> {
  indexed ??= Promise.all([
    db.collection(LAB_SESSIONS).createIndex({ expiresAt: 1 }, { name: TTL_INDEX_NAME, expireAfterSeconds: 0 }),
    db.collection(LAB_SESSIONS).createIndex({ accountId: 1, createdAt: -1 }, { name: 'account_recent' }),
    db.collection(LAB_SESSIONS).createIndex({ experiment: 1, createdAt: -1 }, { name: 'experiment_recent' }),
  ]).catch((error: unknown) => {
    indexed = null
    throw error
  })
  return indexed
}

export function createMongoLabRepo(provider: DbProvider): LabRepo {
  async function sessions(): Promise<Collection<SessionDoc>> {
    const db = await provider()
    await ensureLabIndexes(db)
    return db.collection<SessionDoc>(LAB_SESSIONS)
  }
  async function consents(): Promise<Collection<ConsentDoc>> {
    return (await provider()).collection<ConsentDoc>(LAB_CONSENTS)
  }

  return {
    async saveSession(record) {
      const { id, ...rest } = record
      await (await sessions()).replaceOne({ _id: id }, rest, { upsert: true })
    },
    async setSummary(id, summary) {
      await (await sessions()).updateOne({ _id: id }, { $set: { summary } })
    },
    async listByAccount(accountId, limit) {
      const docs = await (await sessions()).find({ accountId, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(limit).toArray()
      return docs.map(toLabRecord)
    },
    async listRecent(limit) {
      const docs = await (await sessions()).find({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(limit).toArray()
      return docs.map(toLabRecord)
    },
    async removeSession(accountId, id) {
      const result = await (await sessions()).deleteOne({ _id: id, accountId })
      return result.deletedCount === 1
    },
    async removeAllFor(accountId) {
      await (await sessions()).deleteMany({ accountId })
      await (await consents()).deleteOne({ _id: accountId })
    },
    async getConsent(accountId) {
      const doc = await (await consents()).findOne({ _id: accountId })
      return doc ? ({ accountId, version: doc.version, acceptedAt: date(doc.acceptedAt), revokedAt: doc.revokedAt ? date(doc.revokedAt) : null } satisfies LabConsent) : null
    },
    async setConsent(accountId, version, now) {
      await (await consents()).replaceOne({ _id: accountId }, { version, acceptedAt: now, revokedAt: null, updatedAt: now }, { upsert: true })
    },
    async revokeConsent(accountId, now) {
      await (await consents()).updateOne({ _id: accountId }, { $set: { revokedAt: now, updatedAt: now } })
      await (await sessions()).deleteMany({ accountId })
    },
  }
}
