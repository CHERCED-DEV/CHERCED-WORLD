import type { ServiceId } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export type MessageStatus = 'unread' | 'read' | 'archived'

export type CommentStatus = 'pending' | 'approved' | 'rejected'

export type MessageSort = 'newest' | 'oldest' | 'name'

export type MessageInterest = ServiceId | 'other'

export type NewMessage = {
  name: string
  email: string
  phone: string | null
  message: string
  interest?: MessageInterest | null
  consentAt: Date
}

export type MessageRecord = {
  id: string
  name: string
  email: string
  phone: string | number | null
  message: string
  interest: MessageInterest | null
  status: MessageStatus
  consentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type NewComment = {
  postId: string
  userName: string
  email: string
  comment: string
  lang: Locale
  consentAt: Date
}

export type AuthorReply = { text: string; createdAt: Date; updatedAt: Date }

export type CommentRecord = {
  id: string
  postId: string
  userName: string
  email: string
  comment: string
  lang: Locale | null
  status: CommentStatus
  consentAt: Date | null
  authorReply: AuthorReply | null
  createdAt: Date
  updatedAt: Date
}

export type PublicComment = {
  id: string
  userName: string
  comment: string
  createdAt: Date
  authorReply: AuthorReply | null
}

export type ScryptParams = { N: number; r: number; p: number; keyLen: number }

export type AdminCredential = {
  hash: string
  salt: string
  params: ScryptParams
  createdAt: Date
  updatedAt: Date
}

export type SetupCode = { codeHash: string; expiresAt: Date; createdAt: Date }

export type AdminSession = {
  tokenHash: string
  createdAt: Date
  lastActivityAt: Date
  expiresAt: Date
}

export type RateLimitRule = { limit: number; windowMs: number; blockMs?: number }

export type RateLimitResult = { allowed: boolean; retryAfterMs: number }

export type ReactionKind = 'clap' | 'idea' | 'fire'

export type ReactionOp = 'add' | 'remove'

export type ReactionCounts = Record<ReactionKind, number>

export function emptyReactionCounts(): ReactionCounts {
  return { clap: 0, idea: 0, fire: 0 }
}

export const SESSION_IDLE_MS = 12 * 60 * 60 * 1000

export const MESSAGE_TRANSITIONS: Record<MessageStatus, readonly MessageStatus[]> = {
  unread: ['read', 'archived'],
  read: ['unread', 'archived'],
  archived: ['read'],
}

export const COMMENT_TRANSITIONS: Record<CommentStatus, readonly CommentStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['rejected'],
  rejected: ['approved'],
}

export function canTransition<S extends string>(map: Record<S, readonly S[]>, from: S, to: S): boolean {
  return from === to || map[from].includes(to)
}

export interface MessageRepo {
  create(input: NewMessage): Promise<MessageRecord>
  list(q: { status?: MessageStatus | 'all'; sort: MessageSort }): Promise<MessageRecord[]>
  setStatus(id: string, status: MessageStatus): Promise<boolean>
  remove(id: string): Promise<boolean>
  countUnread(): Promise<number>
  changedSince(since: Date): Promise<MessageRecord[]>
}

export interface CommentRepo {
  create(input: NewComment): Promise<CommentRecord>
  listPublic(postId: string): Promise<PublicComment[]>
  listForModeration(q: { status?: CommentStatus | 'all' }): Promise<CommentRecord[]>
  setStatus(id: string, status: CommentStatus): Promise<boolean>
  setReply(id: string, text: string | null): Promise<boolean>
  remove(id: string): Promise<boolean>
  countPending(): Promise<number>
  changedSince(since: Date): Promise<CommentRecord[]>
}

export interface AdminRepo {
  getCredential(): Promise<AdminCredential | null>
  createCredential(c: AdminCredential): Promise<boolean>
  updateCredential(c: AdminCredential): Promise<void>
  getSetupCode(): Promise<SetupCode | null>
  saveSetupCode(c: SetupCode): Promise<void>
  deleteSetupCode(): Promise<void>
  createSession(s: AdminSession): Promise<void>
  getSession(tokenHash: string): Promise<AdminSession | null>
  touchSession(tokenHash: string, now: Date): Promise<void>
  deleteSession(tokenHash: string): Promise<void>
}

export interface RateLimitRepo {
  hit(key: string, rule: RateLimitRule, now: Date): Promise<RateLimitResult>
  reset(key: string): Promise<void>
}

export interface ReactionRepo {
  counts(postId: string): Promise<ReactionCounts>
  apply(postId: string, kind: ReactionKind, op: ReactionOp): Promise<ReactionCounts>
}

export interface Repos {
  messages: MessageRepo
  comments: CommentRepo
  admin: AdminRepo
  rateLimits: RateLimitRepo
  reactions: ReactionRepo
}

export type RepoFactory = () => Repos
