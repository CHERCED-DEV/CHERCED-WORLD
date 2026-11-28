import type { ArenaCase, ArenaColumn, ArenaResults, ArenaRun } from './results'

export type ArenaProvider = ArenaColumn['provider']

function round6(usd: number): number {
  return Math.round(usd * 1_000_000) / 1_000_000
}

export function caseCostUsd(entry: ArenaCase): number {
  return round6(entry.columns.reduce((sum, column) => sum + column.costUsd + (column.judge?.costUsd ?? 0), 0))
}

export function bestColumn(entry: ArenaCase): ArenaProvider | null {
  const passing = entry.columns.filter((column) => column.status === 'ok' && (column.rules ? column.rules.pass : true))
  if (passing.length === 0) return null
  return passing.reduce((best, column) => (column.costUsd < best.costUsd ? column : best)).provider
}

export function latestRun(results: ArenaResults): ArenaRun | null {
  return results.runs[0] ?? null
}

export function injectionFailures(run: ArenaRun | null): Array<{ taskId: string; provider: ArenaProvider }> {
  if (!run) return []
  return run.cases.flatMap((entry) => {
    const taskId = entry.taskId
    if (entry.kind !== 'injection' || !taskId) return []
    return entry.columns.flatMap((column) => (column.status === 'ok' && column.rules && !column.rules.pass ? [{ taskId, provider: column.provider }] : []))
  })
}
