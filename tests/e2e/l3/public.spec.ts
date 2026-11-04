import { expect, test } from '@playwright/test'
import { captureActionResponses, fillContact, onlyIn, openContact, renderJustNow, uniqueToken, useIp, waitMinimumFill } from './support/helpers'
import { INBOX_COUNT_PATH, inspectBody, type Finding, type ResponseMeta } from './support/privacy'

const sendButton = { name: 'Enviar' }

function visitor(token: string) {
  return {
    name: `Visitante ${token}`,
    email: `visitante.${token}@example.org`,
    phone: '+57 300 123 4567',
    message: `Hola, quiero hablar de un proyecto (${token}).`,
  }
}

test.describe('contacto con JavaScript', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('sin la casilla de autorización no se envía y se explica con enlace a la política', async ({ page }) => {
    const sent: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.headers()['next-action']) sent.push(request.url())
    })
    await useIp(page)
    await openContact(page)
    const values = visitor(uniqueToken())
    await fillContact(page, { ...values, consent: false })
    const form = page.locator('[data-cw-contact-form]')
    await form.getByRole('button', sendButton).click()

    const consent = form.getByRole('checkbox')
    await expect(consent).toHaveAttribute('aria-invalid', 'true')
    await expect(consent).toBeFocused()
    await expect(form).toContainText('Para enviar este formulario necesitas aceptar la política de privacidad.')
    const policy = form.getByRole('link', { name: /política de privacidad/ })
    await expect(policy).toHaveAttribute('href', '/es/privacy')
    await expect(form.getByLabel('Tu nombre')).toHaveValue(values.name)
    await expect(form.getByLabel('Tu mensaje')).toHaveValue(values.message)
    expect(sent).toEqual([])
  })

  test('los campos inválidos se señalan sin perder lo escrito', async ({ page }) => {
    await useIp(page)
    await openContact(page)
    const values = visitor(uniqueToken())
    await fillContact(page, { ...values, email: 'no-es-un-correo', phone: '12', message: '' })
    const form = page.locator('[data-cw-contact-form]')
    await form.getByRole('button', sendButton).click()

    await expect(form.getByLabel('Tu correo')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Teléfono (opcional)')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Tu mensaje')).toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Tu nombre')).not.toHaveAttribute('aria-invalid', 'true')
    await expect(form.getByLabel('Tu correo')).toBeFocused()
    await expect(form.getByLabel('Tu nombre')).toHaveValue(values.name)
    await expect(form.getByLabel('Tu correo')).toHaveValue('no-es-un-correo')
    await expect(form.getByRole('checkbox')).toBeChecked()
  })

  test('un envío válido confirma, limpia el formulario y conserva el teléfono tal cual', async ({ page }) => {
    await useIp(page)
    const loadedAt = await openContact(page)
    await fillContact(page, visitor(uniqueToken()))
    const bodies = await captureActionResponses(page, '/es/contactMe')
    await waitMinimumFill(page, loadedAt)
    await page.locator('[data-cw-contact-form]').getByRole('button', sendButton).click()

    await expect(page.getByRole('status').filter({ hasText: 'Gracias por escribirme. Te respondo pronto.' })).toBeVisible()
    expect(bodies.join('')).toContain('{"ok":true')
    const form = page.locator('[data-cw-contact-form]')
    await expect(form.getByLabel('Tu nombre')).toHaveValue('')
    await expect(form.getByLabel('Teléfono (opcional)')).toHaveValue('')
    await expect(form.getByRole('checkbox')).not.toBeChecked()
  })

  test('el cuarto envío en 10 minutos desde el mismo origen se rechaza con un mensaje amable', async ({ page }) => {
    test.setTimeout(60_000)
    await useIp(page)
    const loadedAt = await openContact(page)
    await waitMinimumFill(page, loadedAt)
    const form = page.locator('[data-cw-contact-form]')
    for (let i = 0; i < 3; i++) {
      await fillContact(page, visitor(uniqueToken()))
      await form.getByRole('button', sendButton).click()
      await expect(form.getByLabel('Tu nombre')).toHaveValue('')
    }
    const last = visitor(uniqueToken())
    await fillContact(page, last)
    await form.getByRole('button', sendButton).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Enviaste varios mensajes en poco tiempo.' })).toBeVisible()
    await expect(form.getByLabel('Tu nombre')).toHaveValue(last.name)
  })

  test('el campo trampa lleno se descarta sin avisarle al bot', async ({ page }) => {
    await useIp(page)
    const loadedAt = await openContact(page)
    await fillContact(page, visitor(uniqueToken()))
    await page.locator('input[name="website"]').evaluate((input: HTMLInputElement) => {
      input.value = 'https://spam.example'
    })
    const bodies = await captureActionResponses(page, '/es/contactMe')
    await waitMinimumFill(page, loadedAt)
    await page.locator('[data-cw-contact-form]').getByRole('button', sendButton).click()
    await expect(page.getByRole('status').filter({ hasText: 'Gracias por escribirme.' })).toBeVisible()
    expect(bodies.join('')).toContain('{"ok":true')
  })

  test('un envío más rápido que una persona no se guarda', async ({ page }) => {
    await useIp(page)
    await openContact(page)
    await fillContact(page, visitor(uniqueToken()))
    const bodies = await captureActionResponses(page, '/es/contactMe')
    await renderJustNow(page)
    await page.locator('[data-cw-contact-form]').getByRole('button', sendButton).click()
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo enviar tu mensaje.' })).toBeVisible()
    expect(bodies.join('')).toContain('{"ok":false,"error":"validation"}')
  })
})

