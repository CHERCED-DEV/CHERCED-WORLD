import 'server-only'
import { randomBytes } from 'node:crypto'
import type { Collection } from 'mongodb'
import { normalizeEmail, cleanPermissions } from '@/lib/accounts/permissions'
import { SESSION_IDLE_MS, type AccountRecord, type AccountRepo } from '@/lib/data/types'
import {
  accountSessionsCollection,
  accountsCollection,
  teamGrantsCollection,
  type AccountDoc,
  type DbProvider,
} from './collections'

const INDEXED = Symbol.for('cherced-world.accounts-indexed')

type Holder = typeof globalThis & { [INDEXED]?: Promise<void> }

function ensureIndexes(accounts: Collection<AccountDoc>): Promise<void> {
  const holder = globalThis as Holder
  holder[INDEXED] ??= accounts
    .createIndex({ googleSub: 1 }, { unique: true, name: 'googleSub_unique' })
    .then(() => undefined)
    .catch((error: unknown) => {
      holder[INDEXED] = undefined
      throw error
    })
  return holder[INDEXED]
}

function toAccount(doc: AccountDoc): AccountRecord {
  return {
    id: doc._id,
    googleSub: doc.googleSub,
    email: doc.email,
    name: doc.name,
    createdAt: doc.createdAt,
    lastLoginAt: doc.lastLoginAt,
    blockedAt: doc.blockedAt ?? null,
  }
}

export function createMongoAccountRepo(db: DbProvider): AccountRepo {
  async function accounts() {
    const collection = await accountsCollection(db)
    await ensureIndexes(collection)
    return collection
  }

  return {
    async upsertFromGoogle(profile, now) {
      const doc = await (await accounts()).findOneAndUpdate(
        { googleSub: profile.googleSub },
        {
          $set: { email: normalizeEmail(profile.email), name: profile.name, lastLoginAt: now },
          $setOnInsert: { _id: randomBytes(12).toString('hex'), createdAt: now, blockedAt: null },
        },
        { upsert: true, returnDocument: 'after' },
      )
      if (!doc) throw new Error('account upsert returned nothing')
      return toAccount(doc)
    },
    async get(id) {
      const doc = await (await accounts()).findOne({ _id: id })
      return doc ? toAccount(doc) : null
    },
    async list() {
      const docs = await (await accounts()).find({}).sort({ lastLoginAt: -1 }).limit(500).toArray()
      return docs.map(toAccount)
    },
    async setBlocked(id, blockedAt) {
      const result = await (await accounts()).updateOne({ _id: id }, { $set: { blockedAt } })
      return result.matchedCount === 1
    },
    async remove(id) {
      const result = await (await accounts()).deleteOne({ _id: id })
      return result.deletedCount === 1
    },
    async getGrant(email) {
      const doc = await (await teamGrantsCollection(db)).findOne({ _id: normalizeEmail(email) })
      return doc ? { email: doc._id, permissions: cleanPermissions(doc.permissions), createdAt: doc.createdAt, updatedAt: doc.updatedAt } : null
    },
    async listGrants() {
      const docs = await (await teamGrantsCollection(db)).find({}).sort({ _id: 1 }).toArray()
      return docs.map((doc) => ({ email: doc._id, permissions: cleanPermissions(doc.permissions), createdAt: doc.createdAt, updatedAt: doc.updatedAt }))
    },
    async setGrant(email, permissions, now) {
      await (await teamGrantsCollection(db)).updateOne(
        { _id: normalizeEmail(email) },
        { $set: { permissions: [...permissions], updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true },
      )
    },
    async removeGrant(email) {
      const result = await (await teamGrantsCollection(db)).deleteOne({ _id: normalizeEmail(email) })
      return result.deletedCount === 1
    },
    async createSession(s) {
      await (await accountSessionsCollection(db)).insertOne({
        _id: s.tokenHash,
        accountId: s.accountId,
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
        expiresAt: s.expiresAt,
      })
    },
    async getSession(tokenHash) {
      const doc = await (await accountSessionsCollection(db)).findOne({ _id: tokenHash })
      return doc
        ? { tokenHash: doc._id, accountId: doc.accountId, createdAt: doc.createdAt, lastActivityAt: doc.lastActivityAt, expiresAt: doc.expiresAt }
        : null
    },
    async touchSession(tokenHash, now) {
      await (await accountSessionsCollection(db)).updateOne(
        { _id: tokenHash },
        { $set: { lastActivityAt: now, expiresAt: new Date(now.getTime() + SESSION_IDLE_MS) } },
      )
    },
    async deleteSession(tokenHash) {
      await (await accountSessionsCollection(db)).deleteOne({ _id: tokenHash })
    },
    async deleteSessionsFor(accountId) {
      await (await accountSessionsCollection(db)).deleteMany({ accountId })
    },
  }
}
