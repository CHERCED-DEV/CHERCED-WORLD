import { readFileSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect as baseExpect, test, type Page, type TestInfo } from '@playwright/test'

const expect = baseExpect.configure({ timeout: 15_000 })

const CORE = ['agente-en-vivo', 'encaje-y-pitch', 'codigo-real', 'tablero-en-numeros'] as const

const API = /^\/api\/(ailab|agent)\//

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

function watchApi(page: Page): string[] {
  const calls: string[] = []
  page.on('request', (request) => {
    const { pathname } = new URL(request.url())
    if (API.test(pathname)) calls.push(pathname)
  })
  return calls
}

async function openRoute(page: Page, lang: 'es' | 'en' = 'es', { ready = true }: { ready?: boolean } = {}) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/ai-lab/ruta`)
  if (ready) await expect(page.locator('[data-cw-route-view]')).toHaveAttribute('data-ready', '')
}

function station(page: Page, id: string) {
  return page.locator(`[data-cw-route-station="${id}"]`)
}

async function markStation(page: Page, id: string, value: 'checked' | 'failed' | 'untested') {
  const card = station(page, id)
  const details = card.locator('xpath=ancestor::details[1]')
  if ((await details.count()) && !(await details.evaluate((node) => (node as HTMLDetailsElement).open))) await details.locator('summary').click()
  await card.locator(`[data-cw-route-mark-option="${value}"]`).check()
}

async function critical(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).include('#main').withTags(TAGS).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

async function shoot(page: Page, testInfo: TestInfo, moment: string) {
  const size = testInfo.project.name === 'mobile-chromium' ? '390x844' : 'escritorio'
  await page.evaluate(() => {
    document.querySelector('[data-cw-route-controls]')?.scrollIntoView({ block: 'start', behavior: 'instant' })
    window.scrollBy({ top: -88, behavior: 'instant' })
  })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `test-results/ruta-${size}-${moment}.png` })
  await page.screenshot({ path: `test-results/ruta-${size}-${moment}-completa.png`, fullPage: true })
}

test.describe('042 · ruta de 10 minutos de punta a punta', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')
  test.describe.configure({ timeout: 120_000 })

  test('empezar, abrir una estación, volver, marcar las cuatro y descargar el acta, sin llamadas a la API antes de abrir', async ({ page }, testInfo) => {
    const calls = watchApi(page)
    await openRoute(page)
    await expect(page.locator('[data-cw-route-time]')).toHaveText('10:00')
    await expect(page.locator('[data-cw-route-station][data-cw-route-core]')).toHaveCount(4)
    await page.waitForLoadState('networkidle')
    expect(calls, 'SC-4205: la ruta sin abrir estaciones no llama a /api/ailab ni a /api/agent').toEqual([])
    expect(await critical(page), 'axe al cargar').toEqual([])

    await page.locator('[data-cw-route-start]').click()
    await expect(page.locator('[data-cw-route-clock]')).toHaveAttribute('data-cw-route-clock', 'running')
    await expect(page.locator('[data-cw-route-announce]')).toContainText('Empezó la ruta')
    await expect(page.locator('#estacion-agente-en-vivo-title')).toBeFocused()
    await expect(page.locator('[data-cw-route-rail="agente-en-vivo"]')).toHaveAttribute('aria-current', 'step')
    await expect(station(page, 'agente-en-vivo').locator('[data-cw-route-mark]')).toHaveAttribute('data-current', '')
    await expect(page.locator('[data-cw-route-time]')).toHaveText(/^0[89]:[0-5]\d$/, { timeout: 5_000 })
    await shoot(page, testInfo, 'empezada')

    await markStation(page, 'agente-en-vivo', 'checked')
    await expect(page.locator('[data-cw-route-rail="agente-en-vivo"]')).toContainText('Comprobada')
    await expect(page.locator('[data-cw-route-rail="encaje-y-pitch"]')).toHaveAttribute('aria-current', 'step')
    await expect(page.locator('[data-cw-route-announce]')).toContainText('Ahora: estación 2 de 4, Encaje y pitch.')
    await station(page, 'agente-en-vivo').locator('[data-cw-route-note]').fill('Citó la spec de Synergos y se negó a dar su prompt.')

    await station(page, 'encaje-y-pitch').locator('[data-cw-route-open="encaje-y-pitch"]').click()
    await expect(page).toHaveURL(/\/es\/ai-lab#lab-a6$/)
    await expect(page.locator('[data-cw-lab-card="A6"]')).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\/es\/ai-lab\/ruta/)
    await expect(page.locator('[data-cw-route-view]')).toHaveAttribute('data-ready', '')
    await expect(page.locator('[data-cw-route-clock]')).toHaveAttribute('data-cw-route-clock', 'running')
    await expect(page.locator('[data-cw-route-rail="agente-en-vivo"]')).toContainText('Comprobada')
    await expect(station(page, 'agente-en-vivo').locator('[data-cw-route-note]')).toHaveValue('Citó la spec de Synergos y se negó a dar su prompt.')

    await markStation(page, 'encaje-y-pitch', 'checked')
    await markStation(page, 'codigo-real', 'failed')
    await station(page, 'codigo-real').locator('[data-cw-route-note]').fill('La explicación no cargó; abrí el archivo en GitHub.')
    await markStation(page, 'tablero-en-numeros', 'checked')
    await expect(page.locator('[data-cw-route-announce]')).toContainText('Marcaste las cuatro estaciones')
    for (const id of CORE) await expect(page.locator(`[data-cw-route-rail="${id}"]`)).not.toContainText('Sin probar')

    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('[data-cw-route-acta]').click()])
    expect(download.suggestedFilename()).toMatch(/^acta-ruta-10-minutos-\d{8}-\d{4}\.md$/)
    const acta = readFileSync((await download.path())!, 'utf8')
    expect(acta).toMatch(/^# Acta de la ruta de 10 minutos/)
    expect(acta).toContain('## Prueba 1. Agentes que funcionan: comprobada')
    expect(acta).toContain('## Prueba 2. Problemas de negocio: comprobada')
    expect(acta).toContain('## Prueba 3. Código de calidad: comprobada en parte')
    expect(acta).toContain('## Prueba 4. Entrega rápida con IA: comprobada')
    expect(acta).toContain('Citó la spec de Synergos y se negó a dar su prompt.')
    expect(acta).toContain('La explicación no cargó; abrí el archivo en GitHub.')
    expect(acta).toMatch(/\]\(http:\/\/localhost:\d+\/es\/ai-lab#lab-v5\)/)
    expect(acta).toMatch(/\]\(http:\/\/localhost:\d+\/es\/ingenieria\/030\)/)

    await page.locator('[data-cw-route-finish]').click()
    await expect(page.locator('[data-cw-route-clock]')).toHaveAttribute('data-cw-route-clock', 'done')
    await expect(page.locator('[data-cw-route-acta]')).toBeFocused()
    await shoot(page, testInfo, 'acta-lista')
    expect(await critical(page), 'axe con la ruta marcada').toEqual([])
  })

  test('el reloj pasa de cero, sigue en negativo con un aviso y las estaciones siguen abiertas', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        if (!sessionStorage.getItem('cw-route')) {
          sessionStorage.setItem(
            'cw-route',
            JSON.stringify({ version: 1, startedAt: Date.now() - 11 * 60_000, endedAt: null, active: 'codigo-real', marks: {}, notes: {}, pill: true }),
          )
        }
      } catch {}
    })
    await openRoute(page)
    await expect(page.locator('[data-cw-route-time]')).toHaveText(/^−01:0\d$/)
    await expect(page.locator('[data-cw-route-clock]')).toHaveAttribute('data-cw-route-clock', 'over')
    await expect(page.locator('[data-cw-route-clock-status]')).toContainText('Te pasaste del tiempo')
    await markStation(page, 'codigo-real', 'checked')
    await expect(page.locator('[data-cw-route-rail="codigo-real"]')).toContainText('Comprobada')
  })

  test('cambiar de idioma a mitad conserva el avance y traduce las estaciones', async ({ page }) => {
    await openRoute(page)
    await page.locator('[data-cw-route-start]').click()
    await markStation(page, 'agente-en-vivo', 'checked')
    await page.goto('/en/ai-lab/ruta')
    await expect(page.locator('[data-cw-route-view]')).toHaveAttribute('data-ready', '')
    await expect(page.locator('h1')).toHaveText('Try me in 10 minutes')
    await expect(page.locator('[data-cw-route-rail="agente-en-vivo"]')).toContainText('Checked')
    await expect(page.locator('[data-cw-route-rail="encaje-y-pitch"]')).toHaveAttribute('aria-current', 'step')
    await expect(page.locator('[data-cw-route-clock]')).toHaveAttribute('data-cw-route-clock', 'running')
  })

  test('con sessionStorage bloqueado la ruta funciona sin guardar y lo dice', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('cw-intro-seen', '1')
      } catch {}
      Storage.prototype.setItem = function () {
        throw new DOMException('bloqueado', 'SecurityError')
      }
    })
    await page.goto('/es/ai-lab/ruta')
    await expect(page.locator('[data-cw-route-view]')).toHaveAttribute('data-ready', '')
    await expect(page.locator('[data-cw-route-memory]')).toBeVisible()
    await page.locator('[data-cw-route-start]').click()
    await markStation(page, 'agente-en-vivo', 'checked')
    await expect(page.locator('[data-cw-route-rail="agente-en-vivo"]')).toContainText('Comprobada')
  })

  test('Rómpelo trae tres ataques, «Otros ataques» cambia a otros tres y el tablero dice que no hay corrida', async ({ page }) => {
    await openRoute(page)
    const breakIt = page.locator('[data-cw-route-breakit]')
    const ids = async () => breakIt.locator('[data-cw-route-attack]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cw-route-attack')))
    const first = await ids()
    expect(first).toEqual(['red-system-es', 'red-address-es', 'red-impersonate-es'])
    await breakIt.locator('[data-cw-route-more-attacks]').click()
    const second = await ids()
    expect(second).toHaveLength(3)
    expect(second.some((id) => first.includes(id))).toBe(false)
    await expect(breakIt.locator('[data-cw-route-evals]')).toContainText('Todavía no hay una corrida publicada.')
  })

  test('con movimiento reducido el reloj y las estaciones no animan', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openRoute(page)
    await page.locator('[data-cw-route-start]').click()
    await markStation(page, 'agente-en-vivo', 'checked')
    await page.waitForTimeout(800)
    const running = await page.locator('[data-cw-route-view]').evaluate((node) => node.getAnimations({ subtree: true }).length)
    expect(running).toBe(0)
  })

  test('en el celular todo cabe sin scroll horizontal y cada control mide 44 px o más', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'solo en 390×844')
    await openRoute(page)
    await page.locator('[data-cw-route-start]').click()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    for (const id of CORE) {
      const box = await station(page, id).boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    }
    const small = await page.locator('[data-cw-route] :is(a, button, summary, label[data-value])').evaluateAll((elements) =>
      elements.flatMap((element) => {
        const style = getComputedStyle(element)
        if (style.display === 'none' || style.visibility === 'hidden') return []
        const rect = element.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) return []
        return rect.width >= 43.5 && rect.height >= 43.5 ? [] : [`${(element.textContent ?? '').trim().slice(0, 40)} ${Math.round(rect.width)}x${Math.round(rect.height)}`]
      }),
    )
    expect(small, 'objetivos táctiles de 44 px o más').toEqual([])
  })
})

test.describe('042 · ruta sin JavaScript', () => {
  onlyIn('no-js')

  test('se ven las cuatro estaciones con sus pasos y enlaces, y el aviso de que el reloj y el acta piden JavaScript', async ({ page }) => {
    await page.goto('/es/ai-lab/ruta')
    await expect(page.locator('h1')).toHaveText('Pruébame en 10 minutos')
    await expect(page.locator('[data-cw-route-station][data-cw-route-core]')).toHaveCount(4)
    await expect(page.locator('[data-cw-route-noscript]')).toBeVisible()
    await expect(page.locator('[data-cw-route-noscript]')).toContainText('piden JavaScript')
    await expect(station(page, 'agente-en-vivo').locator('[data-cw-route-steps] > li')).toHaveCount(4)
    await expect(station(page, 'agente-en-vivo').locator('a[href="/es/ai-lab#lab-v5"]').first()).toBeVisible()
    await expect(station(page, 'codigo-real').locator('a[href^="https://github.com/CHERCED-DEV/"]').first()).toBeVisible()
    await expect(station(page, 'tablero-en-numeros').locator('a[href="/es/ingenieria/030"]').first()).toBeVisible()
    await expect(page.locator('[data-cw-route-start]')).toBeDisabled()
  })
})