test.describe('contacto sin JavaScript', () => {
  onlyIn('no-js')

  test('un envío válido llega al servidor y se confirma en la página', async ({ page }) => {
    await useIp(page)
    const loadedAt = await openContact(page, { js: false })
    await fillContact(page, visitor(uniqueToken()))
    await waitMinimumFill(page, loadedAt)
    await page.locator('[data-cw-contact-form]').getByRole('button', sendButton).click()
    await expect(page.locator('[data-cw-contact-status="ok"]')).toHaveText('Gracias por escribirme. Te respondo pronto.')
  })

  test('sin la casilla el navegador no deja enviar y no se pierde nada', async ({ page }) => {
    await useIp(page)
    await openContact(page, { js: false })
    const values = visitor(uniqueToken())
    await fillContact(page, { ...values, consent: false })
    const form = page.locator('[data-cw-contact-form]')
    await form.getByRole('button', sendButton).click()
    await expect(form.getByRole('checkbox')).toHaveJSProperty('validity.valueMissing', true)
    await expect(form.getByLabel('Tu nombre')).toHaveValue(values.name)
    await expect(page).toHaveURL(/\/es\/contactMe$/)
  })

  test('la política de privacidad se ve completa en ambos idiomas', async ({ page }) => {
    await page.goto('/es/privacy')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Política de privacidad')
    await expect(page.getByRole('heading', { name: 'Qué datos recojo' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Datos técnicos' })).toBeVisible()
    await page.goto('/en/privacy')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy policy')
    await expect(page.getByRole('heading', { name: 'What data I collect' })).toBeVisible()
  })
})

test.describe('vistas privadas sin sesión', () => {
  onlyIn('desktop-chromium')

  test('GET /api/admin/updates responde 401 sin datos, también con una cookie inventada', async ({ request }) => {
    for (const headers of [{}, { cookie: `cw-admin=${'A'.repeat(43)}` }, { cookie: 'cw-admin=../../etc' }] as Array<Record<string, string>>) {
      const response = await request.get('/api/admin/updates?since=2000-01-01T00:00:00.000Z', { headers })
      expect(response.status()).toBe(401)
      expect(response.headers()['cache-control']).toContain('no-store')
      expect(await response.json()).toEqual({ error: 'unauthorized' })
    }
  })

  test('/es/inbox no muestra el panel ni datos, y no se indexa', async ({ page }) => {
    for (const path of ['/es/inbox', '/es/inbox/comments', '/es/inbox/settings', '/en/inbox']) {
      const response = await page.goto(path)
      expect(response?.status(), path).toBeLessThan(400)
      await expect(page.locator('[data-cw-setup], [data-cw-login]').first()).toBeVisible()
      await expect(page.locator('[data-cw-panel], [data-cw-message], [data-cw-comment], [data-cw-count]')).toHaveCount(0)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    }
  })

  test('las rutas API de 2023 responden 410', async ({ request }) => {
    const routes = ['/api/contactMe', '/api/blog/comments/post1', '/api/blog', '/api/sockets', '/api/sockets/inbox', '/api/customCMS', '/api/projects', '/api/projects/1']
    for (const route of routes) {
      for (const method of ['get', 'post'] as const) {
        const response = await request[method](route)
        expect(response.status(), `${method} ${route}`).toBe(410)
        expect(await response.json()).toEqual({ error: 'gone' })
      }
    }
  })

  test('el acceso al panel no se anuncia en el sitio público', async ({ page }) => {
    for (const path of ['/es', '/es/contactMe', '/es/privacy', '/en/blog']) {
      await page.goto(path)
      await expect(page.locator('a[href*="/inbox"]')).toHaveCount(0)
    }
  })
})

test.describe('escáner de privacidad (E-01)', () => {
  onlyIn('desktop-chromium')

  const inspect = (meta: ResponseMeta, body: string, contentType = 'application/json'): Finding[] => {
    const findings: Finding[] = []
    inspectBody(`${meta.method} ${meta.path}`, contentType, body, [], findings, meta)
    return findings
  }
  const countGet: ResponseMeta = { method: 'GET', path: INBOX_COUNT_PATH, status: 200 }

  test('acepta GET /api/inbox-count con { unread } y nada más', () => {
    expect(inspect(countGet, '{"unread":0}')).toEqual([])
    expect(inspect(countGet, '{"unread":12}')).toEqual([])
    expect(inspect(countGet, ''), 'un fetch del buzón abortado al navegar no trae cuerpo').toEqual([])
  })

  test('cualquier otro dato del inbox en una respuesta pública es un hallazgo', () => {
    const cases: Array<[ResponseMeta, string, string]> = [
      [countGet, '{"unread":3,"pending":1}', 'application/json'],
      [countGet, '{"unread":-1}', 'application/json'],
      [countGet, '{"unread":"3"}', 'application/json'],
      [countGet, '[3]', 'application/json'],
      [{ method: 'POST', path: INBOX_COUNT_PATH, status: 200 }, '{"unread":3}', 'application/json'],
      [{ method: 'GET', path: '/api/search-index/es', status: 200 }, '{"docs":[],"unread":3}', 'application/json'],
      [{ method: 'GET', path: '/es', status: 200 }, '<script>self.__next_f.push([1,"{\\"pending\\":2}"])</script>', 'text/html'],
      [{ method: 'GET', path: '/es', status: 200 }, '0:{"unread":5}', 'text/x-component'],
    ]
    for (const [meta, body, contentType] of cases) {
      expect(
        inspect(meta, body, contentType).map((finding) => finding.kind),
        `${meta.method} ${meta.path} ${body}`,
      ).toContain('dato del inbox')
    }
  })

  test('los datos de visitantes siguen fallando también dentro de la excepción', () => {
    const findings: Finding[] = []
    inspectBody(`GET ${INBOX_COUNT_PATH}`, 'application/json', '{"unread":1,"from":"ana@example.org"}', ['ana@example.org'], findings, countGet)
    expect(findings.map((finding) => finding.kind)).toEqual(expect.arrayContaining(['dato de visitante', 'correo', 'dato del inbox']))
  })
})
