import 'server-only'
import { USD_TO_COP, USD_TO_COP_DATE } from '@/lib/ai/pricing'
import { spendToday, SPEND_GLOBAL_KEY } from '@/lib/ai/spend'
import type { RateLimitRepo } from '@/lib/data/types'
import { logServerError } from '@/lib/security/log'
import { rateLimitKey } from '@/lib/security/rate-limit'

export const SPEND_TARGET_USD = 10

export const SPEND_CAP_USD = 25

export const SPEND_CACHE_SECONDS = 3600

export type MonthlySpend = {
  month: string
  usd: number
  targetUsd: number
  capUsd: number
  byProvider: Partial<Record<string, number>>
}

export type MonthlySpendReader = (now: Date) => Promise<MonthlySpend>

export type SpendLineView = { id: string; label: { es: string; en: string }; uses: number; usd: number }

export type SpendToday = { usd: number; since: string | null; lines: SpendLineView[]; provider: 'gemini' }

export type SpendMonth = { month: string; usd: number; byProvider: Array<{ provider: string; usd: number }> }

export type McpCalls = { calls: number; since: string | null }

export type EngineeringSpend =
  | {
      available: true
      takenAt: string
      targetUsd: number
      capUsd: number
      copRate: { value: number; date: string }
      today: SpendToday | null
      month: SpendMonth | null
      mcp: McpCalls
    }
  | { available: false; takenAt: string }

const DAY_MS = 24 * 60 * 60 * 1000

function round(usd: number): number {
  return Math.round(usd * 1_000_000) / 1_000_000
}

export async function mcpCallsToday(repo: RateLimitRepo, now: Date): Promise<McpCalls> {
  const peek = await repo.peek(rateLimitKey('mcpDaily', SPEND_GLOBAL_KEY))
  const fresh = peek && now.getTime() - peek.windowStart.getTime() < DAY_MS ? peek : null
  return { calls: fresh?.count ?? 0, since: fresh ? fresh.windowStart.toISOString() : null }
}

async function today(repo: RateLimitRepo): Promise<SpendToday> {
  const lines = await spendToday(repo)
  const starts = lines.flatMap((line) => (line.since ? [line.since.getTime()] : []))
  return {
    usd: round(lines.reduce((sum, line) => sum + line.usd, 0)),
    since: starts.length ? new Date(Math.min(...starts)).toISOString() : null,
    lines: lines.map((line) => ({ id: line.id, label: line.label, uses: line.uses, usd: round(line.usd) })),
    provider: 'gemini',
  }
}

function monthView(month: MonthlySpend): SpendMonth {
  return {
    month: month.month,
    usd: round(month.usd),
    byProvider: Object.entries(month.byProvider)
      .flatMap(([provider, usd]) => (provider !== 'simulator' && typeof usd === 'number' && Number.isFinite(usd) ? [{ provider, usd: round(usd) }] : []))
      .sort((a, b) => b.usd - a.usd),
  }
}

export async function engineeringSpend(repo: RateLimitRepo, now: Date, monthly?: MonthlySpendReader): Promise<EngineeringSpend> {
  try {
    const [month, mcp] = await Promise.all([monthly ? monthly(now) : Promise.resolve(null), mcpCallsToday(repo, now)])
    return {
      available: true,
      takenAt: now.toISOString(),
      targetUsd: month?.targetUsd ?? SPEND_TARGET_USD,
      capUsd: month?.capUsd ?? SPEND_CAP_USD,
      copRate: { value: USD_TO_COP, date: USD_TO_COP_DATE },
      today: await today(repo),
      month: month ? monthView(month) : null,
      mcp,
    }
  } catch (error) {
    logServerError('engineering.spend', error)
    return { available: false, takenAt: now.toISOString() }
  }
}
