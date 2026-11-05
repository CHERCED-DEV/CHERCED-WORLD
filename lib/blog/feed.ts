import type { PostMeta } from '@/content/types'
import { localizedPath, type Locale } from '@/lib/i18n'
import { getSiteUrl } from '@/lib/site-url'
import { parsePostDate } from './format'
import { postPath } from './paths'

export const FEED_CONTENT_TYPE = 'application/rss+xml; charset=utf-8'

export type FeedItem = {
  title: string
  link: string
  guid: string
  description: string
  pubDate: string
  categories: string[]
}

type FeedSource = Pick<PostMeta, 'id' | 'title' | 'description' | 'date' | 'tags'>

const XML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g

export function escapeXml(value: string): string {
  return value.replace(INVALID_XML_CHARS, '').replace(/[&<>"']/g, (char) => XML_ENTITIES[char] ?? char)
}

export function rfc822Date(iso: string): string {
  const date = parsePostDate(iso)
  if (!date) throw new RangeError(`Fecha de post inválida: "${iso}"`)
  return date.toUTCString()
}

export function feedPath(lang: Locale): string {
  return localizedPath(lang, '/feed.xml')
}

export function feedUrl(lang: Locale, base: URL = getSiteUrl()): string {
  return new URL(feedPath(lang), base).toString()
}

export function feedAlternates(lang: Locale): Record<'application/rss+xml', string> {
  return { 'application/rss+xml': feedPath(lang) }
}

export function toFeedItems(posts: readonly FeedSource[], lang: Locale, base: URL = getSiteUrl()): FeedItem[] {
  return [...posts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((post) => {
      const link = new URL(postPath(lang, post.id), base).toString()
      return {
        title: post.title,
        link,
        guid: link,
        description: post.description,
        pubDate: rfc822Date(post.date),
        categories: [...post.tags],
      }
    })
}
