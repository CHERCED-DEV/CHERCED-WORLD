import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { skipIntro } from '../p6/support'

test.describe.configure({ timeout: 90_000 })

for (const lang of ['es', 'en']) {
  test(`${lang}: atlas y diagramas legibles con o sin JavaScript`, async ({ page }) => {
    await skipIntro(page)
    const response = await page.goto(`/${lang}/synergos/arquitectura`)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-cw-pattern]')).toHaveCount(18)
    await expect(page.locator('[data-cw-architecture-diagram]')).toHaveCount(3)
    for (const diagram of await page.locator('[data-cw-architecture-diagram]').all()) {
      await diagram.locator('summary').focus()
      await page.keyboard.press('Enter')
      await expect(diagram.locator('ol li')).toHaveCount(5)
      await expect(diagram.locator('ol')).toBeVisible()
    }
    const sources = page.locator('[data-cw-pattern] a[href^="https://github.com/"]')
    expect(await sources.count()).toBeGreaterThanOrEqual(18)
    const article = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(article.join('')).toContain('TechArticle')
  })
}

test('responsive, contrastes y movimiento reducido', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium')
  await skipIntro(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/es/synergos/arquitectura')
  for (const width of [320, 375, 768, 1440, 2560]) {
    await page.setViewportSize({ width, height: 960 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), String(width)).toBe(true)
  }
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme)
    const result = await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.filter(item => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([])
  }
})

test('los casos y Synergos enlazan al atlas', async ({ page }) => {
  await skipIntro(page)
  for (const id of ['12', '13']) {
    await page.goto(`/es/portfolio/${id}`)
    const links = page.locator('a[href^="/es/synergos/arquitectura#patron-"]')
    expect(await links.count()).toBeGreaterThan(0)
    await links.first().click()
    const anchor = new URL(page.url()).hash.slice(1)
    await expect(page.locator(`[id="${anchor}"]`)).toBeVisible()
  }
  await page.goto('/es/synergos')
  await expect(page.locator('a[href="/es/synergos/arquitectura"]')).toBeVisible()
})
