import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function postLinks(page: Page, lang: 'es' | 'en') {
  await page.goto(`/${lang}/blog`)
  const hrefs = await page.locator('[data-cw-post-card] h2 a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  return hrefs.filter((href): href is string => typeof href === 'string')
}

async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

const UNAVAILABLE = '{"ok":false,"error":"unavailable"}'
const ACTION_RESULT = /\{"ok":(?:true|false)[^\n]*\}/

async function simulateAction(page: Page, path: string, replacement: string | null, sent: string[] = []) {
  await page.route(`**${path}`, async (route: Route) => {
    const request = route.request()
    if (request.method() !== 'POST' || !request.headers()['next-action']) return route.fallback()
    sent.push(request.postData() ?? '')
    const response = await route.fetch()
    const body = await response.text()
    if (replacement === null) return route.fulfill({ response, body })
    expect(body, 'la respuesta de la acción trae un ActionResult').toMatch(ACTION_RESULT)
    return route.fulfill({ response, body: body.replace(ACTION_RESULT, replacement) })
  })
  return sent
}

async function openCommentDialog(page: Page) {
  await page.locator('[data-cw-comment-open]').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  return dialog
}

async function fillValidComment(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Tu nombre').fill('Ana Prueba')
  await dialog.getByLabel('Tu correo (nunca se muestra)').fill('ana.prueba@example.com')
  await dialog.getByLabel('Tu comentario').fill('Un comentario de prueba <b>con HTML</b>.')
  await dialog.getByRole('checkbox').check()
}

test.describe('posts sin JavaScript', () => {
  onlyIn('no-js')

  test('el índice muestra bienvenida, átomo y una tarjeta enlazada por post', async ({ page }) => {
    await page.goto('/es/blog')
    await expect(page).toHaveTitle(/^Blog \| <-CHERCED-WORLD->$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('CHERCED-WORLD')
    await expect(page.getByText('Hice este espacio para compartir más sobre mí')).toBeVisible()
    await expect(page.locator('[data-cw-atom]')).toHaveAttribute('aria-hidden', 'true')
    await expect(page.locator('head link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/blog$/)

    const cards = page.locator('[data-cw-post-card]')
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
    for (const card of await cards.all()) {
      await expect(card.getByRole('heading', { level: 2 }).getByRole('link')).toHaveAttribute('href', /^\/es\/blog\/[\w-]+$/)
      await expect(card.getByRole('img')).toHaveAttribute('alt', /.+/)
      await expect(card.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
    }
  })

  for (const lang of ['es', 'en'] as const) {
    test(`cada post en ${lang} se lee completo, con fecha, tiempo de lectura y comentarios`, async ({ page }) => {
      const links = await postLinks(page, lang)
      expect(links.length).toBeGreaterThanOrEqual(1)
      for (const href of links) {
        await page.goto(href)
        const post = page.locator('[data-cw-post]')
        await expect(post.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(post.locator('header time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
        await expect(post.locator('[data-cw-reading-time]')).toHaveText(lang === 'es' ? /^\d+ min de lectura$/ : /^\d+ min read$/)
        await expect(post.locator('header img')).toHaveAttribute('alt', /.+/)
        const paragraphs = post.locator('[data-cw-post-body] p')
        expect(await paragraphs.count(), href).toBeGreaterThanOrEqual(2)
        await expect(paragraphs.first()).toBeVisible()
        await expect(page.getByRole('heading', { name: lang === 'es' ? 'Comentarios' : 'Comments' })).toBeVisible()
        await expect(page.locator('[data-cw-comments-state], [data-cw-comment-list]').first()).toBeVisible()
        await expect(page.locator('[data-cw-comment-open]')).toBeHidden()
        await expect(page.locator('[data-cw-share-target="linkedin"]')).toBeVisible()
        await expect(page.locator('[data-cw-lang-notice]')).toHaveCount(0)
      }
    })
  }

  test('el código llega resaltado desde el servidor y el botón de copiar no aparece', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    const block = page.locator('[data-cw-code="typescript"]').first()
    await expect(block.locator('.sh__token--keyword').first()).toBeVisible()
    await expect(block.locator('pre')).toContainText('Math.ceil(words / 200)')
    await expect(block.locator('[data-cw-copy]')).toBeHidden()
    await expect(page.locator('[data-cw-toc]')).toBeVisible()
  })

  test('un post que no existe responde 404', async ({ request }) => {
    const response = await request.get('/es/blog/no-existe')
    expect(response.status()).toBe(404)
  })
})

test.describe('código copiable', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('copia el bloque exacto y lo anuncia', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL })
    await page.goto('/es/blog/catalog')
    const block = page.locator('[data-cw-code="typescript"]').first()
    const expected = (await block.locator('pre').innerText()).replace(/\n$/, '')
    const button = block.locator('[data-cw-copy]')
    await button.click()
    await expect(button).toHaveAttribute('data-cw-copy', 'done')
    await expect(button).toHaveText('Código copiado')
    await expect(block.getByRole('status')).toHaveText('Código copiado')
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied.replace(/\r\n/g, '\n')).toBe(expected)
    expect(expected).toContain('export function readingMinutes(words: number): number {')
    await expect(button).toHaveAttribute('data-cw-copy', 'idle', { timeout: 5000 })
  })

  test('copia el enlace del post para compartir', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL })
    await page.goto('/en/blog/post1')
    await page.locator('[data-cw-share] [data-cw-copy]').click()
    await expect(page.locator('[data-cw-share] [data-cw-copy]')).toHaveText('Link copied')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^https?:\/\/[^/]+\/en\/blog\/post1$/)
    const linkedin = page.locator('[data-cw-share-target="linkedin"]')
    await expect(linkedin).toHaveAttribute('target', '_blank')
    await expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(linkedin).toHaveAttribute('href', /^https:\/\/www\.linkedin\.com\/sharing\/share-offsite\/\?url=/)
  })
})

