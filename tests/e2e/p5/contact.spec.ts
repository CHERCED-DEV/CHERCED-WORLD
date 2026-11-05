import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { SERVICE_IDS } from '@/content/types'
import { fillContact, onlyIn, openContact, uniqueToken, useIp, waitMinimumFill } from '../l3/support/helpers'

const CONSENT = {
  es: 'Autorizo el tratamiento de mis datos personales según la política de privacidad.',
  en: 'I authorize the processing of my personal data as described in the privacy policy.',
} as const

const SUCCESS = 'Gracias por escribirme. Te respondo en menos de 48 horas.'

function visitor() {
  const token = uniqueToken()
  return { name: `Visitante P5 ${token}`, email: `p5.${token}@example.org`, message: `Hola, me interesa un servicio (${token}).` }
}

async function blockingViolations(page: Page, selector: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test.describe('Contacto: preselección desde ?servicio= (contrato con P3, R-408)', () => {
  onlyIn('no-js', 'desktop-chromium')

  for (const id of SERVICE_IDS) {
    test(`?servicio=${id} llega preseleccionado desde el servidor`, async ({ page }) => {
      await page.goto(`/es/contactMe?servicio=${id}`)
      await expect(page.getByLabel('¿Qué te interesa?')).toHaveValue(id)
    })
  }

  test('un valor desconocido, manipulado o repetido se ignora', async ({ page }) => {
    for (const query of ['servicio=consultoria', 'servicio=AI-HARNESS', 'servicio=other', 'servicio=%3Cscript%3E', 'servicio=product&servicio=architecture', 'servicio=']) {
      await page.goto(`/es/contactMe?${query}`)
      await expect(page.getByLabel('¿Qué te interesa?'), query).toHaveValue('')
      await expect(page.getByLabel('¿Qué te interesa?').locator('option:checked'), query).toHaveText('Elige una opción (opcional)')
    }
  })

  test('en inglés el campo y las opciones están traducidos', async ({ page }) => {
    await page.goto('/en/contactMe?servicio=workshops')
    const field = page.getByLabel('What are you interested in?')
    await expect(field).toHaveValue('workshops')
    await expect(field.locator('option:checked')).toHaveText('Team workshops')
    await expect(field.locator('option')).toHaveText([
      'Choose an option (optional)',
      'AI assistants for your profession',
      'Tailor-made software factories',
      'AI process optimization',
      'Architecture & modernization',
      'Product development',
      'Team workshops',
      'Something else',
    ])
  })

  test('cada "Quiero esto" de Servicios abre Contacto con su servicio elegido', async ({ page }) => {
    await page.goto('/es/services')
    const hrefs = await page.locator('a[href*="/contactMe?servicio="]').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
    expect(hrefs.length, 'Servicios publica un enlace por servicio').toBeGreaterThanOrEqual(SERVICE_IDS.length)
    for (const href of new Set(hrefs)) {
      const id = new URL(href, 'http://localhost').searchParams.get('servicio')
      await page.goto(href)
      await expect(page.getByLabel('¿Qué te interesa?'), href).toHaveValue(id ?? '')
    }
  })
})

test.describe('Contacto sin JavaScript', () => {
  onlyIn('no-js')

  test('envía con el servicio preseleccionado, confirma en 48 horas y no muestra agenda (P-422)', async ({ page }) => {
    await useIp(page)
    const loadedAt = Date.now()
    await page.goto('/es/contactMe?servicio=process-optimization')
    await fillContact(page, visitor())
    await waitMinimumFill(page, loadedAt)
    await page.locator('[data-cw-contact-form]').getByRole('button', { name: 'Enviar' }).click()
    await expect(page.locator('[data-cw-contact-status="ok"]')).toHaveText(SUCCESS)
    await expect(page.locator('[data-cw-contact-booking]')).toHaveCount(0)
  })

  test('el CV, la disponibilidad y el mailto de respaldo se ven', async ({ page }) => {
    await page.goto('/es/contactMe')
    const reach = page.locator('[data-cw-contact-reach]')
    await expect(reach.locator('[data-cw-availability]')).toHaveText('Disponibilidad: Armenia, Colombia · UTC−5 · Abierto a reubicación')
    await expect(reach.locator('[data-cw-cv-link]')).toHaveAttribute('href', /linkedin\.com\/in\//)
    await expect(reach.getByRole('link', { name: 'Escribirme un correo' })).toHaveAttribute('href', /^mailto:/)
  })
})

test.describe('Contacto con JavaScript', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('envía el servicio elegido, confirma en 48 horas y no muestra el enlace de agenda (P-422)', async ({ page }) => {
    await useIp(page)
    const loadedAt = await openContact(page)
    await page.getByLabel('¿Qué te interesa?').selectOption('architecture')
    await fillContact(page, visitor())
    const sent: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.headers()['next-action']) sent.push(request.postData() ?? '')
    })
    await waitMinimumFill(page, loadedAt)
    await page.locator('[data-cw-contact-form]').getByRole('button', { name: 'Enviar' }).click()
    await expect(page.getByRole('status').filter({ hasText: SUCCESS }).first()).toBeVisible()
    expect(sent.join('')).toMatch(/name="[^"]*interest"\r\n\r\narchitecture\r\n/)
    await expect(page.locator('[data-cw-contact-booking]')).toHaveCount(0)
  })

  test('chip de disponibilidad, CV en LinkedIn y menú de correo', async ({ page }) => {
    await page.goto('/es/contactMe')
    const reach = page.locator('[data-cw-contact-reach]')
    await expect(reach.locator('[data-cw-availability]')).toBeVisible()
    await expect(reach.locator('[data-cw-availability]')).toContainText('Armenia, Colombia')
    const cv = reach.getByRole('link', { name: 'Ver mi CV en LinkedIn (se abre en una pestaña nueva)' })
    await expect(cv).toHaveAttribute('target', '_blank')
    await expect(cv).toHaveAttribute('rel', /noopener/)
    const trigger = reach.getByRole('button', { name: 'Opciones de correo' })
    await trigger.click()
    await expect(reach.getByRole('menuitem', { name: 'Escribirme un correo' })).toHaveAttribute('href', /^mailto:/)
    await expect(reach.getByRole('menuitem', { name: 'Copiar correo' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })
})

test.describe('checkbox de privacidad: nombre accesible completo (FR-481, SC-409)', () => {
  onlyIn('desktop-chromium')

  for (const lang of ['es', 'en'] as const) {
    test(`Contacto en ${lang}`, async ({ page }) => {
      await page.goto(`/${lang}/contactMe`)
      const form = page.locator('[data-cw-contact-form]')
      const checkbox = form.getByRole('checkbox', { name: CONSENT[lang], exact: true })
      await expect(checkbox).toHaveAccessibleName(CONSENT[lang])
      const policy = form.locator('[data-cw-consent-policy]')
      await expect(policy).toHaveAttribute('href', `/${lang}/privacy`)
      await expect(policy).toHaveAttribute('target', '_blank')
      await expect(policy).toHaveAccessibleName(lang === 'es' ? 'Leer la política de privacidad (se abre en una pestaña nueva)' : 'Read the privacy policy (opens in a new tab)')
      await policy.focus()
      await expect(policy).toBeFocused()
      expect(await blockingViolations(page, '[data-cw-contact-form]')).toEqual([])
    })

    test(`comentarios en ${lang}`, async ({ page }) => {
      await page.goto(`/${lang}/blog/post1`)
      await page.locator('[data-cw-comment-open]').click()
      const dialog = page.getByRole('dialog')
      const checkbox = dialog.getByRole('checkbox', { name: CONSENT[lang], exact: true })
      await expect(checkbox).toHaveAccessibleName(CONSENT[lang])
      const policy = dialog.locator('[data-cw-consent-policy]')
      await expect(policy).toHaveAttribute('href', `/${lang}/privacy`)
      await expect(policy).toHaveAccessibleName(lang === 'es' ? 'Leer la política de privacidad (se abre en una pestaña nueva)' : 'Read the privacy policy (opens in a new tab)')
      expect(await blockingViolations(page, 'dialog[open]')).toEqual([])
    })
  }
})

test.describe('política de privacidad (FR-483)', () => {
  onlyIn('no-js')

  test('menciona el servicio elegido y las reacciones en ES y EN', async ({ page }) => {
    await page.goto('/es/privacy')
    await expect(page.getByText('el servicio que te interesa si lo eliges')).toBeVisible()
    await expect(page.getByText('Las reacciones solo guardan contadores.')).toBeVisible()
    await page.goto('/en/privacy')
    await expect(page.getByText("the service you're interested in if you choose one")).toBeVisible()
    await expect(page.getByText('Reactions only store counts.')).toBeVisible()
  })
})
