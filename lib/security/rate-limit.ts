import 'server-only'
import type { RateLimitRepo, RateLimitResult, RateLimitRule } from '@/lib/data/types'

const MINUTE = 60_000

export const RATE_LIMITS = {
  contact: { limit: 3, windowMs: 10 * MINUTE },
  comment: { limit: 3, windowMs: 10 * MINUTE },
  login: { limit: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  setup: { limit: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  reaction: { limit: 10, windowMs: 10 * MINUTE },
} as const satisfies Record<string, RateLimitRule>

export type RateLimitAction = keyof typeof RATE_LIMITS

export function rateLimitKey(action: RateLimitAction, hashedIp: string): string {
  return `${action}:${hashedIp}`
}

export function hitRateLimit(
  repo: RateLimitRepo,
  action: RateLimitAction,
  hashedIp: string,
  now: Date,
): Promise<RateLimitResult> {
  return repo.hit(rateLimitKey(action, hashedIp), RATE_LIMITS[action], now)
}

export function resetRateLimit(repo: RateLimitRepo, action: RateLimitAction, hashedIp: string): Promise<void> {
  return repo.reset(rateLimitKey(action, hashedIp))
}
