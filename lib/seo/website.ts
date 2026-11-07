import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import { locales, type Locale } from '@/lib/i18n/config'
import { getSiteUrl } from '@/lib/site-url'
import { PERSON_NAME, personId } from './person'

export const SITE_NAME: string = commonEs['brand.name']

export const SITE_ALTERNATE_NAMES = [PERSON_NAME, commonEs['intro.name']] as const

const DESCRIPTIONS: Record<Locale, string> = { es: commonEs['meta.description'], en: commonEn['meta.description'] }

export type WebSiteJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  '@id': string
  name: string
  alternateName: string[]
  url: string
  description: string
  inLanguage: Locale[]
  author: { '@id': string }
  publisher: { '@id': string }
}

export function websiteId(base: URL = getSiteUrl()): string {
  return `${base.origin}/#website`
}

export function websiteJsonLd(lang: Locale, base: URL = getSiteUrl()): WebSiteJsonLd {
  const person = { '@id': personId(base) }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(base),
    name: SITE_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: `${base.origin}/`,
    description: DESCRIPTIONS[lang],
    inLanguage: [...locales],
    author: person,
    publisher: person,
  }
}
