import { expect, test, type Page } from '@playwright/test'
import { getSite } from '@/lib/content'

const { services } = getSite()

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

test.describe('servicios', () => {
  test('tres servicios numerados con pictograma, título y texto', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/services')
    const cards = page.locator('[data-cw-service]')
    await expect(cards).toHaveCount(services.items.length)
    for (const [index, item] of services.items.entries()) {
      const card = page.locator(`[data-cw-service="${item.id}"]`)
      await expect(card.locator(`svg[data-cw-service-icon="${item.id}"]`)).toBeVisible()
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(item.title.es)
      await expect(card.getByText(item.description.es)).toBeVisible()
      await expect(card).toContainText(String(index + 1).padStart(2, '0'))
    }
    await expect(page.locator('ol:has([data-cw-service])')).toHaveCount(1)
  })

  test('Explorar lleva al portafolio y Escríbeme a contacto', async ({ page }, testInfo) => {
    await skipIntro(page)
    await page.goto('/es/services')
    await expect(page.getByRole('link', { name: 'Explorar' })).toHaveAttribute('href', '/es/portfolio')
    const contact = page.getByRole('link', { name: 'Escríbeme', exact: true })
    await expect(contact).toHaveAttribute('href', '/es/contactMe')
    await expect(page.getByRole('heading', { level: 2, name: '¿Hablamos de tu proyecto?' })).toBeVisible()
    test.skip(testInfo.project.name === 'no-js', 'la navegación sin JS la cubre el href')
    await contact.click()
    await page.waitForURL('**/es/contactMe')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('en inglés el llamado se traduce', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/en/services')
    await expect(page.getByRole('heading', { level: 2, name: 'Shall we talk about your project?' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Write to me', exact: true })).toHaveAttribute('href', '/en/contactMe')
  })
})

test.describe('sobre mí: controles', () => {
  test('"¡Ver más!" en móvil despliega y repliega las 18 tecnologías', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'el botón solo existe en móvil con JS')
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const items = page.locator('[data-cw-about="technologies"] li')
    await page.getByRole('button', { name: '¡Ver más!' }).click()
    await expect(items.last()).toBeVisible()
    await page.getByRole('button', { name: 'Ver menos' }).click()
    await expect(items.nth(4)).toBeHidden()
    await expect(page.getByRole('button', { name: '¡Ver más!' })).toHaveAttribute('aria-expanded', 'false')
  })

  test('el enlace de Platzi abre en pestaña nueva', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una vez basta')
    await skipIntro(page)
    await context.route(/^https:\/\/platzi\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>platzi</title>' }))
    await page.goto('/es/aboutMe')
    const link = page.locator('[data-cw-about="courses"] a[href^="https://"]')
    const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()])
    await expect(popup).toHaveURL(getSite().about.courses.platzi.href)
  })
})
