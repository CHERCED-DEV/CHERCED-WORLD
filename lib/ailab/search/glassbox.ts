import { createSearcher, type SearchHit } from '@/lib/search/searcher'
import { excerpt, processTerm, sentences, tokenize } from '@/lib/search/text'
import type { SearchDoc } from '@/lib/search/types'

export const GLASS_FIELDS = ['title', 'keywords', 'text'] as const

export type GlassField = (typeof GLASS_FIELDS)[number]

export const GLASS_FIELD_BOOSTS: Readonly<Record<GlassField, number>> = { title: 4, keywords: 2, text: 1 }

export const GLASS_PREFIX_MIN = 2

export const GLASS_FUZZY_MIN = 4

export const GLASS_FUZZY_RATIO = 0.2

export const GLASS_MAX_FUZZY = 2

export const GLASS_DEFAULT_LIMIT = 8

export const GLASS_FRAGMENT_MAX = 220

export type GlassMatchKind = 'exact' | 'prefix' | 'fuzzy'

export type GlassMatch = { field: GlassField; boost: number; word: string; kind: GlassMatchKind }

export type GlassTerm = { term: string; occurrences: number; score: number; documents: number; matches: GlassMatch[] }

export type GlassQueryTerm = { term: string; occurrences: number; documents: number }

export type GlassSegment = { text: string; hit: boolean }

export type GlassFragment = { field: GlassField; segments: GlassSegment[] }

export type GlassResult = {
  rank: number
  doc: SearchDoc
  score: number
  share: number
  sum: number
  matchedTerms: number
  terms: GlassTerm[]
  fragment: GlassFragment | null
}

export type GlassSearch = { query: string; terms: GlassQueryTerm[]; total: number; results: GlassResult[] }

export type GlassBox = { size: number; search: (query: string, options?: { limit?: number }) => GlassSearch; doc: (id: string) => SearchDoc | null }

export function isIndexedDoc(doc: Pick<SearchDoc, 'url'>): boolean {
  return !PDF.test(doc.url)
}

