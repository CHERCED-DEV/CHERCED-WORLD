import 'server-only'
import { MongoServerError, type Document } from 'mongodb'
import type { RateLimitRepo, RateLimitResult, RateLimitRule } from '@/lib/data/types'
import { rateLimitsCollection, type DbProvider, type RateLimitDoc } from './collections'

const DUPLICATE_KEY = 11000

export function rateLimitPipeline(rule: RateLimitRule, now: Date): Document[] {
  const windowStart = { $ifNull: ['$windowStart', null] }
  const blockedUntil = { $ifNull: ['$blockedUntil', null] }
  const stages: Document[] = [
    { $set: { __blocked: { $and: [{ $ne: [blockedUntil, null] }, { $gt: ['$blockedUntil', now] }] } } },
    {
      $set: {
        __fresh: {
          $and: [
            { $not: ['$__blocked'] },
            {
              $or: [
                { $eq: [windowStart, null] },
                { $ne: [blockedUntil, null] },
                { $gte: [{ $subtract: [now, '$windowStart'] }, rule.windowMs] },
              ],
            },
          ],
        },
      },
    },
    {
      $set: {
        count: {
          $cond: ['$__blocked', '$count', { $cond: ['$__fresh', 1, { $add: [{ $ifNull: ['$count', 0] }, 1] }] }],
        },
        windowStart: { $cond: ['$__fresh', now, '$windowStart'] },
        blockedUntil: { $cond: ['$__fresh', null, blockedUntil] },
      },
    },
  ]
  if (rule.blockMs !== undefined) {
    stages.push({
      $set: {
        blockedUntil: {
          $cond: [
            { $and: [{ $not: ['$__blocked'] }, { $gt: ['$count', rule.limit] }] },
            new Date(now.getTime() + rule.blockMs),
            '$blockedUntil',
          ],
        },
      },
    })
  }
  stages.push(
    { $set: { expiresAt: { $max: [{ $add: ['$windowStart', rule.windowMs] }, { $ifNull: ['$blockedUntil', now] }] } } },
    { $unset: ['__blocked', '__fresh'] },
  )
  return stages
}

export function rateLimitResult(doc: Pick<RateLimitDoc, 'count' | 'windowStart' | 'blockedUntil'>, rule: RateLimitRule, now: Date): RateLimitResult {
  const at = now.getTime()
  if (doc.blockedUntil && doc.blockedUntil.getTime() > at) {
    return { allowed: false, retryAfterMs: doc.blockedUntil.getTime() - at }
  }
  if (doc.count <= rule.limit) return { allowed: true, retryAfterMs: 0 }
  return { allowed: false, retryAfterMs: Math.max(0, doc.windowStart.getTime() + rule.windowMs - at) }
}

export function createMongoRateLimitRepo(db: DbProvider): RateLimitRepo {
  async function apply(key: string, rule: RateLimitRule, now: Date): Promise<RateLimitDoc | null> {
    return (await rateLimitsCollection(db)).findOneAndUpdate({ _id: key }, rateLimitPipeline(rule, now), {
      upsert: true,
      returnDocument: 'after',
    })
  }

  return {
    async hit(key, rule, now) {
      let doc: RateLimitDoc | null
      try {
        doc = await apply(key, rule, now)
      } catch (error) {
        if (!(error instanceof MongoServerError && error.code === DUPLICATE_KEY)) throw error
        doc = await apply(key, rule, now)
      }
      if (!doc) throw new Error('RateLimitUpsertFailed')
      return rateLimitResult(doc, rule, now)
    },
    async reset(key) {
      await (await rateLimitsCollection(db)).deleteOne({ _id: key })
    },
  }
}
