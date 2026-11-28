import 'server-only'
import { getRepos } from '@/lib/data'
import type { BudgetRepo } from '@/lib/data/types'
import { PAID_PROVIDERS, type ProviderId } from '@/lib/ai/providers/types'
import { BUDGET_CAP_USD, BUDGET_TARGET_USD, budgetMonth, fromMicroUsd } from './config'
import { roundSpend } from './summary'

export type MonthlySpend = {
  month: string
  usd: number
  targetUsd: number
  capUsd: number
  byProvider: Record<ProviderId, number>
}

export async function monthlySpend(now: Date, repo: BudgetRepo = getRepos().budget): Promise<MonthlySpend> {
  const month = budgetMonth(now)
  const entry = await repo.get(month)
  const byProvider = {} as Record<ProviderId, number>
  for (const provider of PAID_PROVIDERS) byProvider[provider] = roundSpend(fromMicroUsd(entry?.byProvider[provider] ?? 0))
  byProvider.simulator = 0
  return {
    month,
    usd: roundSpend(fromMicroUsd(entry?.totalMicroUsd ?? 0)),
    targetUsd: BUDGET_TARGET_USD,
    capUsd: BUDGET_CAP_USD,
    byProvider,
  }
}
