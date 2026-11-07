import { expect, test } from '@playwright/test'
import { hydrated, MOBILE_WIDTH, onlyIn, open, PAGES, scrollThrough, textHits } from './support'

const MIN = 12

test.describe(`M1 a M6: ningún texto visible de menos de ${MIN} px a ${MOBILE_WIDTH} px (010)`, () => {
  onlyIn('mobile-chromium')

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: MOBILE_WIDTH, height: 812 })
  })

  for (const lang of ['es', 'en'] as const) {
    for (const { name, path } of PAGES) {
      test(`/${lang}${path} (${name})`, async ({ page }) => {
        await open(page, `/${lang}${path}`)
        await hydrated(page)
        await scrollThrough(page)
        const hits = await textHits(page, 'small', MIN)
        expect(hits.map((hit) => `${hit.size}px ${hit.where} "${hit.text}"`)).toEqual([])
      })
    }

    test(`/${lang}: "Para reclutadores" abierto`, async ({ page }) => {
      await open(page, `/${lang}`)
      await hydrated(page)
      await page.locator('[data-cw-recruiters-open]').click()
      const dialog = page.locator('dialog[open]')
      await expect(dialog.locator('[data-cw-recruiters]')).toBeVisible()
      const hits = await textHits(page, 'small', MIN)
      expect(hits.map((hit) => `${hit.size}px ${hit.where} "${hit.text}"`)).toEqual([])
    })

    test(`/${lang}/aboutMe: las fuentes del mapa abiertas con "Ver todas"`, async ({ page }) => {
      await open(page, `/${lang}/aboutMe`)
      await hydrated(page)
      const toggle = page.locator('[data-cw-sources-toggle]')
      await toggle.scrollIntoViewIfNeeded()
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      const hits = await textHits(page, 'small', MIN)
      expect(hits.map((hit) => `${hit.size}px ${hit.where} "${hit.text}"`)).toEqual([])
    })
  }
})
