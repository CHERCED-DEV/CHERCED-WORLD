import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionResult } from '@/lib/actions/result'
import { createMemoryRepos } from '@/lib/data/memory'
import type { Repos } from '@/lib/data/types'
import { getDictionary } from '@/lib/i18n/server'

let repos: Repos
let failRead = false

vi.mock('@/lib/actions/comments', () => ({
  submitComment: vi.fn(async (): Promise<ActionResult> => ({ ok: false, error: 'unavailable' })),
  getApprovedComments: vi.fn(async (postId: string) => {
    if (failRead) throw new Error('base caída')
    return repos.comments.listPublic(postId)
  }),
}))

const { CommentsSection } = await import('@/components/blog/comments/CommentsSection')
const { CommentForm } = await import('@/components/blog/comments/CommentForm')
const { commentFormLabels, splitConsent } = await import('@/components/blog/labels')
const { fieldErrorText, firstInvalidField, serverFieldErrors, statusOf } = await import('@/components/blog/comments/state')

async function renderSection(lang: 'es' | 'en', postId = 'post1') {
  const [blog, common] = await Promise.all([getDictionary(lang, 'blog'), getDictionary(lang, 'common')])
  const element = await CommentsSection({ lang, postId, blog, common })
  return renderToStaticMarkup(element)
}

async function seed() {
  const consentAt = new Date('2026-11-01T15:00:00Z')
  const approved = await repos.comments.create({
    postId: 'post1',
    userName: 'Laura Gómez',
    email: 'laura.secreta@example.com',
    comment: 'Me encantó el post.\n<script>alert("xss")</script>',
    lang: 'es',
    consentAt,
  })
  await repos.comments.setStatus(approved.id, 'approved')
  await repos.comments.setReply(approved.id, '¡Gracias, Laura!')

  const plain = await repos.comments.create({
    postId: 'post1',
    userName: 'Pedro',
    email: 'pedro.privado@example.com',
    comment: 'Muy bueno',
    lang: 'en',
    consentAt,
  })
  await repos.comments.setStatus(plain.id, 'approved')

  await repos.comments.create({
    postId: 'post1',
    userName: 'Pendiente',
    email: 'pendiente@example.com',
    comment: 'Esto todavía no se publica',
    lang: 'es',
    consentAt,
  })
  const rejected = await repos.comments.create({
    postId: 'post1',
    userName: 'Rechazado',
    email: 'rechazado@example.com',
    comment: 'Spam',
    lang: 'es',
    consentAt,
  })
  await repos.comments.setStatus(rejected.id, 'rejected')

  const other = await repos.comments.create({
    postId: 'post2',
    userName: 'Otro post',
    email: 'otro@example.com',
    comment: 'De otro post',
    lang: 'es',
    consentAt,
  })
  await repos.comments.setStatus(other.id, 'approved')
}

beforeEach(() => {
  repos = createMemoryRepos()
  failRead = false
})

describe('lista de comentarios (server-side, repos en memoria)', () => {
  it('muestra solo los aprobados del post, con nombre, fecha y la respuesta del autor con distintivo', async () => {
    await seed()
    const html = await renderSection('es')

    expect(html).toContain('Laura Gómez')
    expect(html).toContain('Pedro')
    expect(html).toMatch(/<time[^>]*dateTime="[^"]+Z"[^>]*>\d{1,2} de \w+ de \d{4}<\/time>/)
    expect(html).toContain('data-cw-author-reply')
    expect(html).toContain('>Autor<')
    expect(html).toContain('Camilo Hernandez')
    expect(html).toContain('¡Gracias, Laura!')
    expect(html).toContain('aria-label="Respuesta de Camilo Hernandez"')

    expect(html).not.toContain('Esto todavía no se publica')
    expect(html).not.toContain('Spam')
    expect(html).not.toContain('De otro post')
    expect(html.indexOf('Laura Gómez')).toBeLessThan(html.indexOf('Pedro'))
  })

  it('nunca muestra correos y trata el texto como texto', async () => {
    await seed()
    const html = await renderSection('en')
    expect(html).not.toMatch(/@example\.com/)
    expect(html).not.toContain('<script>alert')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('>Author<')
  })

  it('muestra el estado vacío y el botón para comentar', async () => {
    const html = await renderSection('es')
    expect(html).toContain('data-cw-comments-state="empty"')
    expect(html).toContain('Aún no hay comentarios. Sé el primero.')
    expect(html).toContain('data-cw-comment-open')
    expect(html).toContain('Deja un comentario')
  })

  it('dice la verdad cuando no se pueden leer los comentarios', async () => {
    failRead = true
    const html = await renderSection('es')
    expect(html).toContain('data-cw-comments-state="error"')
    expect(html).toContain('Los comentarios no se pueden mostrar en este momento.')
  })
})

