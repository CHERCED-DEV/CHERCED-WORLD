import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type * as RunModule from '@/lib/ai/gates/run'
import type { GateEvent } from '@/lib/ai/gates/view'
import type { PaidProviderId } from '@/lib/ai/providers/types'
import type { GatesCall, GatesScript } from './fake-adapter'

const state = vi.hoisted(() => ({ account: null as null | { account: { id: string } }, calls: [] as unknown[], script: {} as unknown, estimate: null as number | null }))

vi.mock('@/lib/auth/accounts', () => ({ getAccountState: async () => state.account }))

vi.mock('@/lib/ai/gates/run', async (importOriginal) => {
  const original = await importOriginal<typeof RunModule>()
  return { ...original, liveEstimateUsd: (...args: Parameters<typeof original.liveEstimateUsd>) => state.estimate ?? original.liveEstimateUsd(...args) }
})

vi.mock('@/lib/ai/providers/adapters', async () => {
  const { gatesAdapter } = await import('./fake-adapter')
  return {
    PORT_TIMEOUT_MS: 1000,
    loadAdapter: async (provider: PaidProviderId) => gatesAdapter(provider, state.calls as GatesCall[], state.script as GatesScript),
  }
})

const { GET, POST } = await import('@/app/api/ailab/gates/route')
const { getRepos, registerRepoFactory } = await import('@/lib/data')
const { createMemoryRepos } = await import('@/lib/data/memory')
const { BUDGET_CAP_MICRO } = await import('@/lib/ai/budget/config')
const { FAKE_KEYS } = await import('../providers/support')
const { gateRunSchema } = await import('@/lib/ai/gates/schema')
const { sealValid } = await import('@/lib/ai/gates/seal')
const { RATE_LIMITS } = await import('@/lib/security/rate-limit')

const ORIGIN = 'http://localhost'

const OWN = { lang: 'es', text: 'Quiero un formulario de contacto con nombre, correo, mensaje y adjuntos.', consent: true }

function post(body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (origin) headers.origin = origin
  return POST(new NextRequest(`${ORIGIN}/api/ailab/gates`, { method: 'POST', headers, body: JSON.stringify(body) }))
}

async function events(response: Response): Promise<GateEvent[]> {
  return (await response.text())
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GateEvent)
}

function keys(providers: readonly PaidProviderId[]) {
  vi.stubEnv('GEMINI_API_KEY', providers.includes('gemini') ? FAKE_KEYS.gemini : '')
  vi.stubEnv('ANTHROPIC_API_KEY', providers.includes('claude') ? FAKE_KEYS.claude : '')
  vi.stubEnv('OPENAI_API_KEY', providers.includes('openai') ? FAKE_KEYS.openai : '')
}

let fetchSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  registerRepoFactory(() => createMemoryRepos())
  state.account = { account: { id: 'cuenta-1' } }
  state.calls = []
  state.script = {}
  state.estimate = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw new Error('red real no permitida en pruebas')
  })
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('MONGODB_INTEGRAL_DB', '')
  keys(['gemini', 'claude', 'openai'])
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/ailab/gates (FR-4601, FR-4614)', () => {
  it('revisa el origen', async () => {
    expect((await post(OWN, 'https://otro.example')).status).toBe(403)
    expect((await post(OWN, null)).status).toBe(403)
    expect(state.calls).toHaveLength(0)
  })

  it('sin cuenta: pide entrar y no llama a nadie', async () => {
    state.account = null
    const response = await post(OWN)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'account' })
    expect(state.calls).toHaveLength(0)
  })

  it('sin el consentimiento de proveedores no se envía nada', async () => {
    const response = await post({ ...OWN, consent: false })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'consent' })
    expect(state.calls).toHaveLength(0)
  })

  it('valida el largo: más de 600 caracteres, muy corto o un ejemplo que no existe', async () => {
    const long = await post({ ...OWN, text: 'x'.repeat(601) })
    expect(long.status).toBe(413)
    expect(await long.json()).toEqual({ error: 'too_long' })
    expect((await post({ ...OWN, text: 'hola' })).status).toBe(400)
    expect((await post({ lang: 'es', exampleId: 'no-existe', consent: true })).status).toBe(400)
    expect((await post({ ...OWN, text: 'x'.repeat(600) })).status).toBe(200)
  })

  it('manda los pasos a medida que terminan y cierra con una corrida válida, sellada y privada', async () => {
    const response = await post(OWN)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('content-type')).toContain('application/x-ndjson')
    const stream = await events(response)
    const steps = stream.filter((event) => event.type === 'step')
    const done = stream.at(-1)
    expect(done?.type).toBe('done')
    if (done?.type !== 'done') return
    const run = gateRunSchema.parse(done.run)
    expect(run).toMatchObject({ mode: 'vivo', simulated: false, request: { source: 'propio' } })
    expect(steps.map((event) => (event.type === 'step' ? event.step : null))).toEqual(run.steps)
    expect(sealValid(run, 'cuenta-1')).toBe(true)
    expect(sealValid(run, 'otra-cuenta')).toBe(false)
    expect(run.steps.filter((step) => step.kind === 'revisar').every((step) => step.provider !== run.writer.provider)).toBe(true)
    expect(JSON.stringify(stream)).not.toMatch(/sk-ant-|sk-proj-|AIza/)
  })

  it('un pedido de ejemplo también corre en vivo', async () => {
    const stream = await events(await post({ lang: 'en', exampleId: 'citas', consent: true }))
    const done = stream.at(-1)
    expect(done?.type === 'done' && done.run.request).toMatchObject({ source: 'ejemplo', exampleId: 'citas', lang: 'en' })
  })

  it('una URL dentro del pedido se acepta como texto y el servidor no la visita', async () => {
    const text = 'Un formulario como el de https://ejemplo.invalid/contacto, con adjuntos y aviso por correo.'
    const stream = await events(await post({ ...OWN, text }))
    expect(stream.at(-1)?.type).toBe('done')
    expect(fetchSpy).not.toHaveBeenCalled()
    expect((state.calls as GatesCall[])[0]!.prompt).toContain('https://ejemplo.invalid/contacto')
  })

  it('2 corridas por cuenta al día y 6 en total, cobradas solo después de pasar las revisiones', async () => {
    for (let index = 0; index < RATE_LIMITS.gates.limit; index++) expect((await post(OWN)).status).toBe(200)
    const third = await post(OWN)
    expect(third.status).toBe(429)
    expect(await third.json()).toEqual({ error: 'rate_limited' })
    for (let index = 0; index < RATE_LIMITS.gatesDaily.limit - RATE_LIMITS.gates.limit; index++) {
      state.account = { account: { id: `cuenta-${index + 2}` } }
      expect((await post(OWN)).status).toBe(200)
    }
    state.account = { account: { id: 'cuenta-nueva' } }
    const capped = await post(OWN)
    expect(capped.status).toBe(429)
    expect(await capped.json()).toEqual({ error: 'daily_cap' })
    const calls = state.calls.length
    expect((await post(OWN)).status).toBe(429)
    expect(state.calls).toHaveLength(calls)
  })

  it('con el techo mensual alcanzado se rechaza antes de llamar a nadie y sin gastar el cupo', async () => {
    await getRepos().budget.reserve(new Date().toISOString().slice(0, 7), BUDGET_CAP_MICRO, BUDGET_CAP_MICRO)
    const response = await post(OWN)
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'budget' })
    expect(state.calls).toHaveLength(0)
    expect(await getRepos().rateLimits.peek('gates:cuenta-1')).toBeNull()
  })

  it('SC-4605: un estimado de más de 0,05 USD no se corre ni gasta el cupo, y el real de una corrida no pasa de 0,05 USD', async () => {
    state.estimate = 0.0501
    const response = await post(OWN)
    expect(response.status).toBe(422)
    expect(await response.json()).toEqual({ error: 'too_expensive' })
    expect(state.calls).toHaveLength(0)
    expect(await getRepos().rateLimits.peek('gates:cuenta-1')).toBeNull()
    state.estimate = null
    for (const providers of [['gemini', 'claude'], ['gemini', 'claude', 'openai']] as const) {
      keys(providers)
      state.account = { account: { id: `cuenta-${providers.length}` } }
      const done = (await events(await post(OWN))).at(-1)
      expect(done?.type).toBe('done')
      if (done?.type === 'done') expect(done.run.totalUsd).toBeLessThanOrEqual(0.05)
    }
  })

  it('un redactor que no valida dos veces cierra el flujo con un error claro, sin revisores', async () => {
    state.script = { writer: () => ({ raw: 'no es json' }) } satisfies GatesScript
    const stream = await events(await post(OWN))
    expect(stream.at(-1)).toEqual({ type: 'error', error: 'writer' })
    expect((state.calls as GatesCall[]).every((call) => call.role === 'writer')).toBe(true)
  })

  it('sin llaves y sin base responde «apagado»; sin llaves y con la base en memoria responde el simulador', async () => {
    keys([])
    vi.stubEnv('MONGODB_INTEGRAL_DB', 'mongodb://ejemplo.invalid/db')
    expect((await post(OWN)).status).toBe(503)
    vi.stubEnv('MONGODB_INTEGRAL_DB', '')
    const done = (await events(await post(OWN))).at(-1)
    expect(done?.type === 'done' && done.run).toMatchObject({ simulated: true, totalUsd: 0 })
    expect(state.calls).toHaveLength(0)
  })

  it('GET dice el modo y si hay cuenta, sin datos de nadie', async () => {
    expect(await (await GET()).json()).toEqual({ mode: 'live', signedIn: true })
    state.account = null
    expect(await (await GET()).json()).toEqual({ mode: 'live', signedIn: false })
  })
})
