import type { Locale } from '@/lib/i18n/config'
import { fold, tokenize } from '@/lib/search/text'
import { ABBREVIATIONS, ENGLISH_MARKERS, PHRASES, SPANISH_MARKERS, STOPWORDS } from './lexicon'

export const MAX_QUESTION_LENGTH = 500

export type NormalizedQuestion = {
  raw: string
  folded: string
  text: string
  tokens: string[]
  content: string[]
  spanishMarks: boolean
}

export function normalizeQuestion(input: string): NormalizedQuestion {
  const raw = input.slice(0, MAX_QUESTION_LENGTH).trim()
  const folded = fold(raw)
  let text = tokenize(raw)
    .map((token) => ABBREVIATIONS[token] ?? token)
    .join(' ')
  for (const [pattern, replacement] of PHRASES) text = text.replace(pattern, replacement)
  const tokens = text.split(' ').filter((token) => token.length > 0)
  const content = tokens.filter((token) => token.length > 1 && !STOPWORDS.has(token))
  return { raw, folded, text, tokens, content, spanishMarks: /[¿¡ñáéíóú]/i.test(raw) }
}

export function detectLanguage(question: string | NormalizedQuestion, fallback: Locale): Locale {
  const normalized = typeof question === 'string' ? normalizeQuestion(question) : question
  let es = normalized.spanishMarks ? 2 : 0
  let en = 0
  for (const token of normalized.tokens) {
    if (SPANISH_MARKERS.has(token)) es += 1
    if (ENGLISH_MARKERS.has(token)) en += 1
  }
  if (es > en) return 'es'
  if (en > es) return 'en'
  return fallback
}

export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i < rows; i++) {
    let rowMin = Number.POSITIVE_INFINITY
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, matrix[i - 2][j - 2] + 1)
      }
      matrix[i][j] = value
      rowMin = Math.min(rowMin, value)
    }
    if (rowMin > max) return max + 1
  }
  return matrix[a.length][b.length]
}

export function allowedTypos(word: string): number {
  if (word.length >= 9) return 2
  if (word.length >= 5) return 1
  return 0
}

export function closeTo(token: string, word: string): boolean {
  if (token === word) return true
  const budget = Math.min(allowedTypos(token), allowedTypos(word))
  return budget > 0 && editDistance(token, word, budget) <= budget
}
