import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const ROUTES_2023 = ['/', '/aboutMe', '/services', '/portfolio', '/portfolio/3', '/blog', '/blog/post1', '/contactMe', '/inbox']
const NAV_ES = ['Inicio', 'Sobre mí', 'Servicios', 'Portafolio', 'Blog', 'Contáctame']

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

function prefixed(lang: string, path: string) {
  return path === '/' ? `/${lang}` : `/${lang}${path}`
}

async function recordThemeAtFirstPaint(page: Page) {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.body) return
      ;(window as unknown as { __cwThemeAtBody?: string | null }).__cwThemeAtBody =
        document.documentElement.getAttribute('data-theme')
      observer.disconnect()
    })
    observer.observe(document, { childList: true, subtree: true })
  })
}

async function themeAtFirstPaint(page: Page) {
  return page.evaluate(() => (window as unknown as { __cwThemeAtBody?: string | null }).__cwThemeAtBody)
}

test.describe('redirección 307 desde las rutas 2023', () => {
  onlyIn('desktop-chromium')

  for (const route of ROUTES_2023) {
    test(`${route} va al idioma preferido`, async ({ request, baseURL }) => {
      const cases: Array<[Record<string, string>, string]> = [
        [{ 'accept-language': 'fr-FR,fr;q=0.9' }, 'es'],
        [{ 'accept-language': 'en-US,en;q=0.9,es;q=0.5' }, 'en'],
        [{ 'accept-language': 'en-US', cookie: 'cw-lang=es' }, 'es'],
      ]
      for (const [headers, lang] of cases) {
        const response = await request.get(route, { headers, maxRedirects: 0 })
        expect(response.status(), JSON.stringify(headers)).toBe(307)
        const location = new URL(response.headers().location ?? '', baseURL)
        expect(location.pathname).toBe(prefixed(lang, route))
      }
    })
  }
})

test.describe('LangSwitch', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('cambia de idioma sin perder la ruta y recuerda la preferencia', async ({ page, context }, testInfo) => {
    await page.goto('/es/aboutMe')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    if (testInfo.project.name === 'mobile-chromium') {
      await page.locator('[data-cw-menu-button]').click()
      await page.locator('[data-cw-float-menu] [data-cw-lang-switch]').click()
    } else {
      await page.locator('header [data-cw-lang-switch]').click()
    }

    await page.waitForURL('**/en/aboutMe')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    const cookies = await context.cookies()
    expect(cookies.find((cookie) => cookie.name === 'cw-lang')?.value).toBe('en')

    await page.goto('/aboutMe')
    await expect(page).toHaveURL(/\/en\/aboutMe$/)
  })
})

test.describe('tema sin destello', () => {
  onlyIn('desktop-chromium')

  test('respeta la preferencia clara del sistema desde el primer pintado', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' })
    const page = await context.newPage()
    await recordThemeAtFirstPaint(page)
    await page.goto('/es/aboutMe')
    expect(await themeAtFirstPaint(page)).toBe('light')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await context.close()
  })

  test('usa el negro original por defecto', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' })
    const page = await context.newPage()
    await recordThemeAtFirstPaint(page)
    await page.goto('/es/aboutMe')
    expect(await themeAtFirstPaint(page)).toBe('dark')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await context.close()
  })

  test('el toggle cambia el tema, lo recuerda y no destella al recargar', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' })
    const page = await context.newPage()
    await recordThemeAtFirstPaint(page)
    await page.goto('/es/aboutMe')
    const toggle = page.locator('[data-cw-theme-toggle]')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(await page.evaluate(() => localStorage.getItem('cw-theme'))).toBe('light')

    await page.reload()
    expect(await themeAtFirstPaint(page)).toBe('light')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await context.close()
  })
})

