import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { post: make } = await import('../q0/support/posts')
  const loader = (meta: ReturnType<typeof make>) => async () => ({ default: () => null, meta })
  return {
    postRegistry: {
      ambos: {
        es: loader(make('ambos', { lang: 'es', date: '2026-03-01', tags: ['humor'] })),
        en: loader(make('ambos', { lang: 'en', date: '2026-03-01', tags: ['humor'] })),
      },
      'solo-en': {
        en: loader(make('solo-en', { lang: 'en', originalLang: 'en', date: '2026-04-01', title: 'Only in English', tags: ['architecture', 'notes'] })),
      },
    },
  }
})

const { listPosts, loadPost } = await import('@/lib/content')
const { allTagSlugs, ownPosts } = await import('@/lib/blog/source')
const { tagAlternates, tagIndexView, tagLangs } = await import('@/components/blog/index/view')
const { default: sitemap } = await import('@/app/sitemap')

describe('un post sin traducción (edge case de la 005) con etiquetas bilingües', () => {
  it('en la página del otro idioma trae las etiquetas del idioma de la página', async () => {
    const loaded = await loadPost('solo-en', 'es')
    expect(loaded?.fallback).toBe(true)
    expect(loaded?.meta.title).toBe('Only in English')
    expect(loaded?.meta.tags).toEqual(['arquitectura', 'notes'])
    expect((await listPosts('es')).find((post) => post.id === 'solo-en')?.tags).toEqual(['arquitectura', 'notes'])
    expect((await loadPost('solo-en', 'en'))?.meta.tags).toEqual(['architecture', 'notes'])
  })

  it('su etiqueta tiene página en los dos idiomas: en el suyo con el post y en el otro con la lista vacía', async () => {
    expect(await allTagSlugs()).toEqual(expect.arrayContaining(['architecture', 'arquitectura', 'humor', 'notes']))
    expect((await ownPosts('es')).map((post) => post.id)).toEqual(['ambos'])
    expect(await tagLangs('arquitectura')).toEqual(['en'])

    const es = await tagIndexView('es', 'architecture')
    expect(es.tag).toMatchObject({ slug: 'arquitectura', label: 'arquitectura', count: 0, summary: '0 posts con «arquitectura»' })
    expect(es.tag?.index).toEqual({ href: '/es/blog', label: 'Ver todos los posts' })
    expect(es.groups).toEqual([])

    const en = await tagIndexView('en', 'arquitectura')
    expect(en.tag).toMatchObject({ slug: 'architecture', label: 'architecture', count: 1 })

    expect(tagAlternates('es', 'arquitectura', ['en'])).toEqual({ canonical: '/es/blog/tag/arquitectura', languages: { en: '/en/blog/tag/architecture' } })
  })

  it('el sitemap la publica solo en el idioma donde tiene posts, con alternativa solo a ese idioma', async () => {
    const byPath = new Map((await sitemap()).map((entry) => [new URL(entry.url).pathname, entry]))
    expect(byPath.has('/es/blog/tag/arquitectura')).toBe(false)
    expect(Object.keys(byPath.get('/en/blog/tag/architecture')?.alternates?.languages ?? {})).toEqual(['en'])
    expect(Object.keys(byPath.get('/es/blog/tag/humor')?.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
  })
})
