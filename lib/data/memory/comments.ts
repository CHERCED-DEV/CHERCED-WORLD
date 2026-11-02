import 'server-only'
import {
  canTransition,
  COMMENT_TRANSITIONS,
  type CommentRecord,
  type CommentRepo,
  type PublicComment,
} from '../types'
import { clone, newId } from './ids'

function toPublic(record: CommentRecord): PublicComment {
  return {
    id: record.id,
    userName: record.userName,
    comment: record.comment,
    createdAt: new Date(record.createdAt),
    authorReply: record.authorReply ? clone(record.authorReply) : null,
  }
}

export function createMemoryCommentRepo(): CommentRepo {
  const store = new Map<string, CommentRecord>()
  let sequence = 0
  const order = new Map<string, number>()

  const byCreated = (a: CommentRecord, b: CommentRecord) =>
    a.createdAt.getTime() - b.createdAt.getTime() || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)

  return {
    async create(input) {
      const now = new Date()
      const record: CommentRecord = {
        id: newId(),
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
      store.set(record.id, record)
      order.set(record.id, sequence++)
      return clone(record)
    },
    async listPublic(postId) {
      return [...store.values()]
        .filter((c) => c.postId === postId && c.status === 'approved')
        .sort(byCreated)
        .map(toPublic)
    },
    async listForModeration({ status }) {
      return [...store.values()]
        .filter((c) => !status || status === 'all' || c.status === status)
        .sort((a, b) => byCreated(b, a))
        .map(clone)
    },
    async setStatus(id, status) {
      const record = store.get(id)
      if (!record || !canTransition(COMMENT_TRANSITIONS, record.status, status)) return false
      record.status = status
      if (status === 'rejected') record.authorReply = null
      record.updatedAt = new Date()
      return true
    },
    async setReply(id, text) {
      const record = store.get(id)
      if (!record || record.status !== 'approved') return false
      const now = new Date()
      record.authorReply =
        text === null
          ? null
          : { text, createdAt: record.authorReply?.createdAt ?? now, updatedAt: now }
      record.updatedAt = now
      return true
    },
    async remove(id) {
      order.delete(id)
      return store.delete(id)
    },
    async countPending() {
      return [...store.values()].filter((c) => c.status === 'pending').length
    },
    async changedSince(since) {
      return [...store.values()]
        .filter((c) => c.updatedAt.getTime() > since.getTime())
        .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
        .map(clone)
    },
  }
}
