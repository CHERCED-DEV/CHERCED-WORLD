import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { SERVICE_IDS } from '@/content/types'
import { getSite } from '@/lib/content'

const { services } = getSite()
const BLOCKS = ['hero', 'audiences', 'services', 'process', 'cases', 'faq', 'cta']
const CASES = ['12', '13', '2', '14', '15']
const ACCENT = 'rgb(37, 237, 158)'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function open(page: Page, path = '/es/services') {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path)
}

function card(page: Page, id: string): Locator {
  return page.locator(`article[data-cw-service="${id}"]`)
}

async function stepColors(page: Page): Promise<string[]> {
  return page.locator('[data-cw-step]').evaluateAll((items) => items.map((item) => getComputedStyle(item, '::before').borderTopColor))
}

test.describe('Servicios: estructura (US1b, FR-406a a FR-406c)', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: siete bloques en orden, h1 del hero y llamados a Contacto`, async ({ page }) => {
      await open(page, `/${lang}/services`)
      const blocks = page.locator('[data-cw-services-block]')
      await expect(blocks).toHaveCount(BLOCKS.length)
      expect(await blocks.evaluateAll((items) => items.map((item) => item.getAttribute('data-cw-services-block')))).toEqual(BLOCKS)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(services.hero.title[lang])
      await expect(page.locator('[data-cw-services-hero-cta]')).toHaveText(services.hero.cta[lang])
      await expect(page.locator('[data-cw-services-hero-cta]')).toHaveAttribute('href', `/${lang}/contactMe`)
      await expect(page.getByRole('heading', { level: 2, name: services.cta.title[lang] })).toBeVisible()
      await expect(page.locator('[data-cw-services-contact]')).toHaveText(services.cta.button[lang])
      await expect(page.locator('[data-cw-services-contact]')).toHaveAttribute('href', `/${lang}/contactMe`)
      await expect(page.locator('[data-cw-audience]')).toHaveCount(3)
      const tryLink = page.locator('[data-cw-service-try]')
      await expect(tryLink, 'T450: "Probar" solo en asistentes, hacia la vitrina Despacho').toHaveCount(1)
      await expect(tryLink).toHaveAttribute('data-cw-service-try', 'ai-harness')
      await expect(tryLink).toHaveAttribute('href', `/${lang}/ai-lab#lab-a4`)
      await expect(page.locator('#main')).not.toContainText(/\$|USD|COP|€/)
    })
  }

  test('seis tarjetas numeradas del 01 al 06 con pictograma, título y "Quiero esto"', async ({ page }) => {
    await open(page)
    const cards = page.locator('article[data-cw-service]')
    await expect(cards).toHaveCount(6)
    await expect(page.locator('ol:has(article[data-cw-service])')).toHaveCount(1)
    for (const [index, id] of SERVICE_IDS.entries()) {
      const item = services.items[index]!
      const current = card(page, id)
      await expect(current.locator(`svg[data-cw-service-icon="${id}"]`)).toBeVisible()
      await expect(current.getByRole('heading', { level: 3 })).toHaveText(item.title.es)
      await expect(current).toContainText(String(index + 1).padStart(2, '0'))
      const want = current.getByRole('link', { name: `Quiero esto: ${item.title.es}` })
      await expect(want).toHaveAttribute('href', `/es/contactMe?servicio=${id}`)
    }
  })

  test('ícono, número y título quedan a la misma altura en cada fila', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'la grilla de tres columnas es de escritorio')
    await open(page)
    const tops = await page.locator('article[data-cw-service]').evaluateAll((cards) =>
      cards.map((item) => {
        const top = (selector: string) => Math.round(item.querySelector(selector)!.getBoundingClientRect().top)
        return { tile: top('svg'), title: top('h3'), want: top('a[data-cw-service-want]') }
      }),
    )
    for (const row of [tops.slice(0, 3), tops.slice(3, 6)]) {
      for (const key of ['tile', 'title', 'want'] as const) expect(new Set(row.map((entry) => entry[key])).size, key).toBe(1)
    }
  })

  test('Casos enlaza solo a casos publicados, en el orden del portafolio (FR-406h)', async ({ page }) => {
    await open(page)
    const links = page.locator('[data-cw-service-case] h3 a')
    await expect(links).toHaveCount(CASES.length)
    expect(await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual(
      CASES.map((id) => `/es/portfolio/${id}`),
    )
  })
})

