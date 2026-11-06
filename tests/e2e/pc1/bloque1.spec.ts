import { expect, test, type Page } from '@playwright/test'

const HOME_TITLE = 'Camilo Hernández · Software Solutions Engineer · AI-First'

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

const CV_PDF = {
  es: { href: '/cv/camilo-hernandez-cv-es.pdf', filename: 'Camilo_Hernandez_CV_ES.pdf' },
  en: { href: '/cv/camilo-hernandez-cv-en.pdf', filename: 'Camilo_Hernandez_CV_EN.pdf' },
} as const

test.describe('B1: el CV en PDF (FR-701, FR-702, SC-701, T911)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  test('los dos PDF se sirven como application/pdf', async ({ request }) => {
    for (const { href } of Object.values(CV_PDF)) {
      const response = await request.get(href)
      expect(response.status(), href).toBe(200)
      expect(response.headers()['content-type'], href).toContain('application/pdf')
      expect((await response.body()).subarray(0, 5).toString('latin1'), href).toBe('%PDF-')
    }
  })

  for (const [path, scope] of [
    ['/es', '[data-cw-cv-actions]'],
    ['/es/aboutMe', '[data-cw-cv-actions]'],
    ['/es/contactMe', '[data-cw-contact-reach] [data-cw-cv-actions]'],
    ['/en/contactMe', '[data-cw-contact-reach] [data-cw-cv-actions]'],
  ] as const) {
    test(`${path}: "Descargar CV" va junto a LinkedIn`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(path)
      const lang = path.startsWith('/en') ? 'en' : 'es'
      const actions = page.locator(scope).first()
      const download = actions.locator('[data-cw-cv-download]')
      await expect(download).toBeVisible()
      await expect(download).toContainText(lang === 'en' ? 'Download CV' : 'Descargar CV')
      await expect(download).toHaveAttribute('href', CV_PDF[lang].href)
      await expect(download).toHaveAttribute('download', CV_PDF[lang].filename)
      await expect(actions.locator('[data-cw-cv-alternate]')).toBeVisible()
      await expect(actions.locator('[data-cw-cv-link]')).toBeVisible()
    })
  }
})

test.describe('B1: la paleta baja el CV (FR-702, T911)', () => {
  onlyIn('desktop-chromium')

  test('"> descargar cv" + Enter descarga el PDF del idioma de la página', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    await page.keyboard.press('Control+k')
    await expect(page.locator('[data-cw-palette-input]')).toBeFocused()
    await page.keyboard.type('> descargar cv')
    await expect(page.locator('[data-cw-palette-option="action:cv-pdf-es"]')).toHaveAttribute('aria-selected', 'true')
    const downloading = page.waitForEvent('download')
    await page.keyboard.press('Enter')
    const download = await downloading
    expect(download.suggestedFilename()).toBe(CV_PDF.es.filename)
    expect(new URL(download.url()).pathname).toBe(CV_PDF.es.href)
  })
})

test.describe('B2, B3 y B10: títulos y época (FR-704 a FR-706, SC-702, SC-703)', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('títulos de las páginas en ES y EN', async ({ page }) => {
    await skipIntro(page)
    for (const [path, title] of [
      ['/es', HOME_TITLE],
      ['/en', HOME_TITLE],
      ['/es/aboutMe', 'Sobre mí · Camilo Hernández'],
      ['/en/aboutMe', 'About me · Camilo Hernández'],
    ] as const) {
      await page.goto(path)
      await expect(page, path).toHaveTitle(title)
    }
  })

  test('los casos 13, 14 y 15 tienen título en español y época 2026', async ({ page }) => {
    await skipIntro(page)
    for (const [id, es, en] of [
      ['13', 'Director y líneas: agentes de IA en paralelo', 'Director & lines: parallel AI agents'],
      ['14', 'Espacio de trabajo legal', 'Legal workspace'],
      ['15', 'Puente de eventos: AWS → Azure', 'Event bridge: AWS → Azure'],
    ] as const) {
      await page.goto(`/es/portfolio/${id}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(es)
      await expect(page.locator('[data-cw-case-era]')).toContainText('2026')
      await expect(page).toHaveTitle(`${es} · Camilo Hernández`)
      await page.goto(`/en/portfolio/${id}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(en)
    }
  })

  test('ningún texto visible en /es dice los títulos en inglés', async ({ page }) => {
    await skipIntro(page)
    for (const path of ['/es/portfolio', '/es/services', '/es/aboutMe']) {
      await page.goto(path)
      const body = await page.locator('body').innerText()
      for (const english of ['Director & lines', 'Legal workspace', 'Event bridge']) expect(body, `${path}: ${english}`).not.toContain(english)
    }
  })
})
