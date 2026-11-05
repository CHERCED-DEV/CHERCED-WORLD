import type { Locale } from '@/lib/i18n'

export type BookingLink = { href: string; label: string }

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function bookingLink(profile: unknown, lang: Locale): BookingLink | null {
  if (!profile || typeof profile !== 'object') return null
  const booking: unknown = (profile as { booking?: unknown }).booking
  if (!booking || typeof booking !== 'object') return null
  const { href, label } = booking as { href?: unknown; label?: unknown }
  if (!isHttpsUrl(href) || !label || typeof label !== 'object') return null
  const text: unknown = (label as Record<string, unknown>)[lang]
  return typeof text === 'string' && text.trim() !== '' ? { href, label: text.trim() } : null
}
