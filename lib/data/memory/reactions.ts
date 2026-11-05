import 'server-only'
import { emptyReactionCounts, type ReactionCounts, type ReactionRepo } from '../types'

export function createMemoryReactionRepo(): ReactionRepo {
  const store = new Map<string, ReactionCounts>()

  const read = (postId: string): ReactionCounts => ({ ...(store.get(postId) ?? emptyReactionCounts()) })

  return {
    async counts(postId) {
      return read(postId)
    },
    async apply(postId, kind, op) {
      const next = read(postId)
      next[kind] = op === 'add' ? next[kind] + 1 : Math.max(0, next[kind] - 1)
      store.set(postId, next)
      return { ...next }
    },
  }
}
