import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { fillContact, uniqueToken, useIp, waitMinimumFill } from '../l3/support/helpers'
import { blurredSurfaces, MOBILE_HEIGHT, MOBILE_WIDTHS, onlyIn, skipIntro } from '../m0/support'

const KEYBOARD = 320

const SHOTS = process.env.P5_SHOTS_DIR ?? ''

type Box = { top: number; bottom: number; left: number; right: number; height: number; width: number }

async function box(locator: Locator): Promise<Box> {
  return locator.evaluate((element) => {
    const r = element.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, width: r.width }
  })
}

async function openContact(page: Page, path = '/es/contactMe') {
  await page.goto(path)
  const form = page.locator('[data-cw-contact-form]')
  await expect(form).toHaveAttribute('novalidate', '')
  await expect(form.locator('input[name="name"]')).toHaveAttribute('data-cw-light', '')
  return form
}

function viewHeight(page: Page): number {
  return page.viewportSize()?.height ?? MOBILE_HEIGHT
}

async function labelFor(form: Locator, name: string): Promise<Locator> {
  const id = await form.locator(`[name="${name}"]`).getAttribute('id')
  return form.locator(`label[for="${id}"]`)
}

async function settled(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((element) => element.getAnimations().filter((item) => item.playState === 'running').length))
    .toBe(0)
}

async function scrollSettled(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<boolean>((done) => {
            const first = window.scrollY
            setTimeout(() => requestAnimationFrame(() => done(Math.abs(window.scrollY - first) < 0.5)), 120)
          }),
      ),
    )
    .toBe(true)
}

async function openKeyboard(page: Page, inset = KEYBOARD) {
  await page.evaluate((value) => {
    const visual = window.visualViewport
    if (!visual) throw new Error('sin visualViewport')
    Object.defineProperty(visual, 'height', { configurable: true, get: () => window.innerHeight - value })
    visual.dispatchEvent(new Event('resize'))
  }, inset)
}

async function closeKeyboard(page: Page) {
  await page.evaluate(() => {
    const visual = window.visualViewport as unknown as Record<string, unknown> | null
    if (!visual) return
    delete visual.height
    ;(visual as unknown as VisualViewport).dispatchEvent(new Event('resize'))
  })
}

async function headerBottom(page: Page): Promise<number> {
  return page.evaluate(() => {
    const header = document.getElementById('header')
    if (!header) return 0
    const position = getComputedStyle(header).position
    return position === 'sticky' || position === 'fixed' ? Math.max(0, header.getBoundingClientRect().bottom) : 0
  })
}

async function trackLayoutShifts(page: Page) {
  await page.evaluate(() => {
    const holder = window as unknown as { __p5Shifts: number[] }
    holder.__p5Shifts = []
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) holder.__p5Shifts.push(entry.value)
      }
    }).observe({ type: 'layout-shift', buffered: false })
  })
}

async function layoutShift(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __p5Shifts: number[] }).__p5Shifts.reduce((sum, value) => sum + value, 0))
}

function visitor() {
  const token = uniqueToken()
  return { name: `Móvil ${token}`, email: `movil.${token}@example.org`, message: `Hola desde el celular (${token}).` }
}

