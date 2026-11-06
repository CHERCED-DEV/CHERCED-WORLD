import { expect, test, type Page } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

test.describe('FR-710: "Para reclutadores" en Home y Contacto', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`/${lang}: roles, modalidad, inglés y Descargar CV, LinkedIn y Escríbeme`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}`)
      const block = page.locator('[data-cw-recruiters]')
      await expect(block.getByRole('heading', { level: 2 })).toHaveText(lang === 'es' ? 'Para reclutadores' : 'For recruiters')
      await expect(block.locator('[data-cw-recruiters-roles] li')).toHaveCount(4)
      await expect(block.locator('[data-cw-recruiters-english]')).toHaveText(lang === 'es' ? 'B1, B2 en uso profesional frecuente' : 'B1, B2 in regular professional use')
      await expect(block.locator('[data-cw-cv-download]')).toHaveAttribute('href', '/cv/Camilo_Hernandez_CV.pdf')
      await expect(block.locator('[data-cw-cv-link]')).toHaveAttribute('href', /linkedin\.com\/in\/cherced/)
      await expect(block.locator('[data-cw-recruiters-write]')).toHaveAttribute('href', `/${lang}/contactMe`)
    })
  }

  test('/es/contactMe: "Escríbeme" lleva al formulario', async ({ page }, testInfo) => {
    await skipIntro(page)
    await page.goto('/es/contactMe')
    const write = page.locator('[data-cw-recruiters] [data-cw-recruiters-write]')
    await expect(write).toHaveAttribute('href', '#contact-form')
    await expect(page.locator('[data-cw-recruiters] [data-cw-cv-download]')).toHaveCount(0)
    test.skip(testInfo.project.name === 'no-js', 'el foco del ancla se prueba con JS')
    await write.click()
    await expect(page).toHaveURL(/#contact-form$/)
    await expect(page.locator('#contact-form')).toBeInViewport()
  })
})

test.describe('FR-711 y FR-712: certificaciones y "Ver código"', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('Sobre mí lista las certificaciones con el perfil de Platzi', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const certifications = page.locator('[data-cw-certifications]')
    await expect(certifications.getByRole('heading', { level: 3 })).toHaveText('Certificaciones')
    await expect(certifications.locator('[data-cw-certification]')).toHaveCount(2)
    await expect(certifications.locator('[data-cw-certifications-profile]')).toHaveAttribute('href', 'https://platzi.com/p/Cherced/')
  })

  test('Director y líneas muestra "Ver código" hacia Synergos.Fabrica', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio/13')
    const repo = page.locator('[data-cw-case-repo="Synergos.Fabrica"]')
    await expect(repo).toHaveAttribute('href', 'https://github.com/CHERCED-DEV/Synergos.Fabrica')
    await expect(repo).toContainText('Ver código')
    await page.goto('/en/portfolio/12')
    await expect(page.locator('[data-cw-case-repo="Synergos.CMS"]')).toContainText('View code')
    for (const id of ['14', '15']) {
      await page.goto(`/es/portfolio/${id}`)
      await expect(page.locator('[data-cw-case-repo]'), id).toHaveCount(0)
    }
  })
})

test.describe('B12: HYROX en /now', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('dice Río de Janeiro y no publica la fecha', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/now')
    const body = await page.locator('main').innerText()
    expect(body).toContain('HYROX Río de Janeiro')
    expect(body).not.toContain('São Paulo')
  })
})
