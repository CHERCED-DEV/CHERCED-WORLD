import type { Locale } from '@/lib/i18n/config'
import { isSearchIndex, type SearchIndex } from './types'

const cache = new Map<Locale, Promise<SearchIndex>>()

export function searchIndexUrl(lang: Locale): string {
  return `/api/search-index/${lang}`
}

async function fetchIndex(lang: Locale): Promise<SearchIndex> {
  const response = await fetch(searchIndexUrl(lang), { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`search-index ${lang}: ${response.status}`)
  const body: unknown = await response.json()
  if (!isSearchIndex(body) || body.lang !== lang) throw new Error(`search-index ${lang}: formato inesperado`)
  return body
}

export function loadSearchIndex(lang: Locale): Promise<SearchIndex> {
  const cached = cache.get(lang)
  if (cached) return cached
  const pending = fetchIndex(lang).catch((error: unknown) => {
    cache.delete(lang)
    throw error
  })
  cache.set(lang, pending)
  return pending
}
