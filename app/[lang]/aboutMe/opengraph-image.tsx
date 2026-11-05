import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID, ogSection } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage } from '@/lib/og/template'

type Params = { lang: string }

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang } = await params
  return isLocale(lang) ? [ogImageMetadata(OG_DEFAULT_ID, ogSection(lang, 'about'))] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang } = await params
  return renderOgImage(ogSection(isLocale(lang) ? lang : defaultLocale, 'about'))
}
