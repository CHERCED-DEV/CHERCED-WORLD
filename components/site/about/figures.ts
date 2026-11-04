import type { CareerEntry, SiteContent } from '@/content/types'

export type FigureId = 'years' | 'projects' | 'technologies' | 'airlines'

export type Figure = { id: FigureId; value: number; plus: boolean; since?: number }

const WEB_ROLE = /front.?end|developer|engineer|architect/i
const AIRLINES = /\b(\d+)\+\s+(?:international\s+)?airlines\b/i
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

export function airlinesFromCareer(career: readonly CareerEntry[]): number | null {
  const counts = career.flatMap((entry) => {
    const match = AIRLINES.exec(entry.description.en)
    return match ? [Number(match[1])] : []
  })
  return counts.length > 0 ? Math.max(...counts) : null
}

export function mapSkillCount(about: SiteContent['about']): number {
  const ids = new Set((about.skills.lobes ?? []).flatMap((lobe) => lobe.skills))
  return ids.size > 0 ? ids.size : about.skills.tech.length
}

export function aboutFigures(about: SiteContent['about'], projectCount: number, now: Date): Figure[] {
  const figures: Figure[] = []
  const since = webSince(about.career)
  if (since) {
    const { years, more } = fullYearsSince(since, now)
    if (years > 0) figures.push({ id: 'years', value: years, plus: more, since: since.year })
  }
  if (projectCount > 0) figures.push({ id: 'projects', value: projectCount, plus: false })
  const skills = mapSkillCount(about)
  if (skills > 0) figures.push({ id: 'technologies', value: skills, plus: false })
  const airlines = airlinesFromCareer(about.career)
  if (airlines !== null) figures.push({ id: 'airlines', value: airlines, plus: true })
  return figures
}
