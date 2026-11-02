import 'server-only'
import type { Db } from 'mongodb'
import { COLLECTIONS } from './collections'

export const TTL_INDEXES = [COLLECTIONS.setupCodes, COLLECTIONS.sessions, COLLECTIONS.rateLimits] as const

export const TTL_INDEX_NAME = 'expiresAt_ttl'

export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all(
    TTL_INDEXES.map((name) =>
      db.collection(name).createIndex({ expiresAt: 1 }, { name: TTL_INDEX_NAME, expireAfterSeconds: 0 }),
    ),
  )
}
