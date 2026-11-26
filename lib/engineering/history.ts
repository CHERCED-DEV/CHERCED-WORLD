import { z } from 'zod'

export const HISTORY_PATH = 'content/engineering/history.json'

export const BUDGET_IDS = ['lcp', 'cls', 'inp', 'a11y'] as const

export type BudgetId = (typeof BUDGET_IDS)[number]

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'fecha inválida')

const shortSha = z.string().regex(/^[0-9a-f]{7,12}$/)

export const commitSchema = z.strictObject({ sha: shortSha, date: isoDate, subject: z.string().max(200) })

export const deploymentSchema = z.strictObject({ sha: shortSha, date: isoDate, state: z.string().regex(/^[a-z_]{1,24}$/) })

export const measurementSchema = z.strictObject({
  budget: z.enum(BUDGET_IDS),
  page: z.string().regex(/^\/[^\s]*$/),
  value: z.number(),
  date: isoDate,
  source: z.string().min(1).max(160),
})

export const historySchema = z.strictObject({
  version: z.literal(1),
  takenAt: isoDate,
  head: shortSha,
  commits: z.array(commitSchema),
  specCreated: z.record(z.string().regex(/^\d{3}$/), isoDate),
  deployments: z.strictObject({ takenAt: isoDate, byEnvironment: z.record(z.string().min(1).max(40), z.array(deploymentSchema)) }).nullable(),
  measurements: z.array(measurementSchema),
})

export type History = z.infer<typeof historySchema>

export type Commit = z.infer<typeof commitSchema>

export type Deployment = z.infer<typeof deploymentSchema>

export type Measurement = z.infer<typeof measurementSchema>

export function parseHistory(value: unknown): History | null {
  const parsed = historySchema.safeParse(value)
  return parsed.success ? parsed.data : null
}
