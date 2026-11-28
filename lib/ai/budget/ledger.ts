import type { BudgetLine, BudgetMark, BudgetMonth, BudgetProvider, BudgetRepo } from '@/lib/data/types'
import { BudgetExhaustedError, BudgetUnavailableError } from '@/lib/ai/providers/types'
import { BUDGET_CAP_MICRO, BUDGET_CAP_USD, BUDGET_TARGET_MICRO, budgetMonth, fromMicroUsd, toMicroUsd } from './config'

export type BudgetEvent = { kind: 'warned' | 'cut'; month: string; totalUsd: number; at: Date }

export type BudgetNotifier = (event: BudgetEvent) => Promise<void>

export type Ledger = { repo: BudgetRepo; notify?: BudgetNotifier; onError?: (scope: string, error: unknown) => void }

export type Reservation = { month: string; microUsd: number }

export const MIN_RESERVATION_MICRO = 1

async function markOnce(ledger: Ledger, month: string, field: BudgetMark, totalMicroUsd: number, now: Date): Promise<void> {
  try {
    if (!(await ledger.repo.mark(month, field, now))) return
    await ledger.notify?.({ kind: field === 'warnedAt' ? 'warned' : 'cut', month, totalUsd: fromMicroUsd(totalMicroUsd), at: now })
  } catch (error) {
    ledger.onError?.('budget.mark', error)
  }
}

export async function checkCrossings(ledger: Ledger, month: BudgetMonth, now: Date): Promise<void> {
  if (month.totalMicroUsd >= BUDGET_TARGET_MICRO && !month.warnedAt) await markOnce(ledger, month.month, 'warnedAt', month.totalMicroUsd, now)
  if (month.totalMicroUsd >= BUDGET_CAP_MICRO && !month.cutAt) await markOnce(ledger, month.month, 'cutAt', month.totalMicroUsd, now)
}

export async function reserveBudget(ledger: Ledger, usd: number, now: Date): Promise<Reservation> {
  const month = budgetMonth(now)
  const microUsd = Math.max(MIN_RESERVATION_MICRO, toMicroUsd(usd))
  let result: { ok: boolean; totalMicroUsd: number }
  try {
    result = await ledger.repo.reserve(month, microUsd, BUDGET_CAP_MICRO)
  } catch (error) {
    throw new BudgetUnavailableError(error)
  }
  if (!result.ok) {
    if (result.totalMicroUsd + microUsd > BUDGET_CAP_MICRO) await markOnce(ledger, month, 'cutAt', result.totalMicroUsd, now)
    throw new BudgetExhaustedError(month, BUDGET_CAP_USD)
  }
  return { month, microUsd }
}

export async function settleBudget(ledger: Ledger, reservation: Reservation, actualUsd: number, provider: BudgetProvider, line: BudgetLine, now: Date): Promise<BudgetMonth | null> {
  try {
    const month = await ledger.repo.settle(reservation.month, reservation.microUsd, toMicroUsd(actualUsd), provider, line)
    await checkCrossings(ledger, month, now)
    return month
  } catch (error) {
    ledger.onError?.('budget.settle', error)
    return null
  }
}

export async function assertBudget(repo: BudgetRepo, estimateUsd: number, now: Date): Promise<void> {
  const month = budgetMonth(now)
  const current = await repo.get(month)
  if ((current?.totalMicroUsd ?? 0) + toMicroUsd(estimateUsd) > BUDGET_CAP_MICRO) throw new BudgetExhaustedError(month, BUDGET_CAP_USD)
}
