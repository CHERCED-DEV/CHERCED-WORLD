import type { Metadata, ResolvingMetadata } from 'next'
import { CommentsSection } from '@/components/blog/comments/CommentsSection'
import { GeneratedCover } from '@/components/blog/index/GeneratedCover'
import { postLabels } from '@/components/blog/labels'
import { preparePost } from '@/components/blog/mdx/prepare'
import { calloutLabels } from '@/components/blog/post/labels'
import { seriesNavData } from '@/components/blog/post/series'
import { PostView } from '@/components/blog/PostView'
import { BackgroundIntensity } from '@/components/motion'
import { relatedCases } from '@/components/site/portfolio/related'
import { blogPosts, seriesParts } from '@/lib/blog'
import { feedAlternates } from '@/lib/blog/feed'
import { adjacentPosts } from '@/lib/blog/order'
import { postAlternates, postPath, postUrl } from '@/lib/blog/paths'
import { relatedPosts } from '@/lib/blog/related'
import { getProjects, type LoadedPost } from '@/lib/content'
import { t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import { blogPostingJsonLd, postBreadcrumbJsonLd } from '@/lib/seo/blog-posting'
import { jsonLdScript } from '@/lib/seo/person'

export type ResolvedPost = { lang: Locale; id: string; post: LoadedPost }

export async function postMetadata({ lang, id, post }: ResolvedPost, parent: ResolvingMetadata): Promise<Metadata> {
  const previous = await parent
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
    },
  }
}

export async function PostPageView({ lang, id, post }: ResolvedPost) {
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
  const canonicalLang = post.fallback ? meta.lang : lang
  const canonical = postUrl(canonicalLang, id)
  const breadcrumbs = postBreadcrumbJsonLd(meta, lang, postPath(canonicalLang, id), { home: t(common, 'nav.home'), blog: t(common, 'nav.blog') })

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
        relatedCases={relatedCases(id, getProjects(), lang)}
        series={series}
        linkTags
        generatedCover={GeneratedCover}
      />
      <script type="application/ld+json" data-cw-blog-posting="" dangerouslySetInnerHTML={{ __html: jsonLdScript(blogPostingJsonLd(meta, lang, canonical)) }} />
      <script type="application/ld+json" data-cw-breadcrumbs="" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />
      <div className="cw-container">
        <CommentsSection lang={lang} postId={id} blog={blog} common={common} />
      </div>
    </>
  )
}
