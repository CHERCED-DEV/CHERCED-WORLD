import { expect, test } from '@playwright/test'
import { coveredPrimaries, hydrated, MOBILE_WIDTH, onlyIn, open, PAGES } from './support'

const TEXT_LINKS_ONLY = new Set(['/blog', '/now'])

test.describe(`E2 y E3: ningún botón primario queda tapado por el dock ni por el asistente a ${MOBILE_WIDTH} px (010)`, () => {
  onlyIn('mobile-chromium')

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: MOBILE_WIDTH, height: 812 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  for (const { name, path } of PAGES) {
    test(`/es${path} (${name})`, async ({ page }) => {
      await open(page, `/es${path}`)
      await hydrated(page)
      await expect(page.locator('html'), 'el dock está a la vista: con movimiento reducido no se esconde').toHaveAttribute('data-cw-dock', 'shown')
      const { checked, covered } = await coveredPrimaries(page)
      if (!TEXT_LINKS_ONLY.has(path)) expect(checked, 'la página tiene botones primarios que revisar').toBeGreaterThan(0)
      expect(covered.map((item) => `"${item.target}" tapado por ${item.by} (${item.overlap} px²)`)).toEqual([])
    })
  }
})

test.describe('E3: el botón del asistente no tapa CTAs a 768 y 1440 px (010)', () => {
  onlyIn('desktop-chromium')

  for (const width of [768, 1440]) {
    for (const path of ['/aboutMe', '/services', '/contactMe']) {
      test(`${width} px: /es${path}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await open(page, `/es${path}`)
        await hydrated(page)
        const { checked, covered } = await coveredPrimaries(page)
        expect(checked).toBeGreaterThan(0)
        expect(covered.map((item) => `"${item.target}" tapado por ${item.by} (${item.overlap} px²)`)).toEqual([])
      })
    }
  }

  test('al bajar se reduce a ícono, con el mismo nombre accesible, y vuelve al subir', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, '/es/services')
    await hydrated(page)
    const fab = page.locator('[data-cw-assistant-button]')
    const wide = (await fab.boundingBox())!.width
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }))
    await expect(fab).toHaveAttribute('data-cw-compact', '')
    await expect(fab).toHaveAccessibleName(/Pregúntale a mi portafolio/)
    await page.mouse.move(10, 10)
    await expect.poll(async () => (await fab.boundingBox())!.width).toBeLessThanOrEqual(56)
    expect(wide).toBeGreaterThan(100)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(fab).not.toHaveAttribute('data-cw-compact', /.*/)
  })
})
