import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { BUDGET_CAP_MICRO } from '@/lib/ai/budget/config'
import { createMemoryBudgetRepo } from '@/lib/data/memory/budget'
import type { BudgetRepo } from '@/lib/data/types'
import { BudgetExhaustedError, BudgetUnavailableError, ProviderRequestError, ProvidersUnavailableError, SimulatorMissingError, type PaidProviderId } from '@/lib/ai/providers/port'
import { REASON_NO_KEY } from '@/lib/ai/providers/router'
import { PAID_PROVIDERS } from '@/lib/ai/providers/types'
import { FAKE_KEYS, fakeAdapter, testPort, type FakeAdapter } from './support'

const schema = z.object({ ok: z.boolean() })

const request = { task: 'cheap' as const, line: 'arena' as const, system: 'Responde JSON.', prompt: 'Hola', schema }

const OK = '{"ok":true}'

function all(steps: Partial<Record<PaidProviderId, Parameters<typeof fakeAdapter>[1]>>): Record<PaidProviderId, FakeAdapter> {
  return {
    gemini: fakeAdapter('gemini', steps.gemini ?? [{ text: OK }]),
    claude: fakeAdapter('claude', steps.claude ?? [{ text: OK }]),
    openai: fakeAdapter('openai', steps.openai ?? [{ text: OK }]),
  }
}

