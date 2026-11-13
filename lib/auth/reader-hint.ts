export const READER_HINT_COOKIE = 'cw-reader'

export const READER_HINT_OPTIONS = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
} as const

export function hasReaderHint(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false
  return cookieHeader.split(';').some((part) => part.trim() === `${READER_HINT_COOKIE}=1`)
}
