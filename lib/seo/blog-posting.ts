import type { PostMeta } from '@/content/types'
import { blogPath, postPath } from '@/lib/blog/paths'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { getSiteUrl } from '@/lib/site-url'
import { breadcrumbJsonLd, type BreadcrumbListJsonLd } from './breadcrumbs'
import { PERSON_NAME, personId } from './person'

export type BlogPostingJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'BlogPosting'
  headline: string
  description: string
  datePublished: string
  dateModified?: string
  inLanguage: Locale
  image: string
  keywords: string[]
  url: string
  isPartOf: { '@type': 'Blog'; url: string }
  author: { '@id': string } | { '@type': 'Person'; name: string }
}

export type PostCrumbLabels = { home: string; blog: string }

export function postBreadcrumbJsonLd(
  meta: Pick<PostMeta, 'id' | 'title'>,
  lang: Locale,
  canonicalPath: string,
  labels: PostCrumbLabels,
  base: URL = getSiteUrl(),
): BreadcrumbListJsonLd {
  return breadcrumbJsonLd(
    [
      { name: labels.home, path: localizedPath(lang, '/') },
      { name: labels.blog, path: blogPath(lang) },
      { name: meta.title, path: canonicalPath },
    ],
    base,
  )
}

export function postOgImagePath(lang: Locale, id: string): string {
  return `${postPath(lang, id)}/opengraph-image/${OG_DEFAULT_ID}`
}

export function blogPostingJsonLd(meta: PostMeta, lang: Locale, url: string, base: URL = getSiteUrl()): BlogPostingJsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    ...(meta.updated ? { dateModified: meta.updated } : {}),
    inLanguage: meta.lang,
    image: new URL(postOgImagePath(lang, meta.id), base).toString(),
    keywords: [...meta.tags],
    url,
    isPartOf: { '@type': 'Blog', url: new URL(blogPath(lang), base).toString() },
    author: meta.author === PERSON_NAME ? { '@id': personId(base) } : { '@type': 'Person', name: meta.author },
  }
}
