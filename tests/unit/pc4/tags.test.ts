import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { tags as catalog } from '@/content/posts/tags'
import type { Locale } from '@/content/types'
import { findTag, hasTag, switchLocaleKeepingTag, tagAlternates, tagIn, tagPath, tagSlug, tagSlugIn, tagsIn } from '@/lib/blog/tags'
import { readMeta } from '../l5/support/mdx-registry'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

vi.mock('@/components/blog/catalog/es.mdx', async () => {
  const { readMeta: read } = await import('../l5/support/mdx-registry')
  return { default: () => null, meta: read(`${process.cwd()}/components/blog/catalog/es.mdx`) }
})

const { listPosts, loadPost } = await import('@/lib/content')
const { allTagSlugs, feedItems, tagSlugsIn } = await import('@/lib/blog/source')
const { blogIndexView, tagIndexView, tagLangs } = await import('@/components/blog/index/view')
const { default: sitemap } = await import('@/app/sitemap')
const { buildSearchIndex } = await import('@/lib/search/build-index')
const { listPosts: listPostsTool } = await import('@/lib/capabilities/handlers')
const { loadCatalog } = await import('@/components/blog/catalog')

const LANGS: Locale[] = ['es', 'en']
const other = (lang: Locale): Locale => (lang === 'es' ? 'en' : 'es')
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')
const CATALOG_MDX = path.join(process.cwd(), 'components', 'blog', 'catalog', 'es.mdx')

const translated = catalog.filter((names) => names.es !== names.en)
const foreignIn = (lang: Locale) => new Set(translated.map((names) => names[other(lang)]))

const OLD_ES_SLUGS = {
  'spec-driven-development': 'desarrollo-guiado-por-especificaciones',
  'ai-agents': 'agentes-de-ia',
  architecture: 'arquitectura',
  refactoring: 'refactorizacion',
  coupling: 'acoplamiento',
} as const

describe('catálogo de etiquetas { es, en } (B9, T941)', () => {
  it('cada etiqueta tiene nombre en los dos idiomas, con slug propio', () => {
    for (const names of catalog) {
      for (const lang of LANGS) {
        expect(names[lang].trim(), JSON.stringify(names)).toBe(names[lang])
        expect(tagSlug(names[lang]), names[lang]).not.toBe('section')
      }
    }
  })

  it('ningún slug, de ningún idioma, es de dos etiquetas: la redirección entre idiomas no es ambigua', () => {
    const owner = new Map<string, number>()
    catalog.forEach((names, index) => {
      for (const lang of LANGS) {
        const slug = tagSlug(names[lang])
        expect(owner.get(slug) ?? index, `"${slug}" es de dos etiquetas`).toBe(index)
        owner.set(slug, index)
      }
    })
  })

  it('cada post escribe sus etiquetas en su idioma, con el nombre del catálogo, y sus dos versiones llevan las mismas', () => {
    const dirs = readdirSync(POSTS_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory())
    expect(dirs.length).toBeGreaterThan(0)
    for (const dir of dirs) {
      const byLang = new Map<Locale, string[]>()
      for (const lang of LANGS) {
        const file = path.join(POSTS_DIR, dir.name, `${lang}.mdx`)
        if (!existsSync(file)) continue
        const { tags } = readMeta(file)
        for (const tag of tags) expect(findTag(tag)?.[lang], `${dir.name}/${lang}: "${tag}" no es una etiqueta del catálogo en ${lang}`).toBe(tag)
        byLang.set(lang, tags.map((tag) => tagSlugIn(tag, 'en')).sort())
      }
      if (byLang.size === 2) expect(byLang.get('es'), dir.name).toEqual(byLang.get('en'))
    }
    for (const tag of readMeta(CATALOG_MDX).tags) expect(findTag(tag)?.es, `catálogo: "${tag}"`).toBe(tag)
  })

  it('traduce la etiqueta visible o el slug de cualquier idioma, y deja igual una que no conoce', () => {
    expect(tagIn('architecture', 'es')).toBe('arquitectura')
    expect(tagIn('Arquitectura', 'en')).toBe('architecture')
    expect(tagIn('inteligencia-artificial', 'en')).toBe('artificial intelligence')
    expect(tagsIn(['refactoring', 'humor', 'sagas'], 'es')).toEqual(['refactorización', 'humor', 'sagas'])
    expect(tagSlugIn('spec-driven-development', 'es')).toBe('desarrollo-guiado-por-especificaciones')
    expect(tagPath('es', 'architecture')).toBe('/es/blog/tag/arquitectura')
    expect(tagPath('en', 'arquitectura')).toBe('/en/blog/tag/architecture')
    expect(tagPath('en', 'Opinión')).toBe('/en/blog/tag/opinion')
    expect(tagPath('es', 'Sagas y compensación')).toBe('/es/blog/tag/sagas-y-compensacion')
  })

  it('compara etiquetas por identidad, no por idioma', () => {
    const post = { tags: ['arquitectura', 'acoplamiento'] }
    expect(hasTag(post, 'architecture')).toBe(true)
    expect(hasTag(post, 'COUPLING')).toBe(true)
    expect(hasTag(post, 'humor')).toBe(false)
  })

  it('los alternates de una etiqueta enlazan su slug en cada idioma', () => {
    expect(tagAlternates('es', 'carrera', ['es', 'en'])).toEqual({
      canonical: '/es/blog/tag/carrera',
      languages: { es: '/es/blog/tag/carrera', en: '/en/blog/tag/career', 'x-default': '/blog/tag/carrera' },
    })
    expect(tagAlternates('en', 'arquitectura', ['en'])).toEqual({ canonical: '/en/blog/tag/architecture', languages: { en: '/en/blog/tag/architecture' } })
  })
})

