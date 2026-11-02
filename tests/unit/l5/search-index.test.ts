import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('./support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { getProjects, getSite, postIds } = await import('@/lib/content')
const { createSearcher } = await import('@/lib/search/searcher')
const { isSearchIndex, PAGE_IDS } = await import('@/lib/search/types')
const { fold, tokenize, excerpt } = await import('@/lib/search/text')

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g

describe.each(['es', 'en'] as const)('índice de búsqueda (%s)', (lang) => {
  it('tiene la forma del contrato y solo URLs del idioma', async () => {
    const index = await buildSearchIndex(lang)
    expect(isSearchIndex(index)).toBe(true)
    expect(index.lang).toBe(lang)
    for (const doc of index.docs) {
      expect(doc.url.startsWith(`/${lang}`), doc.id).toBe(true)
      expect(doc.title.trim(), doc.id).not.toBe('')
    }
    expect(new Set(index.docs.map((doc) => doc.id)).size).toBe(index.docs.length)
  })

  it('incluye páginas, todos los proyectos y todos los posts', async () => {
    const index = await buildSearchIndex(lang)
    const ids = index.docs.map((doc) => doc.id)
    for (const page of PAGE_IDS) expect(ids).toContain(`page:${page}`)
    for (const project of getProjects()) expect(ids).toContain(`project:${project.id}`)
    for (const id of postIds()) expect(ids).toContain(`post:${id}`)
    expect(index.facts.projects.map((project) => project.url)).toEqual(
      getProjects().map((project) => `/${lang}/portfolio/${project.id}`),
    )
  })

  it('no publica entradas pendientes ni la carrera mientras haya pendientes', async () => {
    const index = await buildSearchIndex(lang)
    const site = getSite()
    if (site.about.career.some((entry) => entry.pending)) {
      expect(index.facts.career).toEqual([])
      expect(index.docs.some((doc) => doc.id === 'section:career')).toBe(false)
    }
    const pendingSchools = site.about.education.filter((entry) => entry.pending).map((entry) => entry.institution)
    for (const institution of pendingSchools) {
      expect(index.facts.education.map((entry) => entry.institution)).not.toContain(institution)
    }
  })

  it('solo contiene el correo público del autor y ningún dato privado', async () => {
    const index = await buildSearchIndex(lang)
    const serialized = JSON.stringify(index)
    const emails = new Set(serialized.match(EMAIL) ?? [])
    const author = getSite().socials.find((social) => social.id === 'email')?.href?.replace('mailto:', '')
    expect([...emails].filter((email) => email !== author)).toEqual([])
    for (const forbidden of ['ipHash', 'passwordHash', 'consentAt', 'MONGODB', 'unread', '"phone"']) {
      expect(serialized).not.toContain(forbidden)
    }
  })

  it('omite las redes sin enlace', async () => {
    const index = await buildSearchIndex(lang)
    expect(index.facts.socials.every((social) => social.href.length > 0)).toBe(true)
    expect(index.facts.socials.map((social) => social.id)).not.toContain('facebook')
  })
})

describe('buscador difuso', () => {
  it('encuentra páginas por prefijo, sin tildes y con errores de tipeo', async () => {
    const index = await buildSearchIndex('es')
    const searcher = createSearcher(index.docs)
    expect(searcher.search('blog')[0]?.doc.id).toBe('page:blog')
    expect(searcher.search('contac')[0]?.doc.id).toBe('page:contact')
    expect(searcher.search('servisios')[0]?.doc.id).toBe('page:services')
    expect(searcher.search('quantic')[0]?.doc.id).toBe('project:1')
    expect(searcher.search('   ')).toEqual([])
  })

  it('respeta el filtro y el límite', async () => {
    const index = await buildSearchIndex('en')
    const searcher = createSearcher(index.docs)
    const hits = searcher.search('react', { filter: (doc) => doc.kind === 'project', limit: 1 })
    expect(hits).toHaveLength(1)
    expect(hits[0]?.doc.kind).toBe('project')
  })
})

describe('utilidades de texto', () => {
  it('pliega tildes, mayúsculas, letras repetidas y sufijos .js', () => {
    expect(fold('Tecnologías')).toBe('tecnologias')
    expect(fold('Next.js y Node.js')).toBe('nextjs y nodejs')
    expect(fold('enecimo intentooooo')).toBe('enecimo intento')
    expect(tokenize('¿Qué hiciste con React?')).toEqual(['que', 'hiciste', 'con', 'react'])
  })

  it('recorta extractos en una palabra completa', () => {
    expect(excerpt('corto')).toBe('corto')
    const long = 'palabra '.repeat(60)
    const cut = excerpt(long, 50)
    expect(cut.endsWith('…')).toBe(true)
    expect(cut.length).toBeLessThanOrEqual(51)
  })
})
