import { describe, expect, it } from 'vitest'
import { GEMINI_MODELS, typicalCostUsd } from '@/lib/ai/models'
import { isPricedModel } from '@/lib/ai/pricing'
import { spendToday } from '@/lib/ai/spend'
import { createMemoryRateLimitRepo } from '@/lib/data/memory/rate-limits'
import { RATE_LIMITS, rateLimitKey } from '@/lib/security/rate-limit'

describe('base común de Gemini (020)', () => {
  it('FR-2001 y FR-2005: los modelos viven en un archivo y todos tienen precio', () => {
    for (const model of Object.values(GEMINI_MODELS)) expect(isPricedModel(model), model).toBe(true)
    for (const id of ['V5', 'A6', 'code', 'summary', 'diagram', 'spec', 'shot', 'pixel', 'listen']) {
      const usd = typicalCostUsd(id)
      expect(usd, id).not.toBeNull()
      expect(usd!, id).toBeGreaterThan(0)
      expect(usd!, id).toBeLessThan(0.5)
    }
    expect(typicalCostUsd('nada')).toBeNull()
  })

  it('FR-2007: el gasto del día sale de los contadores de los límites, sin datos del visitante', async () => {
    const repo = createMemoryRateLimitRepo()
    const now = new Date()
    await repo.hit(rateLimitKey('matchDaily', 'global'), RATE_LIMITS.matchDaily, now)
    await repo.hit(rateLimitKey('matchDaily', 'global'), RATE_LIMITS.matchDaily, now)
    const lines = await spendToday(repo)
    const match = lines.find((line) => line.id === 'A6')!
    expect(match.uses).toBe(2)
    expect(match.usd).toBeCloseTo(2 * typicalCostUsd('A6')!, 6)
    expect(lines.find((line) => line.id === 'V5')!.uses).toBe(0)
  })
})
