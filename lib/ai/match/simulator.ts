import { createGlassBox, isIndexedDoc, type GlassBox, type GlassResult } from '@/lib/ailab/search/glassbox'
import type { Locale } from '@/lib/i18n/config'
import type { SearchIndex } from '@/lib/search/types'
import {
  coverageOf,
  MATCH_MAX_EVIDENCE,
  MATCH_QUESTIONS,
  MATCH_ROLE_MAX,
  MATCH_TEXT_MAX,
  type MatchEvidence,
  type MatchKind,
  type MatchLevel,
  type MatchRequirement,
  type MatchResult,
} from './config'

export const SIMULATED_MAX_REQUIREMENTS = 12

const BULLET = /^(?:[-*•·▪◦–—]|\d{1,2}[.)])\s+/

const WANTED = /\b(deseables?|valorables?|valoramos|se valora|plus|nice to have|bonus|preferred|preferibl\w*|ideal(?:mente)?|deseamos)\b/i

const NEEDED = /\b(requisitos|requerimientos|imprescindible|indispensable|obligatori\w*|requirements|must have|must-have|required|qualifications|buscamos|what you bring|lo que buscamos)\b/i

const STRONG_KINDS = new Set(['project', 'post', 'section'])

const SPANISH = /\b(de|la|que|el|en|y|los|las|con|para|del|experiencia|años|conocimientos)\b/gi

const ENGLISH = /\b(the|and|of|to|with|for|in|experience|years|knowledge|you|we)\b/gi

export type DraftRequirement = { text: string; kind: MatchKind }

