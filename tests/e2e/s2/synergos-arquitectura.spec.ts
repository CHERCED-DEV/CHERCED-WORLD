import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { gotoReady, openPalette, palette, skipIntro } from '../p6/support'

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
      const steps = diagram.locator('[data-cw-architecture-steps]')
      if (await steps.isVisible()) {
        await expect(diagram.locator('details')).toBeHidden()
        await expect(steps.locator('li')).toHaveCount(5)
        for (const step of await steps.locator('li').all()) await expect(step).toBeVisible()
        continue
      }
      await diagram.locator('summary').focus()
      await page.keyboard.press('Enter')
      await expect(diagram.locator('details ol li')).toHaveCount(5)
      await expect(diagram.locator('details ol')).toBeVisible()
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
  for (const width of [320, 375, 480, 768, 992, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 960 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), String(width)).toBe(true)
    const clipped = await page.locator('[data-cw-synergos-architecture] > header').evaluate(header => {
      const hero = header.querySelector('[data-cw-glass]')!
      const rect = hero.getBoundingClientRect()
      const style = getComputedStyle(hero)
      const left = rect.left + parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth)
      const right = rect.right - parseFloat(style.paddingRight) - parseFloat(style.borderRightWidth)
      return [...hero.querySelectorAll('a')].filter(link => {
        const box = link.getBoundingClientRect()
        return box.left < left - 1 || box.right > right + 1
      }).map(link => link.textContent)
    })
    expect(clipped, `enlaces recortados a ${width}px`).toEqual([])
  }
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme)
    const result = await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    expect(result.violations.filter(item => ['critical', 'serious'].includes(item.impact ?? ''))).toEqual([])
  }
})

test('el atlas se explora por función sin perder las entradas ni sus fuentes', async ({ page }, info) => {
  test.skip(info.project.name === 'no-js')
  await skipIntro(page)
  await gotoReady(page, '/es/synergos/arquitectura')
  const filters = page.getByRole('group', { name: 'Explorar por función', exact: true })
  await filters.getByRole('button', { name: /Componer la plataforma/ }).click()
  await expect(page.locator('[data-cw-pattern]:visible')).toHaveCount(4)
  await expect(page.locator('[data-cw-pattern="micro-frontends"]')).toBeVisible()
  await filters.getByRole('button', { name: /Coordinar el negocio/ }).click()
  await expect(page.locator('[data-cw-pattern]:visible')).toHaveCount(5)
  await expect(page.locator('[data-cw-pattern="saga"] a[href^="https://github.com/"]').first()).toBeVisible()
  await filters.getByRole('button', { name: /Todos/ }).click()
  await expect(page.locator('[data-cw-pattern]:visible')).toHaveCount(18)
  await filters.getByRole('button', { name: /Componer la plataforma/ }).click()
  await page.evaluate(() => { location.hash = 'patron-saga' })
  await expect(page.locator('[data-cw-pattern]:visible')).toHaveCount(18)
  await expect(page.locator('[data-cw-pattern="saga"]')).toBeInViewport()
})

test('los casos y Synergos enlazan al atlas', async ({ page }) => {
  await skipIntro(page)
  for (const id of ['12', '13']) {
    await page.goto(`/es/portfolio/${id}`)
    const links = page.locator('a[href^="/es/synergos/arquitectura#patron-"]')
    expect(await links.count()).toBeGreaterThan(0)
    await links.first().click()
    await expect(page).toHaveURL(/\/es\/synergos\/arquitectura#patron-/, { timeout: 15_000 })
    const anchor = new URL(page.url()).hash.slice(1)
    await expect(page.locator(`[id="${anchor}"]`)).toBeVisible()
  }
  await page.goto('/es/synergos')
  await expect(page.locator('a[href="/es/synergos/arquitectura"]')).toBeVisible()
})

test('metadatos, imagen social, sitemap y comando de arquitectura', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'desktop-chromium')
  await skipIntro(page)
  for (const lang of ['es', 'en']) {
    await page.goto(`/${lang}/synergos/arquitectura`)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/${lang}/synergos/arquitectura$`))
    await expect(page.locator('link[hreflang="es"]')).toHaveAttribute('href', /\/es\/synergos\/arquitectura$/)
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', /\/en\/synergos\/arquitectura$/)
    const image = await request.get(`/${lang}/synergos/arquitectura/opengraph-image/og`)
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toContain('image/png')
  }
  const sitemap = await request.get('/sitemap.xml')
  expect(await sitemap.text()).toContain('/es/synergos/arquitectura')
  await gotoReady(page, '/es')
  await openPalette(page)
  await page.locator('[data-cw-palette-input]').fill('> synergos arquitectura')
  const option = palette(page).locator('[data-cw-palette-option="action:synergos-architecture"]')
  await expect(option).toBeVisible()
  await option.click()
  await expect(page).toHaveURL(/\/es\/synergos\/arquitectura$/)
  await expect(page.locator('[data-cw-pattern]')).toHaveCount(18)
})
