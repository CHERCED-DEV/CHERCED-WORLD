import 'server-only'
import type { BudgetMonth, BudgetRepo } from '../types'

function emptyMonth(month: string): BudgetMonth {
  return { month, totalMicroUsd: 0, byProvider: {}, byLine: {}, warnedAt: null, cutAt: null }
}

function copy(month: BudgetMonth): BudgetMonth {
  return { ...month, byProvider: { ...month.byProvider }, byLine: { ...month.byLine } }
}

export function createMemoryBudgetRepo(): BudgetRepo {
  const store = new Map<string, BudgetMonth>()

  const read = (month: string): BudgetMonth => {
    const current = store.get(month)
    if (current) return current
    const fresh = emptyMonth(month)
    store.set(month, fresh)
    return fresh
  }

  return {
    async reserve(month, microUsd, capMicroUsd) {
      const amount = Math.max(0, Math.ceil(microUsd))
      const current = store.get(month)
      const total = current?.totalMicroUsd ?? 0
      if (amount > capMicroUsd || total > capMicroUsd - amount) return { ok: false, totalMicroUsd: total }
      const entry = read(month)
      entry.totalMicroUsd += amount
      return { ok: true, totalMicroUsd: entry.totalMicroUsd }
    },
    async settle(month, reservedMicroUsd, actualMicroUsd, provider, line) {
      const entry = read(month)
      const actual = Math.max(0, Math.round(actualMicroUsd))
      entry.totalMicroUsd += actual - Math.round(reservedMicroUsd)
      entry.byProvider[provider] = (entry.byProvider[provider] ?? 0) + actual
      entry.byLine[line] = (entry.byLine[line] ?? 0) + actual
      return copy(entry)
    },
    async mark(month, field, now) {
      const entry = store.get(month)
      if (!entry || entry[field] !== null) return false
      entry[field] = now
      return true
    },
    async get(month) {
      const entry = store.get(month)
      return entry ? copy(entry) : null
    },
  }
}
