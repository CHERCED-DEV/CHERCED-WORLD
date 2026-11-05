import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { CommentsSection } from '@/components/blog/comments/CommentsSection'
import { postLabels } from '@/components/blog/labels'
import { preparePost } from '@/components/blog/mdx/prepare'
import { calloutLabels } from '@/components/blog/post/labels'
import { seriesNavData } from '@/components/blog/post/series'
import { PostView } from '@/components/blog/PostView'
import { BackgroundIntensity } from '@/components/motion'
import { blogPosts, seriesParts } from '@/lib/blog'
import { feedAlternates } from '@/lib/blog/feed'
import { adjacentPosts } from '@/lib/blog/order'
import { postAlternates, postPath, postUrl } from '@/lib/blog/paths'
import { relatedPosts } from '@/lib/blog/related'
import { loadPost, postIds } from '@/lib/content'
import { isLocale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { blogPostingJsonLd } from '@/lib/seo/blog-posting'
import { jsonLdScript } from '@/lib/seo/person'

type Props = { params: Promise<{ lang: string; id: string }> }

export const revalidate = 3600

export function generateStaticParams() {
  return postIds().map((id) => ({ id }))
}

async function resolve(params: Props['params']) {
  const { lang, id } = await params
  if (!isLocale(lang)) return null
  const post = await loadPost(id, lang)
  return post ? { lang, id, post } : null
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const [resolved, previous] = await Promise.all([resolve(params), parent])
  if (!resolved) return {}
  const { lang, id, post } = resolved
  const { meta } = post
  return {
    title: meta.title,
    description: meta.description,
    authors: [{ name: meta.author }],
    keywords: meta.tags,
    alternates: { ...postAlternates(lang, id, { lang: meta.lang, fallback: post.fallback }), types: feedAlternates(lang) },
    openGraph: {
      type: 'article',
      title: meta.title,
      description: meta.description,
      url: postPath(lang, id),
      siteName: previous.openGraph?.siteName,
      locale: previous.openGraph?.locale,
      publishedTime: meta.date,
      ...(meta.updated ? { modifiedTime: meta.updated } : {}),
      authors: [meta.author],
      tags: meta.tags,
      images: [{ url: meta.image.src, width: meta.image.width, height: meta.image.height, alt: meta.image.alt }],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const resolved = await resolve(params)
  if (!resolved) notFound()
  const { lang, id, post } = resolved
  const { meta } = post

  const [blog, common, posts, parts] = await Promise.all([
    getDictionary(lang, 'blog'),
    getDictionary(lang, 'common'),
    blogPosts(lang),
    meta.series ? seriesParts(meta.series.id, meta.lang) : Promise.resolve([]),
  ])
  const neighbors = adjacentPosts(posts, id)
  const related = relatedPosts(meta, posts, [neighbors.previous?.id, neighbors.next?.id].filter((other): other is string => Boolean(other)))
  const series = seriesNavData(id, meta.series, parts, lang)
  const prepared = preparePost(post.Content, { ...postLabels(blog), callout: calloutLabels(blog, lang) })
  const canonical = post.fallback ? postUrl(meta.lang, id) : postUrl(lang, id)

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <PostView
        lang={lang}
        meta={meta}
        fallback={post.fallback}
        prepared={prepared}
        url={postUrl(lang, id)}
        blog={blog}
        neighbors={neighbors}
        related={related}
        series={series}
        linkTags
      />
      <script type="application/ld+json" data-cw-blog-posting="" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostingJsonLd(meta, lang, canonical)) }} />
      <div className="cw-container">
        <CommentsSection lang={lang} postId={id} blog={blog} common={common} />
      </div>
    </>
  )
}
