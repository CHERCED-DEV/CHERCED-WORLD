import { z } from 'zod'

export const GATES_HISTORY_MAX = 10

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const seededSchema = z.object({
  defects: z.number().int().min(0),
  found: z.number().int().min(0),
  rate: z.number().min(0).max(1),
  missed: z.array(z.object({ caseId: z.string(), criterion: z.string(), where: z.string() })),
})

export const gatesEvalRunSchema = z.object({
  id: z.string().min(1),
  at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'fecha inválida'),
  battery: z.string().min(1),
  rubricVersion: z.string().min(1),
  simulated: z.boolean(),
  providers: z.array(z.enum(['gemini', 'claude', 'openai'])),
  pricesCheckedAt: z.object({ gemini: day, claude: day, openai: day }),
  seeded: seededSchema,
  clean: z.object({ specs: z.number().int().min(0), falseBlockers: z.number().int().min(0), byCase: z.array(z.object({ caseId: z.string(), blockers: z.number().int().min(0) })) }),
  falseFindings: z.object({ planted: z.number().int().min(0), knockedDown: z.number().int().min(0), rate: z.number().min(0).max(1), standing: z.array(z.string()) }),
  injection: z.object({ cases: z.number().int().min(0), failed: z.number().int().min(0), failures: z.array(z.string()) }),
  notSoftware: z.object({ cases: z.number().int().min(0), passed: z.number().int().min(0), failures: z.array(z.string()) }),
  pass: z.boolean(),
  costUsd: z.number().min(0),
  costCop: z.number().int().min(0),
})

export type GatesEvalRun = z.infer<typeof gatesEvalRunSchema>

export const gatesResultsSchema = z.object({ runs: z.array(gatesEvalRunSchema).max(GATES_HISTORY_MAX) })

export type GatesResults = z.infer<typeof gatesResultsSchema>

export function addGatesRun(results: GatesResults, run: GatesEvalRun): GatesResults {
  return { runs: [run, ...results.runs].slice(0, GATES_HISTORY_MAX) }
}

export function latestGatesRun(results: GatesResults): GatesEvalRun | null {
  return [...results.runs].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] ?? null
}
