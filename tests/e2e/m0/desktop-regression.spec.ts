import { expect, test, type Browser, type Page } from '@playwright/test'
import { decodePng } from '../l2/png'
import { onlyIn, skipIntro } from './support'

const WIDTHS = [1280, 1440] as const

const ROUTES = ['/es', '/es/aboutMe', '/es/services', '/es/portfolio', '/es/portfolio/1', '/es/blog', '/es/contactMe']

const BASELINE = process.env.M0_BASELINE_URL ?? ''

const MAX_DIFF_RATIO = 0.002

const FREEZE = [
  '[data-cw-background], [data-cw-background] * { visibility: hidden !important; }',
  '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; caret-color: transparent !important; }',
  '[data-cw-mailbox-badge] { visibility: hidden !important; }',
].join('\n')

test.describe('escritorio sin cambios (SC-601, FR-651)', () => {
  onlyIn('desktop-chromium')
  test.beforeEach(async ({ page }) => skipIntro(page))

  for (const width of WIDTHS) {
    test(`a ${width} px no hay dock ni marcas móviles y el header queda como en la 004`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/es/services')
      const state = await page.evaluate(() => {
        const header = document.querySelector('#header') as HTMLElement
        const css = (selector: string, property: string, pseudo: string | null = null) => {
          const element = document.querySelector(selector)
          return element ? getComputedStyle(element, pseudo).getPropertyValue(property) : null
        }
        const x = (selector: string) => {
          const element = document.querySelector(selector)
          if (!element) return null
          const rect = element.getBoundingClientRect()
          return rect.width > 0 ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null
        }
        return {
          dock: document.documentElement.hasAttribute('data-cw-dock'),
          bar: css('[data-cw-dock-bar]', 'display'),
          assistant: css('[data-cw-dock-assistant]', 'display'),
          headerFilter: css('#header', 'backdrop-filter'),
          headerBefore: css('#header', 'content', '::before'),
          bodyPadding: getComputedStyle(document.body).paddingBottom,
          scrollPadding: getComputedStyle(document.documentElement).scrollPaddingBottom,
          headerBackground: getComputedStyle(header).backgroundColor,
          blur: getComputedStyle(document.documentElement).getPropertyValue('--cw-glass-standard-blur').trim(),
          headerHeight: header.getBoundingClientRect().height,
          controls: ['[data-cw-palette-trigger]', 'header [data-cw-lang-switch]', 'header [data-cw-mailbox]', '[data-cw-theme-toggle]'].map(x),
          cardFilters: [...document.querySelectorAll('main [data-cw-glass]')].slice(0, 6).map((element) => getComputedStyle(element).backdropFilter),
          sweeps: document.querySelectorAll('[data-cw-sweep]').length,
          float: [...document.querySelectorAll('[data-cw-float]')].map((element) => getComputedStyle(element).animationName),
        }
      })
      expect(state.dock).toBe(false)
      expect(state.bar).toBe('contents')
      expect(state.assistant).toBe('none')
      expect(state.headerFilter).toBe('blur(14px) saturate(1.4)')
      expect(['none', 'normal']).toContain(state.headerBefore)
      expect(state.bodyPadding).toBe('0px')
      expect(['auto', '0px']).toContain(state.scrollPadding)
      expect(state.headerBackground).toMatch(/^rgba\(\d+, \d+, \d+, 0\.\d+\)$/)
      expect(state.blur).toBe('14px')
      expect(state.headerHeight).toBe(65)
      const [palette, lang, mailbox, theme] = state.controls
      for (const control of state.controls) {
        expect(control).not.toBeNull()
        expect(control!.bottom).toBeLessThanOrEqual(state.headerHeight)
      }
      expect(palette!.left).toBeLessThan(lang!.left)
      expect(lang!.left).toBeLessThan(mailbox!.left)
      expect(mailbox!.left).toBeLessThan(theme!.left)
      for (const filter of state.cardFilters) expect(filter).toMatch(/blur\((8|14|22)px\)/)
      for (const name of state.float) expect(name).toBe('none')
    })
  }

  test('las hojas y los diálogos de escritorio no cambian de forma', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    await page.locator('[data-cw-palette-trigger]').click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    const box = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, right: rect.right, backdrop: getComputedStyle(element, '::backdrop').backdropFilter }
    })
    expect(box.left).toBeGreaterThan(0)
    expect(box.right).toBeLessThan(1280)
    expect(box.backdrop).toBe('blur(4px)')
  })
})

async function shot(browser: Browser, base: string, route: string, width: number): Promise<Buffer> {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', colorScheme: 'dark' })
  const page: Page = await context.newPage()
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
  await page.route('**/api/inbox-count', (route) => route.fulfill({ json: { unread: 0 } }))
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: FREEZE })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  const buffer = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' })
  await context.close()
  return buffer
}

test.describe('capturas de escritorio contra la 004 (SC-601)', () => {
  onlyIn('desktop-chromium')
  test.skip(!BASELINE, 'define M0_BASELINE_URL con un build de la rama base para comparar píxel a píxel')
  test.describe.configure({ timeout: 120_000 })

  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      test(`${route} a ${width} px es igual a la base`, async ({ browser, baseURL }, testInfo) => {
        const current = decodePng(await shot(browser, baseURL ?? '', route, width))
        const before = decodePng(await shot(browser, BASELINE, route, width))
        expect(current.width).toBe(before.width)
        expect(current.height).toBe(before.height)
        let different = 0
        for (let i = 0; i < current.data.length; i += 4) {
          const delta =
            Math.abs(current.data[i]! - before.data[i]!) + Math.abs(current.data[i + 1]! - before.data[i + 1]!) + Math.abs(current.data[i + 2]! - before.data[i + 2]!)
          if (delta > 24) different += 1
        }
        const ratio = different / (current.width * current.height)
        testInfo.annotations.push({ type: 'diff', description: `${(ratio * 100).toFixed(3)} %` })
        expect(ratio).toBeLessThanOrEqual(MAX_DIFF_RATIO)
      })
    }
  }
})
