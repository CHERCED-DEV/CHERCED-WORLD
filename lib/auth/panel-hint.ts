export const PANEL_HINT_COOKIE = 'cw-panel'

export const PANEL_HINT_OPTIONS = {
  httpOnly: false,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60,
} as const

export function hasPanelHint(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false
  return cookieHeader.split(';').some((part) => part.trim() === `${PANEL_HINT_COOKIE}=1`)
}

export function isOwnerEmail(email: string | null | undefined, owner: string | null | undefined): boolean {
  const left = email?.trim().toLowerCase()
  const right = owner?.trim().toLowerCase()
  return Boolean(left && right && left === right)
}
