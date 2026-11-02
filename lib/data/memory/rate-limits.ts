import 'server-only'
import type { RateLimitRepo } from '../types'

type Entry = { count: number; windowStart: number; blockedUntil: number | null }

export function createMemoryRateLimitRepo(): RateLimitRepo {
  const store = new Map<string, Entry>()

  return {
    async hit(key, rule, now) {
      const at = now.getTime()
      const current = store.get(key)

      if (current?.blockedUntil && current.blockedUntil > at) {
        return { allowed: false, retryAfterMs: current.blockedUntil - at }
      }

      if (!current || current.blockedUntil !== null || at - current.windowStart >= rule.windowMs) {
        const fresh: Entry = { count: 1, windowStart: at, blockedUntil: null }
        store.set(key, fresh)
        return fresh.count <= rule.limit
          ? { allowed: true, retryAfterMs: 0 }
          : { allowed: false, retryAfterMs: rule.windowMs }
      }

      current.count += 1
      if (current.count <= rule.limit) return { allowed: true, retryAfterMs: 0 }

      if (rule.blockMs !== undefined) {
        current.blockedUntil = at + rule.blockMs
        return { allowed: false, retryAfterMs: rule.blockMs }
      }
      return { allowed: false, retryAfterMs: current.windowStart + rule.windowMs - at }
    },
    async reset(key) {
      store.delete(key)
    },
  }
}
