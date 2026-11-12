import { describe, expect, it } from 'vitest'
import {
  compareRankings,
  decodeVector,
  decodeVectors,
  encodeVector,
  isMeaningVectors,
  MEANING_DIMS,
  MEANING_MODEL,
  MEANING_PASSAGE_CHARS,
  MEANING_VECTORS_VERSION,
  passageText,
  quantize,
  queryText,
  rankByMeaning,
  type MeaningVectors,
} from '@/lib/ailab/search/meaning'

function unit(values: number[]): Float32Array {
  const norm = Math.hypot(...values)
  return Float32Array.from(values.map((value) => value / norm))
}

function vectors(entries: Array<[string, number[]]>): MeaningVectors {
  return {
    version: MEANING_VECTORS_VERSION,
    lang: 'es',
    model: MEANING_MODEL,
    dims: entries[0]?.[1].length ?? 0,
    docs: entries.map(([id, values]) => ({ id, v: encodeVector(quantize(unit(values))) })),
  }
}

describe('T734: vectores de la búsqueda por significado', () => {
  it('usa los prefijos de e5 y recorta los pasajes largos', () => {
    expect(queryText('  ¿cómo maneja Synergos las sagas?  ')).toBe('query: ¿cómo maneja Synergos las sagas?')
    expect(passageText({ title: 'Synergos', keywords: 'sagas', text: 'Coordina pagos.' })).toBe('passage: Synergos. sagas. Coordina pagos.')
    expect(passageText({ title: 'Sin claves', keywords: '', text: 'x' })).toBe('passage: Sin claves. x')
    expect(passageText({ title: 'Largo', keywords: '', text: 'a'.repeat(5000) }).length).toBe('passage: '.length + MEANING_PASSAGE_CHARS)
  })

  it('guarda cada vector en int8 y lo recupera igual en base64', () => {
    const original = quantize([1, -1, 0.5, -0.25, 0, 2, -2])
    expect([...original]).toEqual([127, -127, 64, -32, 0, 127, -127])
    expect([...decodeVector(encodeVector(original))]).toEqual([...original])
  })

  it('ordena por similitud de coseno y deja fuera los vectores de otro tamaño', () => {
    const decoded = decodeVectors(
      vectors([
        ['project:12', [1, 0, 0]],
        ['post:6', [0.7, 0.7, 0]],
        ['page:home', [0, 0, 1]],
      ]),
    )
    const hits = rankByMeaning(unit([1, 0.1, 0]), decoded)
    expect(hits.map((hit) => hit.id)).toEqual(['project:12', 'post:6', 'page:home'])
    expect(hits[0]!.score).toBeGreaterThan(0.98)
    expect(hits[2]!.score).toBeLessThan(0.05)
    expect(rankByMeaning([1, 0], decoded)).toEqual([])
    expect(rankByMeaning(unit([1, 0, 0]), decoded, 1)).toHaveLength(1)
  })

  it('compara cada resultado por significado con su puesto por palabras', () => {
    const shifts = compareRankings(
      [
        { id: 'a', score: 0.9 },
        { id: 'b', score: 0.8 },
      ],
      ['b', 'c'],
    )
    expect(shifts).toEqual([
      { id: 'a', meaning: 1, words: null },
      { id: 'b', meaning: 2, words: 1 },
    ])
  })

  it('reconoce el formato de la ruta de vectores y rechaza lo demás', () => {
    const good = vectors([['x', [1, 0]]])
    expect(isMeaningVectors(good)).toBe(true)
    expect(isMeaningVectors({ ...good, version: 2 })).toBe(false)
    expect(isMeaningVectors({ ...good, docs: [{ id: 1, v: 'x' }] })).toBe(false)
    expect(isMeaningVectors(null)).toBe(false)
    expect(MEANING_DIMS).toBe(384)
  })
})
