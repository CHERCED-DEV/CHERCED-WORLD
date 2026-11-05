import { expect, test } from '@playwright/test'
import { blurredSurfaces, onlyIn, skipIntro } from './support'

const ROUTES = [
  '/es',
  '/es/aboutMe',
  '/es/services',
  '/es/portfolio',
  '/es/portfolio/1',
  '/es/blog',
  '/es/blog/post1',
  '/es/blog/post5',
  '/es/contactMe',
  '/es/privacy',
  '/en',
  '/es/esta-ruta-no-existe',
]

const BUDGET = 3

test.describe('presupuesto de cristal en móvil (US2, FR-602, SC-602)', () => {
  onlyIn('mobile-chromium')
  test.use({ viewport: { width: 375, height: 812 } })
  test.beforeEach(async ({ page }) => skipIntro(page))

  for (const route of ROUTES) {
    test(`${route}: 3 o menos superficies con blur a la vista en todo el recorrido`, async ({ page }) => {
      await page.goto(route)
      const failures: string[] = []
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      for (let y = 0, step = 0; step < 60; y += 640, step++) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
        await page.waitForTimeout(60)
        const blurred = await blurredSurfaces(page)
        if (blurred.length > BUDGET) failures.push(`y=${y}: ${blurred.join(', ')}`)
        if (y >= height) break
      }
      expect(failures).toEqual([])
    })
  }

  test('con el menú abierto siguen siendo 3 o menos', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await page.locator('[data-cw-menu-button]').click()
    await expect(page.locator('[data-cw-float-menu]')).toBeVisible()
    const blurred = await blurredSurfaces(page)
    expect(blurred.length, blurred.join(', ')).toBeLessThanOrEqual(BUDGET)
  })

  test('las tarjetas sin marca conservan borde, grano y profundidad sobre fondo sólido', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/es/services')
    const cards = await page.evaluate(() =>
      [...document.querySelectorAll('main [data-cw-glass]')]
        .filter((element) => !element.closest('[data-cw-blur]'))
        .slice(0, 6)
        .map((element) => {
          const style = getComputedStyle(element)
          return {
            filter: style.backdropFilter,
            background: style.backgroundColor,
            border: style.borderTopWidth,
            shadow: style.boxShadow,
          }
        }),
    )
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) {
      expect(card.filter).toBe('none')
      expect(card.background).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
      expect(Number.parseFloat(card.border)).toBeGreaterThanOrEqual(1)
      expect(card.shadow).not.toBe('none')
    }
  })

  test('con transparencia reducida no queda ningún blur activo y el header es sólido', async ({ page }) => {
    const session = await page.context().newCDPSession(page)
    await session.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-transparency', value: 'reduce' },
        { name: 'prefers-color-scheme', value: 'dark' },
      ],
    })
    await page.goto('/es/aboutMe')
    expect(await blurredSurfaces(page)).toEqual([])
    await expect(page.locator('header#header')).toHaveCSS('background-color', 'rgb(17, 17, 17)')
  })
})
