import 'server-only'
import type { Repos } from '@/lib/data/types'
import { createMongoAccountRepo } from './accounts'
import { createMongoAdminRepo } from './admin'
import type { DbProvider } from './collections'
import { createMongoCommentRepo } from './comments'
import { createMongoMessageRepo } from './messages'
import { createMongoRateLimitRepo } from './rate-limits'
import { createMongoReactionRepo } from './reactions'

export function createMongoRepos(db: DbProvider): Repos {
  return {
    messages: createMongoMessageRepo(db),
    comments: createMongoCommentRepo(db),
    admin: createMongoAdminRepo(db),
    accounts: createMongoAccountRepo(db),
    rateLimits: createMongoRateLimitRepo(db),
    reactions: createMongoReactionRepo(db),
  }
}

export { createMongoAccountRepo, createMongoAdminRepo, createMongoCommentRepo, createMongoMessageRepo, createMongoRateLimitRepo, createMongoReactionRepo }
export { COLLECTIONS, type DbProvider } from './collections'
export { ensureIndexes, TTL_INDEXES } from './indexes'
