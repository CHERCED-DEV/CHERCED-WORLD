import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { form, request, resetRequest } from './request-mocks'
import { mailtoHref } from '@/components/admin/mailto'
import { pickParam, queryHref } from '@/components/admin/query'
import { failureText, notCompletedTitle, type ResultLabels } from '@/components/admin/results'
import { PHONE_INPUT_PATTERN } from '@/components/contact/fieldErrors'
import * as admin from '@/lib/actions/admin'
import { login } from '@/lib/actions/auth'
import { getApprovedComments, submitComment } from '@/lib/actions/comments'
import { submitContact } from '@/lib/actions/contact'
import { registerRepoFactory } from '@/lib/data'
import { repoBackend } from '@/lib/data/mongo/register'
import { createUnavailableRepos, DatabaseUnavailableError } from '@/lib/data/mongo/unavailable'
import { PHONE_PATTERN } from '@/lib/validation'

const labels: ResultLabels = {
  unauthorized: 'sesión terminó',
  notFound: 'no existe',
  validation: 'revisa',
  unavailable: 'no disponible',
  rateLimited: 'bloqueado',
  notCompleted: 'No se completó: {action}',
}

describe('textos de resultado del panel', () => {
  it('traduce cada error de acción y nunca muestra nada en un éxito', () => {
    expect(failureText({ ok: true, data: undefined }, labels)).toBeNull()
    expect(failureText({ ok: false, error: 'unauthorized' }, labels)).toBe('sesión terminó')
    expect(failureText({ ok: false, error: 'not_found' }, labels)).toBe('no existe')
    expect(failureText({ ok: false, error: 'validation' }, labels)).toBe('revisa')
    expect(failureText({ ok: false, error: 'consent_required' }, labels)).toBe('revisa')
    expect(failureText({ ok: false, error: 'rate_limited' }, labels)).toBe('bloqueado')
    expect(failureText({ ok: false, error: 'unavailable' }, labels)).toBe('no disponible')
  })

  it('dice qué acción no se completó', () => {
    expect(notCompletedTitle(labels, 'Archivar')).toBe('No se completó: Archivar')
  })
})

describe('responder por correo', () => {
  it('abre el cliente de correo con destinatario y asunto', () => {
    expect(mailtoHref('ana.visitante@example.com', 'Re: tu mensaje en CHERCED-WORLD')).toBe(
      'mailto:ana.visitante@example.com?subject=Re%3A%20tu%20mensaje%20en%20CHERCED-WORLD',
    )
  })

  it('no deja inyectar cabeceras ni destinatarios extra', () => {
    const href = mailtoHref('x@example.com?bcc=otro@example.com&body=hola', 'Asunto')
    expect(href).toBe('mailto:x@example.com%3Fbcc%3Dotro@example.com%26body%3Dhola?subject=Asunto')
    expect(new URL(href).searchParams.get('bcc')).toBeNull()
  })
})

describe('filtros del inbox', () => {
  it('solo acepta valores conocidos', () => {
    const views = ['inbox', 'unread', 'archived', 'all'] as const
    expect(pickParam('unread', views, 'inbox')).toBe('unread')
    expect(pickParam(['archived', 'all'], views, 'inbox')).toBe('archived')
    expect(pickParam('<script>', views, 'inbox')).toBe('inbox')
    expect(pickParam(undefined, views, 'inbox')).toBe('inbox')
  })

  it('arma los enlaces de filtro y orden', () => {
    expect(queryHref('/es/inbox', { view: 'unread', sort: 'name' })).toBe('/es/inbox?view=unread&sort=name')
    expect(queryHref('/es/inbox', {})).toBe('/es/inbox')
  })
})

describe('teléfono sin JavaScript', () => {
  it('el pattern del input acepta y rechaza lo mismo que el servidor, también con la bandera v', () => {
    const html = new RegExp(`^(?:${PHONE_INPUT_PATTERN})$`, 'v')
    const samples = ['+57 300 123 4567', '(601) 555-1234', '3001234567', '+1-202-555-0100', '12345', '+57 300 abc', '+57 300 123 4567 890 12', '++573001234567', '']
    for (const sample of samples) expect(html.test(sample), sample).toBe(PHONE_PATTERN.test(sample))
  })
})

describe('backend de datos', () => {
  it('Mongo si existe la variable, no disponible en Vercel sin ella y memoria en local', () => {
    expect(repoBackend({ MONGODB_INTEGRAL_DB: 'mongodb://x' })).toBe('mongo')
    expect(repoBackend({ MONGODB_INTEGRAL_DB: 'mongodb://x', VERCEL: '1' })).toBe('mongo')
    expect(repoBackend({ VERCEL: '1' })).toBe('unavailable')
    expect(repoBackend({})).toBe('memory')
  })

  it('sin base, cada operación falla con un error sin datos', async () => {
    const repos = createUnavailableRepos()
    await expect(repos.messages.countUnread()).rejects.toBeInstanceOf(DatabaseUnavailableError)
    await expect(repos.admin.getCredential()).rejects.toThrow('database unavailable')
    await expect(repos.rateLimits.hit('k', { limit: 1, windowMs: 1 }, new Date())).rejects.toBeInstanceOf(DatabaseUnavailableError)
    expect('then' in repos.comments && (repos.comments as unknown as { then?: unknown }).then).toBeFalsy()
  })

  describe('con la base no disponible', () => {
    beforeEach(() => {
      resetRequest()
      registerRepoFactory(createUnavailableRepos)
    })

    it('contacto y comentarios responden con un error honesto y la lectura pública queda vacía', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const old = String(Date.now() - 10_000)
      const contact = form({ name: 'Ana', email: 'ana@example.com', message: 'Hola', consent: 'on', renderedAt: old })
      expect(await submitContact(null, contact)).toEqual({ ok: false, error: 'unavailable' })
      const comment = form({ postId: 'post1', userName: 'Ana', email: 'ana@example.com', comment: 'Hola', consent: 'on', renderedAt: old })
      expect(await submitComment(null, comment)).toEqual({ ok: false, error: 'unavailable' })
      expect(await getApprovedComments('post1')).toEqual([])
      expect(await login(null, form({ password: 'una-contraseña-larga' }))).toEqual({ ok: false, error: 'unavailable' })
      const logged = error.mock.calls.map((call) => call.join(' ')).join('\n')
      expect(logged).toContain('DatabaseUnavailable')
      expect(logged).not.toContain('ana@example.com')
    })

    it('las acciones de administración sin sesión siguen respondiendo unauthorized', async () => {
      expect(await admin.deleteMessage('000000000000000000000000')).toEqual({ ok: false, error: 'unauthorized' })
      expect(request.revalidated).toEqual([])
    })
  })
})

describe('textos del panel', () => {
  it('es y en tienen las mismas claves y las nuevas existen', () => {
    const es = JSON.parse(readFileSync('content/i18n/es/admin.json', 'utf8')) as Record<string, string>
    const en = JSON.parse(readFileSync('content/i18n/en/admin.json', 'utf8')) as Record<string, string>
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
    for (const key of ['admin.notCompleted', 'admin.unavailable.title', 'admin.consent.legacy', 'admin.field.consent']) {
      expect(es[key], key).toBeTruthy()
      expect(en[key], key).toBeTruthy()
    }
    expect(es['admin.notCompleted']).toContain('{action}')
    expect(en['admin.notCompleted']).toContain('{action}')
  })
})
