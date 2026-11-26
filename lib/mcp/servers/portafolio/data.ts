import { z } from 'zod'
import { createGlassBox, type GlassBox } from '@/lib/ailab/search/glassbox'
import type { Locale } from '@/lib/i18n/config'
import type { McpContext } from '@/lib/mcp/core/types'
import { buildSearchIndex } from '@/lib/search/build-index'
import type { SearchIndex } from '@/lib/search/types'

const indexes = new Map<Locale, Promise<SearchIndex>>()

const boxes = new Map<Locale, Promise<GlassBox>>()

export function portfolioIndex(lang: Locale): Promise<SearchIndex> {
  const cached = indexes.get(lang)
  if (cached) return cached
  const built = buildSearchIndex(lang)
  indexes.set(lang, built)
  built.catch(() => indexes.delete(lang))
  return built
}

export function portfolioBox(lang: Locale): Promise<GlassBox> {
  const cached = boxes.get(lang)
  if (cached) return cached
  const built = portfolioIndex(lang).then((index) => createGlassBox(index))
  boxes.set(lang, built)
  built.catch(() => boxes.delete(lang))
  return built
}

export const langSchema = z.enum(['es', 'en']).optional().describe('Language of the returned content: "es" (Spanish) or "en" (English). Default: "en".')

export function langOf(requested: Locale | undefined, ctx: Pick<McpContext, 'lang'>): Locale {
  return requested ?? ctx.lang
}

const SPANISH_HINT = /[áéíóúñ¿¡]|\b(qu[eé]|c[oó]mo|d[oó]nde|decisiones|casos?|proyectos?|experiencia|pruebas|arquitectura|sobre|para|con|del|los|las|el|la|de|en|y)\b/gi

const ENGLISH_HINT = /\b(what|how|where|which|decisions?|cases?|projects?|experience|tests?|architecture|about|for|with|the|of|in|and)\b/gi

export function queryLanguage(query: string): Locale {
  const spanish = query.match(SPANISH_HINT)?.length ?? 0
  const english = query.match(ENGLISH_HINT)?.length ?? 0
  return spanish > english ? 'es' : 'en'
}

export function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}