test.describe('Servicios: reverso de las tarjetas (FR-406d, R-410)', () => {
  test('con teclado: Enter y Espacio giran, el estado se anuncia y Esc vuelve', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'teclado en escritorio')
    await open(page)
    const current = card(page, 'ai-harness')
    const flip = current.locator('[data-cw-service-flip]')
    const deliverable = current.getByText(services.items[0]!.deliverables[0]!.es)
    await page.mouse.move(2, 2)
    const description = current.getByText(services.items[0]!.description.es)
    await expect(flip).toHaveAttribute('aria-expanded', 'false')
    await expect(flip).toHaveText('Ver qué recibes')
    await expect(deliverable).toBeHidden()
    await flip.focus()
    await page.keyboard.press('Enter')
    await expect(flip).toHaveAttribute('aria-expanded', 'true')
    await expect(flip).toHaveText('Volver')
    await expect(deliverable).toBeVisible()
    await expect(description).toBeHidden()
    await page.keyboard.press('Space')
    await expect(flip).toHaveAttribute('aria-expanded', 'false')
    await expect(description).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(flip).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(flip).toHaveAttribute('aria-expanded', 'false')
    await expect(flip).toBeFocused()
    const controls = await flip.getAttribute('aria-controls')
    await expect(current.locator(`#${controls?.replace(/:/g, '\\:')}`)).toHaveAttribute('data-cw-face', 'back')
  })

  test('con el puntero: pasar por encima muestra el reverso y salir lo devuelve', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'puntero fino en escritorio')
    await open(page)
    const current = card(page, 'architecture')
    const flip = current.locator('[data-cw-service-flip]')
    await current.locator('h3').hover()
    await expect(flip).toHaveAttribute('aria-expanded', 'true')
    await expect(current.getByText(services.items[3]!.deliverables[0]!.es)).toBeVisible()
    await page.mouse.move(2, 2)
    await expect(flip).toHaveAttribute('aria-expanded', 'false')
  })

  test('con el dedo: tocar la tarjeta la gira y "Quiero esto" sigue siendo un enlace propio', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'toque en móvil')
    await open(page)
    const current = card(page, 'product')
    const flip = current.locator('[data-cw-service-flip]')
    await current.getByText(services.items[4]!.description.es).tap()
    await expect(flip).toHaveAttribute('aria-expanded', 'true')
    await expect(current.getByText(services.items[4]!.deliverables[0]!.es)).toBeVisible()
    await current.locator('[data-cw-face="back"]').tap()
    await expect(flip).toHaveAttribute('aria-expanded', 'false')
    await current.locator('[data-cw-service-want]').tap()
    await page.waitForURL('**/es/contactMe?servicio=product')
  })

  test('con movimiento reducido cambia de cara sin girar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una vez basta')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    const current = card(page, 'workshops')
    await page.mouse.move(2, 2)
    await current.locator('[data-cw-service-flip]').focus()
    await page.keyboard.press('Enter')
    await expect(current.getByText(services.items[5]!.deliverables[0]!.es)).toBeVisible()
    await expect(current.getByText(services.items[5]!.description.es)).toBeHidden()
    const transforms = await current.evaluate((item) => {
      const back = item.querySelector('[data-cw-face="back"]')!
      return [getComputedStyle(back.parentElement!).transform, getComputedStyle(back).transform]
    })
    expect(transforms).toEqual(['none', 'none'])
  })

  test('sin JS se leen las dos caras completas, una debajo de la otra', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-js', 'solo sin JS')
    await open(page)
    for (const [index, id] of SERVICE_IDS.entries()) {
      const item = services.items[index]!
      const current = card(page, id)
      await expect(current.locator('[data-cw-service-flip]')).toBeHidden()
      await expect(current.getByText(item.description.es)).toBeVisible()
      for (const deliverable of item.deliverables) await expect(current.getByText(deliverable.es)).toBeVisible()
      const [front, back] = await Promise.all(
        ['front', 'back'].map((face) => current.locator(`[data-cw-face="${face}"]`).evaluate((el) => el.getBoundingClientRect())),
      )
      expect(back!.top).toBeGreaterThanOrEqual(front!.bottom)
    }
  })
})

