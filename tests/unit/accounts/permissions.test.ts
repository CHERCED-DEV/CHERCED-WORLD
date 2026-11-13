import { describe, expect, it } from 'vitest'
import { can, cleanPermissions, firstPanelPath, teamPermissions } from '@/lib/accounts/permissions'
import { googleClient, signInMode } from '@/lib/auth/google'
import { createMemoryAccountRepo } from '@/lib/data/memory/accounts'
import type { AccountRecord } from '@/lib/data/types'
import { canEditDraft } from '@/lib/editorial/model'

const NOW = new Date('2026-11-13T15:00:00Z')

const account: AccountRecord = {
  id: 'a1',
  googleSub: 'sub-1',
  email: 'ana@example.com',
  name: 'Ana',
  createdAt: NOW,
  lastLoginAt: NOW,
  blockedAt: null,
}

describe('permisos del equipo (FR-1707)', () => {
  it('una cuenta solo tiene los permisos que el autor le dio a su correo', () => {
    const grant = { email: 'ANA@example.com ', permissions: ['posts' as const], createdAt: NOW, updatedAt: NOW }
    expect(teamPermissions(account, grant)).toEqual(['posts'])
    expect(teamPermissions(account, { ...grant, email: 'otra@example.com' })).toEqual([])
    expect(teamPermissions({ ...account, blockedAt: NOW }, grant)).toEqual([])
    expect(teamPermissions(account, null)).toEqual([])
  })

  it('el autor puede todo; el equipo, solo lo suyo', () => {
    const team = { kind: 'team' as const, account, permissions: cleanPermissions(['comments', 'inventado']) }
    expect(team.permissions).toEqual(['comments'])
    expect(can({ kind: 'owner' }, 'messages')).toBe(true)
    expect(can(team, 'comments')).toBe(true)
    expect(can(team, 'messages')).toBe(false)
    expect(can(null, 'posts')).toBe(false)
    expect(firstPanelPath(team)).toBe('/inbox/comments')
    expect(firstPanelPath({ kind: 'owner' })).toBe('/inbox')
  })

  it('un invitado solo edita los borradores que escribió (FR-1708)', () => {
    const guest = { id: 'a1', name: 'Ana' }
    expect(canEditDraft({ author: guest }, guest)).toBe(true)
    expect(canEditDraft({ author: { id: 'b2', name: 'Otra' } }, guest)).toBe(false)
    expect(canEditDraft({ author: null }, guest)).toBe(false)
    expect(canEditDraft({ author: guest }, null)).toBe(true)
  })
})

describe('repositorio de cuentas en memoria', () => {
  it('reingresar con la misma cuenta de Google no crea otra', async () => {
    const repo = createMemoryAccountRepo()
    const first = await repo.upsertFromGoogle({ googleSub: 'sub-1', email: 'Ana@Example.com', name: 'Ana' }, NOW)
    const again = await repo.upsertFromGoogle({ googleSub: 'sub-1', email: 'ana@example.com', name: 'Ana P.' }, new Date(NOW.getTime() + 1000))
    expect(again.id).toBe(first.id)
    expect(again.name).toBe('Ana P.')
    expect(first.email).toBe('ana@example.com')
    expect(await repo.list()).toHaveLength(1)
  })

  it('borrar las sesiones de una cuenta no toca las de otra (FR-1710)', async () => {
    const repo = createMemoryAccountRepo()
    const session = { createdAt: NOW, lastActivityAt: NOW, expiresAt: new Date(NOW.getTime() + 1000) }
    await repo.createSession({ ...session, tokenHash: 'h1', accountId: 'a1' })
    await repo.createSession({ ...session, tokenHash: 'h2', accountId: 'b2' })
    await repo.deleteSessionsFor('a1')
    expect(await repo.getSession('h1')).toBeNull()
    expect(await repo.getSession('h2')).not.toBeNull()
  })

  it('los permisos se guardan por correo normalizado y se pueden quitar', async () => {
    const repo = createMemoryAccountRepo()
    await repo.setGrant(' Ana@Example.com', ['posts', 'comments'], NOW)
    expect((await repo.getGrant('ana@example.com'))?.permissions).toEqual(['posts', 'comments'])
    expect(await repo.removeGrant('ANA@example.com')).toBe(true)
    expect(await repo.getGrant('ana@example.com')).toBeNull()
  })
})

describe('modo de ingreso (FR-1703)', () => {
  it('con credenciales usa Google', () => {
    const env = { GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secreto', MONGODB_INTEGRAL_DB: 'mongodb://x' }
    expect(googleClient(env)).toEqual({ clientId: 'id', clientSecret: 'secreto' })
    expect(signInMode(env)).toBe('google')
  })

  it('el simulador solo existe en local sin base de datos', () => {
    expect(signInMode({})).toBe('local')
    expect(signInMode({ VERCEL: '1' })).toBe('off')
    expect(signInMode({ MONGODB_INTEGRAL_DB: 'mongodb://x' })).toBe('off')
    expect(signInMode({ GOOGLE_CLIENT_ID: 'id' })).toBe('local')
  })
})