const PDF = /\.pdf(?:$|[?#])/i
const WORD = /([\p{L}\p{N}@+#]+)/u

export function queryTerms(query: string): string[] {
  return tokenize(query)
    .map((token) => processTerm(token))
    .filter((term): term is string => term !== null)
}

export function maxFuzzyDistance(term: string): number {
  if (term.length < GLASS_FUZZY_MIN) return 0
  return Math.min(GLASS_MAX_FUZZY, Math.round(term.length * GLASS_FUZZY_RATIO))
}

export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    let best = i
    for (let j = 1; j <= b.length; j += 1) {
      const value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      current.push(value)
      best = Math.min(best, value)
    }
    if (best > max) return max + 1
    previous = current
  }
  return previous[b.length]!
}

export function matchKind(term: string, word: string): GlassMatchKind | null {
  if (word === term) return 'exact'
  if (term.length >= GLASS_PREFIX_MIN && word.startsWith(term)) return 'prefix'
  const max = maxFuzzyDistance(term)
  return max > 0 && editDistance(term, word, max) <= max ? 'fuzzy' : null
}

export function fieldTerms(value: string): string[] {
  return [...new Set(queryTerms(value))]
}

function counted(terms: readonly string[]): Array<{ term: string; occurrences: number }> {
  const counts = new Map<string, number>()
  for (const term of terms) counts.set(term, (counts.get(term) ?? 0) + 1)
  return [...counts].map(([term, occurrences]) => ({ term, occurrences }))
}

function wordTerm(part: string): string | null {
  return WORD.test(part) ? processTerm(part) : null
}

function segment(text: string, weights: ReadonlyMap<string, number>): GlassSegment[] {
  const segments: GlassSegment[] = []
  for (const part of text.split(WORD)) {
    if (part === '') continue
    const term = wordTerm(part)
    const hit = term !== null && weights.has(term)
    const last = segments.at(-1)
    if (last && !last.hit && !hit) last.text += part
    else segments.push({ text: part, hit })
  }
  return segments
}

function sentenceWeight(sentence: string, weights: ReadonlyMap<string, number>): number {
  return fieldTerms(sentence).reduce((total, term) => total + (weights.get(term) ?? 0), 0)
}

function passage(text: string, weights: ReadonlyMap<string, number>): string {
  const all = sentences(text.replace(/\s+/g, ' ').trim())
  let best = all[0] ?? ''
  let bestWeight = sentenceWeight(best, weights)
  for (const sentence of all.slice(1)) {
    const weight = sentenceWeight(sentence, weights)
    if (weight > bestWeight) [best, bestWeight] = [sentence, weight]
  }
  if (best.length <= GLASS_FRAGMENT_MAX) return best
  const parts = best.split(WORD)
  const strongest = parts.reduce((found, part, index) => {
    const weight = weights.get(wordTerm(part) ?? '') ?? 0
    return weight > found.weight ? { index, weight } : found
  }, { index: 0, weight: 0 })
  const offset = parts.slice(0, strongest.index).join('').length
  const start = Math.max(0, offset - Math.floor(GLASS_FRAGMENT_MAX / 3))
  const head = start > 0 ? best.slice(best.indexOf(' ', start) + 1) : best
  return `${start > 0 ? '…' : ''}${excerpt(head, GLASS_FRAGMENT_MAX)}`
}

export function rarity(documents: number, total: number): number {
  return Math.log(1 + total / Math.max(1, documents))
}

export function fragmentOf(doc: SearchDoc, terms: readonly GlassTerm[], total: number): GlassFragment | null {
  for (const field of ['text', 'keywords'] as const) {
    const weights = new Map<string, number>()
    for (const term of terms) {
      for (const match of term.matches) {
        if (match.field !== field) continue
        weights.set(match.word, Math.max(weights.get(match.word) ?? 0, rarity(term.documents, total)))
      }
    }
    if (weights.size > 0 && doc[field].trim()) return { field, segments: segment(passage(doc[field], weights), weights) }
  }
  const text = doc.text.trim()
  return text ? { field: 'text', segments: [{ text: excerpt(text, GLASS_FRAGMENT_MAX), hit: false }] } : null
}

export function createGlassBox(index: { docs: readonly SearchDoc[] }): GlassBox {
  const docs = index.docs.filter(isIndexedDoc)
  const byId = new Map(docs.map((doc) => [doc.id, doc]))
  const searcher = createSearcher(docs)
  const perTerm = new Map<string, Map<string, number>>()
  const perDoc = new Map<string, Record<GlassField, string[]>>()

  const termScores = (term: string): Map<string, number> => {
    const cached = perTerm.get(term)
    if (cached) return cached
    const scores = new Map(searcher.search(term).map((hit) => [hit.doc.id, hit.score]))
    perTerm.set(term, scores)
    return scores
  }

  const docTerms = (doc: SearchDoc): Record<GlassField, string[]> => {
    const cached = perDoc.get(doc.id)
    if (cached) return cached
    const terms = { title: fieldTerms(doc.title), keywords: fieldTerms(doc.keywords), text: fieldTerms(doc.text) }
    perDoc.set(doc.id, terms)
    return terms
  }

  const explain = (doc: SearchDoc, term: string): GlassMatch[] => {
    const fields = docTerms(doc)
    return GLASS_FIELDS.flatMap((field) =>
      fields[field].flatMap((word) => {
        const kind = matchKind(term, word)
        return kind ? [{ field, boost: GLASS_FIELD_BOOSTS[field], word, kind }] : []
      }),
    )
  }

  const result = (hit: SearchHit<SearchDoc>, rank: number, top: number, terms: ReturnType<typeof counted>): GlassResult => {
    const explained = terms.flatMap(({ term, occurrences }) => {
      const scores = termScores(term)
      const single = scores.get(hit.doc.id)
      if (single === undefined) return []
      return [{ term, occurrences, score: single * occurrences, documents: scores.size, matches: explain(hit.doc, term) }]
    })
    return {
      rank,
      doc: hit.doc,
      score: hit.score,
      share: top > 0 ? hit.score / top : 0,
      sum: explained.reduce((total, term) => total + term.score, 0),
      matchedTerms: hit.matched.length,
      terms: explained,
      fragment: fragmentOf(hit.doc, explained, docs.length),
    }
  }

  return {
    size: searcher.size,
    doc: (id) => byId.get(id) ?? null,
    search(query, options = {}) {
      const terms = counted(queryTerms(query))
      const hits = searcher.search(query, { limit: options.limit ?? GLASS_DEFAULT_LIMIT })
      const top = hits[0]?.score ?? 0
      return {
        query,
        terms: terms.map(({ term, occurrences }) => ({ term, occurrences, documents: termScores(term).size })),
        total: docs.length,
        results: hits.map((hit, index) => result(hit, index + 1, top, terms)),
      }
    },
  }
}
