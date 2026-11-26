import { z } from 'zod'
import { EVAL_KINDS, type EvalKind } from '@/content/ailab/evals/battery'
import type { EvalResults, EvalRun } from '@/lib/ai/evals/grade'

const tally = z.object({ total: z.number().int().nonnegative(), passed: z.number().int().nonnegative() }).refine((value) => value.passed <= value.total, 'más aprobadas que casos')

const byKind = z.object(Object.fromEntries(EVAL_KINDS.map((kind) => [kind, tally])) as Record<EvalKind, typeof tally>)

const runSchema = z
  .object({
    id: z.string().min(1),
    at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'fecha inválida'),
    model: z.string().min(1),
    instructionHash: z.string().min(1),
    totals: z
      .object({ cases: z.number().int().nonnegative(), passed: z.number().int().nonnegative() })
      .refine((value) => value.passed <= value.cases, 'más aprobadas que casos'),
    byKind,
    latency: z.object({ p50: z.number().nonnegative(), p95: z.number().nonnegative() }),
    costUsd: z.number().nonnegative(),
    failures: z.array(
      z.object({ caseId: z.string(), kind: z.enum(EVAL_KINDS), question: z.string(), answer: z.string(), reasons: z.array(z.string()) }),
    ),
  })
  .refine((run) => run.latency.p50 <= run.latency.p95, 'p50 mayor que p95')

export const evalResultsSchema = z.object({ runs: z.array(runSchema) })

export type EvalResultsCheck = { ok: true; results: EvalResults } | { ok: false; reason: string }

export function checkEvalResults(value: unknown): EvalResultsCheck {
  const parsed = evalResultsSchema.safeParse(value)
  if (parsed.success) return { ok: true, results: parsed.data satisfies EvalResults }
  const issue = parsed.error.issues[0]
  return { ok: false, reason: issue ? `${issue.path.join('.') || 'raíz'}: ${issue.message}` : 'no cumple el esquema' }
}

export function latestRun(results: EvalResults): EvalRun | null {
  return [...results.runs].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] ?? null
}
