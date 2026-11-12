import type { Locale } from '@/lib/i18n/config'
import type { SearchDoc } from '@/lib/search/types'

export const MEANING_MODEL = 'Xenova/multilingual-e5-small'

export const MEANING_DTYPE = 'q8'

export const MEANING_DIMS = 384

export const MEANING_VECTORS_VERSION = 1

export const MEANING_PASSAGE_CHARS = 1600

export const MEANING_LIMIT = 8

export type MeaningVector = { id: string; v: string }

export type MeaningVectors = {
  version: typeof MEANING_VECTORS_VERSION
  lang: Locale
  model: string
  dims: number
  docs: MeaningVector[]
}

export type MeaningHit = { id: string; score: number }

export type MeaningRequest = { type: 'load' } | { type: 'embed'; text: string }

export type MeaningResult = { type: 'loaded'; ms: number } | { type: 'embedded'; vector: Float32Array; ms: number }

export type MeaningProgress = { stage: 'download'; loaded: number; total: number }

export function passageText(doc: Pick<SearchDoc, 'title' | 'keywords' | 'text'>): string {
  const body = [doc.title, doc.keywords, doc.text].filter((part) => part.trim() !== '').join('. ')
  return `passage: ${body.slice(0, MEANING_PASSAGE_CHARS)}`
}

export function queryText(query: string): string {
  return `query: ${query.trim()}`
}

export function quantize(vector: ArrayLike<number>): Int8Array {
  const out = new Int8Array(vector.length)
  for (let index = 0; index < vector.length; index += 1) {
    out[index] = Math.max(-127, Math.min(127, Math.round((vector[index] ?? 0) * 127)))
  }
  return out
}

export function encodeVector(vector: Int8Array): string {
  let binary = ''
  for (const byte of new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength)) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function decodeVector(encoded: string): Int8Array {
  const binary = atob(encoded)
  const out = new Int8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) out[index] = (binary.charCodeAt(index) << 24) >> 24
  return out
}

export function isMeaningVectors(value: unknown): value is MeaningVectors {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<MeaningVectors>
  return (
    candidate.version === MEANING_VECTORS_VERSION &&
    typeof candidate.lang === 'string' &&
    typeof candidate.model === 'string' &&
    typeof candidate.dims === 'number' &&
    Array.isArray(candidate.docs) &&
    candidate.docs.every((doc) => typeof doc?.id === 'string' && typeof doc?.v === 'string')
  )
}

export type DecodedVectors = { lang: Locale; dims: number; docs: Array<{ id: string; vector: Int8Array }> }

export function decodeVectors(vectors: MeaningVectors): DecodedVectors {
  return {
    lang: vectors.lang,
    dims: vectors.dims,
    docs: vectors.docs.map((doc) => ({ id: doc.id, vector: decodeVector(doc.v) })).filter((doc) => doc.vector.length === vectors.dims),
  }
}

export function rankByMeaning(query: ArrayLike<number>, vectors: DecodedVectors, limit = MEANING_LIMIT): MeaningHit[] {
  if (query.length !== vectors.dims) return []
  const hits = vectors.docs.map(({ id, vector }) => {
    let dot = 0
    for (let index = 0; index < vector.length; index += 1) dot += (query[index] ?? 0) * (vector[index] ?? 0)
    return { id, score: dot / 127 }
  })
  return hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit)
}

export type RankShift = { id: string; meaning: number; words: number | null }

export function compareRankings(meaning: readonly MeaningHit[], words: readonly string[]): RankShift[] {
  return meaning.map((hit, index) => {
    const position = words.indexOf(hit.id)
    return { id: hit.id, meaning: index + 1, words: position === -1 ? null : position + 1 }
  })
}
