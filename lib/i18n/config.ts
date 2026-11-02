export const locales = ['es', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'es'

export const LOCALE_COOKIE = 'cw-lang'

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const namespaces = ['common', 'site', 'motion', 'contact', 'admin', 'privacy', 'blog', 'experience'] as const

export type Namespace = (typeof namespaces)[number]

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'es' || value === 'en'
}

export function otherLocale(lang: Locale): Locale {
  return lang === 'es' ? 'en' : 'es'
}
