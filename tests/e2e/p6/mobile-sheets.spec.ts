import { expect, test, type Locator, type Page } from '@playwright/test'
import { blurredSurfaces } from '../m0/support'
import { blockingViolations, gotoReady, onlyIn, palette, skipIntro } from './support'

test.describe.configure({ timeout: 90_000 })

const KEYBOARD = 320

type Rect = { top: number; bottom: number; left: number; width: number; height: number }

function assistant(page: Page) {
  return page.getByRole('dialog', { name: 'Pregúntale a mi portafolio' })
}

async function rect(locator: Locator): Promise<Rect> {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect()
    return { top: box.top, bottom: box.bottom, left: box.left, width: box.width, height: box.height }
  })
}

async function viewport(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }))
}

async function openKeyboard(page: Page, inset = KEYBOARD): Promise<void> {
  await page.evaluate((value) => {
    const visual = window.visualViewport
    if (!visual) throw new Error('sin visualViewport')
    Object.defineProperty(visual, 'height', { configurable: true, get: () => window.innerHeight - value })
    visual.dispatchEvent(new Event('resize'))
  }, inset)
}

async function closeKeyboard(page: Page): Promise<void> {
  await page.evaluate(() => {
    const visual = window.visualViewport as unknown as Record<string, unknown> | null
    if (!visual) return
    delete visual.height
    ;(visual as unknown as VisualViewport).dispatchEvent(new Event('resize'))
  })
}

async function settled(locator: Locator): Promise<void> {
  await expect
    .poll(() => locator.evaluate((element) => element.getAnimations({ subtree: true }).filter((item) => item.playState === 'running').length))
    .toBe(0)
}

async function expectNearlyFullSheet(page: Page, sheet: Locator): Promise<void> {
  await expect(sheet).toHaveAttribute('data-cw-sheet', '')
  await settled(sheet)
  const box = await rect(sheet)
  const view = await viewport(page)
  expect(Math.round(box.left)).toBe(0)
  expect(Math.round(box.width)).toBe(view.width)
  expect(Math.abs(box.bottom - view.height)).toBeLessThanOrEqual(1)
  expect(box.height).toBeGreaterThanOrEqual(view.height * 0.9)
  expect(box.top).toBeGreaterThan(0)
  await expect(sheet.locator('[data-cw-sheet-drag]')).toBeVisible()
}

async function expectAboveKeyboard(page: Page, sheet: Locator, field: Locator): Promise<void> {
  const view = await viewport(page)
  const visibleBottom = view.height - KEYBOARD
  await expect(sheet).toHaveAttribute('data-cw-keyboard', 'open')
  await settled(sheet)
  const box = await rect(sheet)
  expect(box.bottom).toBeLessThanOrEqual(visibleBottom + 1)
  expect(box.top).toBeGreaterThanOrEqual(0)
  const input = await rect(field)
  expect(input.top).toBeGreaterThanOrEqual(box.top)
  expect(input.bottom).toBeLessThanOrEqual(visibleBottom)
  expect(Math.round(input.height)).toBeGreaterThanOrEqual(44)
}

async function focusStaysInside(page: Page, sheet: Locator, presses = 12): Promise<void> {
  for (let index = 0; index < presses; index++) {
    await page.keyboard.press('Tab')
    const inside = await sheet.evaluate((dialog) => {
      const active = document.activeElement
      return !active || active === document.body || dialog.contains(active)
    })
    expect(inside, `Tab ${index + 1}`).toBe(true)
  }
}

onlyIn('mobile-chromium')

test.beforeEach(async ({ page }) => {
  await skipIntro(page)
})

