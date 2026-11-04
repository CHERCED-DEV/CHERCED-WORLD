import { adjacentPosts, orderPosts, type Adjacent } from '@/lib/blog/order'
import { listPosts, loadPost, postIds, type ListedPost } from '@/lib/content'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import { readingStats } from './mdx/prepare'
import type { PostCardPost } from './PostCard'

export async function orderedPosts(lang: Locale): Promise<ListedPost[]> {
  return orderPosts(await listPosts(lang), postIds())
}

export async function postCards(lang: Locale, blog: Dictionary): Promise<PostCardPost[]> {
  const posts = await orderedPosts(lang)
  return Promise.all(
    posts.map(async (post) => {
      const loaded = await loadPost(post.id, lang)
      if (!loaded) return post
      return { ...post, readingTime: t(blog, 'post.readingTime', { n: readingStats(loaded.Content).minutes }) }
    }),
  )
}

export async function postNeighbors(lang: Locale, id: string): Promise<Adjacent<ListedPost>> {
  return adjacentPosts(await orderedPosts(lang), id)
}
