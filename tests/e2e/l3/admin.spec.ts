import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test'
import { fillContact, hideTab, newVisitor, openContact, renderJustNow, sendContact, showTab, uniqueToken, waitMinimumFill, type ContactValues } from './support/helpers'
import { INBOX_COUNT_PATH, inboxCountProblem, inspectBody, scanPublicSurface, type Finding } from './support/privacy'
import { startIsolatedServer, type IsolatedServer } from './support/server'

const FIRST_PASSWORD = `primera-clave-${uniqueToken()}`
const SECOND_PASSWORD = `segunda-clave-${uniqueToken()}`
const SETUP_LOG = /Código de configuración inicial: ([A-Z0-9]{4}-[A-Z0-9]{4}) \(vence /
const UPDATE_WINDOW_MS = 10_000
const PHONE = '+57 311 987 6543'

let server: IsolatedServer
let admin: { context: BrowserContext; page: Page }
const opened: BrowserContext[] = []
const seeded: { messages: ContactValues[]; comments: Array<{ userName: string; email: string; comment: string }> } = {
  messages: [],
  comments: [],
}

test.describe.configure({ mode: 'serial', timeout: 120_000 })

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'el servidor aislado corre una vez, en desktop-chromium')
  server = await startIsolatedServer()
})

test.afterAll(async () => {
  for (const context of opened) await context.close().catch(() => {})
  await server?.stop()
})

async function visitor(browser: Browser, options: Parameters<typeof newVisitor>[2] = {}) {
  const created = await newVisitor(browser, server.baseURL, options)
  opened.push(created.context)
  return created
}

function messageItem(page: Page, name: string): Locator {
  return page.locator('[data-cw-message]').filter({ has: page.getByRole('heading', { name, exact: true }) })
}

function commentItem(page: Page, userName: string): Locator {
  return page.locator('[data-cw-comment]').filter({ has: page.getByRole('heading', { name: userName, exact: true }) })
}

async function openPanel(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await panelReady(page)
}

async function panelReady(page: Page): Promise<void> {
  await expect(page.locator('[data-cw-updates][data-cw-hydrated]')).toBeVisible()
}

async function login(page: Page, password: string, options: { js?: boolean } = {}): Promise<void> {
  await page.goto('/es/inbox')
  const form = page.locator('[data-cw-login]')
  if (options.js !== false) await expect(form).toHaveAttribute('data-cw-hydrated', '')
  await form.getByLabel('Contraseña').fill(password)
  await form.getByRole('button', { name: 'Entrar' }).click()
}

async function seedMessage(browser: Browser, name: string): Promise<ContactValues> {
  const token = uniqueToken()
  const values: ContactValues = {
    name,
    email: `${name.split(' ')[0]?.toLowerCase()}.${token}@example.org`,
    phone: PHONE,
    message: `Mensaje privado ${token}`,
  }
  const { page } = await visitor(browser)
  await sendContact(page, values)
  seeded.messages.push(values)
  return values
}

