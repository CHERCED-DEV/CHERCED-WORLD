import { expect, test } from '@playwright/test'
import {
  blockingViolations,
  CV,
  gotoReady,
  onlyIn,
  openPalette,
  optionIds,
  options,
  palette,
  shortcutsDialog,
  skipIntro,
  stubLinkedIn,
} from './support'

test.describe.configure({ timeout: 90_000 })

test.beforeEach(async ({ page }) => {
  await skipIntro(page)
})

test.describe('habilidades en la paleta (US6, FR-450, SC-404)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const query of ['saga', 'Angular', 'Synergos']) {
    test(`"${query}" deja una habilidad o un proyecto entre los 3 primeros`, async ({ page }) => {
      await gotoReady(page, '/es')
      await openPalette(page)
      await page.keyboard.type(query)
      await expect(options(page).first()).toBeVisible()
      await expect(palette(page).getByText('Cargando proyectos y posts…')).toBeHidden()
      await expect.poll(async () => {
        const top = await optionIds(page)
        return top.some((id) => id.startsWith('skill:') || id.startsWith('project:'))
      }).toBe(true)
    })
  }

  test('"Angular" muestra los grupos Habilidades y Proyectos, con nivel y lóbulo', async ({ page }) => {
    await gotoReady(page, '/es')
    await openPalette(page)
    await page.keyboard.type('Angular')
    await expect(palette(page).locator('[data-cw-palette-option="skill:angular"]')).toContainText('Frontend · 92 %')
    await expect(palette(page).getByRole('group', { name: 'Habilidades' })).toBeVisible()
    await expect(palette(page).getByRole('group', { name: 'Proyectos' })).toBeVisible()
  })

  test('elegir una habilidad abre "Lo que sé" con su lóbulo activo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoReady(page, '/es/services')
    await openPalette(page)
    await page.keyboard.type('saga')
    const option = palette(page).locator('[data-cw-palette-option="skill:saga"]')
    await expect(option).toBeVisible()
    await option.click()
    await page.waitForURL('**/es/aboutMe#lobe-architecture')
    await expect(palette(page)).toBeHidden()
    await expect(page.locator('[data-cw-lobe="architecture"]')).toHaveAttribute('aria-pressed', 'true')
  })

  test('en inglés, la habilidad lleva a la versión en inglés', async ({ page }) => {
    await gotoReady(page, '/en')
    await page.keyboard.press('Control+k')
    await expect(palette(page, 'en')).toBeVisible()
    await page.keyboard.type('micro-frontends')
    const option = palette(page, 'en').locator('[data-cw-palette-option="skill:micro-frontends"]')
    await expect(option).toContainText('Architecture · 90%')
    await option.click()
    await page.waitForURL('**/en/aboutMe#lobe-architecture')
  })
})