test.describe('paleta como hoja en < md (US14, FR-637)', () => {
  test('se abre con un toque en el dock y se cierra con el botón, Esc y un toque en el fondo', async ({ page }) => {
    await gotoReady(page, '/es')
    const trigger = page.locator('[data-cw-palette-trigger]')
    await trigger.tap()
    const sheet = palette(page)
    await expect(sheet).toBeVisible()
    await expect(page.locator('[data-cw-palette-input]')).toBeFocused()
    await expectNearlyFullSheet(page, sheet)
    const close = sheet.getByRole('button', { name: 'Cerrar' })
    const closeBox = await rect(close)
    expect(Math.round(closeBox.width)).toBeGreaterThanOrEqual(44)
    expect(Math.round(closeBox.height)).toBeGreaterThanOrEqual(44)
    await close.tap()
    await expect(sheet).toBeHidden()

    await trigger.tap()
    await expect(sheet).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Control+k')
    await expect(sheet).toBeVisible()
    await settled(sheet)
    const top = (await rect(sheet)).top
    await page.touchscreen.tap(20, Math.max(5, top / 2))
    await expect(sheet).toBeHidden()
  })

  test('el foco queda atrapado y se elige un resultado con el teclado', async ({ page }) => {
    await gotoReady(page, '/es')
    await page.locator('[data-cw-palette-trigger]').tap()
    const sheet = palette(page)
    await expect(sheet).toBeVisible()
    await focusStaysInside(page, sheet)
    await page.locator('[data-cw-palette-input]').focus()
    await page.keyboard.type('blog')
    await expect(page.locator('[data-cw-palette-option="page:blog"]')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/es/blog')
    await expect(sheet).toBeHidden()
  })

  test('arrastrar la agarradera hacia abajo la cierra, y el botón Cerrar es la alternativa', async ({ page }) => {
    await gotoReady(page, '/es')
    await page.locator('[data-cw-palette-trigger]').tap()
    const sheet = palette(page)
    await settled(sheet)
    const grip = await rect(sheet.locator('[data-cw-sheet-drag]'))
    const x = 195
    const y = grip.top + grip.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let step = 1; step <= 10; step++) await page.mouse.move(x, y + step * 30)
    await page.mouse.up()
    await expect(sheet).toBeHidden()
  })

  test('con el teclado del sistema abierto, el campo de búsqueda queda sobre el teclado', async ({ page }) => {
    await gotoReady(page, '/es')
    await page.locator('[data-cw-palette-trigger]').tap()
    const sheet = palette(page)
    await expectNearlyFullSheet(page, sheet)
    await page.keyboard.type('a')
    await openKeyboard(page)
    await expectAboveKeyboard(page, sheet, page.locator('[data-cw-palette-input]'))
    const list = await rect(sheet.locator('[data-cw-palette-list]'))
    expect(list.bottom).toBeLessThanOrEqual((await viewport(page)).height - KEYBOARD + 1)
    await closeKeyboard(page)
    await expect(sheet).not.toHaveAttribute('data-cw-keyboard', /.*/)
    await expectNearlyFullSheet(page, sheet)
  })

  test('con muchos resultados la lista hace scroll por dentro y la búsqueda no se mueve', async ({ page }) => {
    await gotoReady(page, '/es')
    await page.locator('[data-cw-palette-trigger]').tap()
    const sheet = palette(page)
    await page.keyboard.type('a')
    await expect(page.locator('[data-cw-palette-option]').first()).toBeVisible()
    await settled(sheet)
    const before = await rect(page.locator('[data-cw-palette-input]'))
    await page.keyboard.press('End')
    for (let index = 0; index < 11; index++) await page.keyboard.press('ArrowDown')
    const after = await rect(page.locator('[data-cw-palette-input]'))
    expect(after.top).toBe(before.top)
    const selected = sheet.locator('[aria-selected="true"]')
    await expect(selected).toBeInViewport()
  })

  test('respeta el presupuesto de cristal y no tiene violaciones críticas ni serias', async ({ page }) => {
    for (const scheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await gotoReady(page, '/es')
      await page.locator('[data-cw-palette-trigger]').tap()
      await page.keyboard.type('a')
      await expect(page.locator('[data-cw-palette-option]').first()).toBeVisible()
      const blurred = await blurredSurfaces(page)
      expect(blurred.length, blurred.join(', ')).toBeLessThanOrEqual(3)
      expect(await palette(page).evaluate((element) => getComputedStyle(element).backdropFilter)).toMatch(/blur\(16px\)/)
      expect(await blockingViolations(page)).toEqual([])
    }
  })
})

