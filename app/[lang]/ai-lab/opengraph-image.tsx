import { aiLabOg } from '@/components/ailab/shell/og'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage } from '@/lib/og/template'

type Params = { lang: string }

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang } = await params
  return isLocale(lang) ? [ogImageMetadata(OG_DEFAULT_ID, aiLabOg(lang))] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang } = await params
  return renderOgImage(aiLabOg(isLocale(lang) ? lang : defaultLocale))
}
