import en from '@/content/i18n/en/gates.json'
import es from '@/content/i18n/es/gates.json'
import { formatUsd } from '@/lib/ai/models'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'

export type GatesCopyKey = keyof typeof es & keyof typeof en

export type GatesText = (key: GatesCopyKey, vars?: Record<string, string | number>) => string

const DICTIONARIES = { es, en } as const

const NUMBER_LOCALE: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

export function gatesText(lang: Locale): GatesText {
  const dict = DICTIONARIES[lang]
  return (key, vars) => t(dict, key, vars)
}

export function gatesUsd(usd: number, lang: Locale): string {
  return usd === 0 ? '0' : formatUsd(usd, lang)
}

export function gatesCop(usd: number, rate: number, lang: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], { maximumFractionDigits: 0 }).format(usd * rate)
}

export function gatesNumber(value: number, lang: Locale, digits = 0): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], { maximumFractionDigits: digits }).format(value)
}

export function gatesList(items: readonly string[], lang: Locale): string {
  return new Intl.ListFormat(NUMBER_LOCALE[lang], { type: 'conjunction' }).format(items)
}

export function gatesDate(value: string, lang: Locale): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(NUMBER_LOCALE[lang], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(date)
}