async function seedComment(browser: Browser, postPath: string, userName: string) {
  const token = uniqueToken()
  const values = { userName, email: `comenta.${token}@example.org`, comment: `Comentario ${token}` }
  const { page } = await visitor(browser)
  await page.goto(postPath)
  const openedAt = Date.now()
  const dialog = page.getByRole('dialog')
  await expect(async () => {
    await page.locator('[data-cw-comment-open]').click()
    await expect(dialog).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await dialog.getByLabel('Tu nombre').fill(values.userName)
  await dialog.getByLabel('Tu correo (nunca se muestra)').fill(values.email)
  await dialog.getByLabel('Tu comentario').fill(values.comment)
  await dialog.getByRole('checkbox').check()
  await waitMinimumFill(page, openedAt)
  await dialog.getByRole('button', { name: 'Enviar' }).click()
  await expect(dialog.locator('[data-cw-comment-status="success"]')).toBeVisible()
  seeded.comments.push(values)
  return values
}

async function publicComment(page: Page, path: string, text: string): Promise<Locator> {
  const item = page.locator('[data-cw-comment]').filter({ hasText: text })
  await expect
    .poll(
      async () => {
        await page.goto(path)
        return item.count()
      },
      { timeout: 20_000, intervals: [500, 1000, 2000] },
    )
    .toBe(1)
  return item
}

test('la configuración inicial usa el código de los logs y después desaparece', async ({ browser }) => {
  const { context, page } = await visitor(browser)
  await page.goto('/es/inbox')
  await expect(page).toHaveURL(/\/es\/inbox\/setup$/)
  const form = page.locator('[data-cw-setup]')
  await expect(form).toHaveAttribute('data-cw-hydrated', '')
  const [, code] = await server.waitForOutput(SETUP_LOG)
  expect(code).toBeTruthy()

  await form.getByLabel('Código de configuración de un solo uso').fill('AAAA-AAAA')
  await form.getByLabel('Nueva contraseña', { exact: true }).fill(FIRST_PASSWORD)
  await form.getByLabel('Repite la contraseña').fill(FIRST_PASSWORD)
  await form.getByRole('button', { name: 'Crear contraseña' }).click()
  await expect(form).toContainText('Revisa el código')
  await expect(form.getByLabel('Nueva contraseña', { exact: true })).toHaveValue(FIRST_PASSWORD)

  await form.getByLabel('Código de configuración de un solo uso').fill(code ?? '')
  await form.getByLabel('Repite la contraseña').fill(`${FIRST_PASSWORD}-otra`)
  await form.getByRole('button', { name: 'Crear contraseña' }).click()
  await expect(form).toContainText('Las contraseñas no coinciden')

  await form.getByLabel('Código de configuración de un solo uso').fill((code ?? '').replace('-', '').toLowerCase())
  await form.getByLabel('Repite la contraseña').fill(FIRST_PASSWORD)
  await form.getByRole('button', { name: 'Crear contraseña' }).click()
  await expect(page).toHaveURL(/\/es\/inbox$/)
  await expect(page.locator('[data-cw-panel]')).toBeVisible()

  const session = (await context.cookies()).find((cookie) => cookie.name === 'cw-admin')
  expect(session).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Lax', path: '/' })
  expect(session?.value).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(server.output()).not.toContain(FIRST_PASSWORD)
  expect(server.output()).not.toContain(session?.value ?? '-')
  admin = { context, page }

  const other = await visitor(browser)
  for (const path of ['/es/inbox/setup', `/es/inbox/setup?code=${code}`, '/en/inbox/setup']) {
    const response = await other.page.goto(path)
    expect(response?.status(), path).toBe(404)
  }
  await other.page.goto('/es/inbox')
  await expect(other.page.locator('[data-cw-login]')).toBeVisible()
  await expect(other.page.locator('[data-cw-setup]')).toHaveCount(0)
})

test('el login da un error genérico y bloquea tras 5 fallos en 15 minutos', async ({ browser }) => {
  const { page } = await visitor(browser)
  const generic = 'No se pudo iniciar sesión. Revisa tus datos e intenta de nuevo.'
  for (let attempt = 1; attempt <= 5; attempt++) {
    await login(page, `incorrecta-${attempt}-${uniqueToken()}`)
    await expect(page.locator('[data-cw-form-error]')).toHaveText(generic)
  }
  await login(page, FIRST_PASSWORD)
  await expect(page.locator('[data-cw-form-error]')).toHaveText('Demasiados intentos. Intenta de nuevo en unos minutos.')
  await expect(page.locator('[data-cw-panel]')).toHaveCount(0)

  const other = await visitor(browser)
  await login(other.page, FIRST_PASSWORD)
  await expect(other.page.locator('[data-cw-panel]')).toBeVisible()
  await other.page.reload()
  await expect(other.page.locator('[data-cw-panel]')).toBeVisible()
})

test('un mensaje nuevo aparece en el panel en 10 s o menos, sin recargar, desde otro navegador', async ({ browser }) => {
  const { page } = admin
  await openPanel(page, '/es/inbox')
  await expect(page.locator('[data-cw-updates="live"]')).toBeVisible()
  await page.evaluate(() => {
    ;(window as unknown as { __cwNoReload?: boolean }).__cwNoReload = true
  })
  const before = await page.locator('[data-cw-message]').count()

  const name = `Visitante ${uniqueToken()}`
  const sentAt = { value: 0 }
  const { page: other } = await visitor(browser)
  const token = uniqueToken()
  const values: ContactValues = { name, email: `visitante.${token}@example.org`, phone: PHONE, message: `Hola ${token}` }
  const loadedAt = await openContact(other)
  await fillContact(other, values)
  await waitMinimumFill(other, loadedAt)
  await other.locator('[data-cw-contact-form]').getByRole('button', { name: 'Enviar' }).click()
  await expect(other.getByRole('status').filter({ hasText: 'Gracias por escribirme' })).toBeVisible()
  sentAt.value = Date.now()
  seeded.messages.push(values)

  const item = messageItem(page, name)
  await expect(item).toBeVisible({ timeout: UPDATE_WINDOW_MS })
  const elapsed = Date.now() - sentAt.value
  test.info().annotations.push({ type: 'SC-008', description: `visible en ${elapsed} ms` })
  expect(elapsed).toBeLessThanOrEqual(UPDATE_WINDOW_MS)
  expect(await page.evaluate(() => (window as unknown as { __cwNoReload?: boolean }).__cwNoReload)).toBe(true)
  await expect(page.locator('[data-cw-message]')).toHaveCount(before + 1)
  await expect(page.locator('[data-cw-count="messages"]')).toHaveText('1')
  await expect(item).toHaveAttribute('data-status', 'unread')
  await expect(item).toContainText(values.email)
  await expect(item).toContainText(PHONE)
  await expect(item.locator('[data-cw-consent-at]')).not.toHaveAttribute('data-cw-consent-at', 'legacy')
})

test('lo que llena el campo trampa o llega demasiado rápido nunca entra al inbox', async ({ browser }) => {
  const bot = await visitor(browser)
  const trap = `Bot trampa ${uniqueToken()}`
  const loadedAt = await openContact(bot.page)
  await fillContact(bot.page, { name: trap, email: 'bot@example.org', message: 'spam' })
  await bot.page.locator('input[name="website"]').evaluate((input: HTMLInputElement) => {
    input.value = 'https://spam.example'
  })
  await waitMinimumFill(bot.page, loadedAt)
  await bot.page.locator('[data-cw-contact-form]').getByRole('button', { name: 'Enviar' }).click()
  await expect(bot.page.getByRole('status').filter({ hasText: 'Gracias por escribirme' })).toBeVisible()

  const fast = await visitor(browser)
  const quick = `Bot rápido ${uniqueToken()}`
  await openContact(fast.page)
  await fillContact(fast.page, { name: quick, email: 'rapido@example.org', message: 'spam' })
  await renderJustNow(fast.page)
  await fast.page.locator('[data-cw-contact-form]').getByRole('button', { name: 'Enviar' }).click()
  await expect(fast.page.getByRole('alert').filter({ hasText: 'No se pudo enviar tu mensaje.' })).toBeVisible()

  await openPanel(admin.page, '/es/inbox?view=all')
  await expect(admin.page.locator('[data-cw-messages]')).toBeVisible()
  await expect(messageItem(admin.page, trap)).toHaveCount(0)
  await expect(messageItem(admin.page, quick)).toHaveCount(0)
})

test('el inbox ordena, filtra, marca, archiva, responde por correo y elimina con confirmación', async ({ browser }) => {
  test.setTimeout(180_000)
  const ana = await seedMessage(browser, `Ana ${uniqueToken()}`)
  const bruno = await seedMessage(browser, `Bruno ${uniqueToken()}`)
  const zoe = await seedMessage(browser, `Zoe ${uniqueToken()}`)
  const { page } = admin
  await openPanel(page, '/es/inbox')
  for (const values of [ana, bruno, zoe]) await expect(messageItem(page, values.name)).toBeVisible()

  const names = () => page.locator('[data-cw-message] h3').allTextContents()
  const before = (list: string[], first: string, second: string) => list.indexOf(first) < list.indexOf(second)

  await page.locator('[data-cw-filter="name"]').click()
  await expect(page).toHaveURL(/sort=name/)
  await expect
    .poll(async () => {
      const list = await names()
      return list.join('|') === [...list].sort((a, b) => a.localeCompare(b, 'es')).join('|') && before(list, ana.name, zoe.name)
    })
    .toBe(true)

  await page.locator('[data-cw-filter="oldest"]').click()
  await expect(page).toHaveURL(/sort=oldest/)
  await expect.poll(async () => before(await names(), ana.name, zoe.name)).toBe(true)
  await page.locator('[data-cw-filter="newest"]').click()
  await expect(page).toHaveURL(/sort=newest/)
  await expect.poll(async () => before(await names(), zoe.name, ana.name)).toBe(true)

  const reply = messageItem(page, ana.name).locator('[data-cw-reply]')
  await expect(reply).toHaveAttribute('href', `mailto:${ana.email}?subject=Re%3A%20tu%20mensaje%20en%20CHERCED-WORLD`)

  const unreadBefore = Number(await page.locator('[data-cw-count="messages"]').textContent())
  await messageItem(page, ana.name).locator('[data-cw-action="read"]').click()
  await expect(messageItem(page, ana.name)).toHaveAttribute('data-status', 'read')
  await expect(page.locator('[data-cw-count="messages"]')).toHaveText(String(unreadBefore - 1))
  await messageItem(page, ana.name).locator('[data-cw-action="unread"]').click()
  await expect(messageItem(page, ana.name)).toHaveAttribute('data-status', 'unread')
  await messageItem(page, ana.name).locator('[data-cw-action="read"]').click()
  await expect(messageItem(page, ana.name)).toHaveAttribute('data-status', 'read')

  await page.locator('[data-cw-filter="unread"]').click()
  await expect(messageItem(page, bruno.name)).toBeVisible()
  await expect(messageItem(page, ana.name)).toHaveCount(0)
  await expect(page.locator('[data-cw-message]:not([data-status="unread"])')).toHaveCount(0)

  await page.locator('[data-cw-filter="inbox"]').click()
  await messageItem(page, bruno.name).locator('[data-cw-action="archive"]').click()
  await expect(messageItem(page, bruno.name)).toHaveCount(0)
  await page.locator('[data-cw-filter="archived"]').click()
  await expect(messageItem(page, bruno.name)).toHaveAttribute('data-status', 'archived')
  await messageItem(page, bruno.name).locator('[data-cw-action="unarchive"]').click()
  await expect(messageItem(page, bruno.name)).toHaveCount(0)
  await page.locator('[data-cw-filter="inbox"]').click()
  await expect(messageItem(page, bruno.name)).toHaveAttribute('data-status', 'read')

  await messageItem(page, zoe.name).locator('[data-cw-action="delete"]').click()
  const dialog = page.getByRole('dialog', { name: '¿Eliminar este mensaje?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toBeHidden()
  await expect(messageItem(page, zoe.name)).toBeVisible()
  await messageItem(page, zoe.name).locator('[data-cw-action="delete"]').click()
  await dialog.locator('[data-cw-confirm]').click()
  await expect(messageItem(page, zoe.name)).toHaveCount(0)
  await openPanel(page, '/es/inbox?view=all')
  await expect(messageItem(page, zoe.name)).toHaveCount(0)
  await expect(page.locator('[data-cw-consent-at="legacy"]')).toHaveCount(0)
})

test('dos pestañas del panel reflejan los cambios de la otra', async () => {
  const first = admin.page
  const second = await admin.context.newPage()
  await openPanel(first, '/es/inbox')
  await openPanel(second, '/es/inbox')
  const target = seeded.messages.find((values) => values.name.startsWith('Ana '))
  expect(target).toBeTruthy()
  await expect(messageItem(second, target?.name ?? '')).toBeVisible()
  await messageItem(first, target?.name ?? '').locator('[data-cw-action="archive"]').click()
  await expect(messageItem(first, target?.name ?? '')).toHaveCount(0)
  await expect(messageItem(second, target?.name ?? '')).toHaveCount(0, { timeout: UPDATE_WINDOW_MS })
  await second.close()
})

test('la moderación publica, responde como autor, rechaza y elimina, sin exponer correos', async ({ browser }) => {
  test.setTimeout(240_000)
  const post = '/es/blog/post1'
  const approved = await seedComment(browser, post, `Lectora ${uniqueToken()}`)
  const rejected = await seedComment(browser, post, `Troll ${uniqueToken()}`)
  const pending = await seedComment(browser, post, `Pendiente ${uniqueToken()}`)

  const { page } = admin
  await openPanel(page, '/es/inbox/comments')
  for (const values of [approved, rejected, pending]) {
    await expect(commentItem(page, values.userName)).toHaveAttribute('data-status', 'pending')
    await expect(commentItem(page, values.userName)).toContainText(values.email)
  }
  await expect(page.locator('[data-cw-count="comments"]')).toHaveText('3')

  const reader = await visitor(browser)
  await reader.page.goto(post)
  await expect(reader.page.locator('[data-cw-comment]').filter({ hasText: approved.comment })).toHaveCount(0)

  await commentItem(page, approved.userName).locator('[data-cw-action="approve"]').click()
  await expect(commentItem(page, approved.userName)).toHaveCount(0)
  await commentItem(page, rejected.userName).locator('[data-cw-action="reject"]').click()
  await expect(commentItem(page, rejected.userName)).toHaveCount(0)
  await expect(page.locator('[data-cw-count="comments"]')).toHaveText('1')

  await page.locator('[data-cw-filter="approved"]').click()
  const item = commentItem(page, approved.userName)
  await item.locator('[data-cw-action="reply"]').click()
  await item.getByLabel('Respuesta del autor').fill('Gracias por leer.')
  await item.locator('[data-cw-action="reply-save"]').click()
  await expect(item.locator('[data-cw-author-reply]')).toContainText('Gracias por leer.')

  const published = await publicComment(reader.page, post, approved.comment)
  await expect(published).toContainText(approved.userName)
  await expect
    .poll(
      async () => {
        await reader.page.goto(post)
        return reader.page.locator('[data-cw-comment]').filter({ hasText: approved.comment }).locator('[data-cw-author-reply]').count()
      },
      { timeout: 20_000, intervals: [500, 1000, 2000] },
    )
    .toBe(1)
  const replyBlock = reader.page.locator('[data-cw-comment]').filter({ hasText: approved.comment }).locator('[data-cw-author-reply]')
  await expect(replyBlock).toContainText('Autor')
  await expect(replyBlock).toContainText('Gracias por leer.')
  const html = await reader.page.content()
  for (const values of [approved, rejected, pending]) expect(html).not.toContain(values.email)
  expect(html).not.toContain(rejected.comment)
  expect(html).not.toContain(pending.comment)

  await item.getByRole('button', { name: 'Editar respuesta' }).click()
  await item.getByLabel('Respuesta del autor').fill('Gracias por leer, de verdad.')
  await item.locator('[data-cw-action="reply-save"]').click()
  await expect(item.locator('[data-cw-author-reply]')).toContainText('Gracias por leer, de verdad.')

  await item.locator('[data-cw-action="reject"]').click()
  await expect(item).toHaveCount(0)
  await expect
    .poll(
      async () => {
        await reader.page.goto(post)
        return reader.page.locator('[data-cw-comment]').filter({ hasText: approved.comment }).count()
      },
      { timeout: 20_000, intervals: [500, 1000, 2000] },
    )
    .toBe(0)

  await page.locator('[data-cw-filter="rejected"]').click()
  await expect(commentItem(page, approved.userName).locator('[data-cw-author-reply]')).toHaveCount(0)
  await commentItem(page, approved.userName).locator('[data-cw-action="approve"]').click()
  await expect(commentItem(page, approved.userName)).toHaveCount(0)
  await page.locator('[data-cw-filter="approved"]').click()
  await expect(commentItem(page, approved.userName).locator('[data-cw-author-reply]')).toHaveCount(0)
  await commentItem(page, approved.userName).locator('[data-cw-action="reply"]').click()
  await commentItem(page, approved.userName).getByLabel('Respuesta del autor').fill('Respuesta final del autor.')
  await commentItem(page, approved.userName).locator('[data-cw-action="reply-save"]').click()
  await expect(commentItem(page, approved.userName).locator('[data-cw-author-reply]')).toContainText('Respuesta final del autor.')

  await page.locator('[data-cw-filter="rejected"]').click()
  await commentItem(page, rejected.userName).locator('[data-cw-action="delete"]').click()
  const dialog = page.getByRole('dialog', { name: '¿Eliminar este comentario?' })
  await dialog.locator('[data-cw-confirm]').click()
  await expect(commentItem(page, rejected.userName)).toHaveCount(0)
  await page.locator('[data-cw-filter="all"]').click()
  await expect(commentItem(page, rejected.userName)).toHaveCount(0)
  await expect(commentItem(page, pending.userName)).toHaveAttribute('data-status', 'pending')
})

test('si se pierde la conexión el panel lo indica y reconecta solo', async () => {
  const { page } = admin
  await openPanel(page, '/es/inbox')
  const status = page.locator('[data-cw-updates]')
  await expect(status).toHaveAttribute('data-cw-updates', 'live')
  await page.route('**/api/admin/updates**', (route) => route.abort('internetdisconnected'))
  await expect(status).toHaveAttribute('data-cw-updates', 'reconnecting', { timeout: 8000 })
  await expect(status).toHaveText('Se perdió la conexión. Reconectando…')
  await page.unroute('**/api/admin/updates**')
  await expect(status).toHaveAttribute('data-cw-updates', 'live', { timeout: 15_000 })
  await expect(status).toHaveText('En vivo')
})

test('con la pestaña oculta el panel deja de preguntar y retoma al volver', async () => {
  const { page } = admin
  await openPanel(page, '/es/inbox')
  const polls: number[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/admin/updates')) polls.push(Date.now())
  })
  await expect.poll(() => polls.length, { timeout: 8000 }).toBeGreaterThan(0)
  await hideTab(page)
  const hiddenAt = Date.now()
  await page.waitForTimeout(7000)
  expect(polls.filter((at) => at > hiddenAt + 100)).toEqual([])
  const shownAt = Date.now()
  await showTab(page)
  await expect.poll(() => polls.filter((at) => at >= shownAt).length, { timeout: 2000 }).toBeGreaterThan(0)
})

test('si la sesión termina en medio de una acción, se informa qué no se completó', async ({ browser }) => {
  const extra = await seedMessage(browser, `Carla ${uniqueToken()}`)
  const { page } = await visitor(browser)
  await login(page, FIRST_PASSWORD)
  await panelReady(page)
  await expect(messageItem(page, extra.name)).toHaveAttribute('data-status', 'unread')
  await page.context().clearCookies()
  await messageItem(page, extra.name).locator('[data-cw-action="read"]').click()
  const alert = page.getByRole('alert').filter({ hasText: 'Tu sesión terminó. Inicia sesión de nuevo.' })
  await expect(alert).toBeVisible()
  await expect(alert).toContainText('No se completó: Marcar como leído')
  await expect(page.locator('[data-cw-login]')).toBeVisible()

  await openPanel(admin.page, '/es/inbox')
  await expect(messageItem(admin.page, extra.name)).toHaveAttribute('data-status', 'unread')
})

test('la contraseña se cambia confirmando la actual, y cerrar sesión invalida la cookie', async ({ browser }) => {
  const { page } = admin
  await openPanel(page, '/es/inbox/settings')
  const form = page.locator('[data-cw-change-password]')
  await form.getByLabel('Contraseña actual').fill(`${FIRST_PASSWORD}-mal`)
  await form.getByLabel('Nueva contraseña', { exact: true }).fill(SECOND_PASSWORD)
  await form.getByLabel('Repite la nueva contraseña').fill(SECOND_PASSWORD)
  await form.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await expect(form).toContainText('La contraseña actual no es correcta.')
  await expect(form.getByLabel('Nueva contraseña', { exact: true })).toHaveValue(SECOND_PASSWORD)

  await form.getByLabel('Contraseña actual').fill(FIRST_PASSWORD)
  await form.getByLabel('Nueva contraseña', { exact: true }).fill('corta')
  await form.getByLabel('Repite la nueva contraseña').fill('corta')
  await form.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await expect(form.getByLabel('Nueva contraseña', { exact: true })).toHaveJSProperty('validity.tooShort', true)

  await form.getByLabel('Nueva contraseña', { exact: true }).fill(SECOND_PASSWORD)
  await form.getByLabel('Repite la nueva contraseña').fill(SECOND_PASSWORD)
  await form.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Contraseña actualizada.' }).first()).toBeVisible()

  const cookie = (await admin.context.cookies()).find((item) => item.name === 'cw-admin')?.value ?? ''
  expect(cookie).toMatch(/^[A-Za-z0-9_-]{43}$/)
  await page.locator('[data-cw-logout]').first().click()
  await expect(page.locator('[data-cw-login]')).toBeVisible()
  const replay = await page.request.get('/api/admin/updates', { headers: { cookie: `cw-admin=${cookie}` } })
  expect(replay.status()).toBe(401)

  const other = await visitor(browser)
  await login(other.page, FIRST_PASSWORD)
  await expect(other.page.locator('[data-cw-form-error]')).toHaveText('No se pudo iniciar sesión. Revisa tus datos e intenta de nuevo.')
  await login(page, SECOND_PASSWORD)
  await expect(page.locator('[data-cw-panel]')).toBeVisible()
})

test('el login funciona sin JavaScript', async ({ browser }) => {
  const { page } = await visitor(browser, { javaScriptEnabled: false })
  await login(page, `incorrecta-${uniqueToken()}`, { js: false })
  await expect(page.locator('[data-cw-form-error]')).toHaveText('No se pudo iniciar sesión. Revisa tus datos e intenta de nuevo.')
  await login(page, SECOND_PASSWORD, { js: false })
  await expect(page).toHaveURL(/\/es\/inbox$/)
  await expect(page.locator('[data-cw-panel]')).toBeVisible()
  await expect(page.locator('[data-cw-message]').first()).toBeVisible()
})

test('escaneo de privacidad: ninguna respuesta pública trae datos de visitantes (SC-007)', async ({ browser }) => {
  test.setTimeout(240_000)
  expect(seeded.messages.length).toBeGreaterThanOrEqual(4)
  expect(seeded.comments.length).toBe(3)
  const secrets = [
    ...seeded.messages.flatMap((values) => [values.email, values.name, values.message]),
    ...seeded.comments.flatMap((values) => [values.email]),
    ...seeded.comments.filter((values) => !values.userName.startsWith('Lectora')).flatMap((values) => [values.userName, values.comment]),
    PHONE,
    '573119876543',
    '3119876543',
    '311 987 6543',
  ]
  const { context } = await visitor(browser)
  const report = await scanPublicSurface(context, secrets)
  test.info().annotations.push({ type: 'SC-007', description: `${report.responses} respuestas revisadas en ${report.urls} URLs` })
  expect(report.findings).toEqual([])
  expect(report.urls).toBeGreaterThan(40)

  const count = await context.request.get(INBOX_COUNT_PATH)
  if (count.status() === 404) {
    test.info().annotations.push({ type: 'E-01', description: `${INBOX_COUNT_PATH} todavía no existe en esta rama; lo agrega R0` })
  } else {
    expect(count.status(), `GET ${INBOX_COUNT_PATH}`).toBe(200)
    expect(count.headers()['content-type']).toContain('application/json')
    expect(inboxCountProblem(await count.text()), `GET ${INBOX_COUNT_PATH} solo devuelve { unread }`).toBeNull()
  }

  const control: Finding[] = []
  for (const path of ['/es/inbox?view=all', '/es/inbox/comments?view=all']) {
    await openPanel(admin.page, path)
    inspectBody(path, 'text/html', await admin.page.content(), secrets, control)
  }
  const detected = control.filter((finding) => finding.kind === 'dato de visitante').map((finding) => finding.detail)
  expect(detected, 'el escáner detecta los datos dentro del panel con sesión').toEqual(
    expect.arrayContaining([seeded.messages[0]?.email, PHONE, seeded.comments.find((values) => values.userName.startsWith('Pendiente'))?.email]),
  )
  expect(control.some((finding) => finding.kind === 'marca privada')).toBe(true)
  expect(control.some((finding) => finding.kind === 'dato del inbox'), 'el escáner detecta los contadores del panel con sesión').toBe(true)

  const logs = server.output()
  for (const values of [...seeded.messages, ...seeded.comments]) {
    expect(logs, 'los logs del servidor no llevan datos personales (FR-114)').not.toContain(values.email)
  }
  for (const secret of [PHONE, SECOND_PASSWORD, FIRST_PASSWORD]) expect(logs).not.toContain(secret)
})
