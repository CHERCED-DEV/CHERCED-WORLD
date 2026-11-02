import 'server-only'
import type { Repos } from '../types'
import { createMemoryAdminRepo } from './admin'
import { createMemoryCommentRepo } from './comments'
import { createMemoryMessageRepo } from './messages'
import { createMemoryRateLimitRepo } from './rate-limits'

export function createMemoryRepos(): Repos {
  return {
    messages: createMemoryMessageRepo(),
    comments: createMemoryCommentRepo(),
    admin: createMemoryAdminRepo(),
    rateLimits: createMemoryRateLimitRepo(),
  }
}

export { createMemoryAdminRepo, createMemoryCommentRepo, createMemoryMessageRepo, createMemoryRateLimitRepo }
