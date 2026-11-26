import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))

import { GET } from '@/app/api/engineering/spend/route'
import { typicalCostUsd } from '@/lib/ai/models'
import { USD_TO_COP } from '@/lib/ai/pricing'
import { registerRepoFactory } from '@/lib/data'
import { createMemoryRepos } from '@/lib/data/memory'
import { createMemoryRateLimitRepo } from '@/lib/data/memory/rate-limits'
import type { RateLimitRepo, Repos } from '@/lib/data/types'
import { engineeringSpend, mcpCallsToday, SPEND_CAP_USD, SPEND_TARGET_USD, type MonthlySpend } from '@/lib/engineering/spend'
import { RATE_LIMITS, rateLimitKey } from '@/lib/security/rate-limit'

const VISITOR = '9f1c2e7a4b'

function broken(): RateLimitRepo {
  const fail = async () => {
    throw new Error('base caída')
  }
  return { hit: fail, reset: fail, peek: fail }
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('gasto de IA del tablero (FR-4509)', () => {
  it('sin la 043 usa el estimado de hoy de spendToday, frente a la meta de 10 USD y el techo de 25 USD', async () => {
    const repo = createMemoryRateLimitRepo()
    const now = new Date()
    await repo.hit(rateLimitKey('matchDaily', 'global'), RATE_LIMITS.matchDaily, now)
    await repo.hit(rateLimitKey('matchDaily', 'global'), RATE_LIMITS.matchDaily, now)
    const spend = await engineeringSpend(repo, now)
    expect(spend.available).toBe(true)
    if (!spend.available) return
    expect(spend.month).toBeNull()
    expect(spend.targetUsd).toBe(SPEND_TARGET_USD)
    expect(spend.capUsd).toBe(SPEND_CAP_USD)
    expect([SPEND_TARGET_USD, SPEND_CAP_USD]).toEqual([10, 25])
    expect(spend.copRate.value).toBe(USD_TO_COP)
    expect(spend.today?.provider).toBe('gemini')
    expect(spend.today?.lines.find((line) => line.id === 'A6')?.uses).toBe(2)
    expect(spend.today?.usd).toBeCloseTo(2 * typicalCostUsd('A6')!, 6)
    expect(spend.today?.since).not.toBeNull()
  })

  it('con la 043 usa el gasto del mes por proveedor y deja de estimar el día', async () => {
    const monthly = async (): Promise<MonthlySpend> => ({ month: '2026-11', usd: 3.25, targetUsd: 10, capUsd: 25, byProvider: { gemini: 1.2, claude: 2.05, openai: undefined } })
    const spend = await engineeringSpend(createMemoryRateLimitRepo(), new Date(), monthly)
    expect(spend.available).toBe(true)
    if (!spend.available) return
    expect(spend.today).toBeNull()
    expect(spend.month).toEqual({ month: '2026-11', usd: 3.25, byProvider: [{ provider: 'claude', usd: 2.05 }, { provider: 'gemini', usd: 1.2 }] })
  })

  it('con la base caída dice «no disponible» y no muestra números', async () => {
    const spend = await engineeringSpend(broken(), new Date())
    expect(spend).toEqual({ available: false, takenAt: expect.any(String) })
  })

  it('cuenta las llamadas del día al MCP público con el contador global mcpDaily de la 044', async () => {
    const repo = createMemoryRateLimitRepo()
    const now = new Date()
    expect(await mcpCallsToday(repo, now)).toEqual({ calls: 0, since: null })
    for (let call = 0; call < 3; call += 1) await repo.hit(rateLimitKey('mcpDaily', 'global'), RATE_LIMITS.mcpDaily, now)
    expect((await mcpCallsToday(repo, now)).calls).toBe(3)
    expect((await mcpCallsToday(repo, new Date(now.getTime() + 25 * 60 * 60 * 1000))).calls).toBe(0)
  })

  it('no lleva datos de visitantes: ni sus contadores ni su huella', async () => {
    const repo = createMemoryRateLimitRepo()
    const now = new Date()
    await repo.hit(rateLimitKey('match', VISITOR), RATE_LIMITS.match, now)
    await repo.hit(rateLimitKey('mcp', VISITOR), RATE_LIMITS.mcp, now)
    const spend = await engineeringSpend(repo, now)
    const text = JSON.stringify(spend)
    expect(text).not.toContain(VISITOR)
    expect(text).not.toMatch(/@|"ip"|hash/i)
    if (spend.available) {
      expect(spend.mcp.calls).toBe(0)
      expect(spend.today?.lines.every((line) => line.uses === 0)).toBe(true)
    }
  })
})

describe('GET /api/engineering/spend (FR-4509)', () => {
  let repos: Repos

  beforeEach(() => {
    registerRepoFactory(() => createMemoryRepos())
    repos = createMemoryRepos()
  })

  it('responde los contadores agregados, cacheados una hora en la CDN', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
    expect(response.headers.get('x-robots-tag')).toBe('noindex')
    const body = (await response.json()) as { available: boolean; mcp?: { calls: number } }
    expect(body.available).toBe(true)
    expect(body.mcp?.calls).toBe(0)
  })

  it('con la base caída responde «no disponible» con una caché corta', async () => {
    registerRepoFactory(() => ({ ...repos, rateLimits: broken() }))
    const response = await GET()
    expect(response.headers.get('cache-control')).toContain('s-maxage=60')
    expect(await response.json()).toEqual({ available: false, takenAt: expect.any(String) })
  })
})
