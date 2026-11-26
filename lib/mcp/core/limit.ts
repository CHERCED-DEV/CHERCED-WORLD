import 'server-only'
import '@/lib/data/mongo/register'
import { SPEND_GLOBAL_KEY } from '@/lib/ai/spend'
import { getRepos } from '@/lib/data'
import { clientIp, ipHash } from '@/lib/security/ip'
import { hitRateLimit, rateLimitKey, type RateLimitAction } from '@/lib/security/rate-limit'

export type LimitScope = 'visitor' | 'daily' | 'tool'

export type LimitVerdict = { allowed: true } | { allowed: false; scope: LimitScope; retryAfterSeconds: number }

export class McpLimitUnavailableError extends Error {
  constructor() {
    super('rate limit store unavailable')
    this.name = 'McpLimitUnavailable'
  }
}

type HeaderSource = { get(name: string): string | null }

export const MCP_GLOBAL_KEY = SPEND_GLOBAL_KEY

export function dailyCounterKey(action: RateLimitAction): string {
  return rateLimitKey(action, MCP_GLOBAL_KEY)
}

function seconds(ms: number): number {
  return Math.max(1, Math.ceil(ms / 1000))
}

async function hit(action: RateLimitAction, key: string, now: Date) {
  try {
    return await hitRateLimit(getRepos().rateLimits, action, key, now)
  } catch {
    throw new McpLimitUnavailableError()
  }
}

export async function checkServerLimits(
  headers: HeaderSource,
  limits: { visitor: RateLimitAction; daily: RateLimitAction },
  now: Date = new Date(),
): Promise<LimitVerdict> {
  const visitor = await hit(limits.visitor, ipHash(clientIp(headers)), now)
  if (!visitor.allowed) return { allowed: false, scope: 'visitor', retryAfterSeconds: seconds(visitor.retryAfterMs) }
  const daily = await hit(limits.daily, MCP_GLOBAL_KEY, now)
  if (!daily.allowed) return { allowed: false, scope: 'daily', retryAfterSeconds: seconds(daily.retryAfterMs) }
  return { allowed: true }
}

export async function checkToolLimit(headers: HeaderSource, action: RateLimitAction, now: Date = new Date()): Promise<LimitVerdict> {
  const result = await hit(action, ipHash(clientIp(headers)), now)
  return result.allowed ? { allowed: true } : { allowed: false, scope: 'tool', retryAfterSeconds: seconds(result.retryAfterMs) }
}
