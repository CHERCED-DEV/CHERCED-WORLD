import { readFileSync } from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

export const VITEST_REPORT_PATH = '.engineering/vitest.json'

const count = z.number().int().nonnegative()

const reportSchema = z.object({
  numTotalTests: count,
  numPassedTests: count,
  numFailedTests: count,
  numPendingTests: count.optional(),
  numTodoTests: count.optional(),
  startTime: z.number().positive(),
  success: z.boolean(),
  testResults: z.array(z.object({ status: z.string() })).optional(),
})

export type VitestSummary = {
  total: number
  passed: number
  failed: number
  skipped: number
  files: number | null
  startedAt: string
  success: boolean
}

export function parseVitestReport(value: unknown): VitestSummary | null {
  const parsed = reportSchema.safeParse(value)
  if (!parsed.success) return null
  const report = parsed.data
  const skipped = (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0)
  if (report.numPassedTests + report.numFailedTests + skipped > report.numTotalTests) return null
  const startedAt = new Date(report.startTime)
  if (Number.isNaN(startedAt.getTime())) return null
  return {
    total: report.numTotalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    skipped,
    files: report.testResults ? report.testResults.length : null,
    startedAt: startedAt.toISOString(),
    success: report.success,
  }
}

export function readVitestReport(root: string, file: string = VITEST_REPORT_PATH): VitestSummary | null {
  try {
    return parseVitestReport(JSON.parse(readFileSync(path.join(root, file), 'utf8')))
  } catch {
    return null
  }
}
