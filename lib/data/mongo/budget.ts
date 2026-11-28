import 'server-only'
import { MongoServerError, type Filter, type UpdateFilter } from 'mongodb'
import { BUDGET_LINES, BUDGET_PROVIDERS, BUDGET_RETENTION_DAYS, type BudgetLine, type BudgetMonth, type BudgetProvider, type BudgetRepo } from '@/lib/data/types'
import { budgetCollection, type BudgetDoc, type DbProvider } from './collections'

const DUPLICATE_KEY = 11000

const DAY_MS = 24 * 60 * 60 * 1000

export function budgetExpiresAt(month: string): Date {
  const start = Date.parse(`${month}-01T00:00:00.000Z`)
  return new Date((Number.isNaN(start) ? Date.now() : start) + BUDGET_RETENTION_DAYS * DAY_MS)
}

export type BudgetWrite = { filter: Filter<BudgetDoc>; update: UpdateFilter<BudgetDoc> }

export function budgetReserveWrite(month: string, microUsd: number, capMicroUsd: number): BudgetWrite {
  return {
    filter: { _id: month, totalMicroUsd: { $lte: capMicroUsd - microUsd } },
    update: {
      $inc: { totalMicroUsd: microUsd },
      $setOnInsert: { byProvider: {}, byLine: {}, warnedAt: null, cutAt: null, expiresAt: budgetExpiresAt(month) },
    },
  }
}

export function budgetSettleWrite(month: string, reservedMicroUsd: number, actualMicroUsd: number, provider: BudgetProvider, line: BudgetLine): BudgetWrite {
  const actual = Math.max(0, Math.round(actualMicroUsd))
  return {
    filter: { _id: month },
    update: {
      $inc: { totalMicroUsd: actual - Math.round(reservedMicroUsd), [`byProvider.${provider}`]: actual, [`byLine.${line}`]: actual },
      $setOnInsert: { warnedAt: null, cutAt: null, expiresAt: budgetExpiresAt(month) },
    },
  }
}

function amounts<K extends string>(keys: readonly K[], value: unknown): Partial<Record<K, number>> {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const out: Partial<Record<K, number>> = {}
  for (const key of keys) {
    const amount = raw[key]
    if (typeof amount === 'number' && Number.isFinite(amount)) out[key] = amount
  }
  return out
}

function date(value: unknown): Date | null {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : null
}

export function toBudgetMonth(doc: BudgetDoc): BudgetMonth {
  return {
    month: doc._id,
    totalMicroUsd: typeof doc.totalMicroUsd === 'number' && Number.isFinite(doc.totalMicroUsd) ? doc.totalMicroUsd : 0,
    byProvider: amounts(BUDGET_PROVIDERS, doc.byProvider),
    byLine: amounts(BUDGET_LINES, doc.byLine),
    warnedAt: date(doc.warnedAt),
    cutAt: date(doc.cutAt),
  }
}

export function createMongoBudgetRepo(db: DbProvider): BudgetRepo {
  return {
    async reserve(month, microUsd, capMicroUsd) {
      const amount = Math.max(0, Math.ceil(microUsd))
      const collection = await budgetCollection(db)
      const current = async () => (await collection.findOne({ _id: month }))?.totalMicroUsd ?? 0
      if (amount > capMicroUsd) return { ok: false, totalMicroUsd: await current() }
      const write = budgetReserveWrite(month, amount, capMicroUsd)
      const run = () => collection.findOneAndUpdate(write.filter, write.update, { upsert: true, returnDocument: 'after' })
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const doc = await run()
          if (doc) return { ok: true, totalMicroUsd: doc.totalMicroUsd }
        } catch (error) {
          if (!(error instanceof MongoServerError && error.code === DUPLICATE_KEY)) throw error
        }
      }
      return { ok: false, totalMicroUsd: await current() }
    },
    async settle(month, reservedMicroUsd, actualMicroUsd, provider, line) {
      const collection = await budgetCollection(db)
      const write = budgetSettleWrite(month, reservedMicroUsd, actualMicroUsd, provider, line)
      const doc = await collection.findOneAndUpdate(write.filter, write.update, { upsert: true, returnDocument: 'after' })
      if (!doc) throw new Error('BudgetSettleFailed')
      return toBudgetMonth(doc)
    },
    async mark(month, field, now) {
      const result = await (await budgetCollection(db)).updateOne({ _id: month, [field]: null }, { $set: { [field]: now } })
      return result.modifiedCount === 1
    },
    async get(month) {
      const doc = await (await budgetCollection(db)).findOne({ _id: month })
      return doc ? toBudgetMonth(doc) : null
    },
  }
}
