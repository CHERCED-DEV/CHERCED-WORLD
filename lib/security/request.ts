import 'server-only'
import { headers } from 'next/headers'
import { isLocale, stripLocale, type Locale } from '@/lib/i18n'
import { clientIp, ipHash } from './ip'

export async function requestIpHash(): Promise<string> {
  return ipHash(clientIp(await headers()))
}

export async function requestLocale(fallback: Locale): Promise<Locale> {
  const referer = (await headers()).get('referer')
  if (!referer) return fallback
  try {
    const { locale } = stripLocale(new URL(referer).pathname)
    return isLocale(locale) ? locale : fallback
  } catch {
    return fallback
  }
}
