import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request, resetRequest } from './request-mocks'
import * as blog from '@/app/api/blog/[[...slug]]/route'
import * as contactMe from '@/app/api/contactMe/[[...slug]]/route'
import * as customCMS from '@/app/api/customCMS/[[...slug]]/route'
import * as projects from '@/app/api/projects/[[...slug]]/route'
import * as sockets from '@/app/api/sockets/[[...slug]]/route'
import { GET as updates } from '@/app/api/admin/updates/route'
import { SESSION_COOKIE, startSession } from '@/lib/auth/session'
import { getRepos, registerRepoFactory } from '@/lib/data'
import { createMemoryRepos } from '@/lib/data/memory'
import type { Repos } from '@/lib/data/types'

let repos: Repos

beforeEach(() => {
  resetRequest()
  registerRepoFactory(() => createMemoryRepos())
  repos = getRepos()
})

async function withSession(): Promise<void> {
  const { token } = await startSession(repos.admin, new Date())
  request.cookies.set(SESSION_COOKIE, { name: SESSION_COOKIE, value: token, options: {} })
}

const get = (query = '') => updates(new NextRequest(`http://localhost/api/admin/updates${query}`))

describe('GET /api/admin/updates', () => {
  it('responde 401 sin sesión y sin ningún dato', async () => {
    await repos.messages.create({ name: 'Ana', email: 'ana@example.com', phone: null, message: 'x', consentAt: new Date() })
    const response = await get('?since=2020-01-01T00:00:00Z')
    expect(response.status).toBe(401)
    const body = await response.text()
    expect(body).toBe('{"error":"unauthorized"}')
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  it('con sesión devuelve contadores y cambios desde la fecha', async () => {
    await withSession()
    const since = new Date(Date.now() - 1000).toISOString()
    await repos.messages.create({ name: 'Ana', email: 'ana@example.com', phone: null, message: 'x', consentAt: new Date() })
    await repos.comments.create({ postId: 'post1', userName: 'L', email: 'l@example.com', comment: 'c', lang: 'es', consentAt: new Date() })
    const response = await get(`?since=${encodeURIComponent(since)}`)
    expect(response.status).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(Object.keys(body).sort()).toEqual(['comments', 'messages', 'now', 'pending', 'unread'])
    expect(body.unread).toBe(1)
    expect(body.pending).toBe(1)
    expect((body.messages as unknown[]).length).toBe(1)
    expect((body.comments as unknown[]).length).toBe(1)
    for (const change of [...(body.messages as object[]), ...(body.comments as object[])]) {
      expect(Object.keys(change).sort(), 'R4.1 B2: el sondeo solo lleva id y fecha, nunca el contenido').toEqual(['id', 'updatedAt'])
    }
    expect(JSON.stringify(body)).not.toMatch(/ana@example|l@example|"Ana"/)
    expect(new Date(String(body.now)).getTime()).not.toBeNaN()
  })

  it('sin since (o con basura) solo trae contadores', async () => {
    await withSession()
    await repos.messages.create({ name: 'Ana', email: 'ana@example.com', phone: null, message: 'x', consentAt: new Date() })
    for (const query of ['', '?since=ayer']) {
      const body = (await (await get(query)).json()) as { messages: unknown[]; unread: number }
      expect(body.messages).toEqual([])
      expect(body.unread).toBe(1)
    }
  })

  it('no desliza la sesión: el polling no cuenta como actividad', async () => {
    await withSession()
    const touch = vi.spyOn(repos.admin, 'touchSession')
    await get()
    expect(touch).not.toHaveBeenCalled()
  })

  it('si la base falla responde 503 sin detalles', async () => {
    await withSession()
    vi.spyOn(repos.messages, 'countUnread').mockRejectedValue(new Error('ana@example.com'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await get()
    expect(response.status).toBe(503)
    expect(await response.text()).toBe('{"error":"unavailable"}')
  })
})

describe('rutas API de 2023', () => {
  const routes = { contactMe, blog, sockets, customCMS, projects }

  it.each(Object.entries(routes))('/api/%s responde 410 en todos los métodos', async (_name, route) => {
    for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const) {
      const response = await route[method]()
      expect(response.status, method).toBe(410)
    }
  })
})
