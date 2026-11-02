import { createHash, createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRateLimitRepo } from '@/lib/data/memory'
import { isHoneypotFilled, isTooFast, MIN_FILL_MS, parseRenderedAt } from '@/lib/security/anti-spam'
import { goneHandlers, goneResponse } from '@/lib/security/gone'
import { clientIp, ipHash, UNKNOWN_IP } from '@/lib/security/ip'
import { DATABASE_ENV, serverKey } from '@/lib/security/keys'
import { describeError, logServerError } from '@/lib/security/log'
import { hitRateLimit, RATE_LIMITS, rateLimitKey, resetRateLimit } from '@/lib/security/rate-limit'

const headers = (values: Record<string, string>) => new Headers(values)

describe('clientIp', () => {
  it('toma la primera IP de x-forwarded-for', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
  })

  it('usa x-real-ip si no hay x-forwarded-for', () => {
    expect(clientIp(headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
  })

  it('cae a un valor fijo sin cabeceras o con valores absurdos', () => {
    expect(clientIp(headers({}))).toBe(UNKNOWN_IP)
    expect(clientIp(headers({ 'x-forwarded-for': 'x'.repeat(200) }))).toBe(UNKNOWN_IP)
  })
})

describe('ipHash', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('es HMAC-SHA256 con clave SHA-256 de la variable existente', () => {
    vi.stubEnv(DATABASE_ENV, 'mongodb://ejemplo.invalid/db')
    const key = createHash('sha256').update('mongodb://ejemplo.invalid/db').digest()
    const expected = createHmac('sha256', key).update('203.0.113.7').digest('hex')
    expect(serverKey().equals(key)).toBe(true)
    expect(ipHash('203.0.113.7')).toBe(expected)
  })

  it('nunca contiene la IP en claro y es determinista', () => {
    vi.stubEnv(DATABASE_ENV, '')
    const hashed = ipHash('203.0.113.7')
    expect(hashed).toMatch(/^[0-9a-f]{64}$/)
    expect(hashed).not.toContain('203')
    expect(ipHash('203.0.113.7')).toBe(hashed)
    expect(ipHash('203.0.113.8')).not.toBe(hashed)
  })

  it('cambia de clave cuando existe la variable', () => {
    vi.stubEnv(DATABASE_ENV, '')
    const local = ipHash('203.0.113.7')
    vi.stubEnv(DATABASE_ENV, 'mongodb://otra.invalid/db')
    expect(ipHash('203.0.113.7')).not.toBe(local)
  })
})

describe('reglas de rate limit (data-model §2)', () => {
  it('declara los límites de contacto, comentarios, login y setup', () => {
    expect(RATE_LIMITS.contact).toEqual({ limit: 3, windowMs: 600_000 })
    expect(RATE_LIMITS.comment).toEqual({ limit: 3, windowMs: 600_000 })
    expect(RATE_LIMITS.login).toEqual({ limit: 5, windowMs: 900_000, blockMs: 900_000 })
    expect(RATE_LIMITS.setup).toEqual({ limit: 5, windowMs: 900_000, blockMs: 900_000 })
    expect(rateLimitKey('contact', 'abc')).toBe('contact:abc')
  })

  it('el cuarto contacto en 10 minutos se rechaza y la ventana se reinicia', async () => {
    const repo = createMemoryRateLimitRepo()
    const t0 = new Date('2026-11-01T00:00:00Z')
    for (let i = 0; i < 3; i++) expect((await hitRateLimit(repo, 'contact', 'ip', t0)).allowed).toBe(true)
    const blocked = await hitRateLimit(repo, 'contact', 'ip', new Date(t0.getTime() + 60_000))
    expect(blocked).toEqual({ allowed: false, retryAfterMs: 540_000 })
    expect((await hitRateLimit(repo, 'contact', 'ip', new Date(t0.getTime() + 600_000))).allowed).toBe(true)
  })

  it('el sexto login en 15 minutos queda bloqueado 15 minutos y reset lo libera', async () => {
    const repo = createMemoryRateLimitRepo()
    const t0 = new Date('2026-11-01T00:00:00Z')
    for (let i = 0; i < 5; i++) expect((await hitRateLimit(repo, 'login', 'ip', t0)).allowed).toBe(true)
    expect(await hitRateLimit(repo, 'login', 'ip', t0)).toEqual({ allowed: false, retryAfterMs: 900_000 })
    await resetRateLimit(repo, 'login', 'ip')
    expect((await hitRateLimit(repo, 'login', 'ip', t0)).allowed).toBe(true)
  })

  it('separa acciones e IPs', async () => {
    const repo = createMemoryRateLimitRepo()
    const t0 = new Date()
    for (let i = 0; i < 3; i++) await hitRateLimit(repo, 'contact', 'a', t0)
    expect((await hitRateLimit(repo, 'contact', 'b', t0)).allowed).toBe(true)
    expect((await hitRateLimit(repo, 'comment', 'a', t0)).allowed).toBe(true)
  })
})

