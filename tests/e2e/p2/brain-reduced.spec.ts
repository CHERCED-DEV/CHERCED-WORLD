import { expect, test, type Locator, type Page } from '@playwright/test'

const SHEET = 'dialog[data-cw-sheet]:has([data-cw-terminal])'

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function running(locator: Locator): Promise<string[]> {
  return locator.evaluate((root) =>
    root
      .getAnimations({ subtree: true })
      .filter((animation) => animation.playState === 'running' && !(animation instanceof CSSTransition))
      .map((animation) => (animation instanceof CSSAnimation ? animation.animationName : 'script')),
  )
}

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
    const calls: number[] = []
    ;(window as unknown as { __cwVibrate: number[] }).__cwVibrate = calls
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (pattern: number) => (calls.push(pattern), true) })
  })
  await page.goto('/es/aboutMe')
  await page.locator('[data-cw-brain-map]').scrollIntoViewIfNeeded()
}

test.describe('mapa compacto con movimiento reducido (T824, FR-624, SC-607, P-601)', () => {
  onlyIn('mobile-chromium')

  for (const width of [375, 412]) {
    test(`${width} px: el mapa se ve estático, sin lluvia, paquetes, pulso ni giro`, async ({ page }) => {
      await open(page, width)
      await expect(page.locator('[data-cw-brain-compact]')).toBeVisible()
      await expect(page.locator('[data-cw-lobe]')).toHaveCount(6)
      await page.waitForTimeout(600)
      expect(await running(page.locator('[data-cw-brain]'))).toEqual([])
      await expect(page.locator('[data-cw-rain]')).toBeHidden()
      for (const packet of await page.locator('[data-cw-packet]').all()) await expect(packet).toHaveCSS('opacity', '0')
      await expect(page.locator('[data-cw-pulse]')).toHaveCSS('opacity', '0')
      await expect(page.locator('[data-cw-compact-synapses="frontend"]')).toHaveAttribute('data-on', '')
    })
  }

  test('la hoja entra con un fundido, sin animaciones en marcha ni descifrado, y no vibra', async ({ page }) => {
    await open(page, 390)
    await expect(async () => {
      await page.locator('[data-cw-lobe="practices"]').tap()
      await expect(page.locator(`${SHEET}[open]`)).toBeVisible({ timeout: 1000 })
    }).toPass()
    const sheet = page.locator(`${SHEET}[open]`)
    await expect(sheet.locator('[data-cw-decode]')).toHaveText('Prácticas de ingeniería')
    await page.waitForTimeout(500)
    expect(await running(sheet)).toEqual([])
    expect(await running(page.locator('[data-cw-brain]'))).toEqual([])
    expect(await page.evaluate(() => (window as unknown as { __cwVibrate: number[] }).__cwVibrate)).toEqual([])
    await sheet.locator('[data-cw-sheet-next]').tap()
    await expect(sheet.locator('[data-cw-terminal-body]')).toHaveAttribute('data-cw-terminal-body', 'business')
    expect(await running(page.locator('[data-cw-brain]'))).toEqual([])
  })
})
