import { mkdirSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import en from '@/content/i18n/en/engineering.json'
import es from '@/content/i18n/es/engineering.json'

const COPY = { es, en: { ...es, ...en } } as const

const LANGS = ['es', 'en'] as const

const SHOTS = path.join(process.cwd(), 'test-results', 'engineering')

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const DEV_SERVER = process.env.E2E_DEV_SERVER === '1'

test.describe.configure({ timeout: 120_000 })

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

function withJs(testInfo: TestInfo): boolean {
  return testInfo.project.name !== 'no-js'
}

async function open(page: Page, url: string): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  const response = await page.goto(url)
  expect(response?.status(), url).toBe(200)
}

async function openAll(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const details of document.querySelectorAll<HTMLDetailsElement>('[data-cw-engineering] details')) details.open = true
  })
}

test.describe('tablero de ingeniería (045)', () => {
  for (const lang of LANGS) {
    test(`/${lang}/ingenieria trae la tabla de specs renderizada en el servidor, por grupos de 10 (FR-4501, FR-4504)`, async ({ page }) => {
      await open(page, `/${lang}/ingenieria`)
      await expect(page.getByRole('heading', { level: 1, name: COPY[lang]['engineering.title'] })).toBeVisible()
      const rows = await page.locator('[data-cw-eng-row]').count()
      expect(rows).toBeGreaterThanOrEqual(50)
      await expect(page.locator('[data-cw-eng-specs]')).toHaveAttribute('data-cw-eng-specs', String(rows))
      expect(await page.locator('[data-cw-eng-group]').count()).toBe(Math.ceil(rows / 10))
      await expect(page.locator('[data-cw-eng-group="041"]')).toHaveAttribute('open', '')
      await expect(page.locator('[data-cw-eng-group="001"]')).not.toHaveAttribute('open', '')
      await expect(page.locator('[data-cw-eng-row="030"] [data-status="built"]')).toHaveText(COPY[lang]['engineering.status.built'])
      await expect(page.locator('[data-cw-eng-row="014"] [data-status]')).toHaveAttribute('data-status', 'proposal')
      await expect(page.locator('[data-cw-eng-row="015"] [data-status]')).toHaveAttribute('data-status', 'none')
      await expect(page.locator('[data-cw-eng-history]')).not.toHaveAttribute('data-cw-eng-history', 'none')
    })
  }

  test('la franja dice el commit, el entorno y las pruebas del build, o que no hay reporte, con su fuente (FR-4502, FR-4503)', async ({ page }) => {
    await open(page, '/es/ingenieria')
    const strip = page.locator('[data-cw-eng-deploy]')
    await expect(strip.getByRole('heading', { level: 2, name: COPY.es['engineering.deploy.title'] })).toBeVisible()
    await expect(strip.locator('[data-cw-eng-env]')).toHaveText(/\S/)
    const tests = strip.locator('[data-cw-eng-tests]')
    if ((await tests.getAttribute('data-cw-eng-tests')) === 'report') await expect(tests).toHaveText(/^\d[\d.]* de \d[\d.]* pruebas unitarias y de contrato pasaron en este build/)
    else await expect(tests).toHaveText(COPY.es['engineering.deploy.noReport'])
    await expect(strip).toContainText('VERCEL_GIT_COMMIT_SHA')
  })

  test('al elegir la 030 se abre su detalle: commits con enlace, requisitos con prueba y 1 día hasta su primer feat (US1, FR-4505)', async ({ page }) => {
    await open(page, '/es/ingenieria')
    await page.locator('[data-cw-eng-group="021"] > summary').click()
    await page.locator('[data-cw-eng-row="030"] a').click()
    await expect(page).toHaveURL(/\/es\/ingenieria\/030$/, { timeout: 30_000 })
    const detail = page.locator('[data-cw-eng-spec="030"]')
    await expect(detail.getByRole('heading', { level: 1 })).toContainText('030')
    const commits = detail.locator('[data-cw-eng-commits] li')
    expect(await commits.count()).toBeGreaterThan(0)
    await expect(commits.first().locator('a')).toHaveAttribute('href', /^https:\/\/github\.com\/CHERCED-DEV\/CHERCED-WORLD\/commit\/[0-9a-f]{7}$/)
    await expect(commits.first()).toContainText('(030')
    await expect(detail.locator('[data-cw-eng-days]')).toHaveAttribute('data-cw-eng-days', '1')
    await expect(detail).toContainText('1 día de la spec a su primer feat.')
    await expect(detail.locator('[data-cw-eng-tested] li').first()).toContainText('tests/')
    await expect(detail.getByRole('link', { name: COPY.es['engineering.detail.link'] })).toHaveAttribute('href', /\/specs\/030-modo-entrevista\/spec\.md$/)
    await detail.getByRole('link', { name: COPY.es['engineering.detail.back'] }).click()
    await expect(page).toHaveURL(/\/es\/ingenieria$/, { timeout: 30_000 })
  })

  test('una spec sin commits que la nombren lo dice y no inventa un tiempo; una que no existe da 404 (US1)', async ({ page }) => {
    await open(page, '/en/ingenieria/001')
    const detail = page.locator('[data-cw-eng-spec="001"]')
    await expect(detail.locator('[data-cw-eng-no-commits]')).toHaveText(COPY.en['engineering.detail.noCommits'])
    await expect(detail.locator('[data-cw-eng-days]')).toHaveAttribute('data-cw-eng-days', '')
    const missing = await page.goto('/es/ingenieria/999')
    expect(missing?.status()).toBe(404)
  })

  test('la sección de evals dice que no hay corridas y cómo se corre, y enlaza al tablero de la 032 (US3)', async ({ page }) => {
    await open(page, '/es/ingenieria')
    const battery = page.locator('[data-cw-eng-evals="mini-cherced"]')
    await expect(battery).toHaveAttribute('data-cw-eng-evals-state', 'empty')
    await expect(battery).toContainText(COPY.es['engineering.evals.empty'])
    await expect(battery).toContainText('npm run evals:agent')
    await expect(battery.getByRole('link', { name: COPY.es['engineering.evals.board'] })).toHaveAttribute('href', '/es/ai-lab/evals')
  })

  test('el gasto se lee del endpoint con JavaScript y, sin él, lo dice y enlaza el JSON (FR-4509)', async ({ page }, testInfo) => {
    const calls: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/engineering/spend')) calls.push(request.url())
    })
    await open(page, '/es/ingenieria')
    const section = page.locator('[data-cw-eng-spend-section]')
    await expect(section.getByRole('link', { name: COPY.es['engineering.spend.json'] })).toHaveAttribute('href', '/api/engineering/spend')
    if (withJs(testInfo)) {
      await expect(section.locator('[data-cw-eng-spend="ready"]')).toBeVisible()
      await expect(section.locator('[data-cw-eng-nojs]')).toBeHidden()
      await expect(section.locator('[data-cw-eng-mcp]')).toHaveAttribute('data-cw-eng-mcp', '0')
      await expect(section).toContainText('Estimado de las últimas 24 horas')
      expect(calls.length).toBeGreaterThanOrEqual(1)
      if (!DEV_SERVER) expect(calls).toHaveLength(1)
    } else {
      await expect(section).toContainText(COPY.es['engineering.spend.noscript'])
      await expect(section.locator('[data-cw-eng-spend="idle"]')).toHaveCount(1)
      expect(calls).toHaveLength(0)
    }
    const response = await page.request.get('/api/engineering/spend')
    expect(response.headers()['cache-control']).toContain('s-maxage=3600')
    const body = (await response.json()) as Record<string, unknown>
    expect(body.available).toBe(true)
    expect(JSON.stringify(body)).not.toMatch(/@|"ip"/)
  })

  test('los presupuestos listan la prueba que los vigila y dicen que no hay medición publicada (US4)', async ({ page }) => {
    await open(page, '/es/ingenieria')
    const rows = page.locator('[data-cw-eng-budget]')
    await expect(rows).toHaveCount(4)
    for (const id of ['lcp', 'cls', 'inp', 'a11y']) {
      const row = page.locator(`[data-cw-eng-budget="${id}"]`)
      await expect(row.locator('a').first()).toHaveAttribute('href', /\/tests\/e2e\/integration\/[\w-]+\.spec\.ts$/)
      await expect(row.locator('[data-cw-eng-measurement]')).toHaveText(COPY.es['engineering.budgets.none'])
    }
  })

  test.describe('teclado y accesibilidad', () => {
    onlyIn('desktop-chromium', 'mobile-chromium')

    test('un grupo se abre con Enter y el enlace de la fila lleva al detalle (principio V)', async ({ page }) => {
      await open(page, '/es/ingenieria')
      const group = page.locator('[data-cw-eng-group="021"]')
      await group.locator('> summary').focus()
      await page.keyboard.press('Enter')
      await expect(group).toHaveAttribute('open', '')
      await page.keyboard.press('Enter')
      await expect(group).not.toHaveAttribute('open', '')
      await page.keyboard.press('Enter')
      const link = page.locator('[data-cw-eng-row="030"] a')
      await link.focus()
      await expect(link).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/es\/ingenieria\/030$/, { timeout: 30_000 })
      await expect(page.getByRole('heading', { level: 1 })).toContainText('030')
    })

    for (const scheme of ['dark', 'light'] as const) {
      for (const url of ['/es/ingenieria', '/en/ingenieria/004']) {
        test(`axe sin violaciones serias ni críticas en ${url}, con todo abierto y en tema ${scheme === 'dark' ? 'oscuro' : 'claro'} (SC-4505)`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
          await open(page, url)
          await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
          if (url === '/es/ingenieria') await expect(page.locator('[data-cw-eng-spend="ready"]')).toBeVisible()
          await openAll(page)
          const results = await new AxeBuilder({ page }).include('#main').withTags(TAGS).analyze()
          const blocking = results.violations
            .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
            .map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.slice(0, 5).map((node) => node.target.join(' ')).join(', ')}`)
          expect(blocking).toEqual([])
        })
      }
    }
  })

  test.describe('celular', () => {
    onlyIn('mobile-chromium')

    test('en 390 px no hay scroll horizontal ni zoom de alejamiento, ni con todos los grupos abiertos ni en el detalle más largo', async ({ page }) => {
      const fits = async () => {
        const { inner, scroll } = await page.evaluate(() => ({ inner: window.innerWidth, scroll: document.documentElement.scrollWidth }))
        expect(inner).toBe(390)
        expect(scroll).toBeLessThanOrEqual(391)
      }
      await open(page, '/es/ingenieria')
      await fits()
      await openAll(page)
      await fits()
      await open(page, '/es/ingenieria/004')
      await fits()
    })

    test('con la CPU 4× más lenta: LCP ≤ 2,5 s, CLS ≤ 0,1 y abrir un grupo responde en menos de 200 ms (SC-4505)', async ({ page }, testInfo) => {
      test.skip(DEV_SERVER, 'el rendimiento solo se mide contra un build de producción (next build y next start)')
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.addInitScript(() => {
        const store = { lcp: 0, cls: 0, inp: 0 }
        ;(window as unknown as { __cwEng: typeof store }).__cwEng = store
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) store.lcp = entry.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) store.cls += entry.value
        }).observe({ type: 'layout-shift', buffered: true })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { interactionId?: number }>) if (entry.interactionId) store.inp = Math.max(store.inp, entry.duration)
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit)
      })
      await open(page, '/es/ingenieria')
      await page.waitForTimeout(2500)
      await page.locator('[data-cw-eng-group="031"] > summary').tap()
      await expect(page.locator('[data-cw-eng-group="031"]')).toHaveAttribute('open', '')
      await page.waitForTimeout(800)
      const vitals = await page.evaluate(() => (window as unknown as { __cwEng: { lcp: number; cls: number; inp: number } }).__cwEng)
      testInfo.annotations.push({ type: 'vitals', description: `LCP ${Math.round(vitals.lcp)} ms · CLS ${vitals.cls.toFixed(3)} · interacción ${Math.round(vitals.inp)} ms` })
      expect(vitals.lcp).toBeGreaterThan(0)
      expect(vitals.lcp).toBeLessThanOrEqual(2500)
      expect(vitals.cls).toBeLessThanOrEqual(0.1)
      expect(vitals.inp).toBeLessThan(200)
    })
  })

  test('capturas de /es/ingenieria para la revisión (FR-4108 de la 041)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'no-js', 'las capturas son de escritorio y de celular con JavaScript')
    mkdirSync(SHOTS, { recursive: true })
    const name = testInfo.project.name === 'mobile-chromium' ? '390x844' : 'escritorio-1280x800'
    await open(page, '/es/ingenieria')
    await expect(page.locator('[data-cw-eng-spend="ready"]')).toBeVisible()
    await page.screenshot({ path: path.join(SHOTS, `es-ingenieria-${name}.png`) })
    await page.screenshot({ path: path.join(SHOTS, `es-ingenieria-${name}-completa.png`), fullPage: true })
    await open(page, '/es/ingenieria/030')
    await expect(page.locator('[data-cw-eng-spec="030"]')).toBeVisible()
    await page.screenshot({ path: path.join(SHOTS, `es-ingenieria-030-${name}.png`) })
  })
})
