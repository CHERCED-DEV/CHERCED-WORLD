import type { Locale } from '@/lib/i18n/config'

export const ENGINEERING_TIME_ZONE = 'America/Bogota'

function intlLocale(lang: Locale): string {
  return lang === 'es' ? 'es-CO' : 'en-US'
}

function valid(iso: string): Date | null {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00-05:00` : iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export function shortDate(iso: string, lang: Locale): string {
  const date = valid(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'short', year: 'numeric', timeZone: ENGINEERING_TIME_ZONE })
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? part.value.replace(/\.$/, '') : part.value))
    .join('')
}

export function dayMonth(iso: string, lang: Locale): string {
  const date = valid(iso)
  if (!date) return iso
  return new Intl.DateTimeFormat(intlLocale(lang), { day: 'numeric', month: 'short', timeZone: ENGINEERING_TIME_ZONE })
    .formatToParts(date)
    .map((part) => (part.type === 'month' ? part.value.replace(/\.$/, '') : part.value))
    .join('')
}

export function dateTime(iso: string, lang: Locale): string {
  const date = valid(iso)
  if (!date) return iso
  return `${shortDate(iso, lang)}, ${new Intl.DateTimeFormat(intlLocale(lang), { hour: 'numeric', minute: '2-digit', timeZone: ENGINEERING_TIME_ZONE }).format(date)}`
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
