import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { SearchDoc, SearchIndex } from '@/lib/search/types'

vi.setConfig({ testTimeout: 60_000 })

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { createSearcher } = await import('@/lib/search/searcher')
const {
  GLASS_FIELD_BOOSTS,
  GLASS_FIELDS,
  GLASS_FUZZY_MIN,
  GLASS_FUZZY_RATIO,
  GLASS_MAX_FUZZY,
  GLASS_PREFIX_MIN,
  createGlassBox,
  editDistance,
  fieldTerms,
  matchKind,
  maxFuzzyDistance,
  queryTerms,
} = await import('@/lib/ailab/search/glassbox')

const QUERIES = {
  es: ['¿cómo maneja Synergos las sagas?', 'Angular', 'microservisios', 'accesibilidad', 'arquitectura hexagonal', 'pruebas pruebas', 'next.js react', 'c# .net'],
  en: ['how does Synergos handle sagas?', 'Angular', 'microservises', 'accessibility', 'hexagonal architecture', 'tests tests', 'next.js react', 'c# .net'],
} as const

const indexes = new Map<string, SearchIndex>()

async function index(lang: 'es' | 'en'): Promise<SearchIndex> {
  if (!indexes.has(lang)) indexes.set(lang, await buildSearchIndex(lang))
  return indexes.get(lang)!
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
}

