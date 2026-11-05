import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogIndex } from '@/components/blog/BlogIndex'
import { blogIndexView } from '@/components/blog/index/view'
import { BackgroundIntensity } from '@/components/motion'
import { feedAlternates } from '@/lib/blog/feed'
import { blogPath } from '@/lib/blog/paths'
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
    alternates: { ...alternates(blogPath(lang)), types: feedAlternates(lang) },
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

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <BlogIndex {...await blogIndexView(lang)} />
    </>
  )
}
