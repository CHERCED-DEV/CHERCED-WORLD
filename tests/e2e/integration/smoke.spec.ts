import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { LANGS, PUBLIC_PAGES, pendingPage, skipIntro } from './support/pages'

const SMOKE = '@smoke'

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`consola: ${message.text().split('\n')[0]}`)
  })
  page.on('pageerror', (error) => errors.push(`excepción: ${error.message.split('\n')[0]}`))
  return errors
}

async function stayLocal(context: BrowserContext, baseURL: string): Promise<void> {
  const origin = new URL(baseURL).origin
  await context.route(
    (url) => url.origin !== origin && url.protocol.startsWith('http'),
    (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>sitio externo</title>' }),
  )
}

async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

test.beforeEach(async ({ page, context, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'el humo corre en escritorio; móvil y sin JS los cubren las demás suites')
  await stayLocal(context, baseURL ?? '')
  await skipIntro(page)
})

test.describe('humo: cada página pública carga, tiene su h1 y no rompe', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path}`, { tag: SMOKE }, async ({ page }) => {
      test.setTimeout(60_000)
      const pending = pendingPage(path)
      test.skip(Boolean(pending), pending ?? '')
      const errors = watchErrors(page)
      const response = await page.goto(path)
      expect(response?.status(), `${path} responde`).toBe(200)
      await expect(page.locator('main#main')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 }), 'un solo h1 visible').toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await hydrated(page)
      expect(errors, `errores en ${path}`).toEqual([])
    })
  }
})

test.describe('humo: la navegación del header recorre las secciones', () => {
  for (const lang of LANGS) {
    test(`/${lang}: cada enlace del header lleva a su sección con su h1, y el idioma cambia`, { tag: SMOKE }, async ({ page }) => {
      test.setTimeout(90_000)
      const errors = watchErrors(page)
      await page.goto(`/${lang}`)
      await hydrated(page)
      const nav = page.locator('header#header nav').filter({ visible: true }).first()
      const hrefs = await nav.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
      expect(hrefs.length, 'el header tiene enlaces internos').toBeGreaterThanOrEqual(5)
      for (const href of [...hrefs.slice(1), hrefs[0]!]) {
        await nav.locator(`a[href="${href}"]`).first().click()
        await page.waitForURL((url) => url.pathname === href)
        await expect(page.getByRole('heading', { level: 1 }), `h1 en ${href}`).toBeVisible()
        await expect(nav.locator(`a[href="${href}"]`).first(), `${href} queda marcado`).toHaveAttribute('aria-current', 'page')
      }
      const other = lang === 'es' ? 'en' : 'es'
      await page.locator('header#header [data-cw-lang-switch]').filter({ visible: true }).first().click()
      await page.waitForURL((url) => url.pathname === `/${other}`)
      await expect(page.locator('html')).toHaveAttribute('lang', other)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(errors, `errores al navegar desde /${lang}`).toEqual([])
    })
  }
})