test.describe('Servicios: "Quiero esto" (FR-406f, SC-413)', () => {
  test('lleva a Contacto con el servicio en ?servicio= en un clic, con y sin JS', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chromium', 'el toque lo cubre la prueba del reverso')
    await open(page)
    const want = card(page, 'software-factory').locator('[data-cw-service-want]')
    await want.scrollIntoViewIfNeeded()
    await want.click()
    await page.waitForURL('**/es/contactMe?servicio=software-factory')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Servicios: cómo trabajo (FR-406e)', () => {
  test('los cinco pasos se encienden uno tras otro al entrar en pantalla', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una vez basta')
    await open(page)
    const steps = page.locator('ol[data-cw-steps]')
    await expect(page.locator('[data-cw-step]')).toHaveCount(5)
    await expect(steps).toHaveAttribute('data-cw-reveal', 'pending')
    expect(new Set(await stepColors(page))).not.toContain(ACCENT)
    await steps.scrollIntoViewIfNeeded()
    await expect(steps).toHaveAttribute('data-cw-reveal', 'in')
    const delays = await page
      .locator('[data-cw-step]')
      .evaluateAll((items) => items.map((item) => Number.parseFloat(getComputedStyle(item, '::before').animationDelay)))
    expect(delays).toEqual([...delays].sort((a, b) => a - b))
    expect(new Set(delays).size).toBe(5)
    await expect.poll(() => stepColors(page), { timeout: 5_000 }).toEqual(Array(5).fill(ACCENT))
    for (const principle of services.process.principles) await expect(page.getByText(principle.es)).toBeVisible()
  })

  test('con movimiento reducido o sin JS todo está encendido desde el principio', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile-chromium', 'escritorio con y sin JS')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    const expected = testInfo.project.name === 'no-js' ? '' : 'shown'
    await expect(page.locator('ol[data-cw-steps]')).toHaveAttribute('data-cw-reveal', expected)
    expect(await stepColors(page)).toEqual(Array(5).fill(ACCENT))
    const texts = await page.locator('[data-cw-step]').allInnerTexts()
    for (const text of texts) expect(text.trim()).not.toMatch(/^\d/)
  })
})

test.describe('Servicios: preguntas frecuentes (FR-406g)', () => {
  test('cinco disclosures que abren con un clic, sin la pregunta de propiedad', async ({ page }) => {
    await open(page)
    const items = page.locator('details[data-cw-faq]')
    await expect(items).toHaveCount(5)
    await expect(page.locator('#main')).not.toContainText('¿Quién es dueño')
    const first = items.first()
    await expect(first).not.toHaveAttribute('open', '')
    await expect(first.getByText(services.faq[0]!.a.es)).toBeHidden()
    await first.locator('summary').click()
    await expect(first).toHaveAttribute('open', '')
    await expect(first.getByText(services.faq[0]!.a.es)).toBeVisible()
  })

  test('con teclado, Enter abre y Espacio cierra', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'teclado en escritorio')
    await open(page)
    const second = page.locator('details[data-cw-faq]').nth(1)
    await second.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(second).toHaveAttribute('open', '')
    await page.keyboard.press('Space')
    await expect(second).not.toHaveAttribute('open', '')
  })
})

test.describe('Servicios: accesibilidad y OG (SC-413, FR-471)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: axe sin violaciones, también con una tarjeta girada`, async ({ page }) => {
      await open(page, `/${lang}/services`)
      await page.locator('[data-cw-faq] summary').first().click()
      const scan = async () =>
        (await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations
      expect(await scan()).toEqual([])
      await page.mouse.move(2, 2)
      await card(page, 'ai-harness').locator('[data-cw-service-flip]').focus()
      await page.keyboard.press('Enter')
      await expect(card(page, 'ai-harness')).toHaveAttribute('data-cw-flipped', 'true')
      expect(await scan()).toEqual([])
    })
  }

  test('la imagen OG de Servicios es un PNG propio de 1200 × 630', async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una vez basta')
    await open(page)
    const image = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(image).toMatch(/\/es\/services\/opengraph-image\/og/)
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630')
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /^Servicios: /)
    const response = await request.get(new URL(image!).pathname + new URL(image!).search)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/png')
  })
})
