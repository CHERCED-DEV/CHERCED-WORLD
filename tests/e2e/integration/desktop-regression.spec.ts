import { expect, test, type Browser } from '@playwright/test'
import { decodePng } from '../l2/png'
import { AUDIT_PAGES, pendingPage, skipIntro } from './support/pages'

const WIDTHS = [1280, 1440] as const
const BASELINE = process.env.E2E_BASELINE_URL ?? ''
const MAX_DIFF_RATIO = 0.002

const FREEZE = [
  '[data-cw-background], [data-cw-background] * { visibility: hidden !important; }',
  '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; caret-color: transparent !important; }',
  '[data-cw-mailbox-badge] { visibility: hidden !important; }',
].join('\n')

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'el escritorio se revisa en desktop-chromium')
})

test.describe('escritorio sin rastro de lo móvil en todas las páginas (FR-651, SC-601)', () => {
  for (const path of AUDIT_PAGES) {
    test(`${path} a ${WIDTHS.join(' y ')} px`, async ({ page }) => {
      const pending = pendingPage(path)
      test.skip(Boolean(pending), pending ?? '')
      await skipIntro(page)
      const problems: string[] = []
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
        const state = await page.evaluate(() => {
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0
          }
          const css = (selector: string, property: string) => {
            const element = document.querySelector(selector)
            return element ? getComputedStyle(element).getPropertyValue(property) : null
          }
          return {
            dock: document.documentElement.hasAttribute('data-cw-dock'),
            bar: css('[data-cw-dock-bar]', 'display'),
            dockAssistant: css('[data-cw-dock-assistant]', 'display'),
            fab: [...document.querySelectorAll('[data-cw-assistant-button]')].some(visible),
            bodyPadding: getComputedStyle(document.body).paddingBottom,
            blur: getComputedStyle(document.documentElement).getPropertyValue('--cw-glass-standard-blur').trim(),
            solidGlass: [...document.querySelectorAll('main [data-cw-glass]')]
              .filter((element) => visible(element) && !element.closest('dialog, [popover]'))
              .filter((element) => /^(none|blur\(0px\))/.test(getComputedStyle(element).backdropFilter || 'none')).length,
            floating: [...document.querySelectorAll('[data-cw-float]')].map((element) => getComputedStyle(element).animationName).filter((name) => name !== 'none'),
            sweeps: [...document.querySelectorAll('[data-cw-sweep]')].filter(visible).length,
            hand: [...document.querySelectorAll('[data-cw-hand]')].some(visible),
            compact: [...document.querySelectorAll('[data-cw-brain-compact]')].some(visible),
            carouselDots: [...document.querySelectorAll('[data-cw-carousel-dots]')].some(visible),
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          }
        })
        const at = `${width} px`
        if (state.dock) problems.push(`${at}: :root tiene data-cw-dock`)
        if (state.bar !== null && state.bar !== 'contents') problems.push(`${at}: el envoltorio del dock se ve (${state.bar})`)
        if (state.dockAssistant !== null && state.dockAssistant !== 'none') problems.push(`${at}: el asistente del dock se ve`)
        if (!state.fab) problems.push(`${at}: falta el botón flotante del asistente`)
        if (state.bodyPadding !== '0px') problems.push(`${at}: el body reserva ${state.bodyPadding} abajo`)
        if (state.blur !== '14px') problems.push(`${at}: el blur estándar es ${state.blur}`)
        if (state.solidGlass > 0) problems.push(`${at}: ${state.solidGlass} superficies de cristal sin desenfoque`)
        if (state.floating.length > 0) problems.push(`${at}: profundidad flotante activa (${state.floating.join(', ')})`)
        if (state.sweeps > 0) problems.push(`${at}: ${state.sweeps} barridos a la vista`)
        if (state.hand) problems.push(`${at}: se ve el mazo en la mano`)
        if (state.compact) problems.push(`${at}: se ve el mapa compacto`)
        if (state.carouselDots) problems.push(`${at}: se ven los puntos del carrusel móvil`)
        if (state.overflow) problems.push(`${at}: scroll horizontal`)
      }
      expect(problems).toEqual([])
    })
  }
})

async function shot(browser: Browser, base: string, path: string, width: number): Promise<Buffer> {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'dark' })
  const page = await context.newPage()
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
  await page.route('**/api/inbox-count', (route) => route.fulfill({ json: { unread: 0 } }))
  await page.route('**/api/reactions/**', (route) => route.fulfill({ json: { clap: 0, idea: 0, fire: 0 } }))
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: FREEZE })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  const buffer = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' })
  await context.close()
  return buffer
}

test.describe('capturas de escritorio contra una base sin la 006 (SC-601)', () => {
  test.skip(!BASELINE, 'define E2E_BASELINE_URL con un build anterior a la 006 para comparar píxel a píxel')
  test.describe.configure({ timeout: 120_000 })

  for (const width of WIDTHS) {
    for (const path of AUDIT_PAGES) {
      test(`${path} a ${width} px es igual a la base`, async ({ browser, baseURL }, testInfo) => {
        const pending = pendingPage(path)
        test.skip(Boolean(pending), pending ?? '')
        const current = decodePng(await shot(browser, baseURL ?? '', path, width))
        const before = decodePng(await shot(browser, BASELINE, path, width))
        expect(current.height, 'misma altura de página').toBe(before.height)
        let different = 0
        for (let i = 0; i < current.data.length; i += 4) {
          const delta = Math.abs(current.data[i]! - before.data[i]!) + Math.abs(current.data[i + 1]! - before.data[i + 1]!) + Math.abs(current.data[i + 2]! - before.data[i + 2]!)
          if (delta > 24) different += 1
        }
        const ratio = different / (current.width * current.height)
        testInfo.annotations.push({ type: 'diff', description: `${(ratio * 100).toFixed(3)} %` })
        expect(ratio).toBeLessThanOrEqual(MAX_DIFF_RATIO)
      })
    }
  }
})
