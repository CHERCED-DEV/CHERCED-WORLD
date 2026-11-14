import 'server-only'
import { listDrafts, removeDraftsBy } from '@/lib/data/editorial'
import { listPublished } from '@/lib/data/published'
import type { AccountRecord, AvatarImage, CommentRecord, Permission, ProfileRecord, Repos } from '@/lib/data/types'
import type { EditorialDraft } from '@/lib/editorial/model'
import type { PublishedPost } from '@/lib/editorial/published'
import type { Locale } from '@/lib/i18n/config'

export type GuestPostStatus = 'draft' | 'review' | 'published'

export type GuestPost = {
  id: string
  title: string
  lang: Locale
  status: GuestPostStatus
  createdAt: string
  updatedAt: string
  url: string | null
}

export type ConsentKind = 'signIn' | 'profile' | 'comments'

export type ConsentEntry = { kind: ConsentKind; acceptedAt: Date; version: string | null; count: number | null }

export function guestPostsFrom(drafts: readonly EditorialDraft[], published: readonly PublishedPost[], accountId: string): GuestPost[] {
  const byDraft = new Map(published.map((post) => [post.draftId, post]))
  return drafts
    .filter((draft) => draft.author?.id === accountId)
    .map((draft) => {
      const post = byDraft.get(draft.id)
      const status: GuestPostStatus = post ? 'published' : draft.review ? 'review' : 'draft'
      return {
        id: draft.id,
        title: draft.title,
        lang: draft.lang,
        status,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
        url: post ? `/${post.lang}/blog/${post.id}` : null,
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function guestPostsOf(account: Pick<AccountRecord, 'id' | 'name'>): Promise<GuestPost[]> {
  const [drafts, published] = await Promise.all([listDrafts({ id: account.id, name: account.name }), listPublished()])
  return guestPostsFrom(drafts, published, account.id)
}

export function consentsOf(account: Pick<AccountRecord, 'createdAt'>, profile: ProfileRecord | null, comments: readonly CommentRecord[]): ConsentEntry[] {
  const entries: ConsentEntry[] = [{ kind: 'signIn', acceptedAt: account.createdAt, version: null, count: null }]
  if (profile) entries.push({ kind: 'profile', acceptedAt: profile.consent.acceptedAt, version: profile.consent.version || null, count: null })
  const authorized = comments.flatMap((comment) => (comment.consentAt ? [comment.consentAt] : []))
  if (authorized.length > 0) {
    const last = authorized.reduce((latest, date) => (date.getTime() > latest.getTime() ? date : latest))
    entries.push({ kind: 'comments', acceptedAt: last, version: null, count: authorized.length })
  }
  return entries
}

export async function eraseAccountData(repos: Repos, accountId: string): Promise<boolean> {
  const published = await listPublished()
  await removeDraftsBy(accountId, new Set(published.map((post) => post.draftId)))
  await repos.profiles.remove(accountId)
  await repos.comments.removeByAccount(accountId)
  await repos.accounts.deleteSessionsFor(accountId)
  return repos.accounts.remove(accountId)
}

export type AccountExport = {
  exportedAt: string
  site: 'CHERCED-WORLD'
  version: 1
  account: { id: string; email: string; name: string; googleSub: string; picture: string | null; createdAt: string; lastLoginAt: string }
  permissions: Permission[]
  profile: (Omit<ProfileRecord, 'accountId' | 'avatar' | 'consent' | 'createdAt' | 'updatedAt'> & {
    consent: { version: string; acceptedAt: string }
    createdAt: string
    updatedAt: string
  }) | null
  avatar: { type: string; bytes: number; updatedAt: string; dataUrl: string } | null
  comments: Array<{
    postId: string
    comment: string
    lang: Locale | null
    status: CommentRecord['status']
    consentAt: string | null
    createdAt: string
    authorReply: { text: string; createdAt: string } | null
  }>
  guestPosts: GuestPost[]
  consents: Array<{ kind: ConsentKind; version: string | null; acceptedAt: string; count: number | null }>
}

export function buildAccountExport(input: {
  now: Date
  account: AccountRecord
  permissions: Permission[]
  profile: ProfileRecord | null
  avatar: AvatarImage | null
  comments: readonly CommentRecord[]
  guestPosts: readonly GuestPost[]
}): AccountExport {
  const { now, account, permissions, profile, avatar, comments, guestPosts } = input
  return {
    exportedAt: now.toISOString(),
    site: 'CHERCED-WORLD',
    version: 1,
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      googleSub: account.googleSub,
      picture: account.picture ?? null,
      createdAt: account.createdAt.toISOString(),
      lastLoginAt: account.lastLoginAt.toISOString(),
    },
    permissions: [...permissions],
    profile: profile
      ? {
          country: profile.country,
          city: profile.city,
          role: profile.role,
          company: profile.company,
          linkedin: profile.linkedin,
          github: profile.github,
          languages: [...profile.languages],
          reason: profile.reason,
          reasonNote: profile.reasonNote,
          preferences: { ...profile.preferences },
          photo: profile.photo,
          consent: { version: profile.consent.version, acceptedAt: profile.consent.acceptedAt.toISOString() },
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        }
      : null,
    avatar: avatar
      ? {
          type: avatar.type,
          bytes: avatar.bytes,
          updatedAt: avatar.updatedAt.toISOString(),
          dataUrl: `data:${avatar.type};base64,${Buffer.from(avatar.data).toString('base64')}`,
        }
      : null,
    comments: comments.map((comment) => ({
      postId: comment.postId,
      comment: comment.comment,
      lang: comment.lang,
      status: comment.status,
      consentAt: comment.consentAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
      authorReply: comment.authorReply ? { text: comment.authorReply.text, createdAt: comment.authorReply.createdAt.toISOString() } : null,
    })),
    guestPosts: guestPosts.map((post) => ({ ...post })),
    consents: consentsOf(account, profile, comments).map((entry) => ({
      kind: entry.kind,
      version: entry.version,
      acceptedAt: entry.acceptedAt.toISOString(),
      count: entry.count,
    })),
  }
}
