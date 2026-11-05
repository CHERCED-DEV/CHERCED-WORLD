import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = { headers: new Headers() }

vi.mock('next/headers', () => ({ headers: async () => request.headers }))

const { toggleReaction } = await import('@/lib/actions/reactions')
const { GET } = await import('@/app/api/reactions/[postId]/route')
const { getRepos, registerRepoFactory } = await import('@/lib/data')
const { createMemoryRepos } = await import('@/lib/data/memory')
const { createUnavailableRepos } = await import('@/lib/data/mongo/unavailable')
const { toReactionCounts } = await import('@/lib/data/mongo/mappers')
const { reactionWrite } = await import('@/lib/data/mongo/reactions')
const { RATE_LIMITS, rateLimitKey } = await import('@/lib/security/rate-limit')
const { ipHash } = await import('@/lib/security/ip')

const useIp = (ip: string) => {
  request.headers = new Headers({ 'x-forwarded-for': ip })
}

const get = (postId: string) => GET(new Request(`http://localhost/api/reactions/${postId}`), { params: Promise.resolve({ postId }) })

beforeEach(() => {
  useIp('203.0.113.50')
  registerRepoFactory(() => createMemoryRepos())
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('toggleReaction', () => {
  it('suma una reacción y devuelve solo los contadores', async () => {
    const result = await toggleReaction('post1', 'clap', 'add')
    expect(result).toEqual({ ok: true, data: { counts: { clap: 1, idea: 0, fire: 0 } } })
    expect(await getRepos().reactions.counts('post1')).toEqual({ clap: 1, idea: 0, fire: 0 })
  })

  it('un segundo clic la quita, y quitar de más nunca baja de cero (piso)', async () => {
    await toggleReaction('post1', 'idea', 'add')
    expect(await toggleReaction('post1', 'idea', 'remove')).toEqual({ ok: true, data: { counts: { clap: 0, idea: 0, fire: 0 } } })
    expect(await toggleReaction('post1', 'idea', 'remove')).toEqual({ ok: true, data: { counts: { clap: 0, idea: 0, fire: 0 } } })
  })

  it.each([
    ['un tipo fuera del enum', ['post1', 'heart', 'add']],
    ['una operación desconocida', ['post1', 'clap', 'toggle']],
    ['un post que no existe', ['post99', 'clap', 'add']],
    ['un postId con ruta', ['../post1', 'clap', 'add']],
    ['un objeto en vez de texto', [{ $gt: '' }, 'clap', 'add']],
  ])('rechaza %s como validation, sin escribir ni gastar el límite', async (_case, args) => {
    const [postId, kind, op] = args as [string, 'clap', 'add']
    expect(await toggleReaction(postId, kind, op)).toEqual({ ok: false, error: 'validation' })
    expect(await getRepos().reactions.counts('post1')).toEqual({ clap: 0, idea: 0, fire: 0 })
    const limit = await getRepos().rateLimits.hit(rateLimitKey('reaction', ipHash('203.0.113.50')), RATE_LIMITS.reaction, new Date())
    expect(limit.allowed).toBe(true)
  })

  it('limita a 10 cada 10 minutos por huella de IP; 50 clics no pasan del límite', async () => {
    expect(RATE_LIMITS.reaction).toEqual({ limit: 10, windowMs: 600_000 })
    const results = []
    for (let i = 0; i < 50; i++) results.push(await toggleReaction('post2', 'fire', 'add'))
    expect(results.filter((r) => r.ok)).toHaveLength(10)
    const rejected = results.slice(10)
    expect(rejected.every((r) => !r.ok && r.error === 'rate_limited' && (r.retryAfterMs ?? 0) > 0)).toBe(true)
    expect((await getRepos().reactions.counts('post2')).fire).toBe(10)

    useIp('198.51.100.7')
    expect((await toggleReaction('post2', 'fire', 'add')).ok).toBe(true)
  })

  it('el límite cuenta sumas y restas juntas', async () => {
    for (let i = 0; i < 5; i++) {
      await toggleReaction('post3', 'clap', 'add')
      await toggleReaction('post3', 'clap', 'remove')
    }
    expect(await toggleReaction('post3', 'clap', 'add')).toMatchObject({ ok: false, error: 'rate_limited' })
  })

  it('la huella guardada es un HMAC: nunca la IP en claro', async () => {
    const ip = '192.0.2.123'
    useIp(ip)
    const hits: string[] = []
    const repos = createMemoryRepos()
    const hit = repos.rateLimits.hit.bind(repos.rateLimits)
    repos.rateLimits.hit = (key, rule, now) => {
      hits.push(key)
      return hit(key, rule, now)
    }
    registerRepoFactory(() => repos)
    await toggleReaction('post1', 'clap', 'add')
    expect(hits).toEqual([`reaction:${ipHash(ip)}`])
    expect(hits[0]).not.toContain(ip)
    expect(hits[0]).toMatch(/^reaction:[0-9a-f]{64}$/)
  })

  it('si la base no responde devuelve unavailable sin detalles', async () => {
    registerRepoFactory(createUnavailableRepos)
    expect(await toggleReaction('post1', 'clap', 'add')).toEqual({ ok: false, error: 'unavailable' })
  })
})

describe('GET /api/reactions/[postId]', () => {
  it('200 con exactamente clap, idea y fire, y caché pública de 30 s', async () => {
    await getRepos().reactions.apply('post1', 'clap', 'add')
    const response = await get('post1')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, max-age=30')
    expect(await response.json()).toEqual({ clap: 1, idea: 0, fire: 0 })
  })

  it('404 para un post que no existe', async () => {
    const response = await get('no-existe')
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'not_found' })
  })

  it('503 { error: unavailable } si la base no responde', async () => {
    registerRepoFactory(createUnavailableRepos)
    const response = await get('post1')
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toBe('{"error":"unavailable"}')
  })
})

describe('Mongo: documentos y escrituras de post_reactions', () => {
  it('lee contadores sanos y trata lo dañado como cero', () => {
    expect(toReactionCounts(null)).toEqual({ clap: 0, idea: 0, fire: 0 })
    expect(toReactionCounts({ clap: 3, idea: -2, fire: 1.5 })).toEqual({ clap: 3, idea: 0, fire: 0 })
    expect(toReactionCounts({ clap: '7' as unknown as number })).toEqual({ clap: 0, idea: 0, fire: 0 })
    expect(Object.keys(toReactionCounts({ clap: 1, _id: 'post1', updatedAt: new Date() } as never)).sort()).toEqual(['clap', 'fire', 'idea'])
  })

  it('sumar es un $inc atómico con upsert', () => {
    const now = new Date('2026-11-05T10:00:00Z')
    expect(reactionWrite('post1', 'clap', 'add', now)).toEqual({
      filter: { _id: 'post1' },
      update: { $inc: { clap: 1 }, $set: { updatedAt: now } },
      upsert: true,
    })
  })

  it('restar solo aplica si el contador es mayor que cero, y no crea documentos', () => {
    const now = new Date('2026-11-05T10:00:00Z')
    expect(reactionWrite('post1', 'fire', 'remove', now)).toEqual({
      filter: { _id: 'post1', fire: { $gt: 0 } },
      update: { $inc: { fire: -1 }, $set: { updatedAt: now } },
      upsert: false,
    })
  })
})
