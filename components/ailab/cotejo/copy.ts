import en from '@/content/i18n/en/cotejo.json'
import es from '@/content/i18n/es/cotejo.json'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'

export type CotejoCopyKey = keyof typeof es & keyof typeof en

export type CotejoText = (key: CotejoCopyKey, vars?: Record<string, string | number>) => string

const DICTIONARIES = { es, en } as const

const NUMBER_LOCALE: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

export function cotejoText(lang: Locale): CotejoText {
  const dict = DICTIONARIES[lang]
  return (key, vars) => t(dict, key, vars)
}

export function cotejoHas(lang: Locale, key: string): key is CotejoCopyKey {
  return key in DICTIONARIES[lang]
}

export function cotejoRatio(value: number | null, lang: Locale): string {
  if (value === null) return '—'
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function cotejoNumber(value: number, lang: Locale, digits = 0): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], { maximumFractionDigits: digits }).format(value)
}

export function cotejoMs(value: number, lang: Locale): string {
  return cotejoNumber(value, lang, value < 10 ? 1 : 0)
}

export function cotejoPercent(loaded: number, total: number, lang: Locale): string {
  const share = total > 0 ? Math.min(1, loaded / total) : 0
  return new Intl.NumberFormat(NUMBER_LOCALE[lang], { style: 'percent', maximumFractionDigits: 0 }).format(share)
}

export const COTEJO_REPO_URL = 'https://github.com/CHERCED-DEV/cotejo'

export const COTEJO_ACTION_RUNS_URL = 'https://github.com/CHERCED-DEV/cotejo/actions'
