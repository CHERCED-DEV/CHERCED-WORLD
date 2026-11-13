import 'server-only'
import type { Collection, Db, ObjectId } from 'mongodb'
import type { AuthorReply, CommentStatus, MessageStatus, Permission, ScryptParams } from '@/lib/data/types'

export const COLLECTIONS = {
  messages: 'messages',
  comments: 'comments',
  credentials: 'admin_credentials',
  setupCodes: 'setup_codes',
  sessions: 'admin_sessions',
  rateLimits: 'rate_limits',
  reactions: 'post_reactions',
  accounts: 'accounts',
  accountSessions: 'account_sessions',
  teamGrants: 'team_grants',
} as const

export const CREDENTIAL_ID = 'admin'

export const SETUP_CODE_ID = 'setup'

export type MessageDoc = {
  _id: ObjectId
  name?: unknown
  email?: unknown
  phone?: unknown
  message?: unknown
  interest?: unknown
  status?: MessageStatus | unknown
  consentAt?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

export type CommentDoc = {
  _id: ObjectId
  postId?: unknown
  userName?: unknown
  email?: unknown
  comment?: unknown
  lang?: unknown
  status?: CommentStatus | unknown
  consentAt?: unknown
  authorReply?: AuthorReply | null | unknown
  accountId?: unknown
  date?: unknown
  createdAt?: unknown
  updatedAt?: unknown
}

export type CredentialDoc = {
  _id: typeof CREDENTIAL_ID
  hash: string
  salt: string
  params: ScryptParams
  createdAt: Date
  updatedAt: Date
}

export type SetupCodeDoc = { _id: typeof SETUP_CODE_ID; codeHash: string; expiresAt: Date; createdAt: Date }

export type SessionDoc = { _id: string; createdAt: Date; lastActivityAt: Date; expiresAt: Date }

export type RateLimitDoc = {
  _id: string
  count: number
  windowStart: Date
  blockedUntil: Date | null
  expiresAt: Date
}

export type ReactionDoc = {
  _id: string
  clap?: number
  idea?: number
  fire?: number
  updatedAt?: unknown
}

export type AccountDoc = {
  _id: string
  googleSub: string
  email: string
  name: string
  createdAt: Date
  lastLoginAt: Date
  blockedAt: Date | null
}

export type AccountSessionDoc = SessionDoc & { accountId: string }

export type TeamGrantDoc = { _id: string; permissions: Permission[]; createdAt: Date; updatedAt: Date }

export type DbProvider = () => Promise<Db>

export async function messagesCollection(db: DbProvider): Promise<Collection<MessageDoc>> {
  return (await db()).collection<MessageDoc>(COLLECTIONS.messages)
}

export async function commentsCollection(db: DbProvider): Promise<Collection<CommentDoc>> {
  return (await db()).collection<CommentDoc>(COLLECTIONS.comments)
}

export async function credentialsCollection(db: DbProvider): Promise<Collection<CredentialDoc>> {
  return (await db()).collection<CredentialDoc>(COLLECTIONS.credentials)
}

export async function setupCodesCollection(db: DbProvider): Promise<Collection<SetupCodeDoc>> {
  return (await db()).collection<SetupCodeDoc>(COLLECTIONS.setupCodes)
}

export async function sessionsCollection(db: DbProvider): Promise<Collection<SessionDoc>> {
  return (await db()).collection<SessionDoc>(COLLECTIONS.sessions)
}

export async function rateLimitsCollection(db: DbProvider): Promise<Collection<RateLimitDoc>> {
  return (await db()).collection<RateLimitDoc>(COLLECTIONS.rateLimits)
}

export async function reactionsCollection(db: DbProvider): Promise<Collection<ReactionDoc>> {
  return (await db()).collection<ReactionDoc>(COLLECTIONS.reactions)
}

export async function accountsCollection(db: DbProvider): Promise<Collection<AccountDoc>> {
  return (await db()).collection<AccountDoc>(COLLECTIONS.accounts)
}

export async function accountSessionsCollection(db: DbProvider): Promise<Collection<AccountSessionDoc>> {
  return (await db()).collection<AccountSessionDoc>(COLLECTIONS.accountSessions)
}

export async function teamGrantsCollection(db: DbProvider): Promise<Collection<TeamGrantDoc>> {
  return (await db()).collection<TeamGrantDoc>(COLLECTIONS.teamGrants)
}
