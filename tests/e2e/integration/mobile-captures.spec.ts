import { expect, test } from '@playwright/test'
import { ALL_WIDTHS, introSeen, onlyMobile, widthOf } from './support/mobile'
import { AUDIT_PAGES, EXHAUSTIVE, KEY_PAGES, pendingPage, slugOf } from './support/pages'

test.use({ trace: 'off' })

test.describe('capturas móviles de cada página en ES y EN, en oscuro y claro (T851)', () => {
  onlyMobile()

  for (const theme of ['dark', 'light'] as const) {
    for (const path of AUDIT_PAGES) {
      const inFull = theme === 'dark' && KEY_PAGES.includes(path)
      test(`${path} en tema ${theme}`, { tag: inFull ? ALL_WIDTHS : EXHAUSTIVE }, async ({ page }, testInfo) => {
        const pending = pendingPage(path)
        test.skip(Boolean(pending), pending ?? '')
        const width = widthOf(testInfo)
        await page.emulateMedia({ colorScheme: theme })
        await introSeen(page)
        await page.goto(path, { waitUntil: 'networkidle' })
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await page.waitForTimeout(400)
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        await testInfo.attach(`${slugOf(path)}-${theme}-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
        expect(scrollWidth, `${path} sin scroll horizontal a ${width} px`).toBeLessThanOrEqual(width)
      })
    }
  }
})
