import { describe, expect, it } from 'vitest'
import { BUDGET_CAP_MICRO } from '@/lib/ai/budget/config'
import { monthlySpend } from '@/lib/ai/budget/spend'
import { engineeringSpend } from '@/lib/engineering/spend'
import { createMemoryBudgetRepo } from '@/lib/data/memory/budget'
import { createMemoryRateLimitRepo } from '@/lib/data/memory/rate-limits'
import type { BudgetRepo } from '@/lib/data/types'

const NOW = new Date('2026-11-27T15:00:00.000Z')

describe('monthlySpend(now) para la 045 (contrato de la 041)', () => {
  it('sin libro del mes devuelve ceros, con la meta y el techo', async () => {
    expect(await monthlySpend(NOW, createMemoryBudgetRepo())).toEqual({
      month: '2026-11',
      usd: 0,
      targetUsd: 10,
      capUsd: 25,
      byProvider: { simulator: 0, gemini: 0, claude: 0, openai: 0 },
    })
  })

  it('redondea a 4 decimales, simulator siempre vale 0 y no trae desglose por línea ni nada por visitante', async () => {
    const repo = createMemoryBudgetRepo()
    await repo.reserve('2026-11', 123_456, BUDGET_CAP_MICRO)
    await repo.settle('2026-11', 123_456, 123_456, 'openai', 'arena')
    const spend = await monthlySpend(NOW, repo)
    expect(spend).toEqual({ month: '2026-11', usd: 0.1235, targetUsd: 10, capUsd: 25, byProvider: { simulator: 0, gemini: 0, claude: 0, openai: 0.1235 } })
    expect(Object.keys(spend).sort()).toEqual(['byProvider', 'capUsd', 'month', 'targetUsd', 'usd'])
    expect(JSON.stringify(spend)).not.toContain('arena')
  })

  it('si la capa de datos no responde, lanza: quien lo consume decide', async () => {
    const down: BudgetRepo = { reserve: async () => ({ ok: false, totalMicroUsd: 0 }), settle: () => Promise.reject(new Error('x')), mark: async () => false, get: () => Promise.reject(new Error('database unavailable')) }
    await expect(monthlySpend(NOW, down)).rejects.toThrow('database unavailable')
  })

  it('encaja con el lector que ya espera el tablero de la 045', async () => {
    const repo = createMemoryBudgetRepo()
    await repo.reserve('2026-11', 2_000_000, BUDGET_CAP_MICRO)
    await repo.settle('2026-11', 2_000_000, 2_000_000, 'claude', 'kb')
    const view = await engineeringSpend(createMemoryRateLimitRepo(), NOW, (now) => monthlySpend(now, repo))
    expect(view).toMatchObject({ available: true, month: { month: '2026-11', usd: 2, byProvider: [{ provider: 'claude', usd: 2 }, { provider: 'gemini', usd: 0 }, { provider: 'openai', usd: 0 }, { provider: 'simulator', usd: 0 }] } })
  })
})
