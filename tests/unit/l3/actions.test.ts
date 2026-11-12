import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expectRedirect, form, request, resetRequest } from './request-mocks'

vi.setConfig({ testTimeout: 30_000 })
import * as admin from '@/lib/actions/admin'
import { changePassword, completeSetup, login, logout } from '@/lib/actions/auth'
import { getApprovedComments, submitComment } from '@/lib/actions/comments'
import { submitContact } from '@/lib/actions/contact'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { AUTHOR_HINT_COOKIE, AUTHOR_HINT_MAX_AGE_S } from '@/lib/auth/author-hint'
import { hashSessionToken, SESSION_COOKIE, startSession } from '@/lib/auth/session'
import { ensureSetupCode } from '@/lib/auth/setup'
import { getRepos, registerRepoFactory } from '@/lib/data'
import { createMemoryRepos } from '@/lib/data/memory'
import type { Repos } from '@/lib/data/types'

let repos: Repos

beforeEach(() => {
  resetRequest()
  registerRepoFactory(() => createMemoryRepos())
  repos = getRepos()
})

const old = () => String(Date.now() - 10_000)

function contactForm(overrides: Record<string, string> = {}) {
  return form({
    name: 'Ana Visitante',
    email: 'ana.visitante@example.com',
    phone: '+57 300 123 4567',
    message: 'Hola, quiero hablar de un proyecto.',
    consent: 'on',
    website: '',
    renderedAt: old(),
    ...overrides,
  })
}

