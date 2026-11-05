import { describe, expect, it, vi } from 'vitest'
import { hasTag, postsWithTag, postTags, tagPath, tagSlug, uniqueTagSlugs } from '@/lib/blog/tags'
import { ids, post } from './support/posts'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { allTagSlugs, tagSlugsIn } = await import('@/lib/blog/source')

describe('slug de etiqueta (edge case: mayúsculas, tildes y espacios)', () => {
  it.each([
    ['inteligencia artificial', 'inteligencia-artificial'],
    ['Inteligencia  Artificial ', 'inteligencia-artificial'],
    ['opinión', 'opinion'],
    ['Diseño de APIs', 'diseno-de-apis'],
    ['spec-driven-development', 'spec-driven-development'],
    ['Next.js', 'next-js'],
    ['AI-First', 'ai-first'],
  ])('%s → %s', (tag, slug) => {
    expect(tagSlug(tag)).toBe(slug)
  })

  it('es estable: el slug de un slug es el mismo slug', () => {
    for (const tag of ['Arquitectura Limpia', 'opinión', 'Señales y Sagas', 'C# y .NET']) {
      expect(tagSlug(tagSlug(tag))).toBe(tagSlug(tag))
    }
  })

  it('arma la URL /{lang}/blog/tag/<slug> desde la etiqueta visible o desde el slug', () => {
    expect(tagPath('es', 'Inteligencia Artificial')).toBe('/es/blog/tag/inteligencia-artificial')
    expect(tagPath('en', 'artificial-intelligence')).toBe('/en/blog/tag/artificial-intelligence')
  })
})

describe('etiquetas de una lista de posts', () => {
  const posts = [
    post('a', { tags: ['Arquitectura', 'sagas'] }),
    post('b', { tags: ['arquitectura', 'opinión'] }),
    post('c', { tags: ['Opinion', 'Arquitectura', 'arquitectura'] }),
  ]

  it('cuenta cada etiqueta una vez por post y conserva la etiqueta visible del primero', () => {
    expect(postTags(posts)).toEqual([
      { slug: 'arquitectura', label: 'Arquitectura', count: 3 },
      { slug: 'opinion', label: 'opinión', count: 2 },
      { slug: 'sagas', label: 'sagas', count: 1 },
    ])
  })

  it('filtra por etiqueta comparando slugs', () => {
    expect(ids(postsWithTag(posts, 'opinion'))).toEqual(['b', 'c'])
    expect(ids(postsWithTag(posts, 'Opinión'))).toEqual(['b', 'c'])
    expect(postsWithTag(posts, 'no-existe')).toEqual([])
    expect(hasTag(posts[0]!, 'SAGAS')).toBe(true)
  })

  it('une slugs sin duplicados y en orden estable', () => {
    expect(uniqueTagSlugs([...posts, post('d', { tags: ['Sagas', 'nueva etiqueta'] })])).toEqual([
      'arquitectura',
      'nueva-etiqueta',
      'opinion',
      'sagas',
    ])
  })
})

describe('etiquetas del registro (R-503)', () => {
  it('allTagSlugs es la unión de los dos idiomas, sin duplicados', async () => {
    const [es, en, all] = await Promise.all([tagSlugsIn('es'), tagSlugsIn('en'), allTagSlugs()])
    expect(all).toEqual([...new Set([...es, ...en])].sort())
    expect(new Set(all).size).toBe(all.length)
    expect(es).toContain('carrera')
    expect(en).not.toContain('carrera')
    expect(en).toContain('career')
    expect(all).toEqual(expect.arrayContaining(['carrera', 'career', 'inteligencia-artificial', 'artificial-intelligence']))
  })
})
