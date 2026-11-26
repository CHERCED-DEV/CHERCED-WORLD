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
  accountId?: string | null
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
  accountId: string | null
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

export const PERMISSIONS = ['posts', 'messages', 'comments'] as const

export type Permission = (typeof PERMISSIONS)[number]

export type AccountProfile = { googleSub: string; email: string; name: string; picture?: string | null }

export type AccountRecord = AccountProfile & {
  id: string
  createdAt: Date
  lastLoginAt: Date
  blockedAt: Date | null
}

export const PROFILE_REASONS = ['hiring', 'services', 'learning', 'collaborate', 'curious', 'other'] as const

export type ProfileReason = (typeof PROFILE_REASONS)[number]

export const PHOTO_SOURCES = ['upload', 'google', 'none'] as const

export type PhotoSource = (typeof PHOTO_SOURCES)[number]

export const AVATAR_TYPES = ['image/webp', 'image/jpeg'] as const

export type AvatarType = (typeof AVATAR_TYPES)[number]

export type ThemePreference = 'dark' | 'light'

export type ProfileFields = {
  country: string | null
  city: string | null
  role: string | null
  company: string | null
  linkedin: string | null
  github: string | null
  languages: string[]
  reason: ProfileReason | null
  reasonNote: string | null
}

export type ProfilePreferences = { lang: Locale | null; theme: ThemePreference | null }

export type ProfileConsent = { version: string; acceptedAt: Date }

export type AvatarInfo = { type: AvatarType; bytes: number; updatedAt: Date }

export type AvatarImage = AvatarInfo & { data: Uint8Array }

export type ProfileRecord = ProfileFields & {
  accountId: string
  preferences: ProfilePreferences
  photo: PhotoSource
  avatar: AvatarInfo | null
  consent: ProfileConsent
  createdAt: Date
  updatedAt: Date
}

export type ProfilePatch = Partial<ProfileFields> & {
  preferences?: ProfilePreferences
  photo?: PhotoSource
  avatar?: { type: AvatarType; data: Uint8Array } | null
}

export type TeamGrant = { email: string; permissions: Permission[]; createdAt: Date; updatedAt: Date }

export type AccountSession = AdminSession & { accountId: string }

export type RateLimitRule = { limit: number; windowMs: number; blockMs?: number }

export type RateLimitResult = { allowed: boolean; retryAfterMs: number }

export type ReactionKind = 'clap' | 'idea' | 'fire'

export type ReactionOp = 'add' | 'remove'

export type ReactionCounts = Record<ReactionKind, number>

export function emptyReactionCounts(): ReactionCounts {
  return { clap: 0, idea: 0, fire: 0 }
}

export const ACCOUNT_COMMENTS_LIMIT = 100

export const SESSION_IDLE_MS = 12 * 60 * 60 * 1000

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

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
  removeByAccount(accountId: string): Promise<number>
  listByAccount(accountId: string): Promise<CommentRecord[]>
  removeOwn(id: string, accountId: string): Promise<boolean>
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
  deleteAllSessions(): Promise<void>
}

export interface AccountRepo {
  upsertFromGoogle(profile: AccountProfile, now: Date): Promise<AccountRecord>
  get(id: string): Promise<AccountRecord | null>
  list(): Promise<AccountRecord[]>
  setBlocked(id: string, blockedAt: Date | null): Promise<boolean>
  remove(id: string): Promise<boolean>
  getGrant(email: string): Promise<TeamGrant | null>
  listGrants(): Promise<TeamGrant[]>
  setGrant(email: string, permissions: Permission[], now: Date): Promise<void>
  removeGrant(email: string): Promise<boolean>
  createSession(s: AccountSession): Promise<void>
  getSession(tokenHash: string): Promise<AccountSession | null>
  touchSession(tokenHash: string, now: Date): Promise<void>
  deleteSession(tokenHash: string): Promise<void>
  deleteSessionsFor(accountId: string): Promise<void>
}

export interface ProfileRepo {
  get(accountId: string): Promise<ProfileRecord | null>
  getMany(accountIds: readonly string[]): Promise<ProfileRecord[]>
  save(accountId: string, patch: ProfilePatch, now: Date, consent: ProfileConsent | null): Promise<ProfileRecord | null>
  getAvatar(accountId: string): Promise<AvatarImage | null>
  remove(accountId: string): Promise<boolean>
}

export interface RateLimitRepo {
  hit(key: string, rule: RateLimitRule, now: Date): Promise<RateLimitResult>
  reset(key: string): Promise<void>
  peek(key: string): Promise<{ count: number; windowStart: Date } | null>
}

export interface ReactionRepo {
  counts(postId: string): Promise<ReactionCounts>
  apply(postId: string, kind: ReactionKind, op: ReactionOp): Promise<ReactionCounts>
}

export const LAB_INTENTS = ['reclutador', 'lider_tecnico', 'curioso', 'otro'] as const

export type LabIntent = (typeof LAB_INTENTS)[number]

export const LAB_END_REASONS = ['hangup', 'expired', 'error', 'left'] as const

export type LabEndReason = (typeof LAB_END_REASONS)[number]

export type LabTurn = { who: 'you' | 'agent'; text: string }

export type LabTraceSummary = { turns: number; latencyP50: number | null; latencyP95: number | null; tokens: number; costUsd: number; tools: string[] }

export type LabSummary = { points: string[]; intent: LabIntent; topic: string; unanswered: string[]; model: string; costUsd: number; createdAt: Date }

export type LabSessionRecord = {
  id: string
  accountId: string
  experiment: 'V5'
  lang: 'es' | 'en'
  mode: 'live' | 'local'
  interview: string | null
  startedAt: Date
  endedAt: Date
  endReason: LabEndReason
  turns: LabTurn[]
  trace: LabTraceSummary | null
  summary: LabSummary | null
  createdAt: Date
  expiresAt: Date
}

export type LabConsent = { accountId: string; version: string; acceptedAt: Date; revokedAt: Date | null }

export const LAB_EVENT_TYPES = ['open', 'start', 'finish', 'download', 'error'] as const

export type LabEventType = (typeof LAB_EVENT_TYPES)[number]

export type LabEventRecord = {
  accountId: string
  experiment: string
  type: LabEventType
  detail: string | null
  lang: 'es' | 'en'
  at: Date
  expiresAt: Date
}

export type LabEventCount = { experiment: string; type: LabEventType; count: number }

export interface LabRepo {
  addEvents(events: LabEventRecord[]): Promise<void>
  listEventsFor(accountId: string, limit: number): Promise<LabEventRecord[]>
  countEvents(since: Date): Promise<LabEventCount[]>
  saveSession(record: LabSessionRecord): Promise<void>
  setSummary(id: string, summary: LabSummary): Promise<void>
  listByAccount(accountId: string, limit: number): Promise<LabSessionRecord[]>
  listRecent(limit: number): Promise<LabSessionRecord[]>
  removeSession(accountId: string, id: string): Promise<boolean>
  removeAllFor(accountId: string): Promise<void>
  getConsent(accountId: string): Promise<LabConsent | null>
  setConsent(accountId: string, version: string, now: Date): Promise<void>
  revokeConsent(accountId: string, now: Date): Promise<void>
}

export interface Repos {
  messages: MessageRepo
  comments: CommentRepo
  admin: AdminRepo
  accounts: AccountRepo
  profiles: ProfileRepo
  lab: LabRepo
  rateLimits: RateLimitRepo
  reactions: ReactionRepo
}

export type RepoFactory = () => Repos
