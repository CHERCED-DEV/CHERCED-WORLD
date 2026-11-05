import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CATALOG_ID, loadCatalog } from '@/components/blog/catalog'
import { postLabels } from '@/components/blog/labels'
import { preparePost } from '@/components/blog/mdx/prepare'
import { calloutLabels } from '@/components/blog/post/labels'
import { PostView } from '@/components/blog/PostView'
import { BackgroundIntensity } from '@/components/motion'
import { postAlternates, postUrl } from '@/lib/blog/paths'
import { isLocale, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const [blog, catalog] = await Promise.all([getDictionary(lang, 'blog'), loadCatalog(lang)])
  return {
    title: t(blog, 'meta.catalog.title'),
    description: t(blog, 'meta.catalog.description'),
    alternates: postAlternates(lang, CATALOG_ID, { lang: catalog.meta.lang, fallback: catalog.fallback }),
    robots: { index: false, follow: true },
  }
}

export default async function CatalogPage({ params }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()

  const [blog, catalog] = await Promise.all([getDictionary(lang, 'blog'), loadCatalog(lang)])
  const prepared = preparePost(catalog.Content, { ...postLabels(blog), callout: calloutLabels(blog, lang) })

  return (
    <>
      <BackgroundIntensity value="subtle" />
      <PostView
        lang={lang}
        meta={catalog.meta}
        fallback={catalog.fallback}
        prepared={prepared}
        url={postUrl(lang, CATALOG_ID)}
        blog={blog}
      />
    </>
  )
}
