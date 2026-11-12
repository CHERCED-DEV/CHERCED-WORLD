import 'server-only'
import { MongoServerError } from 'mongodb'
import { SESSION_IDLE_MS, type AdminRepo } from '@/lib/data/types'
import {
  CREDENTIAL_ID,
  credentialsCollection,
  sessionsCollection,
  SETUP_CODE_ID,
  setupCodesCollection,
  type DbProvider,
} from './collections'

const DUPLICATE_KEY = 11000

export function createMongoAdminRepo(db: DbProvider): AdminRepo {
  return {
    async getCredential() {
      const doc = await (await credentialsCollection(db)).findOne({ _id: CREDENTIAL_ID })
      if (!doc) return null
      return {
        hash: doc.hash,
        salt: doc.salt,
        params: { N: doc.params.N, r: doc.params.r, p: doc.params.p, keyLen: doc.params.keyLen },
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }
    },
    async createCredential(c) {
      try {
        await (await credentialsCollection(db)).insertOne({ _id: CREDENTIAL_ID, ...c, params: { ...c.params } })
        return true
      } catch (error) {
        if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) return false
        throw error
      }
    },
    async updateCredential(c) {
      await (await credentialsCollection(db)).replaceOne(
        { _id: CREDENTIAL_ID },
        { hash: c.hash, salt: c.salt, params: { ...c.params }, createdAt: c.createdAt, updatedAt: c.updatedAt },
        { upsert: true },
      )
    },
    async getSetupCode() {
      const doc = await (await setupCodesCollection(db)).findOne({ _id: SETUP_CODE_ID })
      return doc ? { codeHash: doc.codeHash, expiresAt: doc.expiresAt, createdAt: doc.createdAt } : null
    },
    async saveSetupCode(c) {
      await (await setupCodesCollection(db)).replaceOne(
        { _id: SETUP_CODE_ID },
        { codeHash: c.codeHash, expiresAt: c.expiresAt, createdAt: c.createdAt },
        { upsert: true },
      )
    },
    async deleteSetupCode() {
      await (await setupCodesCollection(db)).deleteOne({ _id: SETUP_CODE_ID })
    },
    async createSession(s) {
      await (await sessionsCollection(db)).insertOne({
        _id: s.tokenHash,
        createdAt: s.createdAt,
        lastActivityAt: s.lastActivityAt,
        expiresAt: s.expiresAt,
      })
    },
    async getSession(tokenHash) {
      const doc = await (await sessionsCollection(db)).findOne({ _id: tokenHash })
      return doc
        ? { tokenHash: doc._id, createdAt: doc.createdAt, lastActivityAt: doc.lastActivityAt, expiresAt: doc.expiresAt }
        : null
    },
    async touchSession(tokenHash, now) {
      await (await sessionsCollection(db)).updateOne(
        { _id: tokenHash },
        { $set: { lastActivityAt: now, expiresAt: new Date(now.getTime() + SESSION_IDLE_MS) } },
      )
    },
    async deleteSession(tokenHash) {
      await (await sessionsCollection(db)).deleteOne({ _id: tokenHash })
    },
    async deleteAllSessions() {
      await (await sessionsCollection(db)).deleteMany({})
    },
  }
}
