import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { MODEL_PRICES, PRICE_SOURCES } from '@/lib/ai/pricing'
import { costUsd, modelPrice, pricesToReview, reservationCostUsd } from '@/lib/ai/providers/cost'
import { MODELS_PENDING_APPROVAL, PROVIDER_MODELS, portModels } from '@/lib/ai/providers/models'
import { planRoute, REASON_NO_KEY, REASON_NO_PRICE } from '@/lib/ai/providers/router'
import { PAID_PROVIDERS } from '@/lib/ai/providers/types'
import { fakeAdapter, testPort } from './support'

const ESTIMATE = { inputTokens: 1500, outputTokens: 600 }

const ALL = [...PAID_PROVIDERS]

describe('enrutador por costo (FR-4305)', () => {
  it('cheap: el más barato con precio va primero; empates por el orden fijo', () => {
    const plan = planRoute({ task: 'cheap', estimate: ESTIMATE }, ALL)
    expect(plan.candidates.map((candidate) => candidate.provider)).toEqual(['claude', 'openai', 'gemini'])
    expect(plan.candidates.map((candidate) => candidate.model)).toEqual(['claude-haiku-5-5', 'gpt-6-luna', 'gemini-3.8-flash'])
    expect(plan.skipped).toEqual([])
  })

  it('balanced y strong siguen la tabla de precios', () => {
    expect(planRoute({ task: 'balanced', estimate: ESTIMATE }, ALL).candidates.map((candidate) => candidate.provider)).toEqual(['gemini', 'claude', 'openai'])
    expect(planRoute({ task: 'strong', estimate: ESTIMATE }, ALL).candidates.map((candidate) => candidate.model)).toEqual(['gemini-4-argon', 'claude-opus-5-5', 'gpt-6.2-astra'])
  })

  it('prefer adelanta un proveedor y exclude lo saca sin listarlo', () => {
    expect(planRoute({ task: 'cheap', estimate: ESTIMATE, prefer: 'gemini' }, ALL).candidates[0]!.provider).toBe('gemini')
    const plan = planRoute({ task: 'balanced', estimate: ESTIMATE, exclude: ['gemini'] }, ALL)
    expect(plan.candidates.map((candidate) => candidate.provider)).toEqual(['claude', 'openai'])
    expect(plan.skipped.map((attempt) => attempt.provider)).not.toContain('gemini')
  })

  it('un proveedor sin llave se salta con su motivo', () => {
    const plan = planRoute({ task: 'cheap', estimate: ESTIMATE }, ['gemini'])
    expect(plan.candidates.map((candidate) => candidate.provider)).toEqual(['gemini'])
    expect(plan.skipped).toEqual([
      expect.objectContaining({ provider: 'claude', outcome: 'skipped', reason: REASON_NO_KEY, costUsd: 0 }),
      expect.objectContaining({ provider: 'openai', outcome: 'skipped', reason: REASON_NO_KEY, costUsd: 0 }),
    ])
  })

  it('un modelo sin precio en la tabla nunca se llama', async () => {
    const plan = planRoute({ task: 'cheap', estimate: ESTIMATE }, ALL, (provider, task) => (provider === 'openai' ? 'gpt-sin-precio' : PROVIDER_MODELS[provider][task]))
    expect(plan.candidates.map((candidate) => candidate.provider)).toEqual(['claude', 'gemini'])
    expect(plan.skipped).toEqual([expect.objectContaining({ provider: 'openai', requestedModel: 'gpt-sin-precio', reason: REASON_NO_PRICE })])

    const openai = fakeAdapter('openai', [{ text: '{"ok":true}' }])
    const claude = fakeAdapter('claude', [{ fail: 'rate_limit' }])
    const gemini = fakeAdapter('gemini', [{ fail: 'server' }])
    const port = testPort({ adapters: { openai, claude, gemini }, models: (provider, task) => (provider === 'openai' ? 'gpt-sin-precio' : PROVIDER_MODELS[provider][task]) })
    await expect(port.generateJson({ task: 'cheap', line: 'arena', system: 's', prompt: 'p', schema: z.object({ ok: z.boolean() }) })).rejects.toThrow()
    expect(openai.jsonCalls).toHaveLength(0)
    expect(port.loaded).not.toContain('openai')
  })

  it('SC-4305: el costo es tokens × tabla de precios con error de 0,0001 USD o menos', () => {
    expect(costUsd('gemini-3.8-flash', ESTIMATE)).toBeCloseTo(0.003375, 4)
    expect(costUsd('claude-sonnet-5-5', ESTIMATE)).toBeCloseTo(0.009, 4)
    expect(costUsd('claude-haiku-5-5', ESTIMATE)).toBeCloseTo(0.00045, 4)
    expect(costUsd('claude-haiku-5-5', { inputTokens: 120_000, outputTokens: 1000 })).toBeCloseTo(0.0625, 4)
    expect(costUsd('gpt-6-luna', ESTIMATE)).toBeCloseTo(0.00045, 4)
    expect(costUsd('gpt-6.2-sol', { inputTokens: 300_000, outputTokens: 1000 })).toBeCloseTo(1.215, 4)
    expect(costUsd('gpt-6-luna-2026-05-18', ESTIMATE)).toBeCloseTo(0.00045, 4)
    expect(costUsd('modelo-inventado', ESTIMATE)).toBeNull()
  })

  it('la reserva de Opus y Sonnet 5.5 cubre el modelo más caro del fallback del servidor', () => {
    expect(reservationCostUsd('claude-opus-5-5', ESTIMATE)).toBeCloseTo(costUsd('claude-opus-5', ESTIMATE)!, 6)
    expect(reservationCostUsd('claude-sonnet-5-5', ESTIMATE)).toBeCloseTo(costUsd('claude-sonnet-5-5', ESTIMATE)!, 6)
    expect(reservationCostUsd('claude-haiku-5-5', ESTIMATE)).toBeCloseTo(costUsd('claude-haiku-5-5', ESTIMATE)!, 6)
  })

  it('cada modelo del puerto tiene precio, fuente con fecha y los por aprobar están marcados (P-4301)', () => {
    for (const model of portModels()) expect(modelPrice(model), model).not.toBeNull()
    expect(MODELS_PENDING_APPROVAL).toEqual(['gemini-4-argon', 'gpt-6-luna', 'gpt-6.2-sol', 'gpt-6.2-astra'])
    for (const source of Object.values(PRICE_SOURCES)) {
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    expect(MODEL_PRICES['claude-opus-5-5']).toMatchObject({ input: { text: 4 }, output: { text: 20 } })
  })

  it('tabla vencida: se sigue llamando y el panel la marca «por revisar»', () => {
    expect(pricesToReview('2027-01-02')).toEqual(['gemini-3.8-flash'])
    expect(pricesToReview('2026-11-27')).toEqual([])
    expect(planRoute({ task: 'balanced', estimate: ESTIMATE }, ['gemini']).candidates.map((candidate) => candidate.model)).toEqual(['gemini-3.8-flash'])
  })
})
