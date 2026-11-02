import 'server-only'
import { ObjectId } from 'mongodb'
import { isLocale } from '@/lib/i18n/config'
import type {
  AuthorReply,
  CommentRecord,
  CommentStatus,
  MessageRecord,
  MessageStatus,
  PublicComment,
} from '@/lib/data/types'
import type { CommentDoc, MessageDoc } from './collections'

export const MESSAGE_STATUSES: readonly MessageStatus[] = ['unread', 'read', 'archived']

export const COMMENT_STATUSES: readonly CommentStatus[] = ['pending', 'approved', 'rejected']

export const LEGACY_MESSAGE_STATUS: MessageStatus = 'read'

export const LEGACY_COMMENT_STATUS: CommentStatus = 'approved'

export function toObjectId(id: string): ObjectId | null {
  return /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null
}

function text(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function validDate(value: unknown): Date | null {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null
}

function legacyDate(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function messageStatusOf(value: unknown): MessageStatus {
  return MESSAGE_STATUSES.includes(value as MessageStatus) ? (value as MessageStatus) : LEGACY_MESSAGE_STATUS
}

export function commentStatusOf(value: unknown): CommentStatus {
  return COMMENT_STATUSES.includes(value as CommentStatus) ? (value as CommentStatus) : LEGACY_COMMENT_STATUS
}

function phoneOf(value: unknown): string | number | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

function replyOf(value: unknown): AuthorReply | null {
  if (!value || typeof value !== 'object') return null
  const reply = value as Record<string, unknown>
  const createdAt = validDate(reply.createdAt)
  if (typeof reply.text !== 'string' || !createdAt) return null
  return { text: reply.text, createdAt: new Date(createdAt), updatedAt: new Date(validDate(reply.updatedAt) ?? createdAt) }
}

function timestamps(doc: { _id: ObjectId; createdAt?: unknown; updatedAt?: unknown; date?: unknown }) {
  const createdAt = validDate(doc.createdAt) ?? legacyDate(doc.date) ?? doc._id.getTimestamp()
  const updatedAt = validDate(doc.updatedAt) ?? createdAt
  return { createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) }
}

export function toMessageRecord(doc: MessageDoc): MessageRecord {
  return {
    id: doc._id.toHexString(),
    name: text(doc.name),
    email: text(doc.email),
    phone: phoneOf(doc.phone),
    message: text(doc.message),
    status: messageStatusOf(doc.status),
    consentAt: validDate(doc.consentAt) ? new Date(doc.consentAt as Date) : null,
    ...timestamps(doc),
  }
}

export function toCommentRecord(doc: CommentDoc): CommentRecord {
  return {
    id: doc._id.toHexString(),
    postId: text(doc.postId),
    userName: text(doc.userName),
    email: text(doc.email),
    comment: text(doc.comment),
    lang: typeof doc.lang === 'string' && isLocale(doc.lang) ? doc.lang : null,
    status: commentStatusOf(doc.status),
    consentAt: validDate(doc.consentAt) ? new Date(doc.consentAt as Date) : null,
    authorReply: replyOf(doc.authorReply),
    ...timestamps(doc),
  }
}

export function toPublicComment(doc: Pick<CommentDoc, '_id' | 'userName' | 'comment' | 'authorReply' | 'createdAt' | 'date'>): PublicComment {
  return {
    id: doc._id.toHexString(),
    userName: text(doc.userName),
    comment: text(doc.comment),
    createdAt: timestamps(doc).createdAt,
    authorReply: replyOf(doc.authorReply),
  }
}

export function statusFilter<S extends string>(all: readonly S[], legacy: S, wanted: readonly S[]): Record<string, unknown> {
  if (wanted.includes(legacy)) return { status: { $nin: all.filter((s) => !wanted.includes(s)) } }
  return { status: { $in: [...wanted] } }
}

export function transitionSources<S extends string>(all: readonly S[], map: Record<S, readonly S[]>, to: S): S[] {
  return all.filter((from) => from === to || map[from].includes(to))
}
