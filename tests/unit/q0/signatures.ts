import type { PostSeries } from '@/content/posts/series'
import type { Locale, Localized, PostMeta, PostSeriesRef } from '@/content/types'
import type * as Blog from '@/lib/blog'
import type * as Tags from '@/lib/blog/tags'
import type { ListedPost } from '@/lib/content'
import type * as BlogPosting from '@/lib/seo/blog-posting'

type Expect<T extends true> = T
type Is<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Fits<A, B> = [A] extends [B] ? true : false

export type _PostMetaContract = [
  Expect<Is<PostMeta['featured'], true | undefined>>,
  Expect<Is<PostMeta['updated'], string | undefined>>,
  Expect<Is<PostMeta['series'], PostSeriesRef | undefined>>,
  Expect<Is<PostSeriesRef, { id: string; part: number }>>,
  Expect<Is<PostMeta['cover'], 'generated' | undefined>>,
  Expect<Is<PostMeta['image'], { src: string; alt: string; width: number; height: number }>>,
  Expect<Is<PostSeries, { id: string; name: Localized }>>,
]

export type _BlogContract = [
  Expect<Fits<typeof Blog.tagSlug, (tag: string) => string>>,
  Expect<Fits<typeof Blog.tagPath, (lang: Locale, tag: string) => string>>,
  Expect<Fits<typeof Blog.allTagSlugs, () => Promise<string[]>>>,
  Expect<Fits<typeof Blog.tagSlugsIn, (lang: Locale) => Promise<string[]>>>,
  Expect<Fits<ReturnType<typeof Blog.groupByYear<ListedPost>>, { year: number; label: 'now' | 'archive'; posts: ListedPost[] }[]>>,
  Expect<Fits<typeof Blog.featuredPost<ListedPost>, (posts: readonly ListedPost[]) => ListedPost | null>>,
  Expect<Fits<typeof Blog.relatedPosts<ListedPost>, (post: ListedPost, posts: readonly ListedPost[], exclude: string[]) => ListedPost[]>>,
  Expect<Fits<typeof Blog.seriesParts, (seriesId: string, lang: Locale) => Promise<ListedPost[]>>>,
  Expect<Fits<typeof Blog.feedItems, (lang: Locale) => Promise<Blog.FeedItem[]>>>,
  Expect<Fits<typeof Blog.feedAlternates, (lang: Locale) => { 'application/rss+xml': string }>>,
  Expect<Fits<typeof Blog.escapeXml, (value: string) => string>>,
  Expect<Is<Blog.FeedItem, { title: string; link: string; guid: string; description: string; pubDate: string; categories: string[] }>>,
  Expect<Fits<typeof Tags.postsWithTag<ListedPost>, (posts: readonly ListedPost[], tag: string) => ListedPost[]>>,
]

export type _BlogPostingContract = [
  Expect<Fits<typeof BlogPosting.blogPostingJsonLd, (meta: PostMeta, lang: Locale, url: string) => Record<string, unknown>>>,
  Expect<Is<BlogPosting.BlogPostingJsonLd['author'], { '@id': string }>>,
]
