export const AUTHOR_HINT_COOKIE = 'cw-author'

export const AUTHOR_HINT_MAX_AGE_S = 60 * 60 * 24 * 365

export const AUTHOR_HINT_OPTIONS = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: AUTHOR_HINT_MAX_AGE_S,
} as const

export function hasAuthorHint(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false
  return cookieHeader.split(';').some((part) => part.trim() === `${AUTHOR_HINT_COOKIE}=1`)
}

export function mailboxHref(lang: string): string {
  return `/${lang}/inbox`
}