describe.each(['es', 'en'] as const)('caja de cristal sobre el índice real (%s, FR-357)', (lang) => {
  it('el ranking y el puntaje son los del buscador del sitio, sin tocarlos', async () => {
    const data = await index(lang)
    const box = createGlassBox(data)
    const searcher = createSearcher(data.docs)
    for (const query of QUERIES[lang]) {
      const found = box.search(query, { limit: 8 })
      const hits = searcher.search(query, { limit: 8 })
      expect(found.results.map((result) => [result.doc.id, result.score]), query).toEqual(hits.map((hit) => [hit.doc.id, hit.score]))
      expect(found.total).toBe(data.docs.length)
    }
  })

  it('lo que aporta cada palabra, sumado y multiplicado por las que coincidieron, da el puntaje', async () => {
    const box = createGlassBox(await index(lang))
    let checked = 0
    for (const query of QUERIES[lang]) {
      for (const result of box.search(query, { limit: 20 }).results) {
        expect(close(result.sum * result.matchedTerms, result.score), `${query} → ${result.doc.id}`).toBe(true)
        expect(result.terms.length, `${query} → ${result.doc.id}`).toBe(result.matchedTerms)
        for (const term of result.terms) {
          expect(term.score, term.term).toBeGreaterThan(0)
          expect(term.matches.length, `${query} → ${result.doc.id} · ${term.term}`).toBeGreaterThan(0)
          expect(term.documents).toBeGreaterThan(0)
          for (const match of term.matches) expect(match.boost).toBe(GLASS_FIELD_BOOSTS[match.field])
        }
        checked += 1
      }
    }
    expect(checked).toBeGreaterThan(30)
  })

  it('las reglas de coincidencia repiten las del buscador: mismos documentos por palabra', async () => {
    const data = await index(lang)
    const searcher = createSearcher(data.docs)
    const words = new Set<string>(QUERIES[lang].flatMap((query) => queryTerms(query)))
    for (const doc of data.docs.filter((_, position) => position % 7 === 0)) for (const word of fieldTerms(doc.text).slice(0, 6)) words.add(word)
    for (const typo of ['servisios', 'arquitectra', 'anglar', 'reakt', 'sa', 'ux']) words.add(typo)
    for (const word of words) {
      const expected = searcher
        .search(word)
        .map((hit) => hit.doc.id)
        .sort()
      const explained = data.docs
        .filter((doc) => GLASS_FIELDS.some((field) => fieldTerms(doc[field]).some((candidate) => matchKind(word, candidate) !== null)))
        .map((doc) => doc.id)
        .sort()
      expect(explained, word).toEqual(expected)
    }
  })

  it('cada resultado trae fragmento, fuente y enlace del sitio en su idioma, y la palabra resaltada', async () => {
    const box = createGlassBox(await index(lang))
    const found = box.search(QUERIES[lang][0])
    expect(found.results.length).toBeGreaterThan(2)
    const project = found.results.find(result => result.doc.id === 'project:12')
    expect(project?.doc.title).toBe('Synergos')
    expect(found.results.some(result => result.doc.id === 'architecture:synergos')).toBe(true)
    for (const result of found.results) {
      expect(result.doc.url.startsWith(`/${lang}`), result.doc.id).toBe(true)
      expect(result.share).toBeGreaterThan(0)
      expect(result.share).toBeLessThanOrEqual(1)
    }
    const fragment = project!.fragment!
    expect(fragment.field).toBe('text')
    const highlighted = fragment.segments.filter((segment) => segment.hit).map((segment) => segment.text.toLowerCase())
    expect(highlighted).toContain('saga')
    const scores = found.results.map((result) => result.score)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
    expect(found.terms.map((term) => term.term)).toEqual(queryTerms(QUERIES[lang][0]))
  })

  it('el CV en PDF no está: solo los datos del sitio (004, FR-422)', async () => {
    const data = await index(lang)
    const cv = data.facts.cv?.href
    const box = createGlassBox(data)
    for (const query of ['cv', 'curriculum', 'resume', 'hoja de vida', 'pdf', ...QUERIES[lang]]) {
      for (const result of box.search(query, { limit: 50 }).results) {
        expect(result.doc.url, query).not.toMatch(/\.pdf(?:$|[?#])/i)
        if (cv) expect(result.doc.url, query).not.toBe(cv)
      }
    }
  })
})

describe('caja de cristal con un índice de prueba', () => {
  const doc = (id: string, title: string, text: string, keywords = '', url = `/es/${id}`): SearchDoc => ({ id, kind: 'post', title, text, keywords, url })
  const docs = [
    doc('saga', 'Sagas sin miedo', 'Una saga compensa en orden inverso. Cada paso sabe deshacerse.', 'arquitectura'),
    doc('pagos', 'Pagos', 'El cobro falla y la saga compensa la reserva.', 'saga pagos'),
    doc('cv', 'CV', 'Mi hoja de vida en PDF.', 'cv', '/cv/camilo.pdf'),
    doc('otro', 'Otra cosa', 'Nada que ver con el tema.', ''),
  ]

  it('saca los PDF del índice antes de buscar', () => {
    const box = createGlassBox({ docs })
    expect(box.size).toBe(3)
    expect(box.search('hoja de vida pdf').results.map((result) => result.doc.id)).not.toContain('cv')
  })

  it('una palabra repetida cuenta dos veces y lo dice', () => {
    const box = createGlassBox({ docs })
    const found = box.search('saga saga')
    expect(found.terms).toEqual([{ term: 'saga', occurrences: 2, documents: 2 }])
    for (const result of found.results) {
      expect(result.terms[0]!.occurrences).toBe(2)
      expect(close(result.sum * result.matchedTerms, result.score)).toBe(true)
    }
  })

  it('dice en qué campo coincidió, con su peso y su tipo de coincidencia', () => {
    const box = createGlassBox({ docs })
    const results = box.search('saga').results
    expect(results.map((result) => result.doc.id).sort()).toEqual(['pagos', 'saga'])
    const first = results.find((result) => result.doc.id === 'saga')
    expect(results.find((result) => result.doc.id === 'pagos')!.terms[0]!.matches).toEqual([
      { field: 'keywords', boost: 2, word: 'saga', kind: 'exact' },
      { field: 'text', boost: 1, word: 'saga', kind: 'exact' },
    ])
    expect(first!.terms[0]!.matches).toEqual([
      { field: 'title', boost: 4, word: 'sagas', kind: 'prefix' },
      { field: 'text', boost: 1, word: 'saga', kind: 'exact' },
    ])
    expect(first!.fragment).toEqual({
      field: 'text',
      segments: [
        { text: 'Una ', hit: false },
        { text: 'saga', hit: true },
        { text: ' compensa en orden inverso.', hit: false },
      ],
    })
  })

  it('las palabras sin coincidencias aparecen con cero documentos, y sin pregunta no hay resultados', () => {
    const box = createGlassBox({ docs })
    expect(box.search('saga hexagonal').terms).toEqual([
      { term: 'saga', occurrences: 1, documents: 2 },
      { term: 'hexagonal', occurrences: 1, documents: 0 },
    ])
    expect(box.search('   ¿?  ')).toMatchObject({ terms: [], results: [] })
  })

  it('si solo coincide el título, el fragmento es el comienzo del texto', () => {
    const box = createGlassBox({ docs: [doc('a', 'Hexagonal', 'Puertos y adaptadores. Otra frase.')] })
    expect(box.search('hexagonal').results[0]!.fragment).toEqual({ field: 'text', segments: [{ text: 'Puertos y adaptadores. Otra frase.', hit: false }] })
  })

  it('un texto largo se recorta alrededor de la palabra más rara', () => {
    const long = `${'relleno '.repeat(60)}aqui aparece hexagonal por fin ${'cola '.repeat(60)}`
    const box = createGlassBox({ docs: [doc('a', 'Largo', long), doc('b', 'Otro', 'relleno relleno')] })
    const fragment = box.search('hexagonal relleno').results[0]!.fragment!
    const text = fragment.segments.map((segment) => segment.text).join('')
    expect(text.length).toBeLessThanOrEqual(225)
    expect(text.startsWith('…')).toBe(true)
    expect(fragment.segments.some((segment) => segment.hit && segment.text === 'hexagonal')).toBe(true)
  })
})

describe('reglas de coincidencia', () => {
  it('pliega la pregunta como el buscador', () => {
    expect(queryTerms('¿Cómo maneja Synergos las SAGAS?')).toEqual(['como', 'maneja', 'synergos', 'las', 'sagas'])
    expect(queryTerms('Next.js y C#')).toEqual(['nextjs', 'y', 'c'])
  })

  it('exacta, por prefijo desde 2 letras y aproximada desde 4, con distancia según el largo', () => {
    expect(matchKind('saga', 'saga')).toBe('exact')
    expect(matchKind('saga', 'sagas')).toBe('prefix')
    expect(matchKind('s', 'sagas')).toBeNull()
    expect(matchKind('sa', 'sagas')).toBe('prefix')
    expect(matchKind('saga', 'sega')).toBe('fuzzy')
    expect(matchKind('sag', 'sog')).toBeNull()
    expect(matchKind('servisios', 'servicios')).toBe('fuzzy')
    expect(maxFuzzyDistance('abc')).toBe(0)
    expect(maxFuzzyDistance('abcd')).toBe(1)
    expect(maxFuzzyDistance('abcdefg')).toBe(1)
    expect(maxFuzzyDistance('abcdefgh')).toBe(2)
    expect(maxFuzzyDistance('a'.repeat(30))).toBe(2)
  })

  it('la distancia de edición es la de Levenshtein, con corte', () => {
    expect(editDistance('kitten', 'sitting', 5)).toBe(3)
    expect(editDistance('saga', 'saga', 1)).toBe(0)
    expect(editDistance('ab', 'ba', 2)).toBe(2)
    expect(editDistance('abc', 'abcdef', 1)).toBe(2)
    expect(editDistance('flaw', 'lawn', 2)).toBe(2)
  })

  it('las constantes son las del buscador del sitio: si cambian allá, esta prueba avisa', () => {
    const source = readFileSync(join(process.cwd(), 'lib', 'search', 'searcher.ts'), 'utf8')
    const { title, keywords, text } = GLASS_FIELD_BOOSTS
    expect(source).toContain(`fields: ['title', 'keywords', 'text']`)
    expect(source).toContain(`boost: { title: ${title}, keywords: ${keywords}, text: ${text} }`)
    expect(source).toContain(`prefix: (term) => term.length >= ${GLASS_PREFIX_MIN}`)
    expect(source).toContain(`fuzzy: (term) => (term.length >= ${GLASS_FUZZY_MIN} ? ${GLASS_FUZZY_RATIO} : false)`)
    expect(source).toContain(`maxFuzzy: ${GLASS_MAX_FUZZY}`)
    expect(source).toContain(`combineWith: 'OR'`)
  })
})
