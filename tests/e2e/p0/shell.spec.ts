import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const EMAIL = 'chernandezcediel@gmail.com'
const EGG = "Officially Uncle Bob's nephew · SOLID runs in the family."

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
}

async function personJsonLd(page: Page): Promise<Record<string, unknown>> {
  const scripts = page.locator('script[type="application/ld+json"][data-cw-person]')
  await expect(scripts).toHaveCount(1)
  return JSON.parse((await scripts.textContent()) ?? '{}') as Record<string, unknown>
}

test.describe('footer: easter egg y enlace a /now (FR-462, FR-490)', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: la frase va en inglés, discreta y sin enlace`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}/aboutMe`)
      const egg = page.locator('footer#footer [data-cw-footer-egg]')
      await expect(egg).toHaveText(EGG)
      await expect(egg).toHaveAttribute('lang', 'en')
      await expect(egg.locator('a')).toHaveCount(0)
      await egg.scrollIntoViewIfNeeded()
      await expect(egg).toBeVisible()
      const now = page.locator('footer#footer [data-cw-footer-now]')
      await expect(now).toHaveAttribute('href', `/${lang}/now`)
      await expect(now).toHaveText(lang === 'es' ? 'Ahora' : 'Now')
    })
  }
})

test.describe('menú de correo del footer (FR-464)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('ofrece escribir y copiar; copiar avisa con el toast y deja el correo en el portapapeles', async ({ page, context, baseURL }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL })
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const footer = page.locator('footer#footer')
    await expect(footer.locator('[data-cw-email-fallback]')).toBeHidden()
    const trigger = footer.getByRole('button', { name: 'Opciones de correo' })
    await trigger.scrollIntoViewIfNeeded()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const menu = footer.getByRole('menu', { name: 'Opciones de correo' })
    await expect(menu.getByRole('menuitem')).toHaveText(['Escribirme un correo', 'Copiar correo'])
    await expect(menu.getByRole('menuitem', { name: 'Escribirme un correo' })).toHaveAttribute('href', `mailto:${EMAIL}`)
    await menu.getByRole('menuitem', { name: 'Copiar correo' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Correo copiado ✓' })).toBeVisible()
    await expect(menu).toHaveCount(0)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL)
  })

  test('si el portapapeles falla, el aviso muestra el correo para copiarlo a mano', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('denied')) },
      })
    })
    await skipIntro(page)
    await page.goto('/en/aboutMe')
    const trigger = page.locator('footer#footer').getByRole('button', { name: 'Email options' })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    await page.getByRole('menuitem', { name: 'Copy email' }).click()
    await expect(page.getByRole('alert').filter({ hasText: EMAIL })).toBeVisible()
  })
})

