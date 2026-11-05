import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID, ogCase } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage } from '@/lib/og/template'

type Params = { lang: string; id: string }

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang, id } = await params
  if (!isLocale(lang)) return []
  const input = ogCase(lang, id)
  return input ? [ogImageMetadata(OG_DEFAULT_ID, input)] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang, id } = await params
  const input = isLocale(lang) ? ogCase(lang, id) : null
  if (!input) notFound()
  return renderOgImage(input)
}