test.describe('índice del post y anclas', () => {
  onlyIn('desktop-chromium')

  test('el índice lleva a cada encabezado y el encabezado enlaza a sí mismo', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    const toc = page.locator('[data-cw-toc]')
    await expect(toc.getByRole('heading', { name: 'En este post' })).toBeVisible()
    await toc.getByRole('link', { name: 'Código' }).click()
    await expect(page).toHaveURL(/#codigo$/)
    const heading = page.locator('h2#codigo')
    await expect(heading).toBeInViewport()
    await expect(heading.getByRole('link')).toHaveAttribute('href', '#codigo')
  })

  test('GlassDemo cambia de variante con el teclado', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    const demo = page.locator('[data-cw-glass-demo]')
    await expect(demo).toHaveAttribute('data-cw-glass-demo', 'standard')
    await demo.getByRole('radio', { name: 'Fuerte' }).check()
    await expect(demo).toHaveAttribute('data-cw-glass-demo', 'strong')
    await expect(demo.locator('[data-cw-glass="strong"]')).toContainText('glass fuerte')
    await demo.getByRole('checkbox', { name: 'Mover el fondo' }).uncheck()
    await expect(demo.getByRole('checkbox', { name: 'Mover el fondo' })).not.toBeChecked()
  })
})

test.describe('formulario de comentarios', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('valida en el cliente con los mismos criterios que el servidor', async ({ page }) => {
    await page.goto('/es/blog/post1')
    const dialog = await openCommentDialog(page)
    await expect(dialog.getByRole('heading', { name: 'Deja un comentario' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Enviar' }).click()
    await expect(dialog.getByText('Este campo es obligatorio')).toHaveCount(3)
    await expect(dialog.getByText('Para enviar este formulario necesitas aceptar la política de privacidad.')).toBeVisible()
    await expect(dialog.getByLabel('Tu nombre')).toBeFocused()
    await expect(dialog.getByLabel('Tu nombre')).toHaveAttribute('aria-invalid', 'true')

    await dialog.getByLabel('Tu correo (nunca se muestra)').fill('no-es-correo')
    await dialog.getByRole('button', { name: 'Enviar' }).click()
    await expect(dialog.getByText('Escribe un correo válido')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'política de privacidad' })).toHaveAttribute('href', '/es/privacy')
  })

  test('con la acción no disponible avisa con honestidad y no pierde lo escrito', async ({ page }) => {
    await page.goto('/es/blog/post1')
    const sent = await simulateAction(page, '/es/blog/post1', UNAVAILABLE)
    const dialog = await openCommentDialog(page)
    await fillValidComment(page)
    await dialog.getByRole('button', { name: 'Enviar' }).click()

    await expect(dialog.getByRole('alert')).toContainText('Los comentarios no están disponibles en este momento')
    await expect(dialog.getByLabel('Tu nombre')).toHaveValue('Ana Prueba')
    await expect(dialog.getByLabel('Tu comentario')).toHaveValue('Un comentario de prueba <b>con HTML</b>.')
    await expect(dialog.getByRole('checkbox')).toBeChecked()

    expect(sent).toHaveLength(1)
    const body = sent[0] ?? ''
    for (const [field, value] of [
      ['postId', 'post1'],
      ['lang', 'es'],
      ['userName', 'Ana Prueba'],
      ['email', 'ana.prueba@example.com'],
      ['consent', 'on'],
    ]) {
      expect(body, field).toMatch(new RegExp(`name="[^"]*${field}"\\r\\n\\r\\n${value}\\r\\n`))
    }
    expect(body).toMatch(/name="[^"]*renderedAt"\r\n\r\n\d{13}\r\n/)
    expect(body).toMatch(/name="[^"]*website"\r\n\r\n\r\n/)
  })

  test('cuando la acción acepta el comentario, avisa que está en revisión', async ({ page }) => {
    await page.goto('/es/blog/post1')
    await simulateAction(page, '/es/blog/post1', '{"ok":true}')
    let dialog = await openCommentDialog(page)
    await fillValidComment(page)
    await dialog.getByRole('button', { name: 'Enviar' }).click()

    const status = dialog.locator('[data-cw-comment-status="success"]')
    await expect(status).toContainText('¡Gracias! Tu comentario está en revisión.')
    await expect(status).toBeFocused()
    await expect(page.locator('[data-cw-comment-list]')).toHaveCount(0)

    await status.getByRole('button', { name: 'Cerrar' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('[data-cw-comment-open]')).toBeFocused()

    dialog = await openCommentDialog(page)
    await expect(dialog.getByLabel('Tu nombre')).toHaveValue('')
  })

  test('cuando hay límite de envíos lo explica', async ({ page }) => {
    await page.goto('/en/blog/post2')
    await simulateAction(page, '/en/blog/post2', '{"ok":false,"error":"rate_limited","retryAfterMs":60000}')
    const dialog = await openCommentDialog(page)
    await dialog.getByLabel('Your name').fill('Ann Test')
    await dialog.getByLabel('Your email (never shown)').fill('ann.test@example.com')
    await dialog.getByLabel('Your comment').fill('Hello')
    await dialog.getByRole('checkbox').check()
    await dialog.getByRole('button', { name: 'Send' }).click()
    await expect(dialog.getByRole('alert')).toContainText("You've sent several comments in a short time.")
  })

  test('Esc cierra el diálogo y devuelve el foco', async ({ page }) => {
    await page.goto('/es/blog/post1')
    const dialog = await openCommentDialog(page)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.locator('[data-cw-comment-open]')).toBeFocused()
  })
})

