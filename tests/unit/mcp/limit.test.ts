import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { checkServerLimits, checkToolLimit, dailyCounterKey, MCP_GLOBAL_KEY, McpLimitUnavailableError } = await import('@/lib/mcp/core/limit')
const { SPEND_GLOBAL_KEY } = await import('@/lib/ai/spend')
const { getRepos, registerRepoFactory } = await import('@/lib/data')
const { createMemoryRepos } = await import('@/lib/data/memory')
const { RATE_LIMITS } = await import('@/lib/security/rate-limit')

const LIMITS = { visitor: 'mcp', daily: 'mcpDaily' } as const

function headers(ip: string) {
  return new Headers({ 'x-forwarded-for': ip })
}

beforeEach(() => {
  vi.stubEnv('MONGODB_INTEGRAL_DB', '')
  registerRepoFactory(() => createMemoryRepos())
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('límite del MCP (FR-4407, FR-4409)', () => {
  it('las acciones de la base son las de la spec', () => {
    expect(RATE_LIMITS.mcp).toEqual({ limit: 60, windowMs: 10 * 60_000 })
    expect(RATE_LIMITS.mcpMatch).toEqual({ limit: 10, windowMs: 60 * 60_000 })
    expect(RATE_LIMITS.mcpDaily).toEqual({ limit: 3000, windowMs: 24 * 60 * 60_000 })
  })

  it('el contador diario usa la clave global de spend.ts, la que lee el tablero de la 045', () => {
    expect(MCP_GLOBAL_KEY).toBe(SPEND_GLOBAL_KEY)
    expect(dailyCounterKey('mcpDaily')).toBe('mcpDaily:global')
  })

  it('cuenta por hash de la IP: la IP en claro no queda en ninguna clave', async () => {
    const now = new Date('2026-11-26T12:00:00Z')
    expect(await checkServerLimits(headers('203.0.113.9'), LIMITS, now)).toEqual({ allowed: true })
    const repo = getRepos().rateLimits
    expect((await repo.peek('mcpDaily:global'))?.count).toBe(1)
    expect(await repo.peek('mcp:203.0.113.9')).toBeNull()
  })

  it('pasado el límite por IP dice cuánto esperar y no suma en el global', async () => {
    const now = new Date('2026-11-26T12:00:00Z')
    for (let i = 0; i < 60; i += 1) await checkServerLimits(headers('203.0.113.10'), LIMITS, now)
    const verdict = await checkServerLimits(headers('203.0.113.10'), LIMITS, new Date(now.getTime() + 60_000))
    expect(verdict).toEqual({ allowed: false, scope: 'visitor', retryAfterSeconds: 540 })
    expect((await getRepos().rateLimits.peek('mcpDaily:global'))?.count).toBe(60)
  })

  it('el límite de una herramienta va aparte, por IP', async () => {
    const now = new Date('2026-11-26T12:00:00Z')
    for (let i = 0; i < 10; i += 1) expect(await checkToolLimit(headers('203.0.113.11'), 'mcpMatch', now)).toEqual({ allowed: true })
    expect(await checkToolLimit(headers('203.0.113.11'), 'mcpMatch', now)).toMatchObject({ allowed: false, scope: 'tool' })
    expect(await checkToolLimit(headers('203.0.113.12'), 'mcpMatch', now)).toEqual({ allowed: true })
  })

  it('si el repositorio falla, lanza McpLimitUnavailableError', async () => {
    const memory = createMemoryRepos()
    registerRepoFactory(() => ({ ...memory, rateLimits: { ...memory.rateLimits, hit: () => Promise.reject(new Error('caída')) } }))
    await expect(checkServerLimits(headers('203.0.113.13'), LIMITS)).rejects.toBeInstanceOf(McpLimitUnavailableError)
    await expect(checkToolLimit(headers('203.0.113.13'), 'mcpMatch')).rejects.toBeInstanceOf(McpLimitUnavailableError)
  })
})