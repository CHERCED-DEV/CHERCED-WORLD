import { z } from 'zod'
import { ARENA_KINDS } from './tasks'

export const ARENA_HISTORY_MAX = 10

export const ARENA_RUN_MODES = ['pregenerada', 'vivo'] as const

export type ArenaRunMode = (typeof ARENA_RUN_MODES)[number]

export const ARENA_COLUMN_STATUSES = ['ok', 'error', 'inactive'] as const

const paid = z.enum(['gemini', 'claude', 'openai'])

const provider = z.enum(['gemini', 'claude', 'openai', 'simulator'])

const usage = z.object({ inputTokens: z.number().int().min(0), outputTokens: z.number().int().min(0) })

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const arenaAttemptSchema = z.object({
  provider,
  requestedModel: z.string(),
  model: z.string().nullable(),
  outcome: z.enum(['ok', 'error', 'refusal', 'invalid', 'skipped']),
  reason: z.string().max(200).nullable(),
  latencyMs: z.number().min(0),
  usage: usage.nullable(),
  costUsd: z.number().min(0),
})

export const arenaJudgeSchema = z.object({
  provider,
  model: z.string(),
  score: z.number().int().min(0).max(3),
  reason: z.string().max(200),
  costUsd: z.number().min(0),
})

export const arenaColumnSchema = z.object({
  provider: paid,
  status: z.enum(ARENA_COLUMN_STATUSES),
  servedBy: provider.nullable(),
  requestedModel: z.string(),
  model: z.string().nullable(),
  data: z.unknown().nullable(),
  latencyMs: z.number().min(0),
  usage: usage.nullable(),
  costUsd: z.number().min(0),
  truncated: z.boolean(),
  reason: z.string().max(200).nullable(),
  attempts: z.array(arenaAttemptSchema),
  rules: z.object({ pass: z.boolean(), reasons: z.array(z.string()) }).nullable(),
  judge: arenaJudgeSchema.nullable(),
  judgeError: z.string().max(200).nullable(),
})

export const arenaCaseSchema = z
  .object({
    taskId: z.string().nullable(),
    kind: z.enum(ARENA_KINDS).nullable(),
    lang: z.enum(['es', 'en']),
    columns: z.array(arenaColumnSchema).length(3),
  })
  .superRefine((value, ctx) => {
    const providers = value.columns.map((column) => column.provider)
    if (new Set(providers).size !== 3) ctx.addIssue({ code: 'custom', path: ['columns'], message: 'cada proveedor una sola vez' })
    for (const [index, column] of value.columns.entries()) {
      if (column.judge && column.judge.provider === column.provider) ctx.addIssue({ code: 'custom', path: ['columns', index, 'judge'], message: 'el juez no puede ser del proveedor evaluado' })
    }
  })

export const arenaRedTeamSchema = z.object({
  caseId: z.string(),
  judge: provider,
  model: z.string(),
  score: z.number().int().min(0).max(3),
  pass: z.boolean(),
  costUsd: z.number().min(0),
})

export const arenaRunSchema = z.object({
  id: z.string().min(1),
  at: z.iso.datetime(),
  mode: z.enum(ARENA_RUN_MODES),
  simulated: z.boolean(),
  rubricVersion: z.string(),
  models: z.object({ gemini: z.string(), claude: z.string(), openai: z.string() }),
  pricesCheckedAt: z.object({ gemini: day, claude: day, openai: day }),
  copRate: z.object({ value: z.number().positive(), date: day }),
  cases: z.array(arenaCaseSchema).min(1),
  redTeam: z.array(arenaRedTeamSchema),
  totalUsd: z.number().min(0),
  totalCop: z.number().min(0),
})

export const arenaResultsSchema = z.object({ runs: z.array(arenaRunSchema).max(ARENA_HISTORY_MAX) })

export type ArenaAttempt = z.infer<typeof arenaAttemptSchema>

export type ArenaJudge = z.infer<typeof arenaJudgeSchema>

export type ArenaColumn = z.infer<typeof arenaColumnSchema>

export type ArenaCase = z.infer<typeof arenaCaseSchema>

export type ArenaRedTeam = z.infer<typeof arenaRedTeamSchema>

export type ArenaRun = z.infer<typeof arenaRunSchema>

export type ArenaResults = z.infer<typeof arenaResultsSchema>

export function addArenaRun(results: ArenaResults, run: ArenaRun): ArenaResults {
  return { runs: [run, ...results.runs].slice(0, ARENA_HISTORY_MAX) }
}

export { bestColumn, caseCostUsd, injectionFailures, latestRun } from './view'