test.describe('Contacto en el celular (US13, FR-636)', () => {
  onlyIn('mobile-chromium')
  test.beforeEach(async ({ page }) => skipIntro(page))

  for (const width of MOBILE_WIDTHS) {
    test(`a ${width} px: la etiqueta vive dentro del campo, flota al enfocar o con valor y sigue asociada`, async ({ page }) => {
      await page.setViewportSize({ width, height: MOBILE_HEIGHT })
      const form = await openContact(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

      for (const name of ['name', 'email', 'phone', 'message']) {
        const control = form.locator(`[name="${name}"]`)
        const label = await labelFor(form, name)
        await expect(control.locator('xpath=..')).toHaveAttribute('data-cw-floating', '')
        const [field, text] = await Promise.all([box(control), box(label)])
        expect(text.top, `${name}: la etiqueta empieza dentro del campo`).toBeGreaterThanOrEqual(field.top)
        expect(text.bottom, `${name}: y termina dentro`).toBeLessThanOrEqual(field.bottom)
        expect(field.height, `${name}: 44 px o más`).toBeGreaterThanOrEqual(44)
      }

      const name = form.getByLabel('Tu nombre')
      const label = await labelFor(form, 'name')
      const resting = await label.evaluate((element) => getComputedStyle(element).transform)
      await name.tap()
      await expect(name).toBeFocused()
      await settled(label)
      const floating = await label.evaluate((element) => getComputedStyle(element).transform)
      expect(floating).not.toBe(resting)
      expect(floating).toMatch(/matrix\(0\.78/)

      await name.fill('Ana')
      await form.getByLabel('Tu correo').tap()
      await settled(label)
      expect(await label.evaluate((element) => getComputedStyle(element).transform)).toMatch(/matrix\(0\.78/)

      const select = form.getByLabel('¿Qué te interesa?')
      const selectLabel = await labelFor(form, 'interest')
      const [selectBox, selectText] = await Promise.all([box(select), box(selectLabel)])
      expect(selectText.top).toBeGreaterThanOrEqual(selectBox.top)
      expect(selectText.bottom).toBeLessThanOrEqual(selectBox.top + 28)
    })
  }

  test('la luz sigue al dedo y se queda en el campo enfocado, que es el único con blur', async ({ page }) => {
    const form = await openContact(page)
    const email = form.getByLabel('Tu correo')
    await email.scrollIntoViewIfNeeded()
    const target = await box(email)
    await page.touchscreen.tap(target.left + 60, target.top + 20)
    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute('data-cw-blur', '')
    expect(await email.evaluate((element) => (element as HTMLElement).style.getPropertyValue('--cw-mx'))).toBe('60px')
    await expect.poll(() => email.evaluate((element) => getComputedStyle(element).getPropertyValue('--cw-spot-mix').trim())).toBe('1')
    expect(await email.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain('radial-gradient')
    expect(await email.evaluate((element) => getComputedStyle(element).backdropFilter)).toMatch(/blur\(/)
    await expect(form.locator('[data-cw-blur]')).toHaveCount(1)
    expect(await form.locator('input[name="name"]').evaluate((element) => getComputedStyle(element).backdropFilter)).toBe('none')
    expect((await blurredSurfaces(page)).length).toBeLessThanOrEqual(3)

    await form.getByLabel('Tu mensaje').tap()
    await expect(form.locator('[data-cw-blur]')).toHaveCount(1)
    await expect(form.getByLabel('Tu mensaje')).toHaveAttribute('data-cw-blur', '')
    await expect(email).not.toHaveAttribute('data-cw-blur', '')
    await page.locator('#contact-title').tap()
    await expect(form.locator('[data-cw-blur]')).toHaveCount(0)
  })

  test('con movimiento reducido el campo enfocado no se enciende', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const form = await openContact(page)
    const name = form.getByLabel('Tu nombre')
    await name.tap()
    await expect(name).toBeFocused()
    expect(await name.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe('none')
  })

  test('el error se anuncia igual: campo inválido, mensaje asociado y foco en el primero', async ({ page }) => {
    const form = await openContact(page)
    await form.getByRole('button', { name: 'Enviar' }).tap()
    const name = form.getByLabel('Tu nombre')
    await expect(name).toBeFocused()
    await expect(name).toHaveAttribute('aria-invalid', 'true')
    const described = (await name.getAttribute('aria-describedby')) ?? ''
    await expect(page.locator(`[id="${described.split(' ').at(-1)}"]`)).toHaveText('Este campo es obligatorio')
    await expect(name).toHaveAccessibleDescription(/Este campo es obligatorio/)
    const label = await labelFor(form, 'name')
    const [field, text] = await Promise.all([box(name), box(label)])
    expect(text.bottom).toBeLessThanOrEqual(field.bottom)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  for (const name of ['message', 'email'] as const) {
    test(`con el teclado del sistema abierto, el campo "${name}" y el botón de enviar quedan a la vista`, async ({ page }) => {
      const form = await openContact(page)
      const field = form.locator(`[name="${name}"]`)
      const submit = form.locator('[data-cw-contact-submit]')
      await field.tap()
      await openKeyboard(page)
      await expect(form).toHaveAttribute('data-cw-keyboard', 'open')
      const visibleBottom = viewHeight(page) - KEYBOARD
      await expect.poll(async () => (await box(field)).bottom <= visibleBottom && (await box(field)).top >= (await headerBottom(page))).toBe(true)
      const fits = (await box(submit)).bottom - (await box(field)).top <= visibleBottom - (await headerBottom(page)) - 24
      if (fits) await expect.poll(async () => (await box(submit)).bottom <= visibleBottom).toBe(true)
      await closeKeyboard(page)
      await expect(form).not.toHaveAttribute('data-cw-keyboard', 'open')
    })
  }

  test('confirmación de envío: el toast se ve entero sobre el dock y nada salta', async ({ page }) => {
    await useIp(page)
    const loadedAt = Date.now()
    const form = await openContact(page)
    await fillContact(page, visitor())
    await waitMinimumFill(page, loadedAt)
    await trackLayoutShifts(page)
    await form.getByRole('button', { name: 'Enviar' }).tap()
    const toast = page.getByRole('status').filter({ hasText: 'Gracias por escribirme. Te respondo en menos de 48 horas.' }).first()
    await expect(toast).toBeVisible()
    await settled(toast)
    const view = page.viewportSize() ?? { width: 390, height: 844 }
    const rect = await box(toast)
    expect(rect.left).toBeGreaterThanOrEqual(0)
    expect(rect.right).toBeLessThanOrEqual(view.width)
    expect(rect.bottom).toBeLessThanOrEqual(view.height)
    const dock = page.locator('[data-cw-dock-bar]')
    if (await dock.isVisible()) expect(rect.bottom).toBeLessThanOrEqual((await box(dock)).top + 1)
    await expect(form.getByLabel('Tu nombre')).toHaveValue('')
    expect(await layoutShift(page)).toBeLessThan(0.01)
  })

  test('error del servidor: el aviso se ve entero, lo escrito se conserva y nada salta', async ({ page }) => {
    await useIp(page)
    await page.route('**/es/contactMe', async (route) => {
      const request = route.request()
      if (request.method() !== 'POST' || !request.headers()['next-action']) return route.fallback()
      const response = await route.fetch()
      const body = (await response.text()).replace(/\{"ok":(?:true|false)[^\n]*\}/, '{"ok":false,"error":"unavailable"}')
      return route.fulfill({ response, body })
    })
    const loadedAt = Date.now()
    const form = await openContact(page)
    const values = visitor()
    await fillContact(page, values)
    await waitMinimumFill(page, loadedAt)
    await trackLayoutShifts(page)
    await form.getByRole('button', { name: 'Enviar' }).tap()
    const alert = page.getByRole('alert').filter({ hasText: 'No se pudo enviar tu mensaje.' })
    await expect(alert).toBeVisible()
    await settled(alert)
    const view = page.viewportSize() ?? { width: 390, height: 844 }
    const rect = await box(alert)
    expect(rect.left).toBeGreaterThanOrEqual(0)
    expect(rect.right).toBeLessThanOrEqual(view.width)
    expect(rect.bottom).toBeLessThanOrEqual(view.height)
    await expect(form.getByLabel('Tu nombre')).toHaveValue(values.name)
    expect(await layoutShift(page)).toBeLessThan(0.01)
  })

  test('objetivos de 44 px o más en todo el formulario', async ({ page }) => {
    const form = await openContact(page)
    const targets = [
      ...['name', 'email', 'phone', 'interest', 'message'].map((name) => form.locator(`[name="${name}"]`)),
      form.locator('[data-cw-contact-submit]'),
      form.locator('[data-cw-consent-policy]'),
      form.locator('[data-cw-consent-field] label'),
      page.locator('[data-cw-contact-reach] [data-cw-cv-download]'),
      page.locator('[data-cw-contact-reach] [data-cw-cv-alternate]'),
      page.locator('[data-cw-contact-reach] [data-cw-contact-linkedin]'),
      page.locator('[data-cw-contact-reach] [data-cw-email-trigger]'),
    ]
    for (const target of targets) {
      const rect = await box(target)
      expect(rect.height, await target.evaluate((element) => element.outerHTML.slice(0, 80))).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe('Contacto en el celular sin JavaScript', () => {
  onlyIn('mobile-chromium')
  test.use({ javaScriptEnabled: false })

  test('las etiquetas se ven completas sobre cada campo y no hay marcas móviles', async ({ page }) => {
    await page.goto('/es/contactMe')
    const form = page.locator('[data-cw-contact-form]')
    for (const name of ['name', 'email', 'phone', 'interest', 'message']) {
      const label = await labelFor(form, name)
      const [field, text] = await Promise.all([box(form.locator(`[name="${name}"]`)), box(label)])
      expect(text.bottom, `${name}: etiqueta encima del campo`).toBeLessThanOrEqual(field.top + 1)
      expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), `${name}: etiqueta completa`).toBe(true)
    }
    await expect(form.locator('[data-cw-light], [data-cw-blur]')).toHaveCount(0)
  })
})

test.describe('Contacto en escritorio no cambia (FR-651)', () => {
  onlyIn('desktop-chromium')

  test('a 1280 px la etiqueta va encima, sin luz ni blur al enfocar', async ({ page }) => {
    await page.goto('/es/contactMe')
    const form = page.locator('[data-cw-contact-form]')
    await expect(form).toHaveAttribute('novalidate', '')
    const name = form.getByLabel('Tu nombre')
    await name.click()
    const label = await labelFor(form, 'name')
    const [field, text] = await Promise.all([box(name), box(label)])
    expect(text.bottom).toBeLessThanOrEqual(field.top + 1)
    expect(await label.evaluate((element) => getComputedStyle(element).transform)).toBe('none')
    await expect(form.locator('[data-cw-light], [data-cw-blur]')).toHaveCount(0)
    expect(await name.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe('none')
    expect(await name.evaluate((element) => getComputedStyle(element).minHeight)).toBe('44px')
  })
})

test.describe('capturas a 390 px (P5_SHOTS_DIR)', () => {
  onlyIn('mobile-chromium')
  test.skip(!SHOTS, 'solo con P5_SHOTS_DIR')
  test.beforeEach(async ({ page }) => skipIntro(page))

  for (const theme of ['dark', 'light'] as const) {
    test(`tema ${theme}`, async ({ page }) => {
      test.setTimeout(90_000)
      mkdirSync(SHOTS, { recursive: true })
      const shot = (name: string) => page.screenshot({ path: join(SHOTS, `p5-contacto-390-${theme}-${name}.png`) })
      await page.emulateMedia({ colorScheme: theme })
      await useIp(page)
      const loadedAt = Date.now()
      const form = await openContact(page, '/es/contactMe?servicio=ai-harness')
      await form.scrollIntoViewIfNeeded()
      await page.evaluate(() => window.scrollTo({ top: (document.querySelector('[data-cw-contact-form]') as HTMLElement).getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' }))
      await shot('1-reposo')

      const email = form.getByLabel('Tu correo')
      const target = await box(email)
      await page.touchscreen.tap(target.left + 90, target.top + 24)
      await page.keyboard.type('ana@example.org')
      await settled(await labelFor(form, 'email'))
      await settled(email)
      await scrollSettled(page)
      await shot('2-campo-enfocado')

      await form.getByLabel('Tu mensaje').tap()
      await openKeyboard(page)
      await scrollSettled(page)
      await shot('3-teclado-abierto')
      await closeKeyboard(page)

      await form.getByLabel('Tu correo').fill('')
      await form.getByRole('button', { name: 'Enviar' }).tap()
      await scrollSettled(page)
      await settled(form.getByLabel('Tu nombre'))
      await shot('4-errores')

      await fillContact(page, visitor())
      await waitMinimumFill(page, loadedAt)
      await form.getByRole('button', { name: 'Enviar' }).tap()
      await expect(page.getByRole('status').filter({ hasText: 'Te respondo en menos de 48 horas.' }).first()).toBeVisible()
      await scrollSettled(page)
      await settled(page.getByRole('status').filter({ hasText: 'Te respondo en menos de 48 horas.' }).first())
      await shot('5-confirmacion')
    })
  }
})
