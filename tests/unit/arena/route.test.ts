import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type * as ArenaModule from '@/lib/ai/providers/arena'
import type { PaidProviderId } from '@/lib/ai/providers/types'
import type { ArenaCall } from './fake-adapter'

const state = vi.hoisted(() => ({ account: null as null | { account: { id: string } }, calls: [] as unknown[], failing: [] as string[], estimate: null as number | null }))

vi.mock('@/lib/auth/accounts', () => ({ getAccountState: async () => state.account }))

vi.mock('@/lib/ai/providers/arena', async (importOriginal) => {
  const original = await importOriginal<typeof ArenaModule>()
  return { ...original, comparisonEstimateUsd: (...args: Parameters<typeof original.comparisonEstimateUsd>) => state.estimate ?? original.comparisonEstimateUsd(...args) }
})

vi.mock('@/lib/ai/providers/adapters', async () => {
  const { arenaAdapter } = await import('./fake-adapter')
  return {
    PORT_TIMEOUT_MS: 1000,
    loadAdapter: async (provider: PaidProviderId) => arenaAdapter(provider, state.calls as ArenaCall[], { fail: state.failing.includes(provider) }),
  }
})

const { GET, POST } = await import('@/app/api/ailab/arena/route')
const { getRepos, registerRepoFactory } = await import('@/lib/data')
const { createMemoryRepos } = await import('@/lib/data/memory')
const { BUDGET_CAP_MICRO } = await import('@/lib/ai/budget/config')
const { FAKE_KEYS } = await import('../providers/support')
const { arenaRunSchema } = await import('@/content/ailab/arena/results')
const { RATE_LIMITS } = await import('@/lib/security/rate-limit')

const ORIGIN = 'http://localhost'

function post(body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (origin) headers.origin = origin
  return POST(new NextRequest(`${ORIGIN}/api/ailab/arena`, { method: 'POST', headers, body: JSON.stringify(body) }))
}

const FIXED = { lang: 'es', taskId: 'citas-es', consent: true }

function keys(providers: readonly PaidProviderId[]) {
  vi.stubEnv('GEMINI_API_KEY', providers.includes('gemini') ? FAKE_KEYS.gemini : '')
  vi.stubEnv('ANTHROPIC_API_KEY', providers.includes('claude') ? FAKE_KEYS.claude : '')
  vi.stubEnv('OPENAI_API_KEY', providers.includes('openai') ? FAKE_KEYS.openai : '')
}

