import 'server-only'
import type { Repos } from '../types'
import { createMemoryAccountRepo } from './accounts'
import { createMemoryAdminRepo } from './admin'
import { createMemoryBudgetRepo } from './budget'
import { createMemoryCommentRepo } from './comments'
import { createMemoryLabRepo } from './lab'
import { createMemoryMessageRepo } from './messages'
import { createMemoryProfileRepo } from './profiles'
import { createMemoryRateLimitRepo } from './rate-limits'
import { createMemoryReactionRepo } from './reactions'

export function createMemoryRepos(): Repos {
  return {
    messages: createMemoryMessageRepo(),
    comments: createMemoryCommentRepo(),
    admin: createMemoryAdminRepo(),
    accounts: createMemoryAccountRepo(),
    profiles: createMemoryProfileRepo(),
    lab: createMemoryLabRepo(),
    rateLimits: createMemoryRateLimitRepo(),
    reactions: createMemoryReactionRepo(),
    budget: createMemoryBudgetRepo(),
  }
}

export { createMemoryAccountRepo, createMemoryAdminRepo, createMemoryBudgetRepo, createMemoryCommentRepo, createMemoryLabRepo, createMemoryMessageRepo, createMemoryProfileRepo, createMemoryRateLimitRepo, createMemoryReactionRepo }
