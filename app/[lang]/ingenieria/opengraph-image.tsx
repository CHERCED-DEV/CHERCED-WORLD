import en from '@/content/i18n/en/engineering.json'
import es from '@/content/i18n/es/engineering.json'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage, type OgInput } from '@/lib/og/template'

type Params = { lang: string }

const COPY = { es, en } as const

function engineeringOg(lang: Locale): OgInput {
  return { lang, title: COPY[lang]['engineering.title'], line: COPY[lang]['engineering.meta.description'] }
}

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang } = await params
  return isLocale(lang) ? [ogImageMetadata(OG_DEFAULT_ID, engineeringOg(lang))] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang } = await params
  return renderOgImage(engineeringOg(isLocale(lang) ? lang : defaultLocale))
}
