import 'server-only'
import type { Repos } from '@/lib/data/types'
import { createMongoAdminRepo } from './admin'
import type { DbProvider } from './collections'
import { createMongoCommentRepo } from './comments'
import { createMongoMessageRepo } from './messages'
import { createMongoRateLimitRepo } from './rate-limits'

export function createMongoRepos(db: DbProvider): Repos {
  return {
    messages: createMongoMessageRepo(db),
    comments: createMongoCommentRepo(db),
    admin: createMongoAdminRepo(db),
    rateLimits: createMongoRateLimitRepo(db),
  }
}

export { createMongoAdminRepo, createMongoCommentRepo, createMongoMessageRepo, createMongoRateLimitRepo }
export { COLLECTIONS, type DbProvider } from './collections'
export { ensureIndexes, TTL_INDEXES } from './indexes'
