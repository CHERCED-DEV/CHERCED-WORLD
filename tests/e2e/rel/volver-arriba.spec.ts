import { expect, test, type Page } from '@playwright/test'

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

async function open(page: Page, path: string) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path)
}

const ROUTES: ReadonlyArray<[from: string, link: string]> = [
  ['/es/aboutMe', 'footer a[href="/es/now"]'],
  ['/es/services', 'footer a[href="/es/ai-lab"]'],
  ['/es/now', 'main a[href="/es/synergos"]'],
  ['/es/services', 'main a[href="/es/portfolio/12"]'],
  ['/es/blog', 'footer a[href="/es/privacy"]'],
]

test.describe('al cambiar de página se empieza arriba (R4.6)', () => {
  for (const [from, link] of ROUTES) {
    test(`desde el final de ${from}, ${link} abre la página nueva arriba`, async ({ page }) => {
      onlyIn('desktop-chromium', 'mobile-chromium')
      await open(page, from)
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400)
      const target = page.locator(link).first()
      const href = await target.getAttribute('href')
      await target.click()
      await page.waitForURL(`**${href}`)
      await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5000 }).toBe(0)
    })
  }
})
