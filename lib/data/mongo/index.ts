import 'server-only'
import type { Repos } from '@/lib/data/types'
import { createMongoAccountRepo } from './accounts'
import { createMongoAdminRepo } from './admin'
import { createMongoBudgetRepo } from './budget'
import type { DbProvider } from './collections'
import { createMongoCommentRepo } from './comments'
import { createMongoLabRepo } from './lab'
import { createMongoMessageRepo } from './messages'
import { createMongoProfileRepo } from './profiles'
import { createMongoRateLimitRepo } from './rate-limits'
import { createMongoReactionRepo } from './reactions'

export function createMongoRepos(db: DbProvider): Repos {
  return {
    messages: createMongoMessageRepo(db),
    comments: createMongoCommentRepo(db),
    admin: createMongoAdminRepo(db),
    accounts: createMongoAccountRepo(db),
    profiles: createMongoProfileRepo(db),
    lab: createMongoLabRepo(db),
    rateLimits: createMongoRateLimitRepo(db),
    reactions: createMongoReactionRepo(db),
    budget: createMongoBudgetRepo(db),
  }
}

export { createMongoAccountRepo, createMongoAdminRepo, createMongoBudgetRepo, createMongoCommentRepo, createMongoMessageRepo, createMongoProfileRepo, createMongoRateLimitRepo, createMongoReactionRepo }
export { COLLECTIONS, type DbProvider } from './collections'
export { ensureIndexes, TTL_INDEXES } from './indexes'
