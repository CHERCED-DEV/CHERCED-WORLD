import type { Locale } from '@/lib/i18n/config'

export const ENGINEERING_TIME_ZONE = 'America/Bogota'

function intlLocale(lang: Locale): string {
  return lang === 'es' ? 'es-CO' : 'en-US'
}

function valid(iso: string): Date | null {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00-05:00` : iso)
  return Number.isNaN(date.getTime()) ? null : date
}

function parts(date: Date, lang: Locale, options: Intl.DateTimeFormatOptions): Partial<Record<Intl.DateTimeFormatPartTypes, string>> {
  const found: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const part of new Intl.DateTimeFormat(intlLocale(lang), { ...options, timeZone: ENGINEERING_TIME_ZONE }).formatToParts(date)) found[part.type] = part.value
  return found
}

function shortMonth(value: string | undefined): string {
  return (value ?? '').replace(/\.$/, '')
}

export function shortDate(iso: string, lang: Locale): string {
  const date = valid(iso)
  if (!date) return iso
  const { day, month, year } = parts(date, lang, { day: 'numeric', month: 'short', year: 'numeric' })
  return lang === 'es' ? `${day} ${shortMonth(month)} ${year}` : `${shortMonth(month)} ${day}, ${year}`
}

export function dayMonth(iso: string, lang: Locale): string {
  const date = valid(iso)
  if (!date) return iso
  const { day, month } = parts(date, lang, { day: 'numeric', month: 'short' })
  return lang === 'es' ? `${day} ${shortMonth(month)}` : `${shortMonth(month)} ${day}`
}

export function longDate(iso: string, lang: Locale): string {
  const date = valid(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'long', year: 'numeric', timeZone: ENGINEERING_TIME_ZONE }).format(date)
}

export function dateTime(iso: string, lang: Locale): string {
  const date = valid(iso)
  if (!date) return iso
  const time = new Intl.DateTimeFormat(intlLocale(lang), { hour: 'numeric', minute: '2-digit', timeZone: ENGINEERING_TIME_ZONE }).format(date)
  return `${longDate(iso, lang)}, ${time}`
}

export function integer(value: number, lang: Locale): string {
  return new Intl.NumberFormat(intlLocale(lang), { maximumFractionDigits: 0 }).format(value)
}

export function decimal(value: number, lang: Locale, digits = 2): string {
  return new Intl.NumberFormat(intlLocale(lang), { maximumFractionDigits: digits }).format(value)
}

export function usd(value: number, lang: Locale): string {
  const digits = value > 0 && value < 0.01 ? 4 : 2
  return new Intl.NumberFormat(intlLocale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

export function pluralKey(count: number, lang: Locale): 'one' | 'other' {
  return new Intl.PluralRules(intlLocale(lang)).select(count) === 'one' ? 'one' : 'other'
}
