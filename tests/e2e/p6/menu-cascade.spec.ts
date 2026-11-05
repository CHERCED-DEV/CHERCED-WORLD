import { expect, test, type Page } from '@playwright/test'
import { onlyIn, skipIntro } from './support'

test.describe.configure({ timeout: 60_000 })

type Timing = { name: string; delay: number; animation: string; opacity: string }

const MENU = '[data-cw-float-menu]'

async function openMenu(page: Page): Promise<void> {
  await page.goto('/es')
  await page.locator('[data-cw-menu-button]').tap()
  await expect(page.locator(MENU)).toBeVisible()
}

async function timings(page: Page): Promise<Timing[]> {
  return page.locator(MENU).evaluate((menu) => {
    const items = [...menu.querySelectorAll('nav li'), menu.querySelector('[data-cw-lang-switch]')].filter(
      (item): item is Element => item !== null,
    )
    return items.map((item) => {
      const style = getComputedStyle(item)
      return {
        name: item.textContent?.trim() ?? '',
        delay: Math.round(Number.parseFloat(style.animationDelay) * 1000),
        animation: style.animationName,
        opacity: style.opacity,
      }
    })
  })
}

test.beforeEach(async ({ page }) => {
  await skipIntro(page)
})

test.describe('cascada del menú en < md (US14, FR-637)', () => {
  onlyIn('mobile-chromium')

  test('los enlaces y el idioma entran uno tras otro, con 35 ms entre cada uno, sobre cristal strong', async ({ page }) => {
    await openMenu(page)
    const items = await timings(page)
    expect(items.map((item) => item.name)).toEqual(['Inicio', 'Sobre mí', 'Servicios', 'Portafolio', 'Blog', 'Contáctame', 'English'])
    expect(items.map((item) => item.delay)).toEqual([0, 35, 70, 105, 140, 175, 210])
    for (const item of items) expect(item.animation, item.name).not.toBe('none')
    const steps = items.slice(1).map((item, index) => item.delay - items[index]!.delay)
    for (const step of steps) {
      expect(step).toBeGreaterThanOrEqual(30)
      expect(step).toBeLessThanOrEqual(40)
    }
    const menu = page.locator(MENU)
    await expect(menu).toHaveAttribute('data-cw-glass', 'strong')
    expect(await menu.evaluate((element) => getComputedStyle(element).backdropFilter)).toMatch(/blur\(16px\)/)
    await expect.poll(async () => (await timings(page)).every((item) => item.opacity === '1')).toBe(true)
  })

  test('se cierra con el botón de 44 px y con Esc, y el foco empieza en el primer enlace', async ({ page }) => {
    await openMenu(page)
    const menu = page.locator(MENU)
    await expect(menu.getByRole('link', { name: 'Inicio' })).toBeFocused()
    const close = menu.getByRole('button', { name: 'Cerrar menú' })
    const box = await close.boundingBox()
    expect(Math.round(box?.width ?? 0)).toBeGreaterThanOrEqual(44)
    expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44)
    await close.tap()
    await expect(menu).toBeHidden()
    await page.locator('[data-cw-menu-button]').tap()
    await expect(menu).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })

  test('con movimiento reducido entran todos a la vez', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openMenu(page)
    const items = await timings(page)
    expect(items).toHaveLength(7)
    for (const item of items) {
      expect(item.animation, item.name).toBe('none')
      expect(item.opacity, item.name).toBe('1')
    }
  })
})

test.describe('en escritorio el menú no cambia (FR-651)', () => {
  onlyIn('desktop-chromium')
  test.use({ viewport: { width: 1024, height: 768 } })

  test('mantiene la cascada de 40 ms de la 002 y el idioma no se anima', async ({ page }) => {
    await page.goto('/es')
    await page.locator('[data-cw-menu-button]').click()
    await expect(page.locator(MENU)).toBeVisible()
    const items = await timings(page)
    expect(items.slice(0, 6).map((item) => item.delay)).toEqual([40, 80, 120, 160, 200, 240])
    expect(items[6]?.animation).toBe('none')
  })
})
