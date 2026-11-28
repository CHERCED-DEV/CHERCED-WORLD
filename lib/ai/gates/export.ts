import { specToMarkdown } from './markdown'
import { revisionSchema, type GateDecision, type GateLang, type GateRevision, type GateRun } from './schema'
import { standingCounts } from './view'

export const GATES_STATION_ID = 'gates'

export const SPEC_FILE = 'spec.md'

export const REVISION_FILE = 'revision.json'

export const ACTA_NOTE_MAX = 500

const LABELS = {
  es: {
    recommendation: { lista: 'Lista para aprobar', 'con-reservas': 'Con reservas', 'no-lista': 'No lista' },
    decision: { aprobar: 'aprobar', 'pedir-cambios': 'pedir cambios', rechazar: 'rechazar' },
    pending: 'sin decidir',
  },
  en: {
    recommendation: { lista: 'Ready to approve', 'con-reservas': 'With reservations', 'no-lista': 'Not ready' },
    decision: { aprobar: 'approve', 'pedir-cambios': 'request changes', rechazar: 'reject' },
    pending: 'not decided',
  },
} as const

export function specFile(run: Pick<GateRun, 'rounds' | 'request'>): string {
  return specToMarkdown(run.rounds.at(-1)!.spec, run.request.lang)
}

export function buildRevision(run: GateRun, decision: GateDecision): GateRevision {
  const { seal: _seal, ...rest } = run
  return revisionSchema.parse({ ...rest, decision })
}

export function revisionFile(run: GateRun, decision: GateDecision): string {
  return `${JSON.stringify(buildRevision(run, decision), null, 2)}\n`
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

export function actaSummary(input: { lang: GateLang; run: GateRun; decision: GateDecision | null; template: string; stopText: string }): string {
  const labels = LABELS[input.lang]
  const counts = standingCounts(input.run)
  const vars: Record<string, string | number> = {
    request: clip(input.run.request.text, 120),
    recommendation: labels.recommendation[input.run.recommendation],
    stop: clip(input.stopText.replace(/\.$/, ''), 110),
    decision: input.decision ? labels.decision[input.decision.decision] : labels.pending,
    comment: input.decision?.comment ? `: «${clip(input.decision.comment, 90)}»` : '',
    findings: counts.findings,
    knocked: counts.knockedDown,
    usd: input.run.totalUsd.toFixed(4),
  }
  const text = input.template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(vars, key) ? String(vars[key]) : match))
  return clip(text, ACTA_NOTE_MAX)
}

export function appendNote(existing: string | undefined, summary: string): string {
  const base = existing?.trim()
  if (!base) return summary.slice(0, ACTA_NOTE_MAX)
  if (base.includes(summary)) return base.slice(0, ACTA_NOTE_MAX)
  const room = ACTA_NOTE_MAX - summary.length - 2
  return room > 0 ? `${base.slice(0, room).trimEnd()}\n\n${summary}` : summary.slice(0, ACTA_NOTE_MAX)
}