describe('submitContact', () => {
  it('guarda el mensaje como no leído con fecha de autorización y teléfono tal cual', async () => {
    const before = Date.now()
    expect(await submitContact(null, contactForm())).toEqual({ ok: true, data: undefined })
    const [saved] = await repos.messages.list({ sort: 'newest' })
    expect(saved).toMatchObject({ name: 'Ana Visitante', phone: '+57 300 123 4567', status: 'unread' })
    expect(saved?.consentAt?.getTime()).toBeGreaterThanOrEqual(before)
  })

  it('sin casilla de autorización no envía y lo dice', async () => {
    const result = await submitContact(null, contactForm({ consent: '' }))
    expect(result).toMatchObject({ ok: false, error: 'consent_required', fieldErrors: { consent: 'privacy.required' } })
    expect(await repos.messages.countUnread()).toBe(0)
  })

  it('señala cada campo inválido', async () => {
    const result = await submitContact(null, contactForm({ email: 'no-es-correo', message: '', name: 'x'.repeat(61) }))
    expect(result).toMatchObject({
      ok: false,
      error: 'validation',
      fieldErrors: { email: 'form.email.invalid', message: 'form.required', name: 'form.tooLong' },
    })
  })

  it('descarta en silencio lo que llena el campo trampa', async () => {
    expect(await submitContact(null, contactForm({ website: 'https://spam.example' }))).toMatchObject({ ok: true })
    expect(await repos.messages.list({ sort: 'newest' })).toEqual([])
  })

  it('rechaza envíos hechos en menos de 3 s o sin renderedAt', async () => {
    expect(await submitContact(null, contactForm({ renderedAt: String(Date.now()) }))).toEqual({ ok: false, error: 'validation' })
    expect(await submitContact(null, contactForm({ renderedAt: '' }))).toEqual({ ok: false, error: 'validation' })
    expect(await repos.messages.list({ sort: 'newest' })).toEqual([])
  })

  it('permite 3 envíos por 10 min por origen y rechaza el cuarto', async () => {
    for (let i = 0; i < 3; i++) expect((await submitContact(null, contactForm())).ok).toBe(true)
    const fourth = await submitContact(null, contactForm())
    expect(fourth).toMatchObject({ ok: false, error: 'rate_limited' })
    expect(fourth.ok === false && fourth.retryAfterMs).toBeGreaterThan(0)
    resetRequest('198.51.100.20')
    expect((await submitContact(null, contactForm())).ok).toBe(true)
  })

  it('si el guardado falla responde unavailable y no registra datos personales', async () => {
    vi.spyOn(repos.messages, 'create').mockRejectedValue(new Error('fallo con ana.visitante@example.com'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await submitContact(null, contactForm())).toEqual({ ok: false, error: 'unavailable' })
    expect(JSON.stringify(log.mock.calls)).not.toContain('ana.visitante@example.com')
  })
})

describe('comentarios', () => {
  function commentForm(overrides: Record<string, string> = {}) {
    return form({
      postId: 'post1',
      userName: 'Luis Lector',
      email: 'luis.lector@example.com',
      comment: 'Muy buen post',
      consent: 'true',
      renderedAt: old(),
      lang: 'en',
      ...overrides,
    })
  }

  it('crea el comentario pendiente con idioma y autorización', async () => {
    expect((await submitComment(null, commentForm())).ok).toBe(true)
    const [pending] = await repos.comments.listForModeration({ status: 'pending' })
    expect(pending).toMatchObject({ postId: 'post1', status: 'pending', lang: 'en' })
    expect(pending?.consentAt).toBeInstanceOf(Date)
    expect(await getApprovedComments('post1')).toEqual([])
  })

  it('toma el idioma de la página si el formulario no lo trae', async () => {
    request.headers.set('referer', 'http://localhost/en/blog/post1')
    await submitComment(null, commentForm({ lang: '' }))
    const [pending] = await repos.comments.listForModeration({})
    expect(pending?.lang).toBe('en')
  })

  it('exige un post existente, autorización y aplica anti-spam', async () => {
    expect(await submitComment(null, commentForm({ postId: 'post999' }))).toEqual({ ok: false, error: 'not_found' })
    expect(await submitComment(null, commentForm({ consent: '' }))).toMatchObject({ error: 'consent_required' })
    expect(await submitComment(null, commentForm({ website: 'x' }))).toMatchObject({ ok: true })
    expect(await submitComment(null, commentForm({ renderedAt: String(Date.now()) }))).toMatchObject({ error: 'validation' })
    expect(await repos.comments.countPending()).toBe(0)
    for (let i = 0; i < 3; i++) await submitComment(null, commentForm())
    expect(await submitComment(null, commentForm())).toMatchObject({ error: 'rate_limited' })
  })

  it('la lectura pública solo trae aprobados y nunca el correo', async () => {
    await submitComment(null, commentForm())
    const [created] = await repos.comments.listForModeration({})
    await repos.comments.setStatus(created?.id ?? '', 'approved')
    await repos.comments.setReply(created?.id ?? '', 'Gracias')
    const list = await getApprovedComments('post1')
    expect(list).toHaveLength(1)
    expect(Object.keys(list[0] ?? {}).sort()).toEqual(['authorReply', 'comment', 'createdAt', 'id', 'userName'])
    expect(JSON.stringify(list)).not.toContain('luis.lector@example.com')
    expect(await getApprovedComments('no-existe')).toEqual([])
  })

  it('si la base falla, la lectura pública devuelve vacío', async () => {
    vi.spyOn(repos.comments, 'listPublic').mockRejectedValue(new Error('down'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await getApprovedComments('post1')).toEqual([])
  })
})

async function captureSetupCode(): Promise<string> {
  const lines: string[] = []
  await ensureSetupCode(repos.admin, new Date(), (line) => lines.push(line))
  return /: ([A-Z0-9]{4}-[A-Z0-9]{4}) /.exec(lines[0] ?? '')?.[1] ?? ''
}

const PASSWORD = 'una contraseña larga de verdad'

async function configureAdmin(): Promise<void> {
  await repos.admin.createCredential(await hashPassword(PASSWORD))
}

describe('configuración inicial', () => {
  it('crea la contraseña con el código de los logs, borra el código e inicia sesión', async () => {
    const code = await captureSetupCode()
    await expectRedirect(completeSetup(null, form({ code, password: PASSWORD, confirm: PASSWORD, lang: 'en' })), '/en/inbox')
    const credential = await repos.admin.getCredential()
    expect(credential && (await verifyPassword(PASSWORD, credential))).toBe(true)
    expect(await repos.admin.getSetupCode()).toBeNull()
    const cookie = request.cookies.get(SESSION_COOKIE)
    expect(cookie?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
    expect(await repos.admin.getSession(hashSessionToken(cookie?.value ?? ''))).not.toBeNull()
    const hint = request.cookies.get(AUTHOR_HINT_COOKIE)
    expect(hint?.value).toBe('1')
    expect(hint?.options).toMatchObject({ httpOnly: false, secure: true, sameSite: 'lax', path: '/', maxAge: AUTHOR_HINT_MAX_AGE_S })
  })

  it('rechaza un código incorrecto, contraseñas cortas o distintas', async () => {
    await captureSetupCode()
    expect(await completeSetup(null, form({ code: 'AAAA-AAAA', password: PASSWORD, confirm: PASSWORD }))).toMatchObject({
      error: 'validation',
      fieldErrors: { code: 'form.code.invalid' },
    })
    expect(await completeSetup(null, form({ code: 'AAAA-AAAA', password: 'corta', confirm: 'corta' }))).toMatchObject({
      fieldErrors: { password: 'form.password.tooShort' },
    })
    expect(await completeSetup(null, form({ code: 'AAAA-AAAA', password: PASSWORD, confirm: `${PASSWORD}!` }))).toMatchObject({
      fieldErrors: { confirm: 'form.password.mismatch' },
    })
    expect(await repos.admin.getCredential()).toBeNull()
  })

  it('el código deja de servir y no hay setup cuando ya existe credencial', async () => {
    const code = await captureSetupCode()
    await expectRedirect(completeSetup(null, form({ code, password: PASSWORD, confirm: PASSWORD })), '/es/inbox')
    expect(await completeSetup(null, form({ code, password: 'otra contraseña distinta', confirm: 'otra contraseña distinta' }))).toEqual({
      ok: false,
      error: 'not_found',
    })
  })

  it('bloquea tras 5 códigos fallidos en 15 min', async () => {
    const code = await captureSetupCode()
    for (let i = 0; i < 5; i++) await completeSetup(null, form({ code: 'AAAA-AAAA', password: PASSWORD, confirm: PASSWORD }))
    expect(await completeSetup(null, form({ code, password: PASSWORD, confirm: PASSWORD }))).toMatchObject({ error: 'rate_limited' })
  })
})

describe('login y logout', () => {
  it('con la contraseña correcta inicia sesión y redirige al panel', async () => {
    await configureAdmin()
    await expectRedirect(login(null, form({ password: PASSWORD, lang: 'es' })), '/es/inbox')
    expect(request.cookies.get(SESSION_COOKIE)?.value).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('con contraseña incorrecta o sin credencial responde siempre lo mismo', async () => {
    expect(await login(null, form({ password: PASSWORD }))).toEqual({ ok: false, error: 'unauthorized' })
    await configureAdmin()
    expect(await login(null, form({ password: 'incorrecta pero larga' }))).toEqual({ ok: false, error: 'unauthorized' })
    expect(request.cookies.has(SESSION_COOKIE)).toBe(false)
  })

  it('el sexto intento en 15 min queda bloqueado aunque la contraseña sea correcta', async () => {
    await configureAdmin()
    for (let i = 0; i < 5; i++) expect(await login(null, form({ password: `mal ${i} contraseña` }))).toMatchObject({ error: 'unauthorized' })
    expect(await login(null, form({ password: PASSWORD }))).toMatchObject({ ok: false, error: 'rate_limited' })
    resetRequest('198.51.100.30')
    await expectRedirect(login(null, form({ password: PASSWORD })), '/es/inbox')
  })

  it('acertar reinicia el contador de fallos', async () => {
    await configureAdmin()
    for (let i = 0; i < 4; i++) await login(null, form({ password: 'fallo de contraseña' }))
    await expectRedirect(login(null, form({ password: PASSWORD })), '/es/inbox')
    for (let i = 0; i < 4; i++) expect(await login(null, form({ password: 'fallo de contraseña' }))).toMatchObject({ error: 'unauthorized' })
  })

  it('cerrar sesión borra la cookie y la sesión', async () => {
    await configureAdmin()
    await expectRedirect(login(null, form({ password: PASSWORD })), '/es/inbox')
    const token = request.cookies.get(SESSION_COOKIE)?.value ?? ''
    await expectRedirect(logout(null, form({ lang: 'en' })), '/en/inbox')
    expect(request.deleted.map((c) => c.name)).toContain(SESSION_COOKIE)
    expect(await repos.admin.getSession(hashSessionToken(token))).toBeNull()
  })
})

async function signedIn(): Promise<void> {
  await configureAdmin()
  await expectRedirect(login(null, form({ password: PASSWORD })), '/es/inbox')
}

describe('cambio de contraseña', () => {
  it('sin sesión no hace nada', async () => {
    await configureAdmin()
    expect(await changePassword(null, form({ current: PASSWORD, password: 'nueva contraseña larga', confirm: 'nueva contraseña larga' }))).toEqual({
      ok: false,
      error: 'unauthorized',
    })
  })

  it('pide la contraseña actual y cierra todas las sesiones, también las de otros equipos (R4.1 M1)', async () => {
    await signedIn()
    const other = await startSession(repos.admin, new Date())
    const before = request.cookies.get(SESSION_COOKIE)?.value ?? ''
    expect(await changePassword(null, form({ current: 'no es la actual', password: 'nueva contraseña larga', confirm: 'nueva contraseña larga' }))).toMatchObject({
      error: 'validation',
      fieldErrors: { current: 'admin.password.currentWrong' },
    })
    expect(await changePassword(null, form({ current: PASSWORD, password: 'nueva contraseña larga', confirm: 'nueva contraseña larga' }))).toEqual({
      ok: true,
      data: undefined,
    })
    const credential = await repos.admin.getCredential()
    expect(credential && (await verifyPassword('nueva contraseña larga', credential))).toBe(true)
    expect(credential && (await verifyPassword(PASSWORD, credential))).toBe(false)
    const after = request.cookies.get(SESSION_COOKIE)?.value ?? ''
    expect(after).not.toBe(before)
    expect(await repos.admin.getSession(hashSessionToken(before))).toBeNull()
    expect(await repos.admin.getSession(other.session.tokenHash), 'la sesión del otro equipo también se cierra').toBeNull()
    expect(await repos.admin.getSession(hashSessionToken(after))).not.toBeNull()
  })
})

describe('acciones de administración', () => {
  const calls: Array<[string, () => Promise<unknown>]> = [
    ['setMessageStatus', () => admin.setMessageStatus('000000000000000000000000', 'read')],
    ['deleteMessage', () => admin.deleteMessage('000000000000000000000000')],
    ['setCommentStatus', () => admin.setCommentStatus('000000000000000000000000', 'approved')],
    ['setCommentReply', () => admin.setCommentReply('000000000000000000000000', 'hola')],
    ['deleteComment', () => admin.deleteComment('000000000000000000000000')],
  ]

  it.each(calls)('%s sin sesión responde unauthorized y no toca nada', async (_name, call) => {
    await configureAdmin()
    const message = await repos.messages.create({ name: 'A', email: 'a@example.com', phone: null, message: 'x', consentAt: new Date() })
    expect(await call()).toEqual({ ok: false, error: 'unauthorized' })
    expect((await repos.messages.list({ sort: 'newest' }))[0]?.status).toBe(message.status)
    expect(request.refreshes).toBe(0)
  })

  it('una cookie inventada no sirve', async () => {
    await configureAdmin()
    request.cookies.set(SESSION_COOKIE, { name: SESSION_COOKIE, value: 'A'.repeat(43), options: {} })
    expect(await admin.deleteMessage('000000000000000000000000')).toEqual({ ok: false, error: 'unauthorized' })
  })

  it('gestiona estados y borrado de mensajes', async () => {
    await signedIn()
    const message = await repos.messages.create({ name: 'A', email: 'a@example.com', phone: null, message: 'x', consentAt: new Date() })
    expect(await admin.setMessageStatus(message.id, 'read')).toEqual({ ok: true, data: undefined })
    expect(await admin.setMessageStatus(message.id, 'archived')).toMatchObject({ ok: true })
    expect(await admin.setMessageStatus(message.id, 'unread')).toEqual({ ok: false, error: 'not_found' })
    expect(await admin.setMessageStatus(message.id, 'spam' as never)).toEqual({ ok: false, error: 'validation' })
    expect(await admin.deleteMessage(message.id)).toMatchObject({ ok: true })
    expect(await admin.deleteMessage(message.id)).toEqual({ ok: false, error: 'not_found' })
    expect(request.refreshes).toBeGreaterThan(0)
  })

  it('modera comentarios y la respuesta del autor solo vive en aprobados', async () => {
    await signedIn()
    const comment = await repos.comments.create({
      postId: 'post1',
      userName: 'L',
      email: 'l@example.com',
      comment: 'c',
      lang: 'es',
      consentAt: new Date(),
    })
    expect(await admin.setCommentReply(comment.id, 'Gracias')).toEqual({ ok: false, error: 'not_found' })
    expect(await admin.setCommentStatus(comment.id, 'approved')).toMatchObject({ ok: true })
    expect(request.revalidated).toContain('/[lang]/blog/[id]')
    expect(await admin.setCommentReply(comment.id, '   ')).toMatchObject({ error: 'validation', fieldErrors: { text: 'form.required' } })
    expect(await admin.setCommentReply(comment.id, 'Gracias por leer')).toMatchObject({ ok: true })
    expect((await repos.comments.listPublic('post1'))[0]?.authorReply?.text).toBe('Gracias por leer')
    expect(await admin.setCommentStatus(comment.id, 'rejected')).toMatchObject({ ok: true })
    expect(await repos.comments.listPublic('post1')).toEqual([])
    const [rejected] = await repos.comments.listForModeration({ status: 'rejected' })
    expect(rejected?.authorReply).toBeNull()
    expect(await admin.setCommentStatus(comment.id, 'approved')).toMatchObject({ ok: true })
    expect(await admin.setCommentReply(comment.id, 'Otra')).toMatchObject({ ok: true })
    expect(await admin.setCommentReply(comment.id, null)).toMatchObject({ ok: true })
    expect((await repos.comments.listPublic('post1'))[0]?.authorReply).toBeNull()
    expect(await admin.deleteComment(comment.id)).toMatchObject({ ok: true })
    expect(await repos.comments.listForModeration({})).toEqual([])
  })

  it('una sesión vencida obliga a iniciar sesión de nuevo', async () => {
    await signedIn()
    const token = request.cookies.get(SESSION_COOKIE)?.value ?? ''
    const hash = hashSessionToken(token)
    const session = await repos.admin.getSession(hash)
    await repos.admin.deleteSession(hash)
    await repos.admin.createSession({ ...session!, expiresAt: new Date(Date.now() - 1) })
    expect(await admin.deleteMessage('000000000000000000000000')).toEqual({ ok: false, error: 'unauthorized' })
  })
})
