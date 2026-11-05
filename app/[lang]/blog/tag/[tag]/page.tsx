import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { BlogIndex } from '@/components/blog/BlogIndex'
import { tagAlternates, tagIndexView, tagLangs } from '@/components/blog/index/view'
import { BackgroundIntensity } from '@/components/motion'
import { feedAlternates } from '@/lib/blog/feed'
import { allTagSlugs } from '@/lib/blog/source'
import { tagPath, tagSlug } from '@/lib/blog/tags'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string; tag: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  return (await allTagSlugs()).map((tag) => ({ tag }))
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function resolve(params: Props['params']): Promise<{ lang: Locale; slug: string } | null> {
  const { lang, tag } = await params
  if (!isLocale(lang)) return null
  const slug = tagSlug(decode(tag))
  return (await allTagSlugs()).includes(slug) ? { lang, slug } : null
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolved = await resolve(params)
  if (!resolved) return {}
  const { lang, slug } = resolved
  const [view, blog, langs, previous] = await Promise.all([tagIndexView(lang, slug), getDictionary(lang, 'blog'), tagLangs(slug), parent])
  const title = view.tag?.summary ?? t(blog, 'meta.blog.title')
  const description = t(blog, 'meta.blog.description')
  return {
    title,
    description,
    alternates: { ...tagAlternates(lang, slug, langs), types: feedAlternates(lang) },
    robots: langs.includes(lang) ? undefined : { index: false, follow: true },
    openGraph: {
      type: 'website',
      title,
      description,
      url: tagPath(lang, slug),
      siteName: previous.openGraph?.siteName,
      locale: previous.openGraph?.locale,
      images: previous.openGraph?.images,
    },
  }
}

export default async function BlogTagPage({ params }: Props) {
  const resolved = await resolve(params)
  if (!resolved) notFound()

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <BlogIndex {...await tagIndexView(resolved.lang, resolved.slug)} />
    </>
  )
}
