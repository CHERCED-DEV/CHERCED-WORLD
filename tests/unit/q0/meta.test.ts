import { describe, expect, it, vi } from 'vitest'
import { series as registeredSeries, type PostSeries } from '@/content/posts/series'
import type { Locale, PostMeta } from '@/content/types'
import { parsePostDate } from '@/lib/blog/format'
import { tagSlug } from '@/lib/blog/tags'
import { post } from './support/posts'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { ownPosts } = await import('@/lib/blog/source')

const LOCALES: Locale[] = ['es', 'en']

function metaProblems(lang: Locale, posts: readonly PostMeta[], seriesList: readonly PostSeries[]): string[] {
  const problems: string[] = []
  const featured = posts.filter((meta) => meta.featured === true)
  if (featured.length > 1) problems.push(`${lang}: más de un destacado (${featured.map((meta) => meta.id).join(', ')})`)

  const parts = new Map<string, string>()
  const labels = new Map<string, string>()
  for (const meta of posts) {
    if (meta.featured !== undefined && meta.featured !== true) problems.push(`${meta.id}/${lang}: featured solo puede ser true`)
    if (meta.cover !== undefined && meta.cover !== 'generated') problems.push(`${meta.id}/${lang}: cover solo puede ser 'generated'`)
    if (meta.updated !== undefined) {
      if (!parsePostDate(meta.updated)) problems.push(`${meta.id}/${lang}: updated no es AAAA-MM-DD`)
      else if (meta.updated < meta.date) problems.push(`${meta.id}/${lang}: updated es anterior a date`)
    }
    if (meta.series) {
      const { id, part } = meta.series
      if (!seriesList.some((entry) => entry.id === id)) problems.push(`${meta.id}/${lang}: la serie "${id}" no existe en series.ts`)
      if (!Number.isInteger(part) || part < 1) problems.push(`${meta.id}/${lang}: part debe ser un entero de 1 en adelante`)
      const key = `${id}#${part}`
      const owner = parts.get(key)
      if (owner) problems.push(`${meta.id}/${lang}: la parte ${part} de "${id}" ya es ${owner}`)
      else parts.set(key, meta.id)
    }
    for (const tag of meta.tags) {
      const slug = tagSlug(tag)
      if (slug === 'section' && tag.trim().toLowerCase() !== 'section') problems.push(`${meta.id}/${lang}: la etiqueta "${tag}" no tiene un slug propio`)
      const seen = labels.get(slug)
      if (seen !== undefined && seen !== tag) problems.push(`${lang}: "${tag}" y "${seen}" comparten el slug "${slug}"`)
      else labels.set(slug, tag)
    }
  }
  return problems
}

describe('meta de los posts del registro (data-model §1)', () => {
  it.each(LOCALES)('los posts en %s cumplen las reglas de featured, updated, series, cover y etiquetas', async (lang) => {
    const posts = await ownPosts(lang)
    expect(posts.length).toBeGreaterThan(0)
    expect(metaProblems(lang, posts, registeredSeries)).toEqual([])
  })
})

describe('las reglas fallan cuando deben', () => {
  const serie = [{ id: 'building', name: { es: 'Construyendo', en: 'Building' } }]

  it('avisa si hay más de un destacado en un idioma', () => {
    const posts = [post('a', { featured: true }), post('b', { featured: true }), post('c')]
    expect(metaProblems('es', posts, serie)).toEqual(['es: más de un destacado (a, b)'])
  })

  it('exige updated en AAAA-MM-DD igual o posterior a date', () => {
    expect(metaProblems('es', [post('a', { date: '2026-05-01', updated: '2026-04-30' })], serie)).toEqual(['a/es: updated es anterior a date'])
    expect(metaProblems('es', [post('a', { updated: '2026-13-01' })], serie)).toEqual(['a/es: updated no es AAAA-MM-DD'])
    expect(metaProblems('es', [post('a', { date: '2026-05-01', updated: '2026-05-01' })], serie)).toEqual([])
  })

  it('exige una serie existente y una parte única, entera y positiva', () => {
    expect(metaProblems('es', [post('a', { series: { id: 'nada', part: 1 } })], serie)).toEqual(['a/es: la serie "nada" no existe en series.ts'])
    expect(metaProblems('es', [post('a', { series: { id: 'building', part: 0 } })], serie)).toEqual(['a/es: part debe ser un entero de 1 en adelante'])
    expect(metaProblems('es', [post('a', { series: { id: 'building', part: 1.5 } })], serie)).toEqual(['a/es: part debe ser un entero de 1 en adelante'])
    expect(
      metaProblems('es', [post('a', { series: { id: 'building', part: 1 } }), post('b', { series: { id: 'building', part: 1 } })], serie),
    ).toEqual(['b/es: la parte 1 de "building" ya es a'])
  })

  it('avisa si dos etiquetas distintas chocan en el mismo slug o si una no tiene slug propio', () => {
    expect(metaProblems('es', [post('a', { tags: ['Arquitectura'] }), post('b', { tags: ['arquitectura'] })], serie)).toEqual([
      'es: "arquitectura" y "Arquitectura" comparten el slug "arquitectura"',
    ])
    expect(metaProblems('es', [post('a', { tags: ['🚀'] })], serie)).toEqual(['a/es: la etiqueta "🚀" no tiene un slug propio'])
  })
})
