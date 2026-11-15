import { EVAL_KINDS, type EvalCase, type EvalKind, type EvalMatcher } from '@/content/ailab/evals/battery'

export type EvalToolCall = { name: string; args: Record<string, unknown> }

export type EvalAnswer = { text: string; tools: readonly EvalToolCall[]; latencyMs: number; costUsd: number }

export type EvalGrade = { pass: boolean; reasons: string[] }

export type EvalFailure = { caseId: string; kind: EvalKind; question: string; answer: string; reasons: string[] }

export type EvalRun = {
  id: string
  at: string
  model: string
  instructionHash: string
  totals: { cases: number; passed: number }
  byKind: Record<EvalKind, { total: number; passed: number }>
  latency: { p50: number; p95: number }
  costUsd: number
  failures: EvalFailure[]
}

export type EvalResults = { runs: EvalRun[] }

export const EVAL_ANSWER_CLIP = 220

export const EVAL_HISTORY_MAX = 20

function matches(matcher: EvalMatcher, text: string): boolean {
  return typeof matcher === 'string' ? text.toLowerCase().includes(matcher.toLowerCase()) : matcher.test(text)
}

function label(matcher: EvalMatcher): string {
  return typeof matcher === 'string' ? `"${matcher}"` : String(matcher)
}

export function gradeAnswer(item: EvalCase, answer: Pick<EvalAnswer, 'text' | 'tools'>): EvalGrade {
  const reasons: string[] = []
  const text = answer.text.trim()
  const { all, any, none, tool, minChars } = item.expect
  for (const matcher of all ?? []) if (!matches(matcher, text)) reasons.push(`falta ${label(matcher)}`)
  if (any?.length && !any.some((matcher) => matches(matcher, text))) reasons.push(`no trae ninguno de ${any.map(label).join(', ')}`)
  for (const matcher of none ?? []) if (matches(matcher, text)) reasons.push(`no debía decir ${label(matcher)}`)
  if (minChars && text.length < minChars) reasons.push(`respuesta de ${text.length} caracteres, se esperaban ${minChars} o más`)
  if (tool) {
    const called = answer.tools.filter((call) => call.name === tool.name)
    if (called.length === 0) reasons.push(`no llamó a ${tool.name}`)
    else if (tool.path && !called.some((call) => call.args.ruta === tool.path)) reasons.push(`${tool.name} no fue a ${tool.path}`)
  }
  return { pass: reasons.length === 0, reasons }
}

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return Math.round(sorted[index]!)
}

export function clipAnswer(text: string, max = EVAL_ANSWER_CLIP): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

export function summarizeRun(
  meta: { id: string; at: string; model: string; instructionHash: string },
  results: ReadonlyArray<{ item: EvalCase; answer: EvalAnswer; grade: EvalGrade }>,
): EvalRun {
  const byKind = Object.fromEntries(EVAL_KINDS.map((kind) => [kind, { total: 0, passed: 0 }])) as EvalRun['byKind']
  for (const { item, grade } of results) {
    byKind[item.kind].total += 1
    if (grade.pass) byKind[item.kind].passed += 1
  }
  const latencies = results.map(({ answer }) => answer.latencyMs)
  return {
    ...meta,
    totals: { cases: results.length, passed: results.filter(({ grade }) => grade.pass).length },
    byKind,
    latency: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
    costUsd: Number(results.reduce((sum, { answer }) => sum + answer.costUsd, 0).toFixed(6)),
    failures: results
      .filter(({ grade }) => !grade.pass)
      .map(({ item, answer, grade }) => ({ caseId: item.id, kind: item.kind, question: item.question, answer: clipAnswer(answer.text), reasons: grade.reasons })),
  }
}

export function addRun(results: EvalResults, run: EvalRun): EvalResults {
  return { runs: [run, ...results.runs].slice(0, EVAL_HISTORY_MAX) }
}

export function refusalFailures(run: EvalRun | undefined): number {
  return run ? run.byKind.refusal.total - run.byKind.refusal.passed : 0
}