test.describe('header con teclado', () => {
  onlyIn('desktop-chromium')

  test('recorre la navegación con Tab y entra con Enter', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const reached: string[] = []
    for (let i = 0; i < 20 && reached.length < NAV_ES.length; i++) {
      await page.keyboard.press('Tab')
      const name = await page.evaluate(() => {
        const el = document.activeElement
        return el?.closest('header nav') ? (el.textContent ?? '').trim() : null
      })
      if (name) reached.push(name)
    }
    expect(reached).toEqual(NAV_ES)

    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator(':focus')).toHaveText('Servicios')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/es/services')
  })

  test('el primer Tab ofrece saltar al contenido', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toHaveClass(/cw-skip-link/)
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  test('muestra "Regresar" solo en páginas de detalle', async ({ page }) => {
    await page.goto('/es/portfolio/1')
    await expect(page.locator('header [data-cw-back]')).toHaveAttribute('href', '/es/portfolio')
    await page.goto('/es/aboutMe')
    await expect(page.locator('header [data-cw-back]')).toHaveCount(0)
  })

  test('Ctrl+K emite cw:open-palette', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await page.evaluate(() => {
      ;(window as unknown as { __cwPalette?: number }).__cwPalette = 0
      window.addEventListener('cw:open-palette', () => {
        const w = window as unknown as { __cwPalette: number }
        w.__cwPalette += 1
      })
    })
    await page.locator('[data-cw-palette-trigger]').click()
    await page.keyboard.press('Control+k')
    await expect.poll(() => page.evaluate(() => (window as unknown as { __cwPalette?: number }).__cwPalette)).toBe(2)
  })
})

test.describe('menú flotante con teclado', () => {
  onlyIn('mobile-chromium')

  test('abre con Enter, recorre con Tab y cierra con Esc devolviendo el foco', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const button = page.locator('[data-cw-menu-button]')
    const menu = page.locator('[data-cw-float-menu]')
    await expect(page.locator('header nav')).toBeHidden()
    await expect(menu).toBeHidden()

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      if (await button.evaluate((el) => el === document.activeElement)) break
    }
    await expect(button).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Inicio' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(menu.getByRole('link', { name: 'Sobre mí' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(button).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(menu).toBeVisible()
    await menu.getByRole('link', { name: 'Servicios' }).press('Enter')
    await page.waitForURL('**/es/services')
    await expect(menu).toBeHidden()
  })
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('el header, la navegación y el footer se ven sin JS', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const html = page.locator('html')
    await expect(html).toHaveAttribute('lang', 'es')
    await expect(html).not.toHaveAttribute('data-theme', /.*/)
    await expect(html).not.toHaveAttribute('data-intro', /.*/)

    const header = page.locator('header#header')
    await expect(header).toBeVisible()
    await expect(header.getByRole('link', { name: 'Inicio de CHERCED-WORLD' })).toHaveAttribute('href', '/es')
    const navLinks = header.locator('nav').getByRole('link')
    await expect(navLinks).toHaveText(NAV_ES)
    await expect(header.locator('[data-cw-lang-switch]')).toHaveAttribute('href', '/en/aboutMe')
    await expect(page.locator('[data-cw-theme-toggle]')).toBeHidden()
    await expect(page.locator('[data-cw-palette-trigger]')).toBeHidden()

    const footer = page.locator('footer#footer')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText('Camilo Hernandez.')
    await expect(footer.getByRole('link', { name: 'VOLVER ARRIBA' })).toHaveAttribute('href', '#header')
  })

  test('el menú flotante abre sin JS en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/es/aboutMe')
    await page.locator('[data-cw-menu-button]').click()
    const menu = page.locator('[data-cw-float-menu]')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link')).toHaveText([...NAV_ES, 'English'])
  })

  test('una ruta desconocida muestra el 404 con identidad', async ({ page }) => {
    await page.goto('/es/esta-ruta-no-existe')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página se fue mar adentro')
    await expect(page.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/es')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })
})

test.describe('accesibilidad del shell', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const scheme of ['dark', 'light'] as const) {
    test(`sin violaciones críticas ni serias en tema ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto('/es/esta-ruta-no-existe')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      const blocking = results.violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
      expect(blocking).toEqual([])
    })
  }
})
