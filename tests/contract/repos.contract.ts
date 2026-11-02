import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SESSION_IDLE_MS, type NewComment, type NewMessage, type Repos } from '@/lib/data/types'

export type RepoContractOptions = {
  setup: () => Repos | Promise<Repos>
  teardown?: () => void | Promise<void>
}

const MISSING_ID = '000000000000000000000000'

const pause = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms))

function message(overrides: Partial<NewMessage> = {}): NewMessage {
  return {
    name: 'Ana',
    email: 'ana@example.com',
    phone: '+57 300 123 4567',
    message: 'Hola',
    consentAt: new Date('2026-11-01T10:00:00Z'),
    ...overrides,
  }
}

function comment(overrides: Partial<NewComment> = {}): NewComment {
  return {
    postId: 'post1',
    userName: 'Luis',
    email: 'luis@example.com',
    comment: 'Gran post',
    lang: 'es',
    consentAt: new Date('2026-11-01T10:00:00Z'),
    ...overrides,
  }
}

export function runRepoContract(name: string, options: RepoContractOptions): void {
  describe(`contrato de repositorios: ${name}`, () => {
    let repos: Repos

    beforeEach(async () => {
      repos = await options.setup()
    })

    afterEach(async () => {
      await options.teardown?.()
    })

    describe('messages', () => {
      it('crea un mensaje no leído con fechas y conserva el teléfono tal cual', async () => {
        const created = await repos.messages.create(message())
        expect(created.id).toEqual(expect.any(String))
        expect(created.status).toBe('unread')
        expect(created.phone).toBe('+57 300 123 4567')
        expect(created.consentAt).toEqual(new Date('2026-11-01T10:00:00Z'))
        expect(created.createdAt).toBeInstanceOf(Date)
        expect(created.updatedAt).toBeInstanceOf(Date)
      })

      it('acepta teléfono nulo', async () => {
        const created = await repos.messages.create(message({ phone: null }))
        expect(created.phone).toBeNull()
      })

      it('ordena por más nuevos, más viejos y nombre, y filtra por estado', async () => {
        const first = await repos.messages.create(message({ name: 'Carla' }))
        await pause()
        const second = await repos.messages.create(message({ name: 'Ana' }))
        await pause()
        const third = await repos.messages.create(message({ name: 'Beto' }))
        expect((await repos.messages.list({ sort: 'newest' })).map((m) => m.id)).toEqual([third.id, second.id, first.id])
        expect((await repos.messages.list({ sort: 'oldest' })).map((m) => m.id)).toEqual([first.id, second.id, third.id])
        expect((await repos.messages.list({ sort: 'name' })).map((m) => m.name)).toEqual(['Ana', 'Beto', 'Carla'])
        expect(await repos.messages.setStatus(second.id, 'read')).toBe(true)
        expect((await repos.messages.list({ status: 'unread', sort: 'newest' })).map((m) => m.id)).toEqual([third.id, first.id])
        expect((await repos.messages.list({ status: 'all', sort: 'newest' })).length).toBe(3)
      })

      it('respeta las transiciones de estado', async () => {
        const created = await repos.messages.create(message())
        expect(await repos.messages.setStatus(created.id, 'read')).toBe(true)
        expect(await repos.messages.setStatus(created.id, 'unread')).toBe(true)
        expect(await repos.messages.setStatus(created.id, 'archived')).toBe(true)
        expect(await repos.messages.setStatus(created.id, 'unread')).toBe(false)
        expect(await repos.messages.setStatus(created.id, 'read')).toBe(true)
        expect(await repos.messages.setStatus(MISSING_ID, 'read')).toBe(false)
      })

      it('cuenta no leídos y elimina', async () => {
        const a = await repos.messages.create(message())
        await repos.messages.create(message())
        expect(await repos.messages.countUnread()).toBe(2)
        await repos.messages.setStatus(a.id, 'read')
        expect(await repos.messages.countUnread()).toBe(1)
        expect(await repos.messages.remove(a.id)).toBe(true)
        expect(await repos.messages.remove(a.id)).toBe(false)
        expect((await repos.messages.list({ sort: 'newest' })).length).toBe(1)
      })

      it('devuelve los cambios posteriores a una fecha', async () => {
        const a = await repos.messages.create(message())
        await pause()
        const since = new Date()
        await pause()
        expect(await repos.messages.changedSince(since)).toEqual([])
        await repos.messages.setStatus(a.id, 'read')
        const b = await repos.messages.create(message())
        const changed = await repos.messages.changedSince(since)
        expect(changed.map((m) => m.id).sort()).toEqual([a.id, b.id].sort())
      })

      it('no expone su estado interno', async () => {
        const created = await repos.messages.create(message())
        created.name = 'mutado'
        const [listed] = await repos.messages.list({ sort: 'newest' })
        expect(listed?.name).toBe('Ana')
      })
    })

    describe('comments', () => {
      it('crea comentarios pendientes y sin respuesta del autor', async () => {
        const created = await repos.comments.create(comment())
        expect(created.status).toBe('pending')
        expect(created.authorReply).toBeNull()
        expect(created.lang).toBe('es')
        expect(await repos.comments.countPending()).toBe(1)
      })

      it('la lista pública solo trae aprobados del post y nunca correo ni consentimiento', async () => {
        const approved = await repos.comments.create(comment())
        await repos.comments.create(comment({ userName: 'Pendiente' }))
        const other = await repos.comments.create(comment({ postId: 'post2' }))
        await repos.comments.setStatus(approved.id, 'approved')
        await repos.comments.setStatus(other.id, 'approved')
        const list = await repos.comments.listPublic('post1')
        expect(list.map((c) => c.id)).toEqual([approved.id])
        const [item] = list
        expect(Object.keys(item ?? {}).sort()).toEqual(['authorReply', 'comment', 'createdAt', 'id', 'userName'])
        expect(JSON.stringify(list)).not.toContain('luis@example.com')
      })

      it('respeta las transiciones de moderación y borra la respuesta al rechazar', async () => {
        const created = await repos.comments.create(comment())
        expect(await repos.comments.setReply(created.id, 'Gracias')).toBe(false)
        expect(await repos.comments.setStatus(created.id, 'approved')).toBe(true)
        expect(await repos.comments.setStatus(created.id, 'pending')).toBe(false)
        expect(await repos.comments.setReply(created.id, 'Gracias')).toBe(true)
        expect(await repos.comments.setStatus(created.id, 'rejected')).toBe(true)
        const [rejected] = await repos.comments.listForModeration({ status: 'rejected' })
        expect(rejected?.authorReply).toBeNull()
        expect(await repos.comments.setStatus(created.id, 'approved')).toBe(true)
        expect(await repos.comments.setStatus(MISSING_ID, 'approved')).toBe(false)
      })

      it('edita y elimina la respuesta del autor', async () => {
        const created = await repos.comments.create(comment())
        await repos.comments.setStatus(created.id, 'approved')
        await repos.comments.setReply(created.id, 'Primera')
        const [first] = await repos.comments.listPublic('post1')
        await pause()
        await repos.comments.setReply(created.id, 'Editada')
        const [edited] = await repos.comments.listPublic('post1')
        expect(edited?.authorReply?.text).toBe('Editada')
        expect(edited?.authorReply?.createdAt).toEqual(first?.authorReply?.createdAt)
        expect(edited?.authorReply?.updatedAt.getTime()).toBeGreaterThan(first?.authorReply?.updatedAt.getTime() ?? 0)
        await repos.comments.setReply(created.id, null)
        const [cleared] = await repos.comments.listPublic('post1')
        expect(cleared?.authorReply).toBeNull()
      })

      it('filtra para moderación, cuenta pendientes, elimina y reporta cambios', async () => {
        const a = await repos.comments.create(comment())
        await pause()
        const since = new Date()
        await pause()
        const b = await repos.comments.create(comment())
        await repos.comments.setStatus(a.id, 'approved')
        expect((await repos.comments.listForModeration({ status: 'pending' })).map((c) => c.id)).toEqual([b.id])
        expect((await repos.comments.listForModeration({})).length).toBe(2)
        expect(await repos.comments.countPending()).toBe(1)
        expect((await repos.comments.changedSince(since)).map((c) => c.id).sort()).toEqual([a.id, b.id].sort())
        expect(await repos.comments.remove(b.id)).toBe(true)
        expect(await repos.comments.remove(b.id)).toBe(false)
      })
    })

    describe('admin', () => {
      const credential = {
        hash: 'hash',
        salt: 'salt',
        params: { N: 32768, r: 8, p: 1, keyLen: 64 },
        createdAt: new Date('2026-11-01T00:00:00Z'),
        updatedAt: new Date('2026-11-01T00:00:00Z'),
      }

      it('crea la credencial una sola vez y la actualiza', async () => {
        expect(await repos.admin.getCredential()).toBeNull()
        expect(await repos.admin.createCredential(credential)).toBe(true)
        expect(await repos.admin.createCredential({ ...credential, hash: 'otra' })).toBe(false)
        expect((await repos.admin.getCredential())?.hash).toBe('hash')
        await repos.admin.updateCredential({ ...credential, hash: 'nueva' })
        expect((await repos.admin.getCredential())?.hash).toBe('nueva')
      })

      it('guarda, lee y borra el código de configuración', async () => {
        expect(await repos.admin.getSetupCode()).toBeNull()
        const code = { codeHash: 'abc', expiresAt: new Date('2026-11-02T00:00:00Z'), createdAt: new Date('2026-11-01T00:00:00Z') }
        await repos.admin.saveSetupCode(code)
        expect(await repos.admin.getSetupCode()).toEqual(code)
        await repos.admin.deleteSetupCode()
        expect(await repos.admin.getSetupCode()).toBeNull()
      })

      it('maneja sesiones con vencimiento deslizante de 12 h', async () => {
        const start = new Date('2026-11-01T00:00:00Z')
        await repos.admin.createSession({
          tokenHash: 't1',
          createdAt: start,
          lastActivityAt: start,
          expiresAt: new Date(start.getTime() + SESSION_IDLE_MS),
        })
        expect((await repos.admin.getSession('t1'))?.lastActivityAt).toEqual(start)
        const later = new Date('2026-11-01T05:00:00Z')
        await repos.admin.touchSession('t1', later)
        const touched = await repos.admin.getSession('t1')
        expect(touched?.lastActivityAt).toEqual(later)
        expect(touched?.expiresAt).toEqual(new Date(later.getTime() + SESSION_IDLE_MS))
        await repos.admin.deleteSession('t1')
        expect(await repos.admin.getSession('t1')).toBeNull()
        expect(await repos.admin.getSession('desconocida')).toBeNull()
      })
    })

    describe('rateLimits', () => {
      const t0 = new Date('2026-11-01T00:00:00Z')
      const at = (ms: number) => new Date(t0.getTime() + ms)
      const rule = { limit: 3, windowMs: 10 * 60_000 }

      it('permite hasta el límite y rechaza con el tiempo restante de la ventana', async () => {
        for (let i = 0; i < 3; i++) {
          expect(await repos.rateLimits.hit('contact:ip', rule, at(i * 1000))).toEqual({ allowed: true, retryAfterMs: 0 })
        }
        expect(await repos.rateLimits.hit('contact:ip', rule, at(60_000))).toEqual({
          allowed: false,
          retryAfterMs: 10 * 60_000 - 60_000,
        })
        expect((await repos.rateLimits.hit('contact:ip', rule, at(10 * 60_000))).allowed).toBe(true)
      })

      it('bloquea durante blockMs al superar el límite', async () => {
        const login = { limit: 5, windowMs: 15 * 60_000, blockMs: 15 * 60_000 }
        for (let i = 0; i < 5; i++) expect((await repos.rateLimits.hit('login:ip', login, at(i))).allowed).toBe(true)
        expect(await repos.rateLimits.hit('login:ip', login, at(10))).toEqual({ allowed: false, retryAfterMs: 15 * 60_000 })
        expect(await repos.rateLimits.hit('login:ip', login, at(10 + 60_000))).toEqual({
          allowed: false,
          retryAfterMs: 14 * 60_000,
        })
        expect((await repos.rateLimits.hit('login:ip', login, at(10 + 15 * 60_000))).allowed).toBe(true)
      })

      it('separa las claves y se reinicia con reset', async () => {
        const one = { limit: 1, windowMs: 60_000 }
        expect((await repos.rateLimits.hit('a', one, t0)).allowed).toBe(true)
        expect((await repos.rateLimits.hit('b', one, t0)).allowed).toBe(true)
        expect((await repos.rateLimits.hit('a', one, at(1))).allowed).toBe(false)
        await repos.rateLimits.reset('a')
        expect((await repos.rateLimits.hit('a', one, at(2))).allowed).toBe(true)
      })
    })
  })
}
