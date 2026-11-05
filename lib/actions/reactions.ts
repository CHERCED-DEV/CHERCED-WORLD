'use server'

import '@/lib/data/mongo/register'
import { postIds } from '@/lib/content'
import { getRepos } from '@/lib/data'
import type { ReactionCounts, ReactionKind, ReactionOp } from '@/lib/data/types'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'
import { parseInput, reactionSchema } from '@/lib/validation'
import { fail, ok, type ActionResult } from './result'

export type ReactionResult = ActionResult<{ counts: ReactionCounts }>

export async function toggleReaction(postId: string, kind: ReactionKind, op: ReactionOp): Promise<ReactionResult> {
  const parsed = parseInput(reactionSchema, { postId, kind, op })
  if (!parsed.success || !postIds().includes(parsed.data.postId)) return fail('validation')

  try {
    const repos = getRepos()
    const limit = await hitRateLimit(repos.rateLimits, 'reaction', await requestIpHash(), new Date())
    if (!limit.allowed) return fail('rate_limited', { retryAfterMs: limit.retryAfterMs })

    const { clap, idea, fire } = await repos.reactions.apply(parsed.data.postId, parsed.data.kind, parsed.data.op)
    return ok({ counts: { clap, idea, fire } })
  } catch (error) {
    logServerError('reactions.toggle', error)
    return fail('unavailable')
  }
}
