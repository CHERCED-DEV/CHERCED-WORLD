import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import en from '@/content/i18n/en/mcp.json'
import es from '@/content/i18n/es/mcp.json'

const TEXT = { es, en } as const

const TOOLS = [
  'search_portfolio',
  'list_case_studies',
  'get_case_study',
  'get_decisions',
  'get_career',
  'get_skills',
  'list_posts',
  'match_job_description',
  'get_contact_options',
  'search',
  'fetch',
]

const MODERN_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
  'mcp-protocol-version': '2026-07-28',
}

const META = {
  'io.modelcontextprotocol/protocolVersion': '2026-07-28',
  'io.modelcontextprotocol/clientInfo': { name: 'playwright', version: '1.0.0' },
  'io.modelcontextprotocol/clientCapabilities': {},
}

async function open(page: Page, lang: 'es' | 'en' = 'es'): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/mcp`)
  await expect(page.locator('[data-cw-mcp-ready]')).toBeVisible({ timeout: 30_000 })
}

test.describe('página /mcp (US2, FR-4411)', () => {
  test('sin JavaScript se ven la URL, los pasos por cliente y el catálogo de tools/list', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/en/mcp')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TEXT.en['mcp.title'])
    await expect(page.locator('[data-cw-mcp-url]')).toContainText('/api/mcp')
    await expect(page.locator('[data-cw-mcp-client]')).toHaveCount(5)
    await expect(page.locator('[data-cw-mcp-tool]')).toHaveCount(TOOLS.length)
    for (const name of TOOLS) await expect(page.locator(`[data-cw-mcp-tool="${name}"]`)).toContainText(name)
    await expect(page.locator('[data-cw-mcp-prompt]')).toHaveCount(2)
    await expect(page.locator('[data-cw-mcp-noscript]')).toHaveText(TEXT.en['mcp.tester.noscript'])
    await expect(page.locator('[data-cw-mcp-noscript]')).toBeVisible()
    await context.close()
  })

  test('«Probar» en get_case_study muestra la petición, la respuesta, los milisegundos y «Copiar»', async ({ page }) => {
    await open(page)
    await expect(page.locator('[data-cw-mcp-noscript]')).toBeHidden()
    await page.locator('[data-cw-mcp-try="get_case_study"]').click()
    const exchange = page.locator('[data-cw-mcp-exchange="tools/call"]').first()
    await expect(exchange).toHaveAttribute('data-cw-mcp-status', '200')
    await expect(exchange.locator('[data-cw-mcp-request]')).toContainText('"name": "get_case_study"')
    await expect(exchange.locator('[data-cw-mcp-request]')).toContainText('mcp-name: get_case_study')
    await expect(exchange.locator('[data-cw-mcp-response]')).toContainText('Synergos')
    await expect(exchange).toContainText(/HTTP 200 · \d+ ms/)
    await expect(exchange.getByRole('button', { name: TEXT.es['mcp.tester.copy'] })).toBeVisible()
    await expect(page.locator('[data-cw-mcp-announce]')).toContainText(/tools\/call: HTTP 200 en \d+ ms/)
    await expect(exchange.locator('article')).toBeFocused()
  })

  test('con initialize: la notificación responde 202 y tools/list trae el catálogo real', async ({ page }) => {
    await open(page, 'en')
    await page.locator('[data-cw-mcp-era="legacy"]').click()
    await expect(page.locator('[data-cw-mcp-era="legacy"]')).toBeChecked()
    await page.locator('[data-cw-mcp-step="1"]').click()
    await expect(page.locator('[data-cw-mcp-exchange="initialize"]')).toHaveAttribute('data-cw-mcp-status', '200')
    await expect(page.locator('[data-cw-mcp-exchange="notifications/initialized"]')).toHaveAttribute('data-cw-mcp-status', '202')
    await page.locator('[data-cw-mcp-step="2"]').click()
    const list = page.locator('[data-cw-mcp-exchange="tools/list"]').first()
    await expect(list).toHaveAttribute('data-cw-mcp-status', '200')
    await expect(list.locator('[data-cw-mcp-request]')).toContainText('mcp-protocol-version: 2025-11-25')
    for (const name of TOOLS) await expect(list.locator('[data-cw-mcp-response]')).toContainText(`"name": "${name}"`)
  })

  test('si el servidor no responde, el error se ve y no hay una lista vacía engañosa', async ({ page }) => {
    await open(page)
    await page.route('**/api/mcp', (route) => route.abort('failed'))
    await page.locator('[data-cw-mcp-step="2"]').click()
    const failed = page.locator('[data-cw-mcp-exchange="tools/list"]').first()
    await expect(failed).toHaveAttribute('data-cw-mcp-status', 'error')
    await expect(failed.locator('[data-cw-mcp-error]')).toContainText('El servidor no respondió')
    await expect(failed.locator('[data-cw-mcp-response]')).toHaveCount(0)
  })

  test('JSON inválido en los argumentos se avisa sin llamar al servidor', async ({ page }) => {
    await open(page)
    await page.locator('[data-cw-mcp-args]').fill('{ no es json')
    await page.locator('[data-cw-mcp-step="3"]').click()
    await expect(page.getByText(TEXT.es['mcp.tester.badJson'])).toBeVisible()
    await expect(page.locator('[data-cw-mcp-args]')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('[data-cw-mcp-exchange]')).toHaveCount(0)
  })

  test('se opera con teclado', async ({ page }) => {
    await open(page)
    await page.locator('[data-cw-mcp-try="search_portfolio"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-cw-mcp-exchange="tools/call"] article').first()).toBeFocused()
    await page.locator('[data-cw-mcp-tool-select]').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-cw-mcp-args]')).toBeFocused()
    await page.locator('[data-cw-mcp-step="1"]').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-cw-mcp-exchange="server/discover"]')).toHaveAttribute('data-cw-mcp-status', '200')
  })

  test('axe sin violaciones serias ni críticas, en oscuro y en claro', async ({ page }) => {
    for (const theme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
      await open(page)
      await page.locator('[data-cw-mcp-try="list_case_studies"]').click()
      await expect(page.locator('[data-cw-mcp-exchange="tools/call"]').first()).toHaveAttribute('data-cw-mcp-status', '200')
      const results = await new AxeBuilder({ page }).include('[data-cw-mcp]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(
        results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious').map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`),
        theme,
      ).toEqual([])
    }
  })

  test('captura de /es/mcp para la revisión en el celular y en escritorio', async ({ page }, testInfo) => {
    await open(page)
    const dir = join(process.cwd(), 'test-results', 'mcp-capturas')
    mkdirSync(dir, { recursive: true })
    await page.screenshot({ path: join(dir, `es-mcp-${testInfo.project.name}.png`), fullPage: true })
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width)
  })
})

test.describe('endpoint /api/mcp en el servidor local (US1)', () => {
  test('tools/call responde JSON con fuente absoluta; GET da 405', async ({ request }) => {
    const reply = await request.post('/api/mcp', {
      headers: { ...MODERN_HEADERS, 'mcp-method': 'tools/call', 'mcp-name': 'search_portfolio' },
      data: { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'search_portfolio', arguments: { query: 'sagas' }, _meta: META } },
    })
    expect(reply.status()).toBe(200)
    expect(reply.headers()['cache-control']).toBe('no-store')
    expect(reply.headers()['access-control-allow-origin']).toBe('*')
    const body = (await reply.json()) as { result: { isError: boolean; structuredContent: { sources: Array<{ url: string }> } } }
    expect(body.result.isError).toBe(false)
    expect(body.result.structuredContent.sources[0]!.url).toMatch(/^http:\/\/localhost:\d+\/en\//)
    expect((await request.get('/api/mcp')).status()).toBe(405)
  })
})