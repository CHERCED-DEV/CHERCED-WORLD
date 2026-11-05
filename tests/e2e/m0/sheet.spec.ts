import { expect, test, type Page } from '@playwright/test'
import { MOBILE_HEIGHT, blurredSurfaces, mountHarness, onlyIn, rectOf, skipIntro, waitForSettled } from './support'

const SHEET = 'dialog[data-cw-sheet][aria-labelledby="m0-sheet-title"]'
const OPEN = '[data-m0-open]'
const TITLE = '#m0-sheet-title'
const GRIP = `${SHEET} [data-cw-sheet-drag]`

async function setup(page: Page, width = 375, query = '') {
  await skipIntro(page)
  await page.setViewportSize({ width, height: MOBILE_HEIGHT })
  await page.goto(`/es/services${query}`)
  await mountHarness(page)
}

async function opened(page: Page) {
  await expect(page.locator(`${SHEET}[open]`)).toBeVisible()
  await waitForSettled(page, SHEET)
}

async function closed(page: Page) {
  await expect.poll(() => page.locator(SHEET).evaluate((dialog) => (dialog as HTMLDialogElement).open)).toBe(false)
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 8) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
}

async function gripCenter(page: Page) {
  const grip = await rectOf(page, GRIP)
  return { x: grip.left + grip.width / 3, y: grip.top + 10 }
}