test.describe('asistente como hoja en < md (US14, FR-637)', () => {
  test('se abre desde el dock, responde y se cierra con el botón y con Esc', async ({ page }) => {
    await gotoReady(page, '/es')
    const opener = page.locator('[data-cw-dock-assistant]')
    await opener.tap()
    const sheet = assistant(page)
    await expect(sheet).toBeVisible()
    await expect(sheet.locator('[data-cw-assistant-input]')).toBeFocused()
    await expectNearlyFullSheet(page, sheet)
    const form = await rect(sheet.locator('form'))
    const box = await rect(sheet)
    expect(box.bottom - form.bottom).toBeLessThanOrEqual(64)

    await sheet.locator('[data-cw-assistant-input]').fill('¿Qué proyectos has hecho?')
    await sheet.getByRole('button', { name: 'Preguntar' }).tap()
    const answer = sheet.locator('[data-cw-answer-kind]')
    await expect(answer).toHaveCount(1)
    await expect(answer).toBeInViewport()
    for (const link of await answer.getByRole('link').all()) {
      const size = await rect(link)
      expect(Math.round(size.height), await link.innerText()).toBeGreaterThanOrEqual(44)
    }

    await sheet.getByRole('button', { name: 'Cerrar el asistente' }).tap()
    await expect(sheet).toBeHidden()
    await opener.tap()
    await expect(sheet).toBeVisible()
    await focusStaysInside(page, sheet)
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('con el teclado del sistema abierto, el campo de la pregunta queda sobre el teclado', async ({ page }) => {
    await gotoReady(page, '/es')
    await page.locator('[data-cw-dock-assistant]').tap()
    const sheet = assistant(page)
    await expectNearlyFullSheet(page, sheet)
    const input = sheet.locator('[data-cw-assistant-input]')
    await openKeyboard(page)
    await expectAboveKeyboard(page, sheet, input)
    await input.fill('¿Qué servicios ofreces?')
    await page.keyboard.press('Enter')
    await expect(sheet.locator('[data-cw-answer-kind]')).toHaveCount(1)
    await expectAboveKeyboard(page, sheet, input)
    await closeKeyboard(page)
    await expectNearlyFullSheet(page, sheet)
  })

  test('sin violaciones críticas ni serias en ambos temas', async ({ page }) => {
    for (const scheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await gotoReady(page, '/es')
      await page.locator('[data-cw-dock-assistant]').tap()
      const sheet = assistant(page)
      await sheet.locator('[data-cw-assistant-input]').fill('¿Qué proyectos has hecho?')
      await sheet.getByRole('button', { name: 'Preguntar' }).tap()
      await expect(sheet.locator('[data-cw-answer-kind]')).toHaveCount(1)
      expect(await blockingViolations(page)).toEqual([])
    }
  })
})

test.describe('en escritorio los diálogos no cambian (FR-651)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })

  test('la paleta y el asistente siguen centrados y sin agarradera', async ({ page }) => {
    await gotoReady(page, '/es')
    await page.keyboard.press('Control+k')
    const sheet = palette(page)
    await expect(sheet).toBeVisible()
    await settled(sheet)
    const box = await rect(sheet)
    expect(box.width).toBeLessThanOrEqual(640)
    expect(Math.abs(box.left + box.width / 2 - 640)).toBeLessThanOrEqual(1)
    expect(box.top).toBeGreaterThanOrEqual(80)
    await expect(sheet.locator('[data-cw-sheet-drag]')).toBeHidden()
    await page.keyboard.press('Escape')

    await page.locator('[data-cw-assistant-button]').click()
    const chat = assistant(page)
    await expect(chat).toBeVisible()
    await settled(chat)
    const chatBox = await rect(chat)
    expect(chatBox.width).toBeLessThanOrEqual(600)
    expect(Math.abs(chatBox.left + chatBox.width / 2 - 640)).toBeLessThanOrEqual(1)
    await expect(chat.locator('[data-cw-sheet-drag]')).toBeHidden()
  })
})