function words(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

export function vacancyLanguage(vacancy: string): Locale {
  const spanish = vacancy.match(SPANISH)?.length ?? 0
  const english = vacancy.match(ENGLISH)?.length ?? 0
  return english > spanish ? 'en' : 'es'
}

function isHeader(line: string): boolean {
  return !BULLET.test(line) && (line.endsWith(':') || words(line) <= 5)
}

export function vacancyRole(vacancy: string): string {
  const first = vacancy
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  return clip((first ?? '').replace(BULLET, '').replace(/[:.]$/, ''), MATCH_ROLE_MAX)
}

export function splitRequirements(vacancy: string): DraftRequirement[] {
  const lines = vacancy
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const bullets = lines.filter((line) => BULLET.test(line))
  const drafts: DraftRequirement[] = []
  const seen = new Set<string>()
  const push = (raw: string, kind: MatchKind) => {
    const text = clip(raw.replace(BULLET, '').replace(/[.;]+$/, ''), MATCH_TEXT_MAX)
    const key = text.toLowerCase()
    const size = words(text)
    if (size < 2 || size > 40 || seen.has(key)) return
    seen.add(key)
    drafts.push({ text, kind: WANTED.test(text) ? 'deseable' : kind })
  }
  if (bullets.length >= 2) {
    let section: MatchKind = 'obligatorio'
    for (const line of lines) {
      if (isHeader(line)) {
        if (WANTED.test(line)) section = 'deseable'
        else if (NEEDED.test(line)) section = 'obligatorio'
        continue
      }
      if (BULLET.test(line)) push(line, section)
    }
  } else {
    for (const sentence of lines.slice(1).join(' ').split(/(?<=[.;!?])\s+/)) push(sentence, 'obligatorio')
  }
  return drafts.slice(0, SIMULATED_MAX_REQUIREMENTS)
}

type Judged = { level: MatchLevel; evidence: MatchEvidence[] }

const GENERIC = new Set(
  (
    'experiencia experiencias experience experienced años ano anos year years conocimiento conocimientos knowledge manejo uso use using ' +
    'dominio solido solida solid strong fuerte avanzado avanzada advanced demostrable proven minimo minima minimum mas more plus ' +
    'trabajo trabajar work working equipo equipos team teams capacidad ability habilidad habilidades skills nivel level ' +
    'produccion production entornos entorno environment environments diseñando diseñar designing design construyendo construir building build ' +
    'desarrollando desarrollar developing aplicaciones aplicacion applications application apps app sistemas systems proyectos projects ' +
    'herramientas tools tecnologias technologies buenas practicas good practices ser debe must should puede can tener have having ' +
    'deseable deseables valorable nice bonus requisito requisitos requirement requirements ' +
    'de la el los las un una unos unas y o u e en con para por del al a que se su sus como sobre entre sin tu tus mi mis lo le les es son ' +
    'the an and or of to in on with for by as at from your our is are be this that into'
  ).split(' '),
)

export function meaningfulQuery(text: string): string {
  return text
    .split(/[^\p{L}\p{N}.+#]+/u)
    .map((word) => word.replace(/^[.]+|[.]+$/g, ''))
    .filter((word) => word.length > 1 && /\p{L}/u.test(word))
    .filter((word) => !GENERIC.has(word.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n')) && !GENERIC.has(word.toLowerCase()))
    .join(' ')
}

export function judgeRequirement(box: GlassBox, text: string): Judged {
  const query = meaningfulQuery(text)
  if (!query) return { level: 'sin_evidencia', evidence: [] }
  const search = box.search(query, { limit: 4 })
  const terms = Math.max(1, search.terms.length)
  const needed = terms <= 2 ? 1 : 0.5
  const solid = (result: GlassResult) =>
    result.terms.filter((term) => term.matches.some((match) => match.kind !== 'fuzzy' || (term.term.length >= 5 && match.word.startsWith(term.term.slice(0, 5))))).length /
    terms
  const hits = search.results.filter((result) => isIndexedDoc(result.doc))
  const passing = hits.filter((result) => result.score >= 3 && solid(result) >= needed)
  const evidence = passing.slice(0, MATCH_MAX_EVIDENCE).map((result) => ({ id: result.doc.id, title: result.doc.title, url: result.doc.url, kind: result.doc.kind }))
  if (evidence.length === 0) {
    const near = hits.find((result) => result.score >= 3 && solid(result) >= 0.5)
    return near ? { level: 'parcial', evidence: [{ id: near.doc.id, title: near.doc.title, url: near.doc.url, kind: near.doc.kind }] } : { level: 'sin_evidencia', evidence: [] }
  }
  const strong = passing.some((result) => STRONG_KINDS.has(result.doc.kind) && result.score >= 6 && solid(result) >= Math.max(needed, 0.6))
  return { level: strong ? 'fuerte' : 'parcial', evidence }
}

const NOTES: Record<Locale, Record<MatchLevel, string>> = {
  es: {
    fuerte: 'Aparece en {title}.',
    parcial: 'Hay relación parcial en {title}.',
    sin_evidencia: 'No encontré evidencia publicada en el sitio.',
  },
  en: {
    fuerte: 'It shows up in {title}.',
    parcial: 'There is a partial match in {title}.',
    sin_evidencia: 'I found no published evidence on the site.',
  },
}

const QUESTIONS: Record<Locale, { gap: string; partial: string; deep: string }> = {
  es: {
    gap: 'Cuéntame de un caso real en el que hayas trabajado con: {text}.',
    partial: '¿Hasta dónde llegaste con {text}? Dame un ejemplo concreto.',
    deep: '¿Cuál fue la decisión más difícil en {text} y qué sacrificaste?',
  },
  en: {
    gap: 'Tell me about a real case where you worked with: {text}.',
    partial: 'How far did you go with {text}? Give me a concrete example.',
    deep: 'What was the hardest decision in {text} and what did you give up?',
  },
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match)
}

export function simulateMatch(vacancy: string, index: SearchIndex): MatchResult {
  const lang = vacancyLanguage(vacancy)
  const box = createGlassBox(index)
  const requirements: MatchRequirement[] = splitRequirements(vacancy).map((draft) => {
    const judged = judgeRequirement(box, draft.text)
    const title = judged.evidence[0]?.title ?? ''
    return { ...draft, ...judged, note: fill(NOTES[lang][judged.level], { title }) }
  })
  const questions: string[] = []
  for (const item of requirements.filter((entry) => entry.level === 'sin_evidencia')) questions.push(fill(QUESTIONS[lang].gap, { text: item.text }))
  for (const item of requirements.filter((entry) => entry.level === 'parcial')) questions.push(fill(QUESTIONS[lang].partial, { text: item.text }))
  for (const item of requirements.filter((entry) => entry.level === 'fuerte' && entry.evidence[0]?.kind === 'project')) {
    questions.push(fill(QUESTIONS[lang].deep, { text: item.evidence[0]!.title }))
  }
  return {
    mode: 'local',
    role: vacancyRole(vacancy),
    requirements,
    questions: [...new Set(questions)].slice(0, MATCH_QUESTIONS),
    coverage: coverageOf(requirements),
    dropped: 0,
    costUsd: 0,
  }
}
