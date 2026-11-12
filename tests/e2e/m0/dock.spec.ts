import { expect, test, type Page } from '@playwright/test'
import { MOBILE_HEIGHT, MOBILE_WIDTHS, onlyIn, rectOf, skipIntro, waitForSettled } from './support'

const ACTIONS = [
  { selector: '[data-cw-palette-trigger]', name: /Busca o salta a/ },
  { selector: '[data-cw-dock-assistant]', name: /Pregúntale a mi portafolio/ },
  { selector: '[data-cw-theme-toggle]', name: /Tema oscuro/ },
  { selector: '[data-cw-menu-button]', name: /Abrir menú/ },
] as const

const BAR = '[data-cw-dock-bar]'
const MENU = '[data-cw-menu-button]'

async function dockAttribute(page: Page) {
  return page.evaluate(() => document.documentElement.getAttribute('data-cw-dock'))
}

async function scrollBy(page: Page, delta: number) {
  await page.mouse.move(180, 400)
  await page.mouse.wheel(0, delta)
  await page.waitForTimeout(350)
}

test.describe('dock flotante (US6, FR-607, FR-608)', () => {
  onlyIn('mobile-chromium')
  test.use({ viewport: { width: 375, height: MOBILE_HEIGHT } })
  test.beforeEach(async ({ page }) => skipIntro(page))

  for (const width of MOBILE_WIDTHS) {
    test(`a ${width} px agrupa búsqueda, asistente, tema y menú abajo al centro; el buzón sigue en el header`, async ({ page }) => {
      await page.setViewportSize({ width, height: MOBILE_HEIGHT })
      await page.goto('/es/aboutMe')
      await expect.poll(() => dockAttribute(page)).toBe('shown')
      await waitForSettled(page, MENU)

      const bar = await rectOf(page, BAR)
      const header = await rectOf(page, '#header')
      expect(Math.abs((bar.left + bar.right) / 2 - width / 2)).toBeLessThanOrEqual(1)
      expect(bar.bottom).toBeLessThanOrEqual(MOBILE_HEIGHT - 11)
      expect(bar.bottom).toBeGreaterThan(MOBILE_HEIGHT - 80)

      for (const action of ACTIONS) {
        const control = page.locator(action.selector)
        await expect(control).toBeVisible()
        await expect(control).toHaveAccessibleName(action.name)
        const box = await rectOf(page, action.selector)
        expect(box.width, action.selector).toBeGreaterThanOrEqual(44)
        expect(box.height, action.selector).toBeGreaterThanOrEqual(44)
        expect(box.top, action.selector).toBeGreaterThanOrEqual(bar.top - 0.5)
        expect(box.bottom, action.selector).toBeLessThanOrEqual(bar.bottom + 0.5)
        expect(box.top, `${action.selector} no se repite arriba`).toBeGreaterThan(header.bottom)
      }

      const mailbox = page.locator('header [data-cw-mailbox]')
      await expect(mailbox).toBeVisible()
      await expect(mailbox, 'D-R1: el visitante va a Contacto').toHaveAttribute('href', '/es/contactMe')
      const box = await rectOf(page, 'header [data-cw-mailbox]')
      expect(box.bottom).toBeLessThanOrEqual(header.bottom)
      expect(box.right).toBeLessThanOrEqual(width)
      expect(await page.locator('[data-cw-menu-button]').count()).toBe(1)
    })
  }

  test('se esconde al bajar con transform y vuelve al subir', async ({ page }) => {
    await page.goto('/es/services')
    await expect.poll(() => dockAttribute(page)).toBe('shown')
    await scrollBy(page, 900)
    await expect.poll(() => dockAttribute(page)).toBe('hidden')
    await waitForSettled(page, MENU)
    expect((await rectOf(page, MENU)).top).toBeGreaterThanOrEqual(MOBILE_HEIGHT)
    const moved = await page.locator(MENU).evaluate((element) => getComputedStyle(element).translate)
    expect(moved).not.toBe('none')

    await scrollBy(page, -200)
    await expect.poll(() => dockAttribute(page)).toBe('shown')
    await waitForSettled(page, MENU)
    expect((await rectOf(page, MENU)).bottom).toBeLessThan(MOBILE_HEIGHT)
  })

  test('con el foco dentro se queda a la vista aunque se baje', async ({ page }) => {
    await page.goto('/es/services')
    await scrollBy(page, 900)
    await expect.poll(() => dockAttribute(page)).toBe('hidden')
    await page.locator(MENU).focus()
    await waitForSettled(page, MENU)
    expect((await rectOf(page, MENU)).bottom).toBeLessThan(MOBILE_HEIGHT)
  })

  test('al final de la página, con el dock a la vista, no tapa ningún control', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/services')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await page.waitForTimeout(300)
    await expect.poll(() => dockAttribute(page)).toBe('shown')
    await waitForSettled(page, MENU)
    const bar = await rectOf(page, BAR)
    const covered = await page.evaluate((barTop) => {
      const hits: string[] = []
      for (const element of document.querySelectorAll('footer a[href], footer button, main a[href], main button')) {
        const rect = element.getBoundingClientRect()
        if (rect.width === 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) continue
        if (rect.bottom > barTop) hits.push((element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 30))
      }
      return hits
    }, bar.top)
    expect(covered).toEqual([])
    const space = await page.evaluate(() => getComputedStyle(document.body).paddingBottom)
    expect(Number.parseFloat(space)).toBeGreaterThanOrEqual(bar.height + 12)
  })

  test('cada acción funciona desde el dock y el foco vuelve a su botón', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })

    await page.locator(MENU).click()
    await expect(page.locator('[data-cw-float-menu]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-cw-float-menu]')).toBeHidden()
    await expect(page.locator(MENU)).toBeFocused()

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    await page.locator('[data-cw-theme-toggle]').click()
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', theme ?? '')

    for (const opener of ['[data-cw-palette-trigger]', '[data-cw-dock-assistant]']) {
      await page.locator(opener).click()
      const dialog = page.locator('dialog[open]')
      await expect(dialog).toBeVisible()
      await waitForSettled(page, MENU)
      expect((await rectOf(page, MENU)).top, 'el dock se aparta con un diálogo abierto').toBeGreaterThanOrEqual(MOBILE_HEIGHT)
      await page.keyboard.press('Escape')
      await expect(page.locator('dialog[open]')).toHaveCount(0)
      await expect(page.locator(opener)).toBeFocused()
      await waitForSettled(page, MENU)
      expect((await rectOf(page, MENU)).bottom).toBeLessThan(MOBILE_HEIGHT)
    }
  })

  test('con movimiento reducido no se mueve con el scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/services')
    await expect.poll(() => dockAttribute(page)).toBe('shown')
    await scrollBy(page, 900)
    expect(await dockAttribute(page)).toBe('shown')
    expect((await rectOf(page, MENU)).bottom).toBeLessThan(MOBILE_HEIGHT)
  })
})

test.describe('dock sin JavaScript (US6, escenario 5)', () => {
  onlyIn('no-js')

  test('no hay dock: el header conserva sus botones y el menú abre por popover', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: MOBILE_HEIGHT })
    await page.goto('/es/aboutMe')
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-cw-dock'))).toBe(false)
    const header = await rectOf(page, '#header')
    const menu = await rectOf(page, MENU)
    expect(menu.bottom).toBeLessThanOrEqual(header.bottom)
    await expect(page.locator('[data-cw-dock-assistant]')).toBeHidden()
    await expect(page.locator('header [data-cw-mailbox]')).toBeVisible()
    expect(await page.evaluate(() => getComputedStyle(document.body).paddingBottom)).toBe('0px')
    await page.locator(MENU).click()
    await expect(page.locator('[data-cw-float-menu]')).toBeVisible()
  })
})

