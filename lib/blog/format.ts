import type { Locale } from '@/lib/i18n'

const LOCALE_TAGS: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

export const COMMENT_TIME_ZONE = 'America/Bogota'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parsePostDate(iso: string): Date | null {
  const match = ISO_DATE.exec(iso)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(day) ? null : date
}

export function formatPostDate(iso: string, lang: Locale): string {
  const date = parsePostDate(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat(LOCALE_TAGS[lang], { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

export function formatCommentDate(date: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[lang], { dateStyle: 'long', timeZone: COMMENT_TIME_ZONE }).format(date)
}

export function commentDateTime(date: Date): string {
  return date.toISOString()
}
