import en from '@/content/i18n/en/arena.json'
import es from '@/content/i18n/es/arena.json'
import { formatUsd } from '@/lib/ai/models'
import { USD_TO_COP } from '@/lib/ai/pricing'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'

export type ArenaCopyKey = keyof typeof es & keyof typeof en

export type ArenaText = (key: ArenaCopyKey, vars?: Record<string, string | number>) => string

const DICTIONARIES = { es, en } as const

export function arenaText(lang: Locale): ArenaText {
  const dict = DICTIONARIES[lang]
  return (key, vars) => t(dict, key, vars)
}

const NUMBER_LOCALE: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

export function arenaUsd(usd: number, lang: Locale): string {
  return formatUsd(usd, lang)
}

export function arenaCop(usd: number, lang: Locale, rate = USD_TO_COP): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], { maximumFractionDigits: 0 }).format(usd * rate)
}

export function arenaNumber(value: number, lang: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[lang]).format(value)
}

export function arenaDate(value: Date | string, lang: Locale): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(NUMBER_LOCALE[lang], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(date)
}

export function arenaDay(value: string, lang: Locale): string {
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(NUMBER_LOCALE[lang], { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}
