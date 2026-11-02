import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from './config'

export function localeCookieString(lang: Locale): string {
  return `${LOCALE_COOKIE}=${lang}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
}

export function rememberLocale(lang: Locale): void {
  if (typeof document === 'undefined') return
  document.cookie = localeCookieString(lang)
}
