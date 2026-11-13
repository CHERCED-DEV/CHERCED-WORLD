import 'server-only'
import { cache } from 'react'
import { markdownContent } from '@/components/blog/mdx/markdown'
import { listPosts, loadPost, postIds, withTagsIn, type ListedPost, type LoadedPost } from '@/lib/content'
import { listPublished } from '@/lib/data/published'
import { isPublishedId, publishedMeta, type PublishedPost } from '@/lib/editorial/published'
import { locales, type Locale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'
import { toFeedItems, type FeedItem } from './feed'
import { orderPosts } from './order'
import { partsOfSeries } from './series'
import { tagSlugIn, uniqueTagSlugs } from './tags'

export const publishedPosts = cache(async (): Promise<PublishedPost[]> => {
  try {
    return await listPublished()
  } catch (error) {
    logServerError('blog.published', error)
    return []
  }
})

function listedPublished(post: PublishedPost, lang: Locale): ListedPost {
  return { ...withTagsIn(publishedMeta(post), lang), fallback: post.lang !== lang }
}

export async function publishedListed(lang: Locale): Promise<ListedPost[]> {
  return (await publishedPosts()).map((post) => listedPublished(post, lang))
}

export async function resolvePost(id: string, lang: Locale): Promise<LoadedPost | null> {
  if (!isPublishedId(id)) return loadPost(id, lang)
  const post = (await publishedPosts()).find((item) => item.id === id)
  if (!post) return null
  return { Content: markdownContent(post.body), meta: withTagsIn(publishedMeta(post), lang), fallback: post.lang !== lang }
}

export async function isKnownPost(id: string): Promise<boolean> {
  if (postIds().includes(id)) return true
  return isPublishedId(id) && (await publishedPosts()).some((post) => post.id === id)
}

export async function blogPosts(lang: Locale): Promise<ListedPost[]> {
  const [own, published] = await Promise.all([listPosts(lang), publishedListed(lang)])
  return orderPosts([...own, ...published], postIds())
}

export async function ownPosts(lang: Locale): Promise<ListedPost[]> {
  return (await blogPosts(lang)).filter((post) => !post.fallback)
}

export async function tagSlugsIn(lang: Locale): Promise<string[]> {
  return uniqueTagSlugs(await ownPosts(lang))
}

export async function allTagSlugs(): Promise<string[]> {
  const perLang = await Promise.all(locales.map((lang) => ownPosts(lang)))
  const tags = perLang.flat().flatMap((post) => post.tags)
  return uniqueTagSlugs(locales.map((lang) => ({ tags: tags.map((tag) => tagSlugIn(tag, lang)) })))
}

export async function seriesParts(seriesId: string, lang: Locale): Promise<ListedPost[]> {
  return partsOfSeries(await ownPosts(lang), seriesId)
}

export async function feedItems(lang: Locale, base?: URL): Promise<FeedItem[]> {
  return toFeedItems(await ownPosts(lang), lang, base)
}
