import 'server-only'
import { cookies, headers } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE, LOCALE_HEADER, type Locale } from './config'

export function localeOf(fromPath: string | null | undefined, fromCookie: string | null | undefined): Locale {
  if (isLocale(fromPath)) return fromPath
  return isLocale(fromCookie) ? fromCookie : defaultLocale
}

export async function requestLocale(): Promise<Locale> {
  const [list, jar] = await Promise.all([headers(), cookies()])
  return localeOf(list.get(LOCALE_HEADER), jar.get(LOCALE_COOKIE)?.value)
}
