import { sentences, tokenize } from '@/lib/search/text'
import type { AdrFact, ProjectFact } from '@/lib/search/types'
import { STOPWORDS } from './lexicon'

export const PASSAGE_FIELDS = ['context', 'role', 'decisions', 'adr', 'result'] as const

export type PassageField = (typeof PASSAGE_FIELDS)[number]

export type Passage = {
  project: ProjectFact
  field: PassageField
  index: number
  text: string
  tokens: string[]
}

export type PassageHit = { passage: Passage; matched: string[] }

const MATCH_PRIORITY: Record<PassageField, number> = { decisions: 0, adr: 1, result: 2, context: 3, role: 4 }

const MIN_TERM = 4

const MIN_SHARED = 2

const MAX_PASSAGES = 2

export function similarWord(a: string, b: string): boolean {
  if (a === b) return true
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  if (short.length < MIN_TERM) return false
  let prefix = 0
  while (prefix < short.length && short[prefix] === long[prefix]) prefix++
  return prefix >= MIN_TERM && prefix >= short.length - 2 && long.length - prefix <= 4
}

function significant(tokens: readonly string[]): string[] {
  return [...new Set(tokens.filter((token) => token.length >= MIN_TERM && !STOPWORDS.has(token)))]
}

function passage(project: ProjectFact, field: PassageField, index: number, text: string, words: string = text): Passage {
  return { project, field, index, text, tokens: significant(tokenize(words)) }
}

export function projectPassages(project: ProjectFact, formatAdr: (adr: AdrFact) => string): Passage[] {
  const fields: Array<[Exclude<PassageField, 'adr'>, string | null]> = [
    ['context', project.context],
    ['role', project.role],
    ['decisions', project.decisions],
    ['result', project.result],
  ]
  const list: Passage[] = []
  for (const [field, value] of fields) {
    if (!value) continue
    sentences(value).forEach((sentence, index) => list.push(passage(project, field, index, sentence)))
  }
  project.adrs.forEach((adr, index) =>
    list.push(passage(project, 'adr', index, formatAdr(adr), [adr.decision, adr.why, adr.tradeoff].join(' '))),
  )
  return list
}

export function matchTerms(terms: readonly string[], tokens: readonly string[]): string[] {
  return terms.filter((term) => tokens.some((token) => similarWord(term, token)))
}

const RARE_IN_CASE = 2

function contains(item: Passage, token: string): boolean {
  return item.tokens.some((other) => similarWord(token, other))
}

function sharedRare(a: Passage, b: Passage, own: readonly Passage[]): number {
  return a.tokens.filter((token) => contains(b, token) && own.filter((item) => contains(item, token)).length <= RARE_IN_CASE).length
}

function byRelevance(a: PassageHit, b: PassageHit): number {
  return (
    b.matched.length - a.matched.length ||
    MATCH_PRIORITY[a.passage.field] - MATCH_PRIORITY[b.passage.field] ||
    a.passage.index - b.passage.index
  )
}

function inReadingOrder(a: Passage, b: Passage): number {
  return PASSAGE_FIELDS.indexOf(a.field) - PASSAGE_FIELDS.indexOf(b.field) || a.index - b.index
}

export function rankPassages(terms: readonly string[], passages: readonly Passage[]): PassageHit[] {
  return passages
    .map((item) => ({ passage: item, matched: matchTerms(terms, item.tokens) }))
    .filter((hit) => hit.matched.length > 0)
    .sort(byRelevance)
}

export function pickPassages(best: PassageHit, hits: readonly PassageHit[], passages: readonly Passage[]): Passage[] {
  const top = best.passage
  const own = passages.filter((item) => item.project.id === top.project.id)
  const chosen = [top]
  if (top.field === 'context') {
    const answer = own.find((item) => item.field === 'decisions')
    if (answer) chosen.push(answer)
  } else {
    const sameCase = hits.filter((hit) => hit.passage !== top && hit.passage.project.id === top.project.id)
    const related =
      sameCase.find((hit) => hit.matched.length === best.matched.length)?.passage ??
      [...sameCase.map((hit) => hit.passage), ...own.filter((item) => item.field === 'adr')].find(
        (item) => item !== top && sharedRare(top, item, own) >= MIN_SHARED,
      )
    if (related) chosen.push(related)
  }
  return chosen.slice(0, MAX_PASSAGES).sort(inReadingOrder)
}