describe('cada superficie muestra las etiquetas en el idioma de la página (B9)', () => {
  for (const lang of LANGS) {
    it(`${lang}: posts, índice, páginas de etiqueta y RSS`, async () => {
      const foreign = foreignIn(lang)
      const posts = await listPosts(lang)
      for (const post of posts) {
        for (const tag of post.tags) {
          expect(tagIn(tag, lang), `${post.id}/${lang}`).toBe(tag)
          expect(foreign.has(tag), `${post.id}/${lang}: "${tag}"`).toBe(false)
        }
        expect((await loadPost(post.id, lang))?.meta.tags).toEqual(post.tags)
      }

      const index = await blogIndexView(lang)
      for (const item of index.toolbar.tags.slice(1)) {
        expect(foreign.has(item.label), `${lang}: filtro "${item.label}"`).toBe(false)
        expect(item.href).toBe(tagPath(lang, item.label))
      }
      for (const card of [index.featured?.post, ...index.groups.flatMap((group) => group.posts)]) {
        for (const tag of card?.tags ?? []) expect(foreign.has(tag), `${lang}: tarjeta ${card?.id} "${tag}"`).toBe(false)
      }

      for (const slug of await tagSlugsIn(lang)) {
        const view = await tagIndexView(lang, slug)
        expect(foreign.has(view.tag?.label ?? ''), `${lang}: página "${slug}"`).toBe(false)
        expect(view.tag?.slug).toBe(slug)
        expect(view.tag?.count).toBeGreaterThan(0)
      }

      for (const item of await feedItems(lang, new URL('https://cherced-world.test'))) {
        for (const category of item.categories) expect(foreign.has(category), `${lang}: RSS "${category}"`).toBe(false)
      }
    })

    it(`${lang}: búsqueda, asistente y list_posts`, async () => {
      const foreign = foreignIn(lang)
      const searchIndex = await buildSearchIndex(lang)
      for (const post of searchIndex.facts.posts) for (const tag of post.tags) expect(foreign.has(tag), `${lang}: índice "${tag}"`).toBe(false)
      const architecture = listPostsTool(searchIndex, { tag: 'architecture' }, { origin: null })
      const arquitectura = listPostsTool(searchIndex, { tag: 'arquitectura' }, { origin: null })
      expect(architecture.posts.map((post) => post.id).sort()).toEqual(['post4', 'post5', 'post6', 'post7'])
      expect(arquitectura.posts.map((post) => post.id)).toEqual(architecture.posts.map((post) => post.id))
      for (const post of architecture.posts) expect(post.tags).toContain(tagIn('architecture', lang))
    })
  }

  it('el catálogo de componentes, que solo existe en español, muestra sus etiquetas en inglés en /en', async () => {
    expect((await loadCatalog('es')).meta.tags).toEqual(['guía', 'mdx'])
    expect((await loadCatalog('en')).meta.tags).toEqual(['guide', 'mdx'])
  })
})

