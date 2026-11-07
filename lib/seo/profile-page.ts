import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { getSiteUrl } from '@/lib/site-url'
import { personJsonLd, type PersonJsonLd } from './person'
import { websiteId } from './website'

export const PROFILE_PATH = '/aboutMe'

export type ProfilePageJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'ProfilePage'
  '@id': string
  url: string
  name: string
  description: string
  inLanguage: Locale
  isPartOf: { '@id': string }
  mainEntity: Omit<PersonJsonLd, '@context'>
}

export function profilePageJsonLd(lang: Locale, page: { name: string; description: string }, base: URL = getSiteUrl()): ProfilePageJsonLd {
  const url = new URL(localizedPath(lang, PROFILE_PATH), base).toString()
  const { '@context': _context, ...person } = personJsonLd(lang, base)
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    name: page.name,
    description: page.description,
    inLanguage: lang,
    isPartOf: { '@id': websiteId(base) },
    mainEntity: person,
  }
}