test.describe('modo de comandos > (FR-451, SC-403)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('">" lista solo comandos', async ({ page }) => {
    await gotoReady(page, '/es')
    await openPalette(page)
    await page.keyboard.type('>')
    const group = palette(page).getByRole('group', { name: 'Comandos' })
    await expect(group).toBeVisible()
    await expect(palette(page).getByRole('group')).toHaveCount(1)
    expect(await optionIds(page, 20)).toEqual([
      'action:cv-pdf-es',
      'action:cv',
      'action:copy-email',
      'action:theme',
      'action:lang',
      'action:assistant',
      'action:shortcuts',
      'action:now',
      'action:synergos',
      'action:synergos-architecture',
    ])
    await expect(group.getByRole('option', { name: 'Descargar CV en español' })).toBeVisible()
    await expect(group.getByRole('option', { name: 'Descargar CV en inglés' }), 'T970: la paleta baja solo el PDF del idioma de la página').toHaveCount(0)
    await expect(group.locator('[data-cw-palette-option="action:cv-pdf-es"]')).toContainText('PDF · 175 kB')
    await expect(group.getByRole('option', { name: 'Ver mi perfil de LinkedIn' })).toBeVisible()
    await expect(group.getByRole('option', { name: /Ver los atajos de teclado/ })).toHaveAttribute('aria-keyshortcuts', '?')
  })

  for (const [lang, filename] of [
    ['es', 'Camilo_Hernandez_CV_ES.pdf'],
    ['en', 'Camilo_Hernandez_CV_EN.pdf'],
  ] as const) {
    test(`/${lang}: ">cv" y Enter bajan el CV en PDF del idioma de la página: 4 teclas (FR-702 y T911 de la 007)`, async ({ page }) => {
      await gotoReady(page, `/${lang}`)
      await page.keyboard.press('Control+k')
      await expect(palette(page, lang)).toBeVisible()
      await expect(page.locator('[data-cw-palette-input]')).toBeFocused()
      for (const key of ['>', 'c', 'v']) await page.keyboard.press(key)
      await expect(palette(page, lang).locator(`[data-cw-palette-option="action:cv-pdf-${lang}"]`)).toHaveAttribute('aria-selected', 'true')
      const downloading = page.waitForEvent('download')
      await page.keyboard.press('Enter')
      expect((await downloading).suggestedFilename()).toBe(filename)
      await expect(palette(page, lang)).toBeHidden()
      await expect(page).toHaveURL(new RegExp(`/${lang}$`))
    })
  }

  test('">linkedin" y Enter abren el perfil de LinkedIn en una pestaña nueva', async ({ page }) => {
    await stubLinkedIn(page)
    await gotoReady(page, '/es')
    await openPalette(page)
    const popup = page.waitForEvent('popup')
    await page.keyboard.type('>linkedin')
    await expect(palette(page).locator('[data-cw-palette-option="action:cv"]')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')
    const tab = await popup
    await tab.waitForLoadState()
    expect(tab.url()).toBe(CV)
    expect(await tab.evaluate(() => window.opener)).toBeNull()
    await expect(palette(page)).toBeHidden()
    await expect(page).toHaveURL(/\/es$/)
  })

  test('">atajos" abre el diálogo de atajos y ">ahora" lleva a /now', async ({ page }) => {
    await gotoReady(page, '/es')
    await openPalette(page)
    await page.keyboard.type('>atajos')
    await page.keyboard.press('Enter')
    await expect(shortcutsDialog(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(shortcutsDialog(page)).toBeHidden()

    await openPalette(page)
    await page.keyboard.type('>ahora')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/es/now')
  })

  test('sin comandos que coincidan dice "Sin resultados"', async ({ page }) => {
    await gotoReady(page, '/es')
    await openPalette(page)
    await page.keyboard.type('>angular')
    await expect(options(page)).toHaveCount(0)
    await expect(palette(page).getByRole('status')).toHaveText('Sin resultados para «>angular»')
  })

  test('">tema" cambia el tema con el mismo puerto que set_preferences', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await gotoReady(page, '/es')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await openPalette(page)
    await page.keyboard.type('>tema')
    await page.keyboard.press('Enter')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await page.evaluate(() => localStorage.getItem('cw-theme'))).toBe('light')
  })

  for (const scheme of ['dark', 'light'] as const) {
    test(`sin violaciones críticas ni serias con habilidades y comandos (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await gotoReady(page, '/es')
      await openPalette(page)
      await page.keyboard.type('saga')
      await expect(palette(page).getByRole('group', { name: 'Habilidades' })).toBeVisible()
      expect(await blockingViolations(page)).toEqual([])
      await page.locator('[data-cw-palette-input]').fill('>')
      await expect(palette(page).getByRole('group', { name: 'Comandos' })).toBeVisible()
      expect(await blockingViolations(page)).toEqual([])
    })
  }
})

test.describe('el asistente usa el contenido de la 004 (T491)', () => {
  onlyIn('desktop-chromium')

  test('la hoja de vida se responde con el enlace de LinkedIn y un lóbulo con su ancla', async ({ page }) => {
    await gotoReady(page, '/es')
    await page.locator('[data-cw-assistant-button]').click()
    const dialog = page.getByRole('dialog', { name: 'Pregúntale a mi portafolio' })
    const answers = dialog.locator('[data-cw-answer-kind]')
    await dialog.locator('[data-cw-assistant-input]').fill('¿Me pasas tu hoja de vida?')
    await dialog.getByRole('button', { name: 'Preguntar' }).click()
    const cv = dialog.getByRole('link', { name: 'Perfil de LinkedIn' })
    await expect(cv).toHaveAttribute('href', CV)
    await expect(cv).toHaveAttribute('target', '_blank')
    await expect(cv).toHaveAttribute('rel', 'noopener noreferrer')

    await dialog.locator('[data-cw-assistant-input]').fill('¿Qué sabes de arquitectura?')
    await dialog.getByRole('button', { name: 'Preguntar' }).click()
    await expect(answers).toHaveCount(2)
    await expect(answers.nth(1).getByRole('link', { name: 'Arquitectura' })).toHaveAttribute('href', '/es/aboutMe#lobe-architecture')
  })
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('el ancla de una habilidad lleva a la lista de su lóbulo', async ({ page }) => {
    await page.goto('/es/aboutMe#lobe-architecture')
    await expect(page.locator('#lobe-architecture')).toBeAttached()
    await expect(page.locator('[data-cw-lobe-list="architecture"]')).toContainText('SAGA')
  })
})
