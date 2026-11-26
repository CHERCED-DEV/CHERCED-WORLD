import en from '@/content/i18n/en/mcp.json'
import es from '@/content/i18n/es/mcp.json'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage, type OgInput } from '@/lib/og/template'

type Params = { lang: string }

const COPY = { es, en } as const

function mcpOg(lang: Locale): OgInput {
  return { lang, title: COPY[lang]['mcp.title'], line: COPY[lang]['mcp.meta.description'] }
}

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang } = await params
  return isLocale(lang) ? [ogImageMetadata(OG_DEFAULT_ID, mcpOg(lang))] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang } = await params
  return renderOgImage(mcpOg(isLocale(lang) ? lang : defaultLocale))
}