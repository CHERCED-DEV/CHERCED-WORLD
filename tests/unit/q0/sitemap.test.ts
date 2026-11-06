import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { default: sitemap } = await import('@/app/sitemap')
const { tagSlugsIn } = await import('@/lib/blog/source')

const entries = await sitemap()
const byPath = new Map(entries.map((entry) => [new URL(entry.url).pathname, entry]))
const tagPaths = [...byPath.keys()].filter((path) => path.includes('/blog/tag/'))

describe('sitemap con páginas de etiqueta (A-507)', () => {
  it('suma cada etiqueta en cada idioma donde tiene posts', async () => {
    const [es, en] = await Promise.all([tagSlugsIn('es'), tagSlugsIn('en')])
    expect(tagPaths.sort()).toEqual([...es.map((slug) => `/es/blog/tag/${slug}`), ...en.map((slug) => `/en/blog/tag/${slug}`)].sort())
    expect(byPath.has('/es/blog/tag/carrera')).toBe(true)
    expect(byPath.has('/en/blog/tag/carrera')).toBe(false)
    expect(byPath.has('/en/blog/tag/career')).toBe(true)
  })

  it('enlaza como alternativa los idiomas donde la etiqueta tiene posts, cada uno con su slug (B9 de la 007)', () => {
    const paired = byPath.get('/es/blog/tag/carrera')!
    expect(Object.keys(paired.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
    expect(new URL(String(paired.alternates?.languages?.en)).pathname).toBe('/en/blog/tag/career')
    const shared = byPath.get('/en/blog/tag/humor')!
    expect(Object.keys(shared.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
  })

  it('no cambia el resto: páginas, casos y posts siguen en ambos idiomas', () => {
    for (const lang of ['es', 'en']) {
      for (const path of ['', '/blog', '/now', '/portfolio/12', '/blog/post1', '/blog/post5']) expect(byPath.has(`/${lang}${path}`), `/${lang}${path}`).toBe(true)
    }
    expect(Object.keys(byPath.get('/es/blog/post1')!.alternates?.languages ?? {}).sort()).toEqual(['en', 'es', 'x-default'])
    expect(byPath.get('/es/blog/post4')?.lastModified).toBe('2026-11-02')
  })
})
