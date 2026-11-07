import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { isSearchIndex, SEARCH_INDEX_VERSION } = await import('@/lib/search/types')
const { getSite } = await import('@/lib/content')
const { now } = await import('@/content/now')

const site = getSite()

describe('A-406: índice versión 2 con habilidades (FR-450)', () => {
  it('la versión es 2 y el cliente descarta índices de la versión 1', async () => {
    const index = await buildSearchIndex('es')
    expect(SEARCH_INDEX_VERSION).toBe(2)
    expect(isSearchIndex(index)).toBe(true)
    expect(isSearchIndex({ ...index, version: 1 })).toBe(false)
  })

  it.each(['es', 'en'] as const)('los docs de habilidad siguen data-model §4 (%s)', async (lang) => {
    const index = await buildSearchIndex(lang)
    const doc = index.docs.find((item) => item.id === 'skill:saga')
    const lobe = site.about.skills.lobes!.find((item) => item.skills.includes('saga'))!
    expect(doc).toEqual({
      id: 'skill:saga',
      kind: 'skill',
      title: 'SAGA · COMPENSATING TRANSACTIONS',
      text: lang === 'es' ? `${lobe.name.es} · 85 %` : `${lobe.name.en} · 85%`,
      keywords: `${lobe.name[lang]} saga`,
      url: `/${lang}/aboutMe#lobe-${lobe.id}`,
    })
    const label = index.docs.find((item) => item.id === 'skill:business-to-architecture')
    expect(label?.title).toBe(lang === 'es' ? 'DEL NEGOCIO A LA ARQUITECTURA' : 'BUSINESS → ARCHITECTURE')
    const english = index.docs.find((item) => item.id === 'skill:en')
    expect(english?.title).toBe(lang === 'es' ? 'Inglés' : 'English')
  })

  it('incluye /now como página, sin el texto de lo que el autor está aprendiendo', async () => {
    for (const lang of ['es', 'en'] as const) {
      const index = await buildSearchIndex(lang)
      expect(index.docs.find((doc) => doc.id === 'page:now')).toMatchObject({ kind: 'page', url: `/${lang}/now`, text: '' })
      const serialized = JSON.stringify(index)
      for (const entry of now.learning) expect(serialized).not.toContain(entry[lang])
      if (site.about.skills.learningNow) expect(serialized).not.toContain(site.about.skills.learningNow[lang])
    }
  })

  it('refleja el contenido de la 004: servicios nuevos, lóbulos y el título de hoy; sin el texto de 2023', async () => {
    for (const lang of ['es', 'en'] as const) {
      const index = await buildSearchIndex(lang)
      const serialized = JSON.stringify(index)
      expect(serialized).not.toContain(site.about.skills.description[lang])
      for (const bullet of site.about.skills.bullets) expect(serialized).not.toContain(bullet[lang])
      expect(index.facts.services.items.map((item) => item.id)).toEqual(site.services.items.map((item) => item.id))
      expect(index.facts.skills.lobes.map((lobe) => lobe.id)).toEqual(site.about.skills.lobes!.map((lobe) => lobe.id))
      expect(index.docs.find((doc) => doc.id === 'page:home')?.text).toContain(site.home.title[lang])
      const practices = index.facts.skills.lobes.find((lobe) => lobe.id === 'practices')
      expect(practices?.words).toBeNull()
    }
  })

  it('el CV entra como enlaces, a LinkedIn y a los dos PDF del sitio, sin su contenido (FR-422, FR-701 y T911 de la 007)', async () => {
    const en = await buildSearchIndex('en')
    expect(en.facts.cv).toEqual({
      href: 'https://www.linkedin.com/in/cherced/',
      label: 'LinkedIn profile',
      pdfs: [
        { lang: 'en', href: '/cv/camilo-hernandez-cv-en.pdf', label: 'Download CV in English (PDF)', bytes: 172_753 },
        { lang: 'es', href: '/cv/camilo-hernandez-cv-es.pdf', label: 'Download CV in Spanish (PDF)', bytes: 174_507 },
      ],
    })
    const es = await buildSearchIndex('es')
    expect(es.facts.cv?.pdfs.map((pdf) => [pdf.lang, pdf.label])).toEqual([
      ['es', 'Descargar CV en español (PDF)'],
      ['en', 'Descargar CV en inglés (PDF)'],
    ])
    for (const index of [en, es]) {
      const text = JSON.stringify(index).replaceAll('/cv/camilo-hernandez-cv-en.pdf', '').replaceAll('/cv/camilo-hernandez-cv-es.pdf', '')
      expect(text).not.toMatch(/\.pdf\b/i)
    }
  })
})
