import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { CommentsSection } from '@/components/blog/comments/CommentsSection'
import { postLabels } from '@/components/blog/labels'
import { preparePost } from '@/components/blog/mdx/prepare'
import { PostView } from '@/components/blog/PostView'
import { BackgroundIntensity } from '@/components/motion'
import { postAlternates, postPath, postUrl } from '@/lib/blog/paths'
import { loadPost, postIds } from '@/lib/content'
import { isLocale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string; id: string }> }

export const revalidate = 60

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
    alternates: postAlternates(lang, id, { lang: meta.lang, fallback: post.fallback }),
    openGraph: {
      type: 'article',
      title: meta.title,
      description: meta.description,
      url: postPath(lang, id),
      siteName: previous.openGraph?.siteName,
      locale: previous.openGraph?.locale,
      publishedTime: meta.date,
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

  const [blog, common] = await Promise.all([getDictionary(lang, 'blog'), getDictionary(lang, 'common')])
  const prepared = preparePost(post.Content, postLabels(blog))

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <PostView lang={lang} meta={post.meta} fallback={post.fallback} prepared={prepared} url={postUrl(lang, id)} blog={blog} />
      <div className="cw-container">
        <CommentsSection lang={lang} postId={id} blog={blog} common={common} />
      </div>
    </>
  )
}
