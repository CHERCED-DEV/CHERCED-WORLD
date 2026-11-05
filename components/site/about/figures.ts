import { formatFact, synergosFacts } from '@/content/synergos'
import type { CareerEntry, Locale, SiteContent, SynergosFacts } from '@/content/types'

export type FigureId = 'years' | 'pieces' | 'adrs' | 'tests'

export type Figure = { id: FigureId; value: number; plus: boolean; since?: number }

export type FigureFacts = Pick<SynergosFacts, 'pieces' | 'adrsAtLeast' | 'testsAtLeast'>

const WEB_ROLE = /front.?end|developer|engineer|architect/i
const MONTH = /^(\d{4})(?:-(\d{2}))?$/

function parseMonth(value: string): { year: number; month: number } | null {
  const match = MONTH.exec(value)
  if (!match) return null
  return { year: Number(match[1]), month: match[2] ? Number(match[2]) : 1 }
}

export function webSince(career: readonly CareerEntry[]): { year: number; month: number } | null {
  const starts = career
    .filter((entry) => WEB_ROLE.test(entry.role.en))
    .map((entry) => parseMonth(entry.start))
    .filter((value): value is { year: number; month: number } => value !== null)
    .sort((a, b) => a.year - b.year || a.month - b.month)
  return starts[0] ?? null
}

export function fullYearsSince(since: { year: number; month: number }, now: Date): { years: number; more: boolean } {
  const months = (now.getUTCFullYear() - since.year) * 12 + (now.getUTCMonth() + 1 - since.month)
  const safe = Math.max(0, months)
  return { years: Math.floor(safe / 12), more: safe % 12 > 0 }
}

export function aboutFigures(about: SiteContent['about'], now: Date, facts: FigureFacts = synergosFacts): Figure[] {
  const figures: Figure[] = []
  const since = webSince(about.career)
  if (since) {
    const { years, more } = fullYearsSince(since, now)
    if (years > 0) figures.push({ id: 'years', value: years, plus: more, since: since.year })
  }
  if (facts.pieces > 0) figures.push({ id: 'pieces', value: facts.pieces, plus: false })
  if (facts.adrsAtLeast > 0) figures.push({ id: 'adrs', value: facts.adrsAtLeast, plus: true })
  if (facts.testsAtLeast > 0) figures.push({ id: 'tests', value: facts.testsAtLeast, plus: true })
  return figures
}

export function figureDigits(value: number, lang: Locale): string {
  return formatFact(value, lang)
}

export function figureText(figure: Pick<Figure, 'value' | 'plus'>, lang: Locale): string {
  return `${figureDigits(figure.value, lang)}${figure.plus ? '+' : ''}`
}
