import { projects } from '@/content/projects'
import { synergosShowcase, SYNERGOS_CASE_ID, SYNERGOS_PATH } from '@/content/synergos-showcase'
import { projectTitle } from '@/lib/content/project-title'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { getSiteUrl } from '@/lib/site-url'
import { personId } from './person'

export type SynergosJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'CreativeWork'
  '@id': string
  name: string
  headline: string
  description: string
  url: string
  inLanguage: Locale
  image: string
  dateModified: string
  keywords: string[]
  author: { '@id': string }
  hasPart: Array<{ '@type': 'SoftwareSourceCode'; name: string; codeRepository: string }>
}

export function synergosOgImagePath(lang: Locale): string {
  return `${localizedPath(lang, SYNERGOS_PATH)}/opengraph-image/${OG_DEFAULT_ID}`
}

export function synergosJsonLd(lang: Locale, base: URL = getSiteUrl()): SynergosJsonLd {
  const project = projects.find((item) => item.id === SYNERGOS_CASE_ID)
  const url = new URL(localizedPath(lang, SYNERGOS_PATH), base).toString()
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${url}#synergos`,
    name: project ? projectTitle(project, lang) : 'Synergos',
    headline: synergosShowcase.copy.title[lang],
    description: project?.summary[lang] ?? synergosShowcase.copy.description[lang],
    url,
    inLanguage: lang,
    image: new URL(synergosOgImagePath(lang), base).toString(),
    dateModified: synergosShowcase.countedAt,
    keywords: [...(project?.technologies ?? [])],
    author: { '@id': personId(base) },
    hasPart: (project?.links.repos ?? []).map((repo) => ({ '@type': 'SoftwareSourceCode', name: repo.label, codeRepository: repo.href })),
  }
}
