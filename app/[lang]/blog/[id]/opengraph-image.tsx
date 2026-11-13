import { notFound } from 'next/navigation'
import { formatPostDate } from '@/lib/blog/format'
import { resolvePost } from '@/lib/blog/source'
import { isLocale } from '@/lib/i18n'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage, type OgInput } from '@/lib/og/template'

type Params = { lang: string; id: string }

async function postOg(lang: string, id: string): Promise<OgInput | null> {
  if (!isLocale(lang)) return null
  const post = await resolvePost(id, lang)
  if (!post) return null
  const { title, date, tags } = post.meta
  return { lang, title, line: [formatPostDate(date, lang), ...tags].join(' · ') }
}

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang, id } = await params
  const input = await postOg(lang, id)
  return input ? [ogImageMetadata(OG_DEFAULT_ID, input)] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang, id } = await params
  const input = await postOg(lang, id)
  if (!input) notFound()
  return renderOgImage(input)
}
