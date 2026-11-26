import en from '@/content/i18n/en/route.json'
import es from '@/content/i18n/es/route.json'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage, type OgInput } from '@/lib/og/template'

type Params = { lang: string }

const COPY = { es, en } as const

function routeOg(lang: Locale): OgInput {
  return { lang, title: COPY[lang]['route.meta.title'], line: COPY[lang]['route.meta.description'] }
}

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang } = await params
  return isLocale(lang) ? [ogImageMetadata(OG_DEFAULT_ID, routeOg(lang))] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang } = await params
  return renderOgImage(routeOg(isLocale(lang) ? lang : defaultLocale))
}