test.describe('aviso de idioma', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('un post que solo existe en español avisa en inglés y marca su idioma', async ({ page }) => {
    await page.goto('/en/blog/catalog')
    const notice = page.locator('[data-cw-lang-notice]')
    await expect(notice).toBeVisible()
    await expect(notice).toHaveAttribute('role', 'note')
    await expect(notice).toContainText('Originally written in Spanish.')
    await expect(notice).toContainText("This post isn't available in English yet")
    await expect(page.locator('[data-cw-post-body]')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('lang', 'es')
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', /\/es\/blog\/catalog$/)
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('en su idioma original no hay aviso', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    await expect(page.locator('[data-cw-lang-notice]')).toHaveCount(0)
    await expect(page.locator('[data-cw-post-body]')).not.toHaveAttribute('lang', /.+/)
  })
})

test.describe('accesibilidad (axe)', () => {
  onlyIn('desktop-chromium')

  for (const scheme of ['dark', 'light'] as const) {
    for (const path of ['/es/blog', '/en/blog/post1', '/en/blog/catalog']) {
      test(`${path} sin violaciones críticas ni serias en tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.goto(path)
        expect(await blockingViolations(page)).toEqual([])
      })
    }

    test(`diálogo de comentarios con errores sin violaciones en tema ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto('/es/blog/post1')
      const dialog = await openCommentDialog(page)
      await dialog.getByRole('button', { name: 'Enviar' }).click()
      await expect(dialog.getByText('Este campo es obligatorio').first()).toBeVisible()
      expect(await blockingViolations(page)).toEqual([])
    })
  }
})
