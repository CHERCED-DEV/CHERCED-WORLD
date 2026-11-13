import 'server-only'
import type { Repos } from '../types'
import { createMemoryAccountRepo } from './accounts'
import { createMemoryAdminRepo } from './admin'
import { createMemoryCommentRepo } from './comments'
import { createMemoryMessageRepo } from './messages'
import { createMemoryRateLimitRepo } from './rate-limits'
import { createMemoryReactionRepo } from './reactions'

export function createMemoryRepos(): Repos {
  return {
    messages: createMemoryMessageRepo(),
    comments: createMemoryCommentRepo(),
    admin: createMemoryAdminRepo(),
    accounts: createMemoryAccountRepo(),
    rateLimits: createMemoryRateLimitRepo(),
    reactions: createMemoryReactionRepo(),
  }
}

export { createMemoryAccountRepo, createMemoryAdminRepo, createMemoryCommentRepo, createMemoryMessageRepo, createMemoryRateLimitRepo, createMemoryReactionRepo }
