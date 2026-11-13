import { describe, expect, it, vi } from 'vitest'
import blogEn from '@/content/i18n/en/blog.json'
import blogEs from '@/content/i18n/es/blog.json'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { blogIndexView, tagAlternates, tagIndexView, tagLangs, tagResultsText, tagSummary } = await import('@/components/blog/index/view')
const { ownPosts } = await import('@/lib/blog/source')

const ids = (posts: readonly { id: string }[]) => posts.map((post) => post.id)

describe('índice del blog sobre los posts reales (T610, T611)', () => {
  for (const lang of ['es', 'en'] as const) {
    it(`en ${lang}: el destacado va arriba y no se repite en su grupo`, async () => {
      const view = await blogIndexView(lang)
      expect(view.featured?.post.id).toBe('post7')
      expect(view.featured?.badge).toBe(lang === 'es' ? 'Destacado' : 'Featured')
      const grouped = view.groups.flatMap((group) => ids(group.posts))
      expect(grouped).not.toContain('post7')
      expect([view.featured?.post.id, ...grouped].sort()).toEqual(ids(await ownPosts(lang)).sort())
    })

    it(`en ${lang}: 2026 es "Ahora" y 2023 es "Archivo", del más nuevo al más viejo`, async () => {
      const view = await blogIndexView(lang)
      expect(view.groups.map(({ year, label, title }) => ({ year, label, title }))).toEqual([
        { year: 2026, label: 'now', title: lang === 'es' ? 'Ahora' : 'Now' },
        { year: 2023, label: 'archive', title: lang === 'es' ? 'Archivo' : 'Archive' },
      ])
      expect(view.groups.map((group) => ids(group.posts))).toEqual([['post6', 'post5', 'post4'], ['post3', 'post2', 'post1']])
    })
  }

  it('la barra trae "Todas" activa, una etiqueta por slug, el RSS del idioma y la búsqueda', async () => {
    const view = await blogIndexView('es')
    expect(view.toolbar.active).toBe('all')
    expect(view.toolbar.tags[0]).toEqual({ key: 'all', label: 'Todas', href: '/es/blog' })
    const keys = view.toolbar.tags.map((tag) => tag.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(view.toolbar.tags).toContainEqual({ key: 'inteligencia-artificial', label: 'inteligencia artificial', href: '/es/blog/tag/inteligencia-artificial' })
    expect(view.toolbar.rss).toEqual({ href: '/es/feed.xml', label: 'Suscríbete por RSS' })
    expect(view.search?.docs.map((doc) => doc.id).sort()).toEqual(['post1', 'post2', 'post3', 'post4', 'post5', 'post6', 'post7'])
    expect(view.search?.labels).toMatchObject({ result: '1 resultado', results: '{count} resultados', noResults: blogEs['index.noResults'] })
    expect(view.tag).toBeNull()
  })
})

describe('páginas de etiqueta (T614, R-503)', () => {
  it('filtra en el servidor, conserva Ahora/Archivo y no muestra destacado ni búsqueda', async () => {
    const view = await tagIndexView('es', 'humor')
    expect(view.featured).toBeNull()
    expect(view.search).toBeNull()
    expect(view.toolbar.active).toBe('humor')
    expect(view.groups.map((group) => [group.label, ids(group.posts)])).toEqual([
      ['now', ['post5']],
      ['archive', ['post3']],
    ])
    expect(view.tag).toMatchObject({ slug: 'humor', label: 'humor', count: 2, summary: '2 posts con «humor»' })
    expect(view.tag?.clear).toEqual({ href: '/es/blog', label: 'Limpiar' })
  })

  it('anuncia la cantidad en singular', async () => {
    const view = await tagIndexView('en', 'career')
    expect(view.tag?.summary).toBe('1 post tagged “career”')
    expect(tagResultsText(blogEs, 1, 'carrera')).toBe('1 post con «carrera»')
    expect(tagResultsText(blogEn, 3, 'tests')).toBe('3 posts tagged “tests”')
  })

  it('una etiqueta del otro idioma se lee con el nombre y el slug del idioma de la página (B9 de la 007)', async () => {
    const view = await tagIndexView('en', 'carrera')
    expect(view.tag).toMatchObject({ slug: 'career', count: 1, label: 'career', summary: '1 post tagged “career”' })
    expect(view.tag?.index).toEqual({ href: '/en/blog', label: 'See all posts' })
    expect(await tagSummary('en', 'carrera')).toEqual({ count: 1, summary: view.tag?.summary })
  })

  it('normaliza la etiqueta visible al slug', async () => {
    const view = await tagIndexView('es', 'Inteligencia Artificial')
    expect(view.tag?.slug).toBe('inteligencia-artificial')
    expect(view.tag?.count).toBe(1)
  })

  it('los alternates solo enlazan los idiomas donde la etiqueta tiene posts, como el sitemap', async () => {
    expect(await tagLangs('humor')).toEqual(['es', 'en'])
    expect(await tagLangs('carrera')).toEqual(['es', 'en'])
    expect(tagAlternates('es', 'humor', ['es', 'en'])).toEqual({
      canonical: '/es/blog/tag/humor',
      languages: { es: '/es/blog/tag/humor', en: '/en/blog/tag/humor', 'x-default': '/blog/tag/humor' },
    })
    expect(tagAlternates('en', 'carrera', ['es'])).toEqual({ canonical: '/en/blog/tag/career', languages: { es: '/es/blog/tag/carrera' } })
  })
})