describe('fallback entre proveedores (FR-4306)', () => {
  it('responde el más barato y el resultado dice proveedor, modelo, tokens, costo e intentos', async () => {
    const adapters = all({})
    const result = await testPort({ adapters }).generateJson(request)
    expect(result).toMatchObject({ data: { ok: true }, provider: 'claude', model: 'claude-haiku-5-5', usage: { inputTokens: 1000, outputTokens: 200 } })
    expect(result.costUsd).toBeCloseTo(0.0002, 6)
    expect(result.attempts).toEqual([expect.objectContaining({ provider: 'claude', outcome: 'ok', reason: null })])
    expect(adapters.openai.jsonCalls).toHaveLength(0)
  })

  it.each([
    ['429', 'rate_limit'],
    ['5xx', 'server'],
    ['tiempo agotado', 'timeout'],
    ['red caída', 'network'],
    ['llave inválida', 'unavailable'],
  ] as const)('ante %s pasa al siguiente y deja los dos intentos', async (_label, kind) => {
    const adapters = all({ claude: [{ fail: kind }] })
    const result = await testPort({ adapters }).generateJson(request)
    expect(result.provider).toBe('openai')
    expect(result.attempts.map((attempt) => [attempt.provider, attempt.outcome])).toEqual([
      ['claude', 'error'],
      ['openai', 'ok'],
    ])
    expect(result.attempts[0]!.reason).toContain(kind)
    for (const attempt of result.attempts) expect(attempt.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('un rechazo del modelo cuenta como intento fallido y no se lee como respuesta', async () => {
    const adapters = all({ claude: [{ fail: 'refusal', message: 'Claude se negó a responder (cyber)' }] })
    const result = await testPort({ adapters }).generateJson(request)
    expect(result.provider).toBe('openai')
    expect(result.attempts[0]).toMatchObject({ provider: 'claude', outcome: 'refusal', reason: 'Claude se negó a responder (cyber)' })
  })

  it('salida inválida: reintenta una vez con el mismo y, si vuelve a fallar, pasa al siguiente', async () => {
    const adapters = all({ claude: [{ text: 'no es json' }, { text: '{"ok":"sí"}' }] })
    const result = await testPort({ adapters }).generateJson(request)
    expect(adapters.claude.jsonCalls).toHaveLength(2)
    expect(adapters.claude.jsonCalls[1]!.prompt).toContain('Tu respuesta anterior no sirvió: la salida no es JSON')
    expect(result.attempts.map((attempt) => [attempt.provider, attempt.outcome])).toEqual([
      ['claude', 'invalid'],
      ['claude', 'invalid'],
      ['openai', 'ok'],
    ])
    expect(result.attempts[1]!.reason).toContain('no cumple el esquema (ok:')
  })

  it('un 400 no hace fallback: es un error del pedido', async () => {
    const adapters = all({ claude: [{ fail: 'request', message: 'Claude respondió 400: max_tokens inválido' }] })
    const error = await testPort({ adapters }).generateJson(request).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ProviderRequestError)
    expect((error as ProviderRequestError).attempts).toEqual([expect.objectContaining({ provider: 'claude', outcome: 'error' })])
    expect(adapters.openai.jsonCalls).toHaveLength(0)
    expect(adapters.gemini.jsonCalls).toHaveLength(0)
  })

  it('si los tres fallan, el error trae la lista de intentos con su motivo', async () => {
    const adapters = all({ claude: [{ fail: 'rate_limit' }], openai: [{ fail: 'server' }], gemini: [{ fail: 'timeout' }] })
    const error = await testPort({ adapters }).generateJson(request).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ProvidersUnavailableError)
    expect((error as ProvidersUnavailableError).attempts.map((attempt) => [attempt.provider, attempt.outcome])).toEqual([
      ['claude', 'error'],
      ['openai', 'error'],
      ['gemini', 'error'],
    ])
  })

  it('un proveedor sin llave se salta sin cargar su adaptador', async () => {
    const adapters = all({})
    const port = testPort({ adapters, keys: { gemini: FAKE_KEYS.gemini } })
    const result = await port.generateJson(request)
    expect(result.provider).toBe('gemini')
    expect(port.loaded).toEqual(['gemini'])
    expect(result.attempts.filter((attempt) => attempt.outcome === 'skipped').map((attempt) => [attempt.provider, attempt.reason])).toEqual([
      ['claude', REASON_NO_KEY],
      ['openai', REASON_NO_KEY],
    ])
  })

  it('SC-4302: en todas las combinaciones de una, dos y tres llaves, el que tiene llave responde y el que no, no se llama', async () => {
    const subsets = Array.from({ length: 7 }, (_, mask) => PAID_PROVIDERS.filter((_provider, index) => ((mask + 1) >> index) & 1))
    for (const subset of subsets) {
      const keys = Object.fromEntries(subset.map((provider) => [provider, FAKE_KEYS[provider]]))
      for (const provider of PAID_PROVIDERS) {
        const adapters = all({})
        const port = testPort({ adapters, keys })
        const others = PAID_PROVIDERS.filter((other) => other !== provider)
        const outcome = await port.generateJson({ ...request, prefer: provider, exclude: others }).catch((caught: unknown) => caught)
        if (subset.includes(provider)) {
          expect(outcome, `${subset.join('+')} → ${provider}`).toMatchObject({ provider })
        } else {
          expect(outcome, `${subset.join('+')} → ${provider}`).toBeInstanceOf(ProvidersUnavailableError)
          expect((outcome as ProvidersUnavailableError).attempts).toEqual([expect.objectContaining({ provider, outcome: 'skipped', reason: REASON_NO_KEY })])
          expect(adapters[provider].jsonCalls).toHaveLength(0)
        }
      }
    }
  })

  it('exclude saca a Gemini aunque sea el más barato', async () => {
    const adapters = all({})
    const result = await testPort({ adapters }).generateJson({ ...request, task: 'balanced', exclude: ['gemini'] })
    expect(result.provider).toBe('claude')
    expect(adapters.gemini.jsonCalls).toHaveLength(0)
  })

  it('con el libro en el techo se rechaza antes de llamar a nadie', async () => {
    const budget = createMemoryBudgetRepo()
    await budget.reserve('2026-11', BUDGET_CAP_MICRO, BUDGET_CAP_MICRO)
    const adapters = all({})
    await expect(testPort({ adapters, budget }).generateJson(request)).rejects.toBeInstanceOf(BudgetExhaustedError)
    for (const adapter of Object.values(adapters)) expect(adapter.jsonCalls).toHaveLength(0)
  })

  it('Mongo caído al reservar: falla cerrado y no llama a nadie', async () => {
    const down: BudgetRepo = {
      reserve: async () => Promise.reject(new Error('database unavailable')),
      settle: async () => Promise.reject(new Error('database unavailable')),
      mark: async () => false,
      get: async () => null,
    }
    const adapters = all({})
    await expect(testPort({ adapters, budget: down }).generateJson(request)).rejects.toBeInstanceOf(BudgetUnavailableError)
    for (const adapter of Object.values(adapters)) expect(adapter.jsonCalls).toHaveLength(0)
  })

  it('modo local: responde el simulador con simulate() y, sin él, da un error claro', async () => {
    const port = testPort({ adapters: {}, mode: 'local' })
    const result = await port.generateJson({ ...request, simulate: () => ({ ok: true }) })
    expect(result).toMatchObject({ provider: 'simulator', model: 'simulador', costUsd: 0, data: { ok: true } })
    await expect(port.generateJson(request)).rejects.toBeInstanceOf(SimulatorMissingError)
    expect(port.availableProviders()).toEqual(['simulator'])
  })

  it('modo apagado: no llama a nadie', async () => {
    const port = testPort({ adapters: all({}), mode: 'off' })
    await expect(port.generateJson(request)).rejects.toBeInstanceOf(ProvidersUnavailableError)
    expect(port.availableProviders()).toEqual([])
  })
})
