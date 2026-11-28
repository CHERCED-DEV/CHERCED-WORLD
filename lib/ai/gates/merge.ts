import type { PaidProviderId, ProviderId } from '@/lib/ai/providers/types'
import { specPlaces } from './markdown'
import type { FindingReporter, GateNote, GateRoundNumber, Gravity, MergedFinding, ReviewFinding, RubricCriterion, SpecBreve } from './schema'

export const GRAVITY_RANK: Readonly<Record<Gravity, number>> = { bloqueante: 0, importante: 1, menor: 2 }

export type ReviewBatch = { seat: PaidProviderId; provider: ProviderId; findings: readonly ReviewFinding[] }

export type DeterministicFinding = { rule: string; criterion: RubricCriterion; gravity: Gravity; where: string; problem: string; fix: string }

export type MergeInput = {
  round: GateRoundNumber
  spec: SpecBreve
  deterministic: readonly DeterministicFinding[]
  reviews: readonly ReviewBatch[]
  changed: readonly string[] | null
  previous: readonly MergedFinding[] | null
}

export type MergeResult = { findings: MergedFinding[]; notes: GateNote[] }

const FIXED_PLACES = ['title', 'problem', 'includes', 'excludes']

export function placeOrder(where: string): number {
  const fixed = FIXED_PLACES.indexOf(where)
  if (fixed >= 0) return fixed
  const match = /^([RCQ])-(\d{1,2})$/.exec(where)
  if (!match) return 1000
  return ({ R: 100, C: 200, Q: 300 } as const)[match[1] as 'R' | 'C' | 'Q'] + Number(match[2])
}

function keyOf(criterion: RubricCriterion, where: string): string {
  return `${criterion}|${where}`
}

function strongest<T extends { gravity: Gravity; confidence: number }>(items: readonly T[]): T {
  return [...items].sort((a, b) => GRAVITY_RANK[a.gravity] - GRAVITY_RANK[b.gravity] || b.confidence - a.confidence)[0]!
}

function reviewerGroups(reviews: readonly ReviewBatch[], places: ReadonlySet<string>, changed: ReadonlySet<string> | null, round: GateRoundNumber, notes: GateNote[]) {
  const groups = new Map<string, { criterion: RubricCriterion; where: string; reporters: FindingReporter[] }>()
  for (const review of reviews) {
    for (const item of review.findings) {
      if (!places.has(item.where)) {
        notes.push({ round, kind: 'lugar-inexistente', seat: review.seat, where: item.where, detail: null })
        continue
      }
      if (changed && !changed.has(item.where)) {
        notes.push({ round, kind: 'fuera-de-cambio', seat: review.seat, where: item.where, detail: null })
        continue
      }
      const key = keyOf(item.criterion, item.where)
      const group = groups.get(key) ?? { criterion: item.criterion, where: item.where, reporters: [] }
      group.reporters.push({ seat: review.seat, provider: review.provider, gravity: item.gravity, confidence: item.confidence, problem: item.problem, fix: item.fix })
      groups.set(key, group)
    }
  }
  return [...groups.values()]
}

function reviewerFinding(group: { criterion: RubricCriterion; where: string; reporters: FindingReporter[] }): MergedFinding {
  const lead = strongest(group.reporters)
  return {
    id: 'H-0',
    criterion: group.criterion,
    gravity: lead.gravity,
    where: group.where,
    problem: lead.problem,
    fix: lead.fix,
    confidence: Math.max(...group.reporters.map((reporter) => reporter.confidence)),
    origin: 'revisor',
    rules: [],
    reporters: group.reporters,
    seenByBoth: new Set(group.reporters.map((reporter) => reporter.seat)).size >= 2,
    verification: null,
    carried: false,
  }
}

function deterministicFindings(items: readonly DeterministicFinding[]): MergedFinding[] {
  const groups = new Map<string, DeterministicFinding[]>()
  for (const item of items) groups.set(keyOf(item.criterion, item.where), [...(groups.get(keyOf(item.criterion, item.where)) ?? []), item])
  return [...groups.values()].map((group) => {
    const lead = [...group].sort((a, b) => GRAVITY_RANK[a.gravity] - GRAVITY_RANK[b.gravity])[0]!
    return {
      id: 'H-0',
      criterion: lead.criterion,
      gravity: lead.gravity,
      where: lead.where,
      problem: [...new Set(group.map((item) => item.problem))].join(' ').slice(0, 600),
      fix: lead.fix.slice(0, 600),
      confidence: 1,
      origin: 'determinista',
      rules: [...new Set(group.map((item) => item.rule))],
      reporters: [],
      seenByBoth: false,
      verification: null,
      carried: false,
    }
  })
}

function carriedFindings(previous: readonly MergedFinding[] | null, places: ReadonlySet<string>, changed: ReadonlySet<string> | null): MergedFinding[] {
  if (!previous || !changed) return []
  return previous
    .filter((item) => item.origin === 'revisor' && item.verification?.result !== 'se-cae' && places.has(item.where) && !changed.has(item.where))
    .map((item) => ({ ...item, carried: true }))
}

export function sortFindings(findings: readonly MergedFinding[]): MergedFinding[] {
  return [...findings].sort(
    (a, b) =>
      GRAVITY_RANK[a.gravity] - GRAVITY_RANK[b.gravity] ||
      Number(a.origin === 'revisor') - Number(b.origin === 'revisor') ||
      placeOrder(a.where) - placeOrder(b.where) ||
      a.criterion.localeCompare(b.criterion),
  )
}

export function mergeFindings(input: MergeInput): MergeResult {
  const notes: GateNote[] = []
  const places = specPlaces(input.spec)
  const changed = input.changed ? new Set(input.changed) : null
  const merged = [
    ...deterministicFindings(input.deterministic.filter((item) => places.has(item.where))),
    ...reviewerGroups(input.reviews, places, changed, input.round, notes).map(reviewerFinding),
    ...carriedFindings(input.previous, places, changed),
  ]
  const findings = sortFindings(merged).map((item, index) => ({ ...item, id: `H-${index + 1}` }))
  return { findings, notes }
}

export function counted(findings: readonly MergedFinding[]): MergedFinding[] {
  return findings.filter((item) => item.verification?.result !== 'se-cae')
}

export function blockers(findings: readonly MergedFinding[]): number {
  return counted(findings).filter((item) => item.gravity === 'bloqueante').length
}

export function toFix(findings: readonly MergedFinding[]): MergedFinding[] {
  return counted(findings).filter((item) => item.gravity !== 'menor')
}

export function minors(findings: readonly MergedFinding[]): MergedFinding[] {
  return counted(findings).filter((item) => item.gravity === 'menor')
}