test.describe('menú de correo con teclado', () => {
  onlyIn('desktop-chromium')

  test('Enter abre en la primera opción, las flechas recorren y Esc devuelve el foco', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const trigger = page.locator('footer#footer [data-cw-email-trigger]')
    await trigger.focus()
    await page.keyboard.press('Enter')
    const items = page.locator('footer#footer [role="menuitem"]')
    await expect(items.nth(0)).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(items.nth(1)).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(items.nth(0)).toBeFocused()
    await page.keyboard.press('End')
    await expect(items.nth(1)).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.locator('footer#footer [role="menu"]')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.press('ArrowDown')
    await expect(items.nth(0)).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.locator('footer#footer [role="menu"]')).toHaveCount(0)
  })

  test('un clic fuera cierra el menú', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const trigger = page.locator('footer#footer [data-cw-email-trigger]')
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()
    await expect(page.locator('footer#footer [role="menu"]')).toBeVisible()
    await page.locator('footer#footer [data-cw-footer-egg]').click()
    await expect(page.locator('footer#footer [role="menu"]')).toHaveCount(0)
  })

  for (const scheme of ['dark', 'light'] as const) {
    test(`el footer con el menú abierto no tiene violaciones críticas ni serias en tema ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await skipIntro(page)
      await page.goto('/es/aboutMe')
      const trigger = page.locator('footer#footer [data-cw-email-trigger]')
      await trigger.scrollIntoViewIfNeeded()
      await trigger.click()
      await expect(page.locator('footer#footer [role="menu"]')).toBeVisible()
      const results = await new AxeBuilder({ page }).include('footer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      const blocking = results.violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
      expect(blocking).toEqual([])
    })
  }
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('el correo del footer sigue siendo un mailto y el menú no aparece', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const footer = page.locator('footer#footer')
    const mailto = footer.locator('[data-cw-email-fallback]')
    await expect(mailto).toBeVisible()
    await expect(mailto).toHaveAttribute('href', `mailto:${EMAIL}`)
    await expect(mailto).toHaveAccessibleName('Escribirme un correo')
    await expect(footer.locator('[data-cw-email-trigger]')).toBeHidden()
    await expect(footer.locator('[data-cw-footer-egg]')).toHaveText(EGG)
    await expect(footer.locator('[data-cw-footer-now]')).toHaveAttribute('href', '/es/now')
  })

  test('el JSON-LD Person llega en el HTML del servidor', async ({ page }) => {
    await page.goto('/en/portfolio')
    const person = await personJsonLd(page)
    expect(person['@type']).toBe('Person')
    expect(person.name).toBe('Camilo Hernandez')
  })
})

test.describe('JSON-LD Person (FR-470, SC-408)', () => {
  onlyIn('desktop-chromium')

  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: un Person válido, con @id estable y sin datos de contacto`, async ({ page, baseURL }) => {
      await page.goto(`/${lang}`)
      const person = await personJsonLd(page)
      const description = await page.locator('meta[name="description"]').getAttribute('content')
      const origin = new URL(String(person.url)).origin
      expect(person['@context']).toBe('https://schema.org')
      expect(person['@type']).toBe('Person')
      expect(person['@id']).toBe(`${origin}/#person`)
      expect(person.name).toBe('Camilo Hernandez')
      expect(person.jobTitle).toBe('Software Solutions Engineer')
      expect(person.description).toBe(description)
      expect(person.sameAs).toEqual(['https://www.linkedin.com/in/cherced/', 'https://github.com/CHERCED-DEV'])
      expect(person.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Armenia', addressCountry: 'CO' })
      expect(person.alumniOf).toEqual({ '@type': 'CollegeOrUniversity', name: 'Institución Universitaria EAM' })
      expect(String(person.image)).toMatch(/\/assets\/imgs\/about\/retrato-oscuro\.webp$/)
      expect(JSON.stringify(person)).not.toMatch(/@gmail|mailto:|telephone|email/i)
      expect(baseURL).toBeTruthy()
    })
  }

  test('el @id es el mismo en otra página y en el otro idioma', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const es = await personJsonLd(page)
    await page.goto('/en/blog')
    const en = await personJsonLd(page)
    expect(es['@id']).toBe(en['@id'])
  })
})

test.describe('imagen OG del home y sitemap', () => {
  onlyIn('desktop-chromium')

  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: la imagen OG por defecto es un PNG de 1200 × 630`, async ({ request }) => {
      const response = await request.get(`/${lang}/opengraph-image/og`)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
      const png = await response.body()
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
    })
  }

  test('el sitemap incluye /now y los 15 casos en ambos idiomas', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    for (const lang of ['es', 'en']) {
      expect(xml).toMatch(new RegExp(`<loc>[^<]*/${lang}/now</loc>`))
      for (const id of ['12', '13', '14', '15']) expect(xml).toMatch(new RegExp(`<loc>[^<]*/${lang}/portfolio/${id}</loc>`))
    }
    expect(xml.match(/\/portfolio\/\d+<\/loc>/g)).toHaveLength(30)
  })
})
