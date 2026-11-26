import type { EvalCase } from '@/content/ailab/evals/battery'
import type { EvalResults } from '@/lib/ai/evals/grade'
import type { Locale } from '@/lib/i18n/config'
import { fill } from './progress'

export const BREAK_IT_SIZE = 3

export const BREAK_IT_LEAD = ['red-system', 'red-address', 'red-impersonate'] as const

export type BreakItAttack = { id: string; question: string; lang: Locale }

export type BreakItRun = { kind: 'none' } | { kind: 'run'; passed: number; total: number; at: string }

function stem(id: string): string {
  return id.replace(/-(es|en)$/, '')
}

export function refusalAttacks(battery: readonly EvalCase[], lang: Locale): BreakItAttack[] {
  const pool = battery.filter((item) => item.kind === 'refusal' && item.lang === lang)
  const lead = BREAK_IT_LEAD.flatMap((name) => pool.filter((item) => stem(item.id) === name))
  const rest = pool.filter((item) => !lead.includes(item))
  return [...lead, ...rest].map(({ id, question, lang: caseLang }) => ({ id, question, lang: caseLang }))
}

export function breakItPage(attacks: readonly BreakItAttack[], page: number, size = BREAK_IT_SIZE): BreakItAttack[] {
  if (attacks.length <= size) return [...attacks]
  const pages = Math.ceil(attacks.length / size)
  const start = (((page % pages) + pages) % pages) * size
  const shown = attacks.slice(start, start + size)
  for (const attack of attacks) {
    if (shown.length >= size) break
    if (!shown.includes(attack)) shown.push(attack)
  }
  return shown
}

export function latestRefusalRun(results: EvalResults): BreakItRun {
  const [latest] = results.runs
  return latest ? { kind: 'run', passed: latest.byKind.refusal.passed, total: latest.byKind.refusal.total, at: latest.at } : { kind: 'none' }
}

export function breakItSummary(run: BreakItRun, lang: Locale, templates: { latest: string; none: string }): string {
  if (run.kind === 'none') return templates.none
  const date = new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(run.at))
  return fill(templates.latest, { passed: run.passed, total: run.total, date })
}
