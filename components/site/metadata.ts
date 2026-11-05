import type { Metadata } from 'next'
import { alternates, localizedPath, t, type Dictionary, type Locale } from '@/lib/i18n'

export type ShareImage = { url: string; width: number; height: number; alt: string }

export type PageMetadataInput = {
  lang: Locale
  path: string
  title: string
  description: string
  common: Dictionary
  image?: ShareImage
  ogImageFile?: boolean
  absoluteTitle?: boolean
}

export function ogLocale(lang: Locale): string {
  return lang === 'es' ? 'es_CO' : 'en_US'
}

export function defaultShareImage(common: Dictionary): ShareImage {
  return { url: '/assets/icons/brandLogoX2.png', width: 202, height: 202, alt: t(common, 'brand.logoAlt') }
}

export function pageMetadata({
  lang,
  path,
  title,
  description,
  common,
  image,
  ogImageFile = false,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const url = localizedPath(lang, path)
  const openGraph: NonNullable<Metadata['openGraph']> = {
    type: 'website',
    siteName: t(common, 'brand.name'),
    locale: ogLocale(lang),
    title,
    description,
    url,
  }
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: alternates(url),
    openGraph: ogImageFile ? openGraph : { ...openGraph, images: [image ?? defaultShareImage(common)] },
  }
}
