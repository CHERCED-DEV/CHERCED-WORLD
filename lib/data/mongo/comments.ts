import 'server-only'
import { ObjectId } from 'mongodb'
import { COMMENT_TRANSITIONS, type CommentRepo, type CommentStatus } from '@/lib/data/types'
import { commentsCollection, type CommentDoc, type DbProvider } from './collections'
import {
  COMMENT_STATUSES,
  LEGACY_COMMENT_STATUS,
  statusFilter,
  toCommentRecord,
  toObjectId,
  toPublicComment,
  transitionSources,
} from './mappers'

const PUBLIC_PROJECTION = { _id: 1, userName: 1, comment: 1, authorReply: 1, createdAt: 1, date: 1 } as const

function byStatus(status: CommentStatus | 'all' | undefined): Record<string, unknown> {
  if (!status || status === 'all') return {}
  return statusFilter(COMMENT_STATUSES, LEGACY_COMMENT_STATUS, [status])
}

const approved = () => statusFilter(COMMENT_STATUSES, LEGACY_COMMENT_STATUS, ['approved'])

export function createMongoCommentRepo(db: DbProvider): CommentRepo {
  return {
    async create(input) {
      const now = new Date()
      const doc: CommentDoc = {
        _id: new ObjectId(),
        postId: input.postId,
        userName: input.userName,
        email: input.email,
        comment: input.comment,
        lang: input.lang,
        status: 'pending',
        consentAt: input.consentAt,
        authorReply: null,
        createdAt: now,
        updatedAt: now,
      }
      await (await commentsCollection(db)).insertOne(doc)
      return toCommentRecord(doc)
    },
    async listPublic(postId) {
      const docs = await (await commentsCollection(db))
        .find({ postId, ...approved() }, { projection: PUBLIC_PROJECTION })
        .sort({ createdAt: 1, _id: 1 })
        .toArray()
      return docs.map(toPublicComment)
    },
    async listForModeration({ status }) {
      const docs = await (await commentsCollection(db))
        .find(byStatus(status))
        .sort({ createdAt: -1, _id: -1 })
        .toArray()
      return docs.map(toCommentRecord)
    },
    async setStatus(id, status) {
      const _id = toObjectId(id)
      if (!_id) return false
      const sources = transitionSources(COMMENT_STATUSES, COMMENT_TRANSITIONS, status)
      const set: Record<string, unknown> = { status, updatedAt: new Date() }
      if (status === 'rejected') set.authorReply = null
      const result = await (await commentsCollection(db)).updateOne(
        { _id, ...statusFilter(COMMENT_STATUSES, LEGACY_COMMENT_STATUS, sources) },
        { $set: set },
      )
      return result.matchedCount === 1
    },
    async setReply(id, text) {
      const _id = toObjectId(id)
      if (!_id) return false
      const collection = await commentsCollection(db)
      const filter = { _id, ...approved() }
      const current = await collection.findOne(filter, { projection: { authorReply: 1, createdAt: 1 } })
      if (!current) return false
      const now = new Date()
      const previous = toCommentRecord({ ...current, _id }).authorReply
      const authorReply = text === null ? null : { text, createdAt: previous?.createdAt ?? now, updatedAt: now }
      const result = await collection.updateOne(filter, { $set: { authorReply, updatedAt: now } })
      return result.matchedCount === 1
    },
    async remove(id) {
      const _id = toObjectId(id)
      if (!_id) return false
      const result = await (await commentsCollection(db)).deleteOne({ _id })
      return result.deletedCount === 1
    },
    async countPending() {
      return (await commentsCollection(db)).countDocuments({ status: 'pending' })
    },
    async changedSince(since) {
      const docs = await (await commentsCollection(db))
        .find({ updatedAt: { $gt: since } })
        .sort({ updatedAt: 1, _id: 1 })
        .toArray()
      return docs.map(toCommentRecord)
    },
  }
}
