import type { Metadata, ResolvingMetadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { BlogIndex } from '@/components/blog/BlogIndex'
import { tagAlternates, tagIndexView, tagLangs, tagSummary } from '@/components/blog/index/view'
import { BackgroundIntensity } from '@/components/motion'
import { feedAlternates } from '@/lib/blog/feed'
import { allTagSlugs } from '@/lib/blog/source'
import { catalogTagSlugs, tagPath, tagSlug, tagSlugIn } from '@/lib/blog/tags'
import { isLocale, t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string; tag: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  return [...new Set([...(await allTagSlugs()), ...catalogTagSlugs()])].map((tag) => ({ tag }))
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function resolve(params: Props['params']): Promise<{ lang: Locale; slug: string; own: boolean } | null> {
  const { lang, tag } = await params
  if (!isLocale(lang)) return null
  const slug = tagSlug(decode(tag))
  if (!(await allTagSlugs()).includes(slug)) return null
  return { lang, slug, own: tagSlugIn(slug, lang) === slug }
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolved = await resolve(params)
  if (!resolved?.own) return {}
  const { lang, slug } = resolved
  const [{ summary: title }, blog, langs, previous] = await Promise.all([tagSummary(lang, slug), getDictionary(lang, 'blog'), tagLangs(slug), parent])
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
  if (!resolved.own) permanentRedirect(tagPath(resolved.lang, resolved.slug))

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <BlogIndex {...await tagIndexView(resolved.lang, resolved.slug)} />
    </>
  )
}