describe('formulario de comentario', () => {
  async function renderForm(lang: 'es' | 'en') {
    const [blog, common] = await Promise.all([getDictionary(lang, 'blog'), getDictionary(lang, 'common')])
    const action = vi.fn(async (): Promise<ActionResult> => ({ ok: true, data: undefined }))
    return renderToStaticMarkup(
      createElement(CommentForm, {
        action,
        postId: 'post1',
        lang,
        privacyHref: `/${lang}/privacy`,
        renderedAt: 1_700_000_000_000,
        labels: commentFormLabels(blog, common),
      }),
    )
  }

  it('lleva los campos de commentSchema, los ocultos para la acción y el campo trampa', async () => {
    const html = await renderForm('es')
    for (const name of ['postId', 'lang', 'renderedAt', 'website', 'userName', 'email', 'comment', 'consent']) {
      expect(html, name).toContain(`name="${name}"`)
    }
    expect(html).toContain('value="post1"')
    expect(html).toContain('value="1700000000000"')
    expect(html).toMatch(/name="website"[^>]*tabindex="-1"|tabindex="-1"[^>]*name="website"/i)
    expect(html).toContain('maxLength="1000"')
    expect(html).toContain('noValidate')
  })

  it('pide la autorización con enlace a la política de privacidad, sin marcar', async () => {
    const html = await renderForm('en')
    const checkbox = /<input[^>]*name="consent"[^>]*>/.exec(html)?.[0] ?? ''
    expect(checkbox).toContain('type="checkbox"')
    expect(checkbox).toContain('value="on"')
    expect(checkbox).not.toContain('checked')
    expect(html).toContain('href="/en/privacy"')
    expect(html).toContain('privacy policy')
    expect(html).toContain('I authorize the processing of my personal data as described in the ')
  })

  it('separa la plantilla de autorización alrededor del enlace', () => {
    expect(splitConsent('Autorizo según la {privacyPolicy}.')).toEqual({ before: 'Autorizo según la ', after: '.' })
    expect(splitConsent('Sin marcador')).toEqual({ before: 'Sin marcador ', after: '' })
  })
})

describe('estados del formulario', () => {
  it('traduce el resultado de la acción a un estado honesto', () => {
    expect(statusOf(null)).toBe('idle')
    expect(statusOf({ ok: true, data: undefined })).toBe('success')
    expect(statusOf({ ok: false, error: 'unavailable' })).toBe('unavailable')
    expect(statusOf({ ok: false, error: 'rate_limited', retryAfterMs: 1000 })).toBe('rate_limited')
    expect(statusOf({ ok: false, error: 'validation', fieldErrors: { email: 'form.email.invalid' } })).toBe('validation')
    expect(statusOf({ ok: false, error: 'consent_required' })).toBe('validation')
    expect(statusOf({ ok: false, error: 'not_found' })).toBe('error')
  })

  it('muestra los errores por campo que devuelve el servidor', async () => {
    expect(serverFieldErrors({ ok: false, error: 'consent_required' })).toEqual({ consent: 'privacy.required' })
    expect(serverFieldErrors({ ok: false, error: 'validation', fieldErrors: { comment: 'form.tooLong' } })).toEqual({ comment: 'form.tooLong' })
    expect(serverFieldErrors({ ok: true, data: undefined })).toEqual({})

    const labels = commentFormLabels(await getDictionary('es', 'blog'), await getDictionary('es', 'common'))
    expect(fieldErrorText(labels.fieldErrors, 'comment', 'form.tooLong')).toBe('Máximo 1000 caracteres')
    expect(fieldErrorText(labels.fieldErrors, 'userName', 'form.tooLong')).toBe('Máximo 60 caracteres')
    expect(fieldErrorText(labels.fieldErrors, 'email', 'form.email.invalid')).toBe('Escribe un correo válido')
    expect(fieldErrorText(labels.fieldErrors, 'consent', 'privacy.required')).toContain('política de privacidad')
    expect(fieldErrorText(labels.fieldErrors, 'email', 'clave.desconocida')).toBe('Este campo es obligatorio')
    expect(fieldErrorText(labels.fieldErrors, 'email', undefined)).toBeUndefined()
    expect(firstInvalidField({ consent: 'x', email: 'y' })).toBe('email')
  })

  it('resuelve todos los textos del formulario en ambos idiomas sin claves crudas', async () => {
    for (const lang of ['es', 'en'] as const) {
      const labels = commentFormLabels(await getDictionary(lang, 'blog'), await getDictionary(lang, 'common'))
      const values = [...Object.values(labels).filter((value) => typeof value === 'string'), ...Object.values(labels.errors)]
      for (const value of values) expect(value).not.toMatch(/^[a-z]+(\.[a-zA-Z]+)+$/)
      expect(labels.commentHint).toContain('1000')
    }
  })
})
