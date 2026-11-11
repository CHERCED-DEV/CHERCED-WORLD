import { expect, test, type Page } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

const COPY = {
  es: { title: 'Esta página se fue mar adentro', cta: 'Volver al inicio', footer: 'VOLVER ARRIBA' },
  en: { title: 'This page drifted out to sea', cta: 'Back to home', footer: 'BACK TO TOP' },
} as const

const ROUTES = [
  ['/es/no-existe', 'es'],
  ['/en/no-existe', 'en'],
  ['/es/portfolio/99', 'es'],
  ['/en/portfolio/99', 'en'],
  ['/es/blog/no-existe', 'es'],
  ['/en/blog/no-existe', 'en'],
  ['/es/blog/tag/no-existe-esta-etiqueta', 'es'],
  ['/en/blog/tag/no-such-tag', 'en'],
  ['/es/a/b/c', 'es'],
] as const

test.describe('404 real (B6, T940, T227 de la 002)', () => {
  onlyIn('desktop-chromium')

  for (const [route, lang] of ROUTES) {
    test(`${route} responde 404 con la vista completa en el HTML del servidor`, async ({ request }) => {
      const response = await request.get(route)
      expect(response.status()).toBe(404)
      const html = await response.text()
      expect(html).toMatch(new RegExp(`<html[^>]* lang="${lang}"`))
      expect(html).toContain(`<title>${COPY[lang].title} · Camilo Hernández</title>`)
      expect(html.match(/<meta name="robots"[^>]*>/g)).toEqual(['<meta name="robots" content="noindex"/>'])
      expect(html).toMatch(new RegExp(`<h1[^>]*>${COPY[lang].title}</h1>`))
      expect(html).toContain('data-cw-not-found=""')
      expect(html).toContain('<header id="header"')
      expect(html).toContain('<footer id="footer"')
      expect(html).toContain('data-cw-background=""')
      expect(html).not.toContain('id="__next_error__"')
    })
  }

  test('una ruta que existe sigue respondiendo 200', async ({ request }) => {
    for (const route of ['/es', '/en/portfolio/1', '/es/blog/post1', '/en/blog/tag/humor']) {
      expect((await request.get(route)).status(), route).toBe(200)
    }
  })

  test('las rutas inexistentes también responden 404 al navegar por RSC', async ({ request }) => {
    for (const [route] of ROUTES) {
      const response = await request.get(route, { headers: { RSC: '1' } })
      expect(response.status(), route).toBe(404)
      expect(response.headers()['content-type']).toContain('text/x-component')
      expect(await response.text()).not.toContain('Expected RSC response')
    }
    for (const route of ['/es/portfolio/%31', '/en/blog/post1', '/es/blog/tag/humor']) {
      expect((await request.get(route, { headers: { RSC: '1' } })).status(), route).toBe(200)
    }
  })

  test('una primera parte que no es idioma ni ruta responde 404 con identidad', async ({ request }) => {
    const response = await request.get('/wp-login.php')
    expect(response.status()).toBe(404)
    const html = await response.text()
    expect(html).toMatch(/<h1[^>]*>Esta página se fue mar adentro<\/h1>/)
    expect(html).toContain('<footer id="footer"')
  })

  test('con JS, el 404 hidrata, el fondo corre y el botón lleva al inicio', async ({ page }) => {
    await skipIntro(page)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const response = await page.goto('/en/portfolio/99')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.en.title)
    await expect(page.locator('[data-cw-background]')).toHaveAttribute('data-state', 'running')
    await expect(page.locator('html')).toHaveAttribute('data-theme', /^(dark|light)$/)
    await page.locator('[data-cw-not-found]').getByRole('link', { name: COPY.en.cta }).click()
    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('[data-cw-not-found]')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})

test.describe('404 sin JavaScript (B6)', () => {
  onlyIn('no-js')

  for (const [route, lang] of ROUTES) {
    test(`${route} se lee completo sin JS, con header y footer`, async ({ page }) => {
      const response = await page.goto(route)
      expect(response?.status()).toBe(404)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page).toHaveTitle(`${COPY[lang].title} · Camilo Hernández`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY[lang].title)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('[data-cw-not-found]').getByRole('link', { name: COPY[lang].cta })).toHaveAttribute('href', `/${lang}`)
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
      await expect(page.locator('header#header')).toBeVisible()
      await expect(page.locator('footer#footer')).toBeVisible()
      await expect(page.locator('footer#footer').getByRole('link', { name: COPY[lang].footer })).toHaveAttribute('href', '#header')
    })
  }
})
