import type { GateLang, SpecBreve } from './schema'

const HEADINGS = {
  es: { problem: 'Problema', includes: 'Incluye', excludes: 'No incluye', requirements: 'Requisitos', criteria: 'Criterios', questions: 'Preguntas' },
  en: { problem: 'Problem', includes: 'Includes', excludes: 'Does not include', requirements: 'Requirements', criteria: 'Criteria', questions: 'Questions' },
} as const

const CLAUSES = {
  es: { covers: 'cubre', given: 'Dado', when: 'cuando', then: 'entonces', byDefault: 'Por defecto' },
  en: { covers: 'covers', given: 'Given', when: 'when', then: 'then', byDefault: 'Default' },
} as const

export type SpecMarkdown = { text: string; places: ReadonlyMap<number, string> }

function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function lowerFirst(text: string): string {
  const clean = oneLine(text)
  return clean.charAt(0).toLocaleLowerCase() + clean.slice(1)
}

function withoutEnd(text: string): string {
  return oneLine(text).replace(/[.;,]+$/, '')
}

export function specMarkdown(spec: SpecBreve, lang: GateLang): SpecMarkdown {
  const heading = HEADINGS[lang]
  const clause = CLAUSES[lang]
  const lines: string[] = []
  const places = new Map<number, string>()
  const push = (line: string, place: string | null) => {
    lines.push(line)
    if (place) places.set(lines.length, place)
  }
  push(`# ${oneLine(spec.title)}`, 'title')
  push('', null)
  push(`## ${heading.problem}`, 'problem')
  push('', 'problem')
  push(oneLine(spec.problem), 'problem')
  push('', null)
  push(`## ${heading.includes}`, 'includes')
  push('', 'includes')
  for (const item of spec.includes) push(`- ${oneLine(item)}`, 'includes')
  push('', null)
  push(`## ${heading.excludes}`, 'excludes')
  push('', 'excludes')
  for (const item of spec.excludes) push(`- ${oneLine(item)}`, 'excludes')
  push('', null)
  push(`## ${heading.requirements}`, null)
  push('', null)
  for (const item of spec.requirements) push(`- **${item.id}**: ${oneLine(item.text)}`, item.id)
  push('', null)
  push(`## ${heading.criteria}`, null)
  push('', null)
  for (const item of spec.criteria) {
    push(`- **${item.id}** (${clause.covers} ${item.covers.join(', ')}): ${clause.given} ${lowerFirst(withoutEnd(item.given))}, ${clause.when} ${lowerFirst(withoutEnd(item.when))}, ${clause.then} ${lowerFirst(withoutEnd(item.then))}.`, item.id)
  }
  if (spec.questions.length) {
    push('', null)
    push(`## ${heading.questions}`, null)
    push('', null)
    for (const item of spec.questions) {
      const byDefault = oneLine(item.byDefault)
      push(`- **${item.id}**: ${oneLine(item.question)}${byDefault ? ` ${clause.byDefault}: ${byDefault}` : ''}`, item.id)
    }
  }
  return { text: `${lines.join('\n')}\n`, places }
}

export function specToMarkdown(spec: SpecBreve, lang: GateLang): string {
  return specMarkdown(spec, lang).text
}

export function placeAt(markdown: SpecMarkdown, line: number): string | null {
  return markdown.places.get(line) ?? null
}

export function specPlaces(spec: SpecBreve): Set<string> {
  return new Set<string>(['title', 'problem', 'includes', 'excludes', ...spec.requirements.map((item) => item.id), ...spec.criteria.map((item) => item.id), ...spec.questions.map((item) => item.id)])
}

export function placeContent(spec: SpecBreve, place: string): string | null {
  if (place === 'title') return spec.title
  if (place === 'problem') return spec.problem
  if (place === 'includes') return JSON.stringify(spec.includes)
  if (place === 'excludes') return JSON.stringify(spec.excludes)
  const item = [...spec.requirements, ...spec.criteria, ...spec.questions].find((entry) => entry.id === place)
  return item ? JSON.stringify(item) : null
}

export function changedPlaces(before: SpecBreve, after: SpecBreve): string[] {
  const places = specPlaces(after)
  return [...places].filter((place) => placeContent(before, place) !== placeContent(after, place))
}
