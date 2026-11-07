import { expect, test, type Page } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function prepare(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
      localStorage.setItem('cw-theme', 'light')
    } catch {}
  })
}

async function expectAlive(page: Page, lang: 'es' | 'en') {
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', lang)
  await expect(html, 'el script del head vuelve a marcar data-js').toHaveAttribute('data-js', '')
  await expect(html, 'el tema elegido se conserva').toHaveAttribute('data-theme', 'light')
  const background = page.locator('[data-cw-background]')
  await expect(background).toBeVisible()
  await expect(background, 'las partículas siguen corriendo').toHaveAttribute('data-state', 'running', { timeout: 10_000 })
}

test.describe('cambiar de idioma no apaga el fondo ni pierde el tema', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('con el botón de idioma del header o del menú', async ({ page }, testInfo) => {
    await prepare(page)
    await page.goto('/es/aboutMe')
    await expectAlive(page, 'es')
    if (testInfo.project.name === 'mobile-chromium') {
      await page.locator('[data-cw-menu-button]').click()
      await page.locator('[data-cw-float-menu] [data-cw-lang-switch]').click()
    } else {
      await page.locator('header [data-cw-lang-switch]').click()
    }
    await page.waitForURL('**/en/aboutMe')
    await expectAlive(page, 'en')
  })

  test('con la paleta de comandos', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'la paleta con teclado es de escritorio')
    await prepare(page)
    await page.goto('/es/portfolio')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    await page.keyboard.press('Control+k')
    await expect(page.locator('[data-cw-palette-input]')).toBeFocused()
    await page.keyboard.type('inglés')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/en/portfolio')
    await expectAlive(page, 'en')
  })
})
