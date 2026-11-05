import { expect, test, type Page } from '@playwright/test'
import { blockingViolations, gotoReady, onlyIn, openPalette, palette, shortcutsDialog, skipIntro } from './support'

test.describe.configure({ timeout: 90_000 })

onlyIn('desktop-chromium')

test.beforeEach(async ({ page }) => {
  await skipIntro(page)
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
})

async function theme(page: Page): Promise<string | null> {
  return page.locator('html').getAttribute('data-theme')
}

async function blur(page: Page): Promise<void> {
  await page.locator('main').evaluate((main) => (main as HTMLElement).focus())
}

test.describe('atajos fuera de campos (US6, FR-452)', () => {
  test('"/" abre la paleta, "?" los atajos y "t" cambia el tema; Ctrl+K sigue', async ({ page }) => {
    await gotoReady(page, '/es')
    await blur(page)
    await page.keyboard.press('/')
    await expect(palette(page)).toBeVisible()
    await expect(page.locator('[data-cw-palette-input]')).toBeFocused()
    await expect(page.locator('[data-cw-palette-input]')).toHaveValue('')
    await page.keyboard.press('Escape')
    await expect(palette(page)).toBeHidden()

    await blur(page)
    await page.keyboard.press('?')
    await expect(shortcutsDialog(page)).toBeVisible()
    await expect(shortcutsDialog(page).getByText('Abrir la paleta')).toBeVisible()
    await expect(shortcutsDialog(page).getByText('Ctrl/⌘ + K')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(shortcutsDialog(page)).toBeHidden()

    await blur(page)
    expect(await theme(page)).toBe('dark')
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.keyboard.press('Control+k')
    await expect(palette(page)).toBeVisible()
  })

  test('con un diálogo abierto o con modificadores no responden', async ({ page }) => {
    await gotoReady(page, '/es')
    await blur(page)
    await page.keyboard.press('?')
    await expect(shortcutsDialog(page)).toBeVisible()
    await page.keyboard.press('t')
    await page.keyboard.press('/')
    expect(await theme(page)).toBe('dark')
    await expect(palette(page)).toBeHidden()
    await page.keyboard.press('Escape')

    await blur(page)
    await page.keyboard.press('Alt+t')
    await page.keyboard.press('Alt+/')
    expect(await theme(page)).toBe('dark')
    await expect(palette(page)).toBeHidden()
  })

  test('declaran aria-keyshortcuts los controles con atajo (FR-453)', async ({ page }) => {
    await gotoReady(page, '/es')
    await expect(page.locator('[data-cw-palette-trigger]')).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K /')
    await expect(page.locator('[data-cw-theme-toggle]')).toHaveAttribute('aria-keyshortcuts', 't')
  })
})

test.describe('atajos dentro de campos (FR-452, escenario 4)', () => {
  test('en el formulario de contacto, "/", "?" y "t" se escriben como siempre', async ({ page }) => {
    await gotoReady(page, '/es/contactMe')
    const fields = page.locator('form :is(input[name="name"], input[name="email"], textarea[name="message"])')
    const count = await fields.count()
    expect(count).toBe(3)
    for (let index = 0; index < count; index++) {
      const field = fields.nth(index)
      await field.click()
      await page.keyboard.type('/?t')
      await expect(field).toHaveValue(/\/\?t$/)
    }
    await expect(palette(page)).toBeHidden()
    await expect(shortcutsDialog(page)).toBeHidden()
    expect(await theme(page)).toBe('dark')
  })

  test('en la paleta, "t" y "?" se escriben en la búsqueda', async ({ page }) => {
    await gotoReady(page, '/es')
    await openPalette(page)
    await page.keyboard.type('t?/')
    await expect(page.locator('[data-cw-palette-input]')).toHaveValue('t?/')
    expect(await theme(page)).toBe('dark')
    await expect(shortcutsDialog(page)).toBeHidden()
  })
})

test.describe('apagar los atajos de una tecla (WCAG 2.1.4, SC-411)', () => {
  test('apagados, "/", "?" y "t" no hacen nada en ninguna página, y se recuerda', async ({ page }) => {
    await gotoReady(page, '/es')
    await blur(page)
    await page.keyboard.press('?')
    const toggle = shortcutsDialog(page).getByRole('switch', { name: 'Atajos de una sola tecla (/, ? y t)' })
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await expect(toggle).toContainText('Activados')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await expect(toggle).toContainText('Desactivados')
    expect(await page.evaluate(() => localStorage.getItem('cw-shortcuts'))).toBe('off')
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-cw-palette-trigger]')).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K')
    await expect(page.locator('[data-cw-theme-toggle]')).not.toHaveAttribute('aria-keyshortcuts', /.+/)

    for (const path of ['/es/aboutMe', '/en/portfolio', '/es/blog']) {
      await gotoReady(page, path)
      await blur(page)
      for (const key of ['/', '?', 't']) await page.keyboard.press(key)
      await page.waitForTimeout(200)
      await expect(page.locator('dialog[open]'), path).toHaveCount(0)
      expect(await theme(page), path).toBe('dark')
    }

    await page.keyboard.press('Control+k')
    await expect(palette(page, 'es')).toBeVisible()
    await page.keyboard.type('>atajos')
    await page.keyboard.press('Enter')
    await shortcutsDialog(page).getByRole('switch').click()
    await page.keyboard.press('Escape')
    await blur(page)
    await page.keyboard.press('t')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await page.evaluate(() => localStorage.getItem('cw-shortcuts'))).toBe('on')
  })

  test('el diálogo de atajos no tiene violaciones críticas ni serias', async ({ page }) => {
    await gotoReady(page, '/es')
    await blur(page)
    await page.keyboard.press('?')
    await expect(shortcutsDialog(page)).toBeVisible()
    expect(await blockingViolations(page)).toEqual([])
    await page.emulateMedia({ colorScheme: 'light' })
    expect(await blockingViolations(page)).toEqual([])
  })
})