beforeEach(() => {
  registerRepoFactory(() => createMemoryRepos())
  state.account = { account: { id: 'cuenta-1' } }
  state.calls = []
  state.failing = []
  state.estimate = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw new Error('red real no permitida en pruebas')
  })
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('MONGODB_INTEGRAL_DB', '')
  keys(['gemini', 'claude', 'openai'])
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/ailab/arena (FR-4313)', () => {
  it('revisa el origen', async () => {
    expect((await post(FIXED, 'https://otro.example')).status).toBe(403)
    expect((await post(FIXED, null)).status).toBe(403)
    expect(state.calls).toHaveLength(0)
  })

  it('sin cuenta: pide entrar y no llama a nadie', async () => {
    state.account = null
    const response = await post(FIXED)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'account' })
    expect(state.calls).toHaveLength(0)
  })

  it('sin el consentimiento de proveedores no se envía nada', async () => {
    const response = await post({ ...FIXED, consent: false })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'consent' })
    expect(state.calls).toHaveLength(0)
  })

  it('valida la entrada: tarea que no existe, libre de más de 1.000 caracteres o muy corta', async () => {
    expect((await post({ ...FIXED, taskId: 'no-existe' })).status).toBe(400)
    const long = await post({ lang: 'es', free: 'x'.repeat(1001), consent: true })
    expect(long.status).toBe(413)
    expect(await long.json()).toEqual({ error: 'too_long' })
    expect((await post({ lang: 'es', free: 'hola', consent: true })).status).toBe(400)
    expect(state.calls).toHaveLength(0)
  })

  it('corre las tres columnas y los jueces y devuelve una corrida en vivo válida, privada', async () => {
    const response = await post(FIXED)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    const { run } = await response.json()
    expect(arenaRunSchema.parse(run)).toMatchObject({ mode: 'vivo', simulated: false })
    expect(run.cases[0].columns.map((column: { status: string }) => column.status)).toEqual(['ok', 'ok', 'ok'])
    expect(run.cases[0].columns.every((column: { provider: string; judge: { provider: string } }) => column.judge.provider !== column.provider)).toBe(true)
    expect(JSON.stringify(run)).not.toMatch(/sk-ant-|sk-proj-|AIza/)
  })

  it('tarea libre: no hay nota de reglas, solo la del juez', async () => {
    const { run } = await (await post({ lang: 'es', free: 'Explica qué es un fallback en dos frases.', consent: true })).json()
    expect(run.cases[0]).toMatchObject({ taskId: null, kind: null })
    for (const column of run.cases[0].columns) {
      expect(column.rules).toBeNull()
      expect(column.judge.score).toBe(3)
    }
  })

  it('3 comparaciones por cuenta al día y 10 en total', async () => {
    for (let index = 0; index < RATE_LIMITS.arena.limit; index++) expect((await post(FIXED)).status).toBe(200)
    const fourth = await post(FIXED)
    expect(fourth.status).toBe(429)
    expect(await fourth.json()).toEqual({ error: 'rate_limited' })
    for (let index = 0; index < RATE_LIMITS.arenaDaily.limit - RATE_LIMITS.arena.limit; index++) {
      state.account = { account: { id: `cuenta-${index + 2}` } }
      expect((await post(FIXED)).status).toBe(200)
    }
    state.account = { account: { id: 'cuenta-nueva' } }
    const capped = await post(FIXED)
    expect(capped.status).toBe(429)
    expect(await capped.json()).toEqual({ error: 'daily_cap' })
  })

  it('con el libro en el techo se rechaza antes de llamar a nadie y sin gastar el cupo', async () => {
    await getRepos().budget.reserve(new Date().toISOString().slice(0, 7), BUDGET_CAP_MICRO, BUDGET_CAP_MICRO)
    const response = await post(FIXED)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'budget' })
    expect(state.calls).toHaveLength(0)
    expect(await getRepos().rateLimits.peek('arena:cuenta-1')).toBeNull()
  })

  it('un estimado de más de 0,05 USD no se corre ni gasta el cupo', async () => {
    state.estimate = 0.0501
    const response = await post(FIXED)
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: 'too_expensive' })
    expect(state.calls).toHaveLength(0)
    expect(await getRepos().rateLimits.peek('arena:cuenta-1')).toBeNull()
    state.estimate = 0.05
    expect((await post(FIXED)).status).toBe(200)
  })

  it('con una llave ausente su columna dice «no activo» y las otras dos funcionan', async () => {
    keys(['gemini', 'openai'])
    const { run } = await (await post(FIXED)).json()
    expect(run.cases[0].columns.map((column: { provider: string; status: string }) => [column.provider, column.status])).toEqual([
      ['gemini', 'ok'],
      ['claude', 'inactive'],
      ['openai', 'ok'],
    ])
  })

  it('si un proveedor falla, su columna lo dice sin la llave y las otras siguen', async () => {
    state.failing = ['openai']
    const { run } = await (await post(FIXED)).json()
    const openai = run.cases[0].columns.find((column: { provider: string }) => column.provider === 'openai')
    expect(openai).toMatchObject({ status: 'error', reason: expect.stringContaining('503') })
    expect(JSON.stringify(openai)).not.toContain(FAKE_KEYS.openai)
  })

  it('sin llaves en local responde el simulador, marcado como tal', async () => {
    keys([])
    const response = await post(FIXED)
    const { run } = await response.json()
    expect(run).toMatchObject({ simulated: true, mode: 'vivo' })
    expect(run.cases[0].columns.every((column: { servedBy: string }) => column.servedBy === 'simulator')).toBe(true)
    expect(state.calls).toHaveLength(0)
  })

  it('sin llaves en Vercel queda apagado (503 off) y GET lo dice', async () => {
    keys([])
    vi.stubEnv('VERCEL', '1')
    expect((await post(FIXED)).status).toBe(503)
    expect(await (await GET()).json()).toEqual({ mode: 'off', signedIn: true })
  })
})
