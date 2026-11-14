import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const request = { headers: new Headers({ 'x-forwarded-for': '203.0.113.77' }) }

vi.mock('next/headers', () => ({ headers: async () => request.headers }))
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { GET, POST } = await import('@/app/api/ailab/match/route')
const { registerRepoFactory } = await import('@/lib/data')
const { createMemoryRepos } = await import('@/lib/data/memory')
const { MATCH_ENDPOINT, VACANCY_MAX, VACANCY_MIN } = await import('@/lib/ai/match/config')
const { RATE_LIMITS } = await import('@/lib/security/rate-limit')

const ORIGIN = 'http://localhost'

const VACANCY = [
  'Ingeniero de software senior',
  '',
  'Requisitos:',
  '- Aplicaciones web con React, Next.js y TypeScript',
  '- Arquitecturas orientadas a eventos en Azure o AWS',
  '- Kubernetes en producción',
].join('\n')

const GEMINI = JSON.stringify({
  rol: 'Ingeniero de software senior',
  requisitos: [{ texto: 'React y Next.js', tipo: 'obligatorio', nivel: 'fuerte', evidencia: ['project:2', 'project:404'], nota: 'Sí.' }],
  preguntas: ['¿Uno?'],
})

function post(body: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (origin) headers.origin = origin
  return POST(new NextRequest(`${ORIGIN}${MATCH_ENDPOINT}`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }))
}

let fetchSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  registerRepoFactory(() => createMemoryRepos())
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('MONGODB_INTEGRAL_DB', '')
  vi.stubEnv('GEMINI_API_KEY', '')
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw new Error('red real no permitida en pruebas')
  })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('ruta /api/ailab/match', () => {
  it('GET dice el modo: simulador en local, Gemini con clave y apagado en Vercel sin clave', async () => {
    expect(await (await GET()).json()).toEqual({ mode: 'local' })
    vi.stubEnv('GEMINI_API_KEY', 'clave-de-prueba')
    expect(await (await GET()).json()).toEqual({ mode: 'live' })
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.stubEnv('VERCEL', '1')
    expect(await (await GET()).json()).toEqual({ mode: 'off' })
  })

  it('rechaza peticiones de otro origen', async () => {
    const response = await post({ lang: 'es', vacancy: VACANCY }, 'https://otro.example')
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'forbidden' })
    expect((await post({ lang: 'es', vacancy: VACANCY }, null)).status).toBe(403)
  })

  it('apagada en Vercel sin clave responde 503 off', async () => {
    vi.stubEnv('VERCEL', '1')
    const response = await post({ lang: 'es', vacancy: VACANCY })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'off' })
  })

  it('valida el largo de la vacante', async () => {
    const short = await post({ lang: 'es', vacancy: 'x'.repeat(VACANCY_MIN - 1) })
    expect(short.status).toBe(400)
    expect(await short.json()).toEqual({ error: 'invalid' })
    const long = await post({ lang: 'es', vacancy: 'x'.repeat(VACANCY_MAX + 1) })
    expect(long.status).toBe(413)
    expect(await long.json()).toEqual({ error: 'too_long' })
    expect((await post('no es json')).status).toBe(400)
    expect((await post({ lang: 'es', vacancy: { $gt: '' } })).status).toBe(400)
  })

  it('en local usa el simulador, sin Google y sin costo', async () => {
    const response = await post({ lang: 'es', vacancy: VACANCY })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    const body = (await response.json()) as { mode: string; role: string; costUsd: number; requirements: unknown[] }
    expect(body).toMatchObject({ mode: 'local', role: 'Ingeniero de software senior', costUsd: 0 })
    expect(body.requirements.length).toBeGreaterThan(0)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('con clave llama a Gemini (simulado), limpia lo inventado y aplica 5 por visitante al día', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'clave-de-prueba')
    fetchSpy.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: GEMINI }] }, finishReason: 'STOP' }],
            usageMetadata: { promptTokenCount: 15_000, candidatesTokenCount: 500, totalTokenCount: 15_500 },
          }),
          { status: 200 },
        ),
    )
    expect(RATE_LIMITS.match).toEqual({ limit: 5, windowMs: 24 * 60 * 60_000 })
    expect(RATE_LIMITS.matchDaily).toEqual({ limit: 50, windowMs: 24 * 60 * 60_000 })
    const statuses: number[] = []
    for (let attempt = 0; attempt < 6; attempt += 1) statuses.push((await post({ lang: 'es', vacancy: VACANCY })).status)
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429])
    expect(fetchSpy).toHaveBeenCalledTimes(5)
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('gemini-3.8-flash:generateContent')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('clave-de-prueba')

    request.headers = new Headers({ 'x-forwarded-for': '198.51.100.9' })
    const fresh = await post({ lang: 'es', vacancy: VACANCY })
    const body = (await fresh.json()) as { mode: string; dropped: number; requirements: Array<{ evidence: Array<{ id: string }> }> }
    expect(body.mode).toBe('live')
    expect(body.dropped).toBe(1)
    expect(body.requirements[0]!.evidence.map((entry) => entry.id)).toEqual(['project:2'])
    const second = await post({ lang: 'es', vacancy: VACANCY })
    expect(second.status, 'otro visitante tiene su propio cupo').toBe(200)
    request.headers = new Headers({ 'x-forwarded-for': '203.0.113.77' })
  })

  it('traduce los errores de Google: sin saldo es "unavailable" y lo demás "failed"', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'clave-de-prueba')
    request.headers = new Headers({ 'x-forwarded-for': '192.0.2.1' })
    fetchSpy.mockImplementation(async () => new Response('{"error":{"message":"prepayment credits depleted"}}', { status: 402 }))
    const unavailable = await post({ lang: 'es', vacancy: VACANCY })
    expect(unavailable.status).toBe(503)
    expect(await unavailable.json()).toEqual({ error: 'unavailable' })
    request.headers = new Headers({ 'x-forwarded-for': '192.0.2.2' })
    fetchSpy.mockImplementation(async () => new Response('{}', { status: 500 }))
    const failed = await post({ lang: 'es', vacancy: VACANCY })
    expect(failed.status).toBe(502)
    expect(await failed.json()).toEqual({ error: 'failed' })
    request.headers = new Headers({ 'x-forwarded-for': '203.0.113.77' })
  })
})
