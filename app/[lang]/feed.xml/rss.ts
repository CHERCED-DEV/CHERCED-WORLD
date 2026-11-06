import { escapeXml, feedUrl, rfc822Date, toFeedItems, type FeedItem } from '@/lib/blog/feed'
import { blogPath } from '@/lib/blog/paths'
import { ownPosts } from '@/lib/blog/source'
import { t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { getSiteUrl } from '@/lib/site-url'

export type RssChannel = {
  title: string
  link: string
  description: string
  language: Locale
  self: string
  lastBuildDate: string | null
}

export const ATOM_NS = 'http://www.w3.org/2005/Atom'

const CHANNEL = '    '
const ITEM = '      '

function element(name: string, value: string, indent: string): string {
  return `${indent}<${name}>${escapeXml(value)}</${name}>`
}

function itemXml(item: FeedItem): string[] {
  return [
    `${CHANNEL}<item>`,
    element('title', item.title, ITEM),
    element('link', item.link, ITEM),
    `${ITEM}<guid isPermaLink="true">${escapeXml(item.guid)}</guid>`,
    element('description', item.description, ITEM),
    element('pubDate', item.pubDate, ITEM),
    ...item.categories.map((category) => element('category', category, ITEM)),
    `${CHANNEL}</item>`,
  ]
}

export function renderRss(channel: RssChannel, items: readonly FeedItem[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<rss version="2.0" xmlns:atom="${ATOM_NS}">`,
    '  <channel>',
    element('title', channel.title, CHANNEL),
    element('link', channel.link, CHANNEL),
    element('description', channel.description, CHANNEL),
    element('language', channel.language, CHANNEL),
    ...(channel.lastBuildDate ? [element('lastBuildDate', channel.lastBuildDate, CHANNEL)] : []),
    `${CHANNEL}<atom:link href="${escapeXml(channel.self)}" rel="self" type="application/rss+xml"/>`,
    ...items.flatMap(itemXml),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

export async function buildFeed(lang: Locale, base: URL = getSiteUrl()): Promise<string> {
  const [posts, blog, common] = await Promise.all([ownPosts(lang), getDictionary(lang, 'blog'), getDictionary(lang, 'common')])
  const newest = posts
    .map((post) => post.updated ?? post.date)
    .sort()
    .at(-1)
  return renderRss(
    {
      title: t(common, 'meta.titleTemplate').replace('%s', t(blog, 'meta.blog.title')),
      link: new URL(blogPath(lang), base).toString(),
      description: t(blog, 'meta.blog.description'),
      language: lang,
      self: feedUrl(lang, base),
      lastBuildDate: newest ? rfc822Date(newest) : null,
    },
    toFeedItems(posts, lang, base),
  )
}
