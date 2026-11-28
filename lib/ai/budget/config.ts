export const BUDGET_TARGET_USD = 10

export const BUDGET_CAP_USD = 25

export const MICRO_PER_USD = 1_000_000

export function toMicroUsd(usd: number): number {
  return Number.isFinite(usd) && usd > 0 ? Math.ceil(Math.round(usd * MICRO_PER_USD * 1000) / 1000) : 0
}

export function fromMicroUsd(micro: number): number {
  return Number.isFinite(micro) ? micro / MICRO_PER_USD : 0
}

export const BUDGET_TARGET_MICRO = toMicroUsd(BUDGET_TARGET_USD)

export const BUDGET_CAP_MICRO = toMicroUsd(BUDGET_CAP_USD)

export function budgetMonth(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}
