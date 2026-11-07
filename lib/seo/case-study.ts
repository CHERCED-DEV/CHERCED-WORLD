import type { Project } from '@/content/types'
import { projectTitle } from '@/lib/content/project-title'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { getSiteUrl } from '@/lib/site-url'
import { breadcrumbJsonLd, type BreadcrumbListJsonLd } from './breadcrumbs'
import { personId } from './person'

export const PORTFOLIO_PATH = '/portfolio'

export type SourceCodeJsonLd = { '@type': 'SoftwareSourceCode'; name: string; codeRepository: string }

export type CaseStudyJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'CreativeWork'
  '@id': string
  name: string
  description: string
  url: string
  inLanguage: Locale
  image: string
  keywords: string[]
  author: { '@id': string }
  isPartOf: { '@type': 'CollectionPage'; '@id': string; url: string }
  hasPart?: SourceCodeJsonLd[]
}

export function casePath(lang: Locale, id: string): string {
  return localizedPath(lang, `${PORTFOLIO_PATH}/${encodeURIComponent(id)}`)
}

export function caseOgImagePath(lang: Locale, id: string): string {
  return `${casePath(lang, id)}/opengraph-image/${OG_DEFAULT_ID}`
}

function sourceCode(project: Project, lang: Locale): SourceCodeJsonLd[] {
  const github = project.links.github ? [{ label: projectTitle(project, lang), href: project.links.github }] : []
  const seen = new Set<string>()
  return [...github, ...(project.links.repos ?? [])].flatMap((repo) => {
    if (!/^https:\/\//.test(repo.href) || seen.has(repo.href)) return []
    seen.add(repo.href)
    return [{ '@type': 'SoftwareSourceCode' as const, name: repo.label, codeRepository: repo.href }]
  })
}

export function caseStudyJsonLd(project: Project, lang: Locale, base: URL = getSiteUrl()): CaseStudyJsonLd {
  const url = new URL(casePath(lang, project.id), base).toString()
  const portfolio = new URL(localizedPath(lang, PORTFOLIO_PATH), base).toString()
  const code = sourceCode(project, lang)
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${url}#work`,
    name: projectTitle(project, lang),
    description: project.summary[lang],
    url,
    inLanguage: lang,
    image: new URL(caseOgImagePath(lang, project.id), base).toString(),
    keywords: [...project.technologies],
    author: { '@id': personId(base) },
    isPartOf: { '@type': 'CollectionPage', '@id': portfolio, url: portfolio },
    ...(code.length > 0 ? { hasPart: code } : {}),
  }
}

export type CrumbLabels = { home: string; section: string }

export function caseBreadcrumbJsonLd(project: Project, lang: Locale, labels: CrumbLabels, base: URL = getSiteUrl()): BreadcrumbListJsonLd {
  return breadcrumbJsonLd(
    [
      { name: labels.home, path: localizedPath(lang, '/') },
      { name: labels.section, path: localizedPath(lang, PORTFOLIO_PATH) },
      { name: projectTitle(project, lang), path: casePath(lang, project.id) },
    ],
    base,
  )
}
