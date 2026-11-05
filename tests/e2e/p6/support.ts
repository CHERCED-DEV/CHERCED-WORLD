import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

export const READY_TIMEOUT = 30_000

export const CV = 'https://www.linkedin.com/in/cherced/'

export function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

export async function skipIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: READY_TIMEOUT })
}

export function palette(page: Page, lang: 'es' | 'en' = 'es') {
  return page.getByRole('dialog', { name: lang === 'es' ? 'Paleta de comandos' : 'Command palette' })
}

export function shortcutsDialog(page: Page, lang: 'es' | 'en' = 'es') {
  return page.getByRole('dialog', { name: lang === 'es' ? 'Atajos de teclado' : 'Keyboard shortcuts' })
}

export async function openPalette(page: Page): Promise<void> {
  await page.keyboard.press('Control+k')
  await expect(palette(page)).toBeVisible()
  await expect(page.locator('[data-cw-palette-input]')).toBeFocused()
}

export function options(page: Page) {
  return page.locator('[data-cw-palette-list] [data-cw-palette-option]')
}

export async function optionIds(page: Page, count = 3): Promise<string[]> {
  const all = await options(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cw-palette-option') ?? ''))
  return all.slice(0, count)
}

export async function blockingViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

export async function stubLinkedIn(page: Page): Promise<void> {
  await page.context().route('https://www.linkedin.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>LinkedIn</title>' }),
  )
}
