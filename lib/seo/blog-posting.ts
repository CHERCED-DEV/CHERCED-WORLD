import type { PostMeta } from '@/content/types'
import { blogPath, postPath } from '@/lib/blog/paths'
import type { Locale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { getSiteUrl } from '@/lib/site-url'
import { personId } from './person'

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
  author: { '@id': string }
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
    author: { '@id': personId(base) },
  }
}
