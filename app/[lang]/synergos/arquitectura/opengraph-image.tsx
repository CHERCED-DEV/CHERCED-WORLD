import { architecture } from '@/content/synergos-architecture'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage } from '@/lib/og/template'

type Params = { lang: string }
const input = (lang: Locale) => ({ lang, title: architecture.copy.title[lang], line: architecture.copy.description[lang] })

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang } = await params
  return isLocale(lang) ? [ogImageMetadata(OG_DEFAULT_ID, input(lang))] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang } = await params
  return renderOgImage(input(isLocale(lang) ? lang : defaultLocale))
}