describe('URL de etiqueta estables (B9)', () => {
  it('las páginas existen para los slugs de los dos idiomas, viejos y nuevos', async () => {
    const all = await allTagSlugs()
    const [es, en] = await Promise.all([tagSlugsIn('es'), tagSlugsIn('en')])
    for (const slug of [...es, ...en]) expect(all).toContain(slug)
    for (const [old, current] of Object.entries(OLD_ES_SLUGS)) {
      expect(all).toContain(old)
      expect(es).toContain(current)
      expect(es).not.toContain(old)
      expect(tagSlugIn(old, 'es'), `/es/blog/tag/${old} redirige`).toBe(current)
      expect(tagSlugIn(old, 'en'), `/en/blog/tag/${old} sigue igual`).toBe(old)
    }
    for (const [old, current] of [['carrera', 'career'], ['cuento', 'story'], ['inteligencia-artificial', 'artificial-intelligence']] as const) {
      expect(all).toContain(old)
      expect(tagSlugIn(old, 'en'), `/en/blog/tag/${old} redirige`).toBe(current)
      expect(tagSlugIn(current, 'es'), `/es/blog/tag/${current} redirige`).toBe(old)
    }
  })

  it('el sitemap lista cada etiqueta con su slug en cada idioma y las enlaza entre sí', async () => {
    const entries = await sitemap()
    const byPath = new Map(entries.map((entry) => [new URL(entry.url).pathname, entry]))
    const tagged = [...byPath.keys()].filter((key) => key.includes('/blog/tag/'))
    const [es, en] = await Promise.all([tagSlugsIn('es'), tagSlugsIn('en')])
    expect(tagged.sort()).toEqual([...es.map((slug) => `/es/blog/tag/${slug}`), ...en.map((slug) => `/en/blog/tag/${slug}`)].sort())
    expect(byPath.has('/es/blog/tag/architecture')).toBe(false)
    const languages = (key: string) => Object.fromEntries(Object.entries(byPath.get(key)?.alternates?.languages ?? {}).map(([lang, url]) => [lang, new URL(String(url)).pathname]))
    expect(languages('/es/blog/tag/arquitectura')).toEqual({ es: '/es/blog/tag/arquitectura', en: '/en/blog/tag/architecture', 'x-default': '/blog/tag/arquitectura' })
    expect(languages('/en/blog/tag/career')).toEqual(languages('/es/blog/tag/carrera'))
  })

  it('los alternates de cada página de etiqueta enlazan los idiomas donde tiene posts', async () => {
    expect(await tagLangs('carrera')).toEqual(['es', 'en'])
    expect(await tagLangs('architecture')).toEqual(['es', 'en'])
    expect(await tagLangs('arquitectura')).toEqual(['es', 'en'])
  })
})

describe('R4.2: cambiar de idioma en una etiqueta lleva al slug del otro idioma, sin pasar por un 308', () => {
  it('traduce el slug de la etiqueta y deja igual el resto de las rutas', () => {
    expect(switchLocaleKeepingTag('/es/blog/tag/acoplamiento', 'en')).toBe('/en/blog/tag/coupling')
    expect(switchLocaleKeepingTag('/en/blog/tag/coupling', 'es')).toBe('/es/blog/tag/acoplamiento')
    expect(switchLocaleKeepingTag('/es/blog/tag/humor', 'en')).toBe('/en/blog/tag/humor')
    expect(switchLocaleKeepingTag('/es/blog/tag/no-existe', 'en')).toBe('/en/blog/tag/no-existe')
    expect(switchLocaleKeepingTag('/es/aboutMe', 'en')).toBe('/en/aboutMe')
    expect(switchLocaleKeepingTag('/es/blog/post1', 'en')).toBe('/en/blog/post1')
  })
})
