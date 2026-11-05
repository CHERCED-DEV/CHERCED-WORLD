import 'server-only'
import { MongoServerError, type Filter, type UpdateFilter } from 'mongodb'
import type { ReactionKind, ReactionOp, ReactionRepo } from '@/lib/data/types'
import { reactionsCollection, type DbProvider, type ReactionDoc } from './collections'
import { toReactionCounts } from './mappers'

const DUPLICATE_KEY = 11000

export type ReactionWrite = { filter: Filter<ReactionDoc>; update: UpdateFilter<ReactionDoc>; upsert: boolean }

export function reactionWrite(postId: string, kind: ReactionKind, op: ReactionOp, now: Date): ReactionWrite {
  if (op === 'add') {
    return { filter: { _id: postId }, update: { $inc: { [kind]: 1 }, $set: { updatedAt: now } }, upsert: true }
  }
  return { filter: { _id: postId, [kind]: { $gt: 0 } }, update: { $inc: { [kind]: -1 }, $set: { updatedAt: now } }, upsert: false }
}

export function createMongoReactionRepo(db: DbProvider): ReactionRepo {
  return {
    async counts(postId) {
      return toReactionCounts(await (await reactionsCollection(db)).findOne({ _id: postId }))
    },
    async apply(postId, kind, op) {
      const collection = await reactionsCollection(db)
      const write = reactionWrite(postId, kind, op, new Date())
      const run = () => collection.findOneAndUpdate(write.filter, write.update, { upsert: write.upsert, returnDocument: 'after' })
      let doc: ReactionDoc | null
      try {
        doc = await run()
      } catch (error) {
        if (!(error instanceof MongoServerError && error.code === DUPLICATE_KEY)) throw error
        doc = await run()
      }
      return toReactionCounts(doc ?? (await collection.findOne({ _id: postId })))
    },
  }
}
