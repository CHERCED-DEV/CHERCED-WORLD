import 'server-only'
import { listPosts, postIds, type ListedPost } from '@/lib/content'
import { locales, type Locale } from '@/lib/i18n'
import { toFeedItems, type FeedItem } from './feed'
import { orderPosts } from './order'
import { partsOfSeries } from './series'
import { uniqueTagSlugs } from './tags'

export async function blogPosts(lang: Locale): Promise<ListedPost[]> {
  return orderPosts(await listPosts(lang), postIds())
}

export async function ownPosts(lang: Locale): Promise<ListedPost[]> {
  return (await blogPosts(lang)).filter((post) => !post.fallback)
}

export async function tagSlugsIn(lang: Locale): Promise<string[]> {
  return uniqueTagSlugs(await ownPosts(lang))
}

export async function allTagSlugs(): Promise<string[]> {
  const perLang = await Promise.all(locales.map((lang) => ownPosts(lang)))
  return uniqueTagSlugs(perLang.flat())
}

export async function seriesParts(seriesId: string, lang: Locale): Promise<ListedPost[]> {
  return partsOfSeries(await ownPosts(lang), seriesId)
}

export async function feedItems(lang: Locale, base?: URL): Promise<FeedItem[]> {
  return toFeedItems(await ownPosts(lang), lang, base)
}
