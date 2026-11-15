import 'server-only'
import type { RateLimitRepo, RateLimitResult, RateLimitRule } from '@/lib/data/types'

const MINUTE = 60_000

export const RATE_LIMITS = {
  contact: { limit: 3, windowMs: 10 * MINUTE },
  comment: { limit: 3, windowMs: 10 * MINUTE },
  login: { limit: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  setup: { limit: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  reaction: { limit: 10, windowMs: 10 * MINUTE },
  account: { limit: 10, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE },
  profile: { limit: 30, windowMs: 60 * MINUTE },
  avatar: { limit: 10, windowMs: 60 * MINUTE },
  accountExport: { limit: 10, windowMs: 60 * MINUTE },
  agent: { limit: 3, windowMs: 60 * MINUTE },
  agentDaily: { limit: 20, windowMs: 24 * 60 * MINUTE },
  agentTrial: { limit: 2, windowMs: 24 * 60 * MINUTE },
  agentTrialDaily: { limit: 15, windowMs: 24 * 60 * MINUTE },
  match: { limit: 5, windowMs: 24 * 60 * MINUTE },
  matchDaily: { limit: 50, windowMs: 24 * 60 * MINUTE },
  labSave: { limit: 30, windowMs: 60 * MINUTE },
  labConsent: { limit: 20, windowMs: 60 * MINUTE },
  code: { limit: 10, windowMs: 60 * MINUTE },
  codeQuestion: { limit: 5, windowMs: 60 * MINUTE },
  codeDaily: { limit: 80, windowMs: 24 * 60 * MINUTE },
  diagram: { limit: 10, windowMs: 24 * 60 * MINUTE },
  diagramDaily: { limit: 100, windowMs: 24 * 60 * MINUTE },
  write: { limit: 10, windowMs: 24 * 60 * MINUTE },
  writeDaily: { limit: 100, windowMs: 24 * 60 * MINUTE },
  listen: { limit: 150, windowMs: 24 * 60 * MINUTE },
  shot: { limit: 5, windowMs: 24 * 60 * MINUTE },
  shotDaily: { limit: 60, windowMs: 24 * 60 * MINUTE },
  pixel: { limit: 2, windowMs: 24 * 60 * MINUTE },
  pixelDaily: { limit: 20, windowMs: 24 * 60 * MINUTE },
  listenDaily: { limit: 600, windowMs: 24 * 60 * MINUTE },
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
