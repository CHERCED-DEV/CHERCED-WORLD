import { PRICE_SOURCES, type PriceProvider } from '@/lib/ai/pricing'
import { pricesToReview } from '@/lib/ai/providers/cost'
import { MODELS_PENDING_APPROVAL } from '@/lib/ai/providers/models'
import { PAID_PROVIDERS, type PaidProviderId } from '@/lib/ai/providers/types'
import { BUDGET_LINES, type BudgetLine, type BudgetMonth, type BudgetRepo } from '@/lib/data/types'
import { BUDGET_CAP_USD, BUDGET_TARGET_USD, budgetMonth, fromMicroUsd } from './config'

export type BudgetState = 'ok' | 'warned' | 'cut'

export type BudgetSummary = {
  month: string
  usd: number
  targetUsd: number
  capUsd: number
  targetPct: number
  capPct: number
  state: BudgetState
  byProvider: Record<PaidProviderId, number>
  byLine: Array<{ line: BudgetLine; usd: number }>
  warnedAt: Date | null
  cutAt: Date | null
  pricesToReview: string[]
  pendingApproval: readonly string[]
  pricesCheckedAt: Record<PriceProvider, string>
}

export function roundSpend(usd: number): number {
  return Math.round(usd * 10_000) / 10_000
}

function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

export function summarize(month: string, entry: BudgetMonth | null, today: string): BudgetSummary {
  const usd = roundSpend(fromMicroUsd(entry?.totalMicroUsd ?? 0))
  const byProvider = Object.fromEntries(PAID_PROVIDERS.map((provider) => [provider, roundSpend(fromMicroUsd(entry?.byProvider[provider] ?? 0))])) as Record<PaidProviderId, number>
  const byLine = BUDGET_LINES.flatMap((line) => {
    const micro = entry?.byLine[line] ?? 0
    return micro > 0 ? [{ line, usd: roundSpend(fromMicroUsd(micro)) }] : []
  })
  const state: BudgetState = usd >= BUDGET_CAP_USD || entry?.cutAt ? 'cut' : usd >= BUDGET_TARGET_USD ? 'warned' : 'ok'
  return {
    month,
    usd,
    targetUsd: BUDGET_TARGET_USD,
    capUsd: BUDGET_CAP_USD,
    targetPct: percent(usd, BUDGET_TARGET_USD),
    capPct: percent(usd, BUDGET_CAP_USD),
    state,
    byProvider,
    byLine,
    warnedAt: entry?.warnedAt ?? null,
    cutAt: entry?.cutAt ?? null,
    pricesToReview: pricesToReview(today),
    pendingApproval: MODELS_PENDING_APPROVAL,
    pricesCheckedAt: { gemini: PRICE_SOURCES.gemini.checkedAt, claude: PRICE_SOURCES.claude.checkedAt, openai: PRICE_SOURCES.openai.checkedAt },
  }
}

export async function budgetSummary(repo: BudgetRepo, now: Date): Promise<BudgetSummary> {
  const month = budgetMonth(now)
  return summarize(month, await repo.get(month), now.toISOString().slice(0, 10))
}
