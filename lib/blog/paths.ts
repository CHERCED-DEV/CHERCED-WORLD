import type { Metadata } from 'next'
import { alternates, localizedPath, type Locale } from '@/lib/i18n'
import { absoluteUrl } from '@/lib/site-url'

export function blogPath(lang: Locale): string {
  return localizedPath(lang, '/blog')
}

export function postPath(lang: Locale, id: string): string {
  return localizedPath(lang, `/blog/${encodeURIComponent(id)}`)
}

export function postUrl(lang: Locale, id: string, env?: Record<string, string | undefined>): string {
  return absoluteUrl(postPath(lang, id), env)
}

export function postAlternates(
  lang: Locale,
  id: string,
  content: { lang: Locale; fallback: boolean },
): NonNullable<Metadata['alternates']> {
  const page = alternates(postPath(lang, id))
  if (!content.fallback) return page
  return { ...page, canonical: postPath(content.lang, id) }
}
