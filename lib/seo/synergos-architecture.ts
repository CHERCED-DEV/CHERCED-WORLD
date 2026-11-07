import { architecture, SYNERGOS_ARCHITECTURE_PATH, SYNERGOS_ARCHITECTURE_UPDATED } from '@/content/synergos-architecture'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { getSiteUrl } from '@/lib/site-url'
import { personId } from './person'

export function architectureJsonLd(lang: Locale, base: URL = getSiteUrl()) {
  const url = new URL(localizedPath(lang, SYNERGOS_ARCHITECTURE_PATH), base).toString()
  return { '@context': 'https://schema.org', '@type': 'TechArticle', '@id': `${url}#architecture`, headline: architecture.copy.title[lang], description: architecture.copy.description[lang], url, inLanguage: lang, dateModified: SYNERGOS_ARCHITECTURE_UPDATED, image: `${url}/opengraph-image/og`, author: { '@id': personId(base) }, about: { '@id': `${new URL(localizedPath(lang, '/synergos'), base)}#synergos` } }
}
