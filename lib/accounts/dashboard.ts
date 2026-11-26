import 'server-only'
import { blogPosts } from '@/lib/blog/source'
import type { AccountState } from '@/lib/auth/accounts'
import type { CommentStatus, Permission, PhotoSource, ProfilePreferences, ProfileReason, Repos } from '@/lib/data/types'
import { locales, localizedPath, type Locale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'
import { consentsOf, guestPostsOf, type ConsentKind, type GuestPostStatus } from './data'
import { displayCountry, displayLanguage, sizedGooglePicture } from './profile-options'

export type DashboardProfile = {
  country: string | null
  countryName: string | null
  city: string | null
  role: string | null
  company: string | null
  linkedin: string | null
  github: string | null
  languages: string[]
  languageNames: string[]
  reason: ProfileReason | null
  reasonNote: string | null
}

export type DashboardComment = {
  id: string
  postTitle: string
  postHref: string
  comment: string
  status: CommentStatus
  date: string
  dateTime: string
  reply: string | null
}

export type DashboardPost = { id: string; title: string; status: GuestPostStatus; date: string; dateTime: string; url: string | null }

export type DashboardConsent = { kind: ConsentKind; date: string; dateTime: string; version: string | null; count: number | null }

export type DashboardData = {
  account: { name: string; email: string; permissions: Permission[]; since: string; sinceTime: string; lastLogin: string; lastLoginTime: string }
  consented: boolean
  profile: DashboardProfile
  preferences: ProfilePreferences
  photo: PhotoSource
  avatarSrc: string | null
  uploadSrc: string | null
  googleSrc: string | null
  comments: DashboardComment[]
  guestPosts: DashboardPost[] | null
  consents: DashboardConsent[]
  labConsent: boolean
  conversations: DashboardConversation[]
  labActivity: DashboardLabEvent[]
}

export type DashboardLabEvent = { experiment: string; type: string; detail: string | null; date: string; dateTime: string }

export type DashboardConversation = {
  id: string
  date: string
  dateTime: string
  interview: string | null
  minutes: number
  points: string[]
  topic: string | null
  turns: Array<{ who: 'you' | 'agent'; text: string }>
}

function formatter(lang: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeZone: 'America/Bogota' })
}

async function attempt<T>(scope: string, fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    logServerError(scope, error)
    return fallback
  }
}

async function postTitles(lang: Locale): Promise<Map<string, string>> {
  const titles = new Map<string, string>()
  for (const locale of [lang, ...locales.filter((item) => item !== lang)]) {
    for (const post of await blogPosts(locale)) if (!titles.has(post.id)) titles.set(post.id, post.title)
  }
  return titles
}

export function avatarSources(photo: PhotoSource, upload: { updatedAt: Date } | null, picture: string | null | undefined) {
  const uploadSrc = upload ? `/api/account/avatar?v=${upload.updatedAt.getTime()}` : null
  const googleSrc = picture ? sizedGooglePicture(picture) : null
  const avatarSrc = photo === 'upload' ? uploadSrc ?? googleSrc : photo === 'google' ? googleSrc : null
  return { avatarSrc, uploadSrc, googleSrc }
}

export async function loadDashboard(repos: Repos, state: AccountState, lang: Locale): Promise<DashboardData> {
  const { account, permissions } = state
  const format = formatter(lang)
  const date = (value: Date) => ({ date: format.format(value), dateTime: value.toISOString() })

  const [profile, comments, titles, labConsent, sessions, labEvents] = await Promise.all([
    repos.profiles.get(account.id),
    attempt('account.dashboard.comments', [], () => repos.comments.listByAccount(account.id)),
    attempt('account.dashboard.titles', new Map<string, string>(), () => postTitles(lang)),
    attempt('account.dashboard.labConsent', null, () => repos.lab.getConsent(account.id)),
    attempt('account.dashboard.lab', [], () => repos.lab.listByAccount(account.id, 20)),
    attempt('account.dashboard.labEvents', [], () => repos.lab.listEventsFor(account.id, 15)),
  ])
  const posts = await attempt('account.dashboard.posts', [], () => guestPostsOf(account))
  const photo = profile?.photo ?? 'google'

  return {
    account: {
      name: account.name,
      email: account.email,
      permissions,
      since: date(account.createdAt).date,
      sinceTime: date(account.createdAt).dateTime,
      lastLogin: date(account.lastLoginAt).date,
      lastLoginTime: date(account.lastLoginAt).dateTime,
    },
    consented: Boolean(profile),
    profile: {
      country: profile?.country ?? null,
      countryName: displayCountry(profile?.country ?? null, lang),
      city: profile?.city ?? null,
      role: profile?.role ?? null,
      company: profile?.company ?? null,
      linkedin: profile?.linkedin ?? null,
      github: profile?.github ?? null,
      languages: profile?.languages ?? [],
      languageNames: (profile?.languages ?? []).map((code) => displayLanguage(code, lang)),
      reason: profile?.reason ?? null,
      reasonNote: profile?.reasonNote ?? null,
    },
    preferences: profile?.preferences ?? { lang: null, theme: null },
    photo,
    ...avatarSources(photo, profile?.avatar ?? null, account.picture),
    comments: comments.map((comment) => ({
      id: comment.id,
      postTitle: titles.get(comment.postId) ?? comment.postId,
      postHref: localizedPath(lang, `/blog/${comment.postId}`),
      comment: comment.comment,
      status: comment.status,
      ...date(comment.createdAt),
      reply: comment.status === 'approved' ? comment.authorReply?.text ?? null : null,
    })),
    guestPosts:
      permissions.includes('posts') || posts.length > 0
        ? posts.map((post) => ({ id: post.id, title: post.title, status: post.status, url: post.url, ...date(new Date(post.updatedAt)) }))
        : null,
    consents: consentsOf(account, profile, comments).map((entry) => ({
      kind: entry.kind,
      version: entry.version,
      count: entry.count,
      ...date(entry.acceptedAt),
    })),
    labConsent: Boolean(labConsent && !labConsent.revokedAt),
    conversations: sessions.map((record) => ({
      id: record.id,
      ...date(record.startedAt),
      interview: record.interview,
      minutes: Math.max(1, Math.round((record.endedAt.getTime() - record.startedAt.getTime()) / 60_000)),
      points: record.summary?.points ?? [],
      topic: record.summary?.topic || null,
      turns: record.turns,
    })),
    labActivity: labEvents.map((event) => ({ experiment: event.experiment, type: event.type, detail: event.detail, ...date(event.at) })),
  }
}