test.describe('hoja de cristal (US3, FR-603, SC-606)', () => {
  onlyIn('mobile-chromium')

  for (const width of [375, 412]) {
    test(`a ${width} px: un toque la abre desde abajo, el foco va al título y "Cerrar" lo devuelve`, async ({ page }) => {
      await setup(page, width)
      await page.locator(OPEN).tap()
      await opened(page)
      const sheet = page.locator(SHEET)
      await expect(sheet).toHaveAttribute('aria-modal', 'true')
      await expect(page.locator(TITLE)).toBeFocused()
      const box = await rectOf(page, SHEET)
      expect(Math.abs(box.bottom - MOBILE_HEIGHT)).toBeLessThanOrEqual(1)
      expect(Math.round(box.width)).toBe(width)
      const timing = await sheet.evaluate((dialog) => {
        const style = getComputedStyle(dialog)
        return { property: style.transitionProperty, duration: style.transitionDuration }
      })
      expect(timing.property).toContain('transform')
      for (const value of timing.duration.split(',')) expect(Number.parseFloat(value)).toBeLessThanOrEqual(0.3)

      await page.locator(`${SHEET} [data-cw-sheet-close]`).tap()
      await closed(page)
      await expect(page.locator(OPEN)).toBeFocused()
      expect(await page.evaluate(() => window.__cwM0?.closes)).toBe(1)
    })
  }

  test('teclado: Enter abre, Tab no sale de la hoja y Esc cierra devolviendo el foco', async ({ page }) => {
    await setup(page)
    await page.locator(OPEN).focus()
    await page.keyboard.press('Enter')
    await opened(page)
    await expect(page.locator(TITLE)).toBeFocused()
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const active = document.activeElement
        return !active || active === document.body || Boolean(active.closest('dialog[data-cw-sheet]'))
      })
      expect(inside, `Tab ${i + 1}`).toBe(true)
    }
    await page.keyboard.press('Escape')
    await closed(page)
    await expect(page.locator(OPEN)).toBeFocused()
  })

  test('arrastrar la agarradera poco la devuelve; más del umbral la cierra y devuelve el foco', async ({ page }) => {
    await setup(page)
    await page.locator(OPEN).tap()
    await opened(page)
    const start = await gripCenter(page)
    await drag(page, start, { x: start.x, y: start.y + 40 }, 10)
    await waitForSettled(page, SHEET)
    expect(await page.locator(SHEET).evaluate((dialog) => (dialog as HTMLDialogElement).open)).toBe(true)
    expect(Math.abs((await rectOf(page, SHEET)).bottom - MOBILE_HEIGHT)).toBeLessThanOrEqual(1)

    await drag(page, start, { x: start.x, y: start.y + 260 })
    await closed(page)
    await expect(page.locator(OPEN)).toBeFocused()
  })

  test('deslizar a los lados o pulsar Anterior y Siguiente cambia de página; el scroll vertical no', async ({ page }) => {
    await setup(page)
    await page.locator(OPEN).tap()
    await opened(page)
    const counter = page.locator(`${SHEET} [data-cw-sheet-nav] p`)
    await expect(counter).toHaveText('1 / 3')
    const text = await rectOf(page, `${SHEET} [data-m0-sheet-text]`)
    const y = text.top + text.height / 2
    await drag(page, { x: 320, y }, { x: 80, y: y + 10 })
    await expect(counter).toHaveText('2 / 3')
    await drag(page, { x: 200, y }, { x: 205, y: y + 120 })
    await expect(counter).toHaveText('2 / 3')
    await page.locator(`${SHEET} [data-cw-sheet-next]`).click()
    await expect(counter).toHaveText('3 / 3')
    await page.locator(`${SHEET} [data-cw-sheet-prev]`).click()
    await expect(counter).toHaveText('2 / 3')
    expect(await page.evaluate(() => window.__cwM0?.swipes)).toEqual(['next', 'next', 'prev'])
    for (const nav of ['prev', 'next']) {
      const box = await rectOf(page, `${SHEET} [data-cw-sheet-${nav}]`)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
  })

  test('tocar el fondo la cierra', async ({ page }) => {
    await setup(page)
    await page.locator(OPEN).tap()
    await opened(page)
    const box = await rectOf(page, SHEET)
    await page.mouse.click(20, Math.max(5, box.top / 2))
    await closed(page)
  })

  test('con contenido largo respeta 100dvh menos el margen, hace scroll por dentro y la página no se mueve', async ({ page }) => {
    await setup(page, 375, '?m0-tall')
    await page.locator(OPEN).tap()
    await opened(page)
    const box = await rectOf(page, SHEET)
    expect(box.top).toBeGreaterThanOrEqual(40 - 1)
    expect(Math.abs(box.bottom - MOBILE_HEIGHT)).toBeLessThanOrEqual(1)
    const body = page.locator(`${SHEET} [data-cw-sheet-body]`)
    expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden')
    const before = await page.evaluate(() => window.scrollY)
    await body.hover()
    await page.mouse.wheel(0, 600)
    await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
    const rule = await page.evaluate(() =>
      [...document.styleSheets].some((sheet) => {
        try {
          return [...sheet.cssRules].some((r) => r.cssText.includes('safe-area-inset-bottom') && r.cssText.includes('100dvh'))
        } catch {
          return false
        }
      }),
    )
    expect(rule).toBe(true)
  })

  test('rotar con la hoja abierta la reajusta sin perder el foco', async ({ page }) => {
    await setup(page)
    await page.locator(OPEN).tap()
    await opened(page)
    await page.setViewportSize({ width: MOBILE_HEIGHT, height: 375 })
    await waitForSettled(page, SHEET)
    const box = await rectOf(page, SHEET)
    expect(box.height).toBeLessThanOrEqual(375 - 40 + 1)
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog[data-cw-sheet]')))).toBe(true)
  })

  test('el dock se aparta mientras la hoja está abierta y el presupuesto de blur se respeta', async ({ page }) => {
    await setup(page)
    await page.locator(OPEN).tap()
    await opened(page)
    await waitForSettled(page, '[data-cw-menu-button]')
    expect((await rectOf(page, '[data-cw-menu-button]')).top).toBeGreaterThanOrEqual(MOBILE_HEIGHT)
    const blurred = await blurredSurfaces(page)
    expect(blurred.length, blurred.join(', ')).toBeLessThanOrEqual(3)
    await page.keyboard.press('Escape')
    await closed(page)
    await waitForSettled(page, '[data-cw-menu-button]')
    expect((await rectOf(page, '[data-cw-menu-button]')).bottom).toBeLessThan(MOBILE_HEIGHT)
  })

  test('con movimiento reducido aparece con un fundido, sin desplazamiento', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await setup(page)
    const sample = page.evaluate(
      () =>
        new Promise<number>((done) => {
          let max = 0
          const started = performance.now()
          const tick = () => {
            const dialog = document.querySelector('dialog[data-cw-sheet][aria-labelledby="m0-sheet-title"]')
            if (dialog && (dialog as HTMLDialogElement).open) {
              const matrix = new DOMMatrix(getComputedStyle(dialog).transform)
              max = Math.max(max, Math.abs(matrix.m42))
            }
            if (performance.now() - started < 600) requestAnimationFrame(tick)
            else done(max)
          }
          requestAnimationFrame(tick)
        }),
    )
    await page.locator(OPEN).tap()
    expect(await sample).toBeLessThan(1)
    await opened(page)
    expect(await page.locator(SHEET).evaluate((dialog) => getComputedStyle(dialog).transitionProperty)).toContain('opacity')
    await page.locator(`${SHEET} [data-cw-sheet-close]`).tap()
    await closed(page)
  })

  test('sin movimiento reducido sí sube desde abajo (control del caso anterior)', async ({ page }) => {
    await setup(page)
    const sample = page.evaluate(
      () =>
        new Promise<number>((done) => {
          let max = 0
          const started = performance.now()
          const tick = () => {
            const dialog = document.querySelector('dialog[data-cw-sheet][aria-labelledby="m0-sheet-title"]')
            if (dialog && (dialog as HTMLDialogElement).open) max = Math.max(max, new DOMMatrix(getComputedStyle(dialog).transform).m42)
            if (performance.now() - started < 600) requestAnimationFrame(tick)
            else done(max)
          }
          requestAnimationFrame(tick)
        }),
    )
    await page.locator(OPEN).tap()
    expect(await sample).toBeGreaterThan(40)
  })

  test('Dialog con mobileSheet se presenta como hoja en < md y se cierra arrastrando', async ({ page }) => {
    await setup(page)
    await page.locator('[data-m0-open-dialog]').tap()
    const dialog = page.locator('dialog[aria-labelledby="m0-dialog-title"]')
    await expect(dialog).toBeVisible()
    await waitForSettled(page, 'dialog[aria-labelledby="m0-dialog-title"]')
    const box = await rectOf(page, 'dialog[aria-labelledby="m0-dialog-title"]')
    expect(Math.abs(box.bottom - MOBILE_HEIGHT)).toBeLessThanOrEqual(1)
    expect(Math.round(box.width)).toBe(375)
    const grip = await rectOf(page, 'dialog[aria-labelledby="m0-dialog-title"] [data-cw-sheet-drag]')
    expect(grip.height).toBeGreaterThanOrEqual(24)
    await drag(page, { x: grip.left + grip.width / 2, y: grip.top + grip.height / 2 }, { x: grip.left + grip.width / 2, y: grip.top + 260 })
    await expect.poll(() => dialog.evaluate((element) => (element as HTMLDialogElement).open)).toBe(false)
  })
})