describe('anti-spam', () => {
  const form = (values: Record<string, string>) => {
    const data = new FormData()
    for (const [key, value] of Object.entries(values)) data.set(key, value)
    return data
  }

  it('detecta el campo trampa', () => {
    expect(isHoneypotFilled(form({}))).toBe(false)
    expect(isHoneypotFilled(form({ website: '' }))).toBe(false)
    expect(isHoneypotFilled(form({ website: '   ' }))).toBe(false)
    expect(isHoneypotFilled(form({ website: 'https://spam.example' }))).toBe(true)
  })

  it('exige al menos 3 s entre el render y el envío', () => {
    const now = new Date('2026-11-01T00:00:10Z')
    const at = (ms: number) => form({ renderedAt: String(now.getTime() - ms) })
    expect(MIN_FILL_MS).toBe(3000)
    expect(isTooFast(at(0), now)).toBe(true)
    expect(isTooFast(at(2999), now)).toBe(true)
    expect(isTooFast(at(3000), now)).toBe(false)
    expect(isTooFast(at(60_000), now)).toBe(false)
  })

  it('trata como bot un renderedAt ausente o con basura', () => {
    const now = new Date()
    expect(isTooFast(form({}), now)).toBe(true)
    expect(isTooFast(form({ renderedAt: 'ayer' }), now)).toBe(true)
    expect(isTooFast(form({ renderedAt: '12' }), now)).toBe(true)
    expect(parseRenderedAt(form({ renderedAt: ' 1761955200000 ' }))).toBe(1761955200000)
  })
})

describe('logs sin datos personales (FR-114)', () => {
  it('solo registra nombre y código del error, nunca el mensaje', () => {
    const error = Object.assign(new Error('E11000 dup key: { email: "ana@example.com" }'), { code: 11000, codeName: 'DuplicateKey' })
    expect(describeError(error)).toBe('Error code=11000 codeName=DuplicateKey')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logServerError('contact.save', error)
    expect(spy).toHaveBeenCalledWith('[CHERCED-WORLD] contact.save: Error code=11000 codeName=DuplicateKey')
    expect(JSON.stringify(spy.mock.calls)).not.toContain('ana@example.com')
  })

  it('descarta códigos con forma rara y valores que no son errores', () => {
    const error = Object.assign(new TypeError('x'), { code: 'ana@example.com tiene +57 300 123 4567' })
    expect(describeError(error)).toBe('TypeError')
    expect(describeError('ana@example.com')).toBe('UnknownError')
  })
})

describe('rutas 2023 retiradas', () => {
  it('responden 410 en todos los métodos sin caché', async () => {
    for (const handler of Object.values(goneHandlers)) {
      const response = await handler()
      expect(response.status).toBe(410)
      expect(response.headers.get('cache-control')).toBe('no-store')
    }
    expect(await goneResponse().json()).toEqual({ error: 'gone' })
  })
})
