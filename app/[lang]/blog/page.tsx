import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogIndex } from '@/components/blog/BlogIndex'
import { postCards } from '@/components/blog/posts'
import { BackgroundIntensity } from '@/components/motion'
import { blogPath } from '@/lib/blog/paths'
import { getSite, pick } from '@/lib/content'
import { alternates, isLocale, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const [blog, previous] = await Promise.all([getDictionary(lang, 'blog'), parent])
  const title = t(blog, 'meta.blog.title')
  const description = t(blog, 'meta.blog.description')
  return {
    title,
    description,
    alternates: alternates(blogPath(lang)),
    openGraph: {
      type: 'website',
      title,
      description,
      url: blogPath(lang),
      siteName: previous.openGraph?.siteName,
      locale: previous.openGraph?.locale,
      images: previous.openGraph?.images,
    },
  }
}

export default async function BlogPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const blog = await getDictionary(lang, 'blog')
  const posts = await postCards(lang, blog)
  const intro = getSite().blog

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <BlogIndex
        lang={lang}
        posts={posts}
        intro={{ title: pick(intro.title, lang), titleStrong: intro.titleStrong, welcome: pick(intro.welcome, lang) }}
        labels={{
          readMore: t(blog, 'post.readMore'),
          originalLanguage: t(blog, 'post.originalLanguage'),
          tags: t(blog, 'post.tags'),
        }}
      />
    </>
  )
}
