import { expect, test, type Locator, type Page } from '@playwright/test'

type Lang = 'es' | 'en'

const CV = {
  es: { href: '/cv/camilo-hernandez-cv-es.pdf', filename: 'Camilo_Hernandez_CV_ES.pdf', format: 'PDF · 175 kB' },
  en: { href: '/cv/camilo-hernandez-cv-en.pdf', filename: 'Camilo_Hernandez_CV_EN.pdf', format: 'PDF · 173 kB' },
} as const

const COPY = {
  es: { download: 'Descargar CV', name: 'Descargar CV en español (PDF, 175 kB)' },
  en: { download: 'Download CV', name: 'Download CV in English (PDF, 173 kB)' },
} as const

const PAGES: ReadonlyArray<readonly [Lang, string, string]> = [
  ['es', '/es', '[data-cw-home-banner] [data-cw-cv-actions]'],
  ['en', '/en', '[data-cw-home-banner] [data-cw-cv-actions]'],
  ['es', '/es/contactMe', '[data-cw-contact-reach] [data-cw-cv-actions]'],
  ['en', '/en/contactMe', '[data-cw-contact-reach] [data-cw-cv-actions]'],
]

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

function recruitersDialog(page: Page, lang: Lang): Locator {
  return page.getByRole('dialog', { name: lang === 'es' ? 'Para reclutadores' : 'For recruiters' })
}

async function openRecruiters(page: Page, lang: Lang): Promise<Locator> {
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 60_000 })
  await page.locator('[data-cw-recruiters-open]').click()
  await expect(recruitersDialog(page, lang)).toBeVisible()
  return recruitersDialog(page, lang).locator('[data-cw-recruiters]')
}

function heroCv(page: Page): Locator {
  return page.locator('[data-cw-home-banner] [data-cw-cv-actions]').first()
}

async function expectDownloadButton(scope: Locator, lang: Lang): Promise<Locator> {
  const primary = scope.locator('[data-cw-cv-download]')
  await expect(primary).toHaveCount(1)
  await expect(primary).toBeVisible()
  await expect(primary).toHaveAttribute('href', CV[lang].href)
  await expect(primary).toHaveAttribute('download', CV[lang].filename)
  await expect(primary).toHaveAttribute('type', 'application/pdf')
  await expect(primary).toHaveAccessibleName(COPY[lang].name)
  await expect(primary).toContainText(COPY[lang].download)
  await expect(primary).toContainText(CV[lang].format)
  await expect(scope.locator('[data-cw-cv-alternate]'), 'sin botón del otro idioma').toHaveCount(0)
  await expect(scope.locator('[data-cw-cv-link]')).toBeVisible()
  return primary
}

async function expectDownload(page: Page, link: Locator, pdf: (typeof CV)[Lang]) {
  const downloading = page.waitForEvent('download')
  await link.click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe(pdf.filename)
  expect(new URL(download.url()).pathname).toBe(pdf.href)
}

test.describe('T911: los dos PDF del CV se sirven tal cual', () => {
  onlyIn('desktop-chromium')

  for (const lang of ['es', 'en'] as const) {
    test(`${CV[lang].href} responde 200 con application/pdf`, async ({ request }) => {
      const response = await request.get(CV[lang].href)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('application/pdf')
      expect((await response.body()).subarray(0, 5).toString('latin1')).toBe('%PDF-')
    })
  }

  test('el CV viejo ya no se publica', async ({ request }) => {
    expect((await request.get('/cv/Camilo_Hernandez_CV.pdf')).status()).toBe(404)
  })
})

test.describe('T911: "Descargar CV" baja el PDF del idioma de la página en Home y Contacto', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const [lang, path, scope] of PAGES) {
    test(`${path}: un solo botón, con el PDF en ${lang}, su formato y su peso`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(path)
      const actions = page.locator(scope).first()
      const primary = await expectDownloadButton(actions, lang)
      for (const link of [primary, actions.locator('[data-cw-cv-link]')]) {
        const box = await link.evaluate((element: HTMLElement) => ({
          html: element.outerHTML.slice(0, 60),
          width: element.offsetWidth,
          height: element.offsetHeight,
        }))
        expect(box.height, box.html).toBeGreaterThanOrEqual(44)
        expect(box.width, box.html).toBeGreaterThanOrEqual(44)
      }
    })
  }

  for (const [path, scope, container] of [
    ['/es', '[data-cw-home-banner] [data-cw-cv-actions]', '[data-cw-home-banner] h1'],
    ['/en/contactMe', '[data-cw-contact-reach] [data-cw-cv-actions]', null],
  ] as const) {
    test(`${path}: los botones del CV siguen centrados`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(path)
      await expect(page.locator(scope).first().locator('[data-cw-cv-download]')).toBeVisible()
      const layout = await page.evaluate(
        ({ scope, container }) => {
          const actions = document.querySelector(scope) as HTMLElement
          const parent = (container ? document.querySelector(container) : actions.parentElement) as HTMLElement
          const frame = parent.getBoundingClientRect()
          const items = [...(actions.parentElement as HTMLElement).querySelectorAll<HTMLElement>(':scope a, :scope button')].filter(
            (item) => item.closest('[data-cw-contact-reach] [data-cw-recruiters-entry], nav') === null && item.offsetParent !== null,
          )
          const lines = new Map<number, { left: number; right: number }>()
          for (const item of items) {
            const rect = item.getBoundingClientRect()
            const key = Math.round(rect.top / 8)
            const line = lines.get(key) ?? { left: Infinity, right: -Infinity }
            lines.set(key, { left: Math.min(line.left, rect.left), right: Math.max(line.right, rect.right) })
          }
          return {
            display: getComputedStyle(actions).display,
            center: frame.left + frame.width / 2,
            lines: [...lines.values()].map((line) => (line.left + line.right) / 2),
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          }
        },
        { scope, container },
      )
      if (path.endsWith('contactMe')) expect(layout.display, 'Contacto mantiene display: contents').toBe('contents')
      expect(layout.lines.length).toBeGreaterThan(0)
      for (const line of layout.lines) expect(Math.abs(line - layout.center)).toBeLessThanOrEqual(2)
      expect(layout.overflow, 'sin scroll horizontal').toBeLessThanOrEqual(0)
    })
  }
})

test.describe('T911: la descarga se guarda con el nombre de su idioma', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of ['es', 'en'] as const) {
    test(`/${lang}: el botón del hero se guarda como ${CV[lang].filename}`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}`)
      const primary = await expectDownloadButton(heroCv(page), lang)
      await expectDownload(page, primary, CV[lang])
    })

    test(`/${lang}: el pop-up "Para reclutadores" baja el mismo PDF`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}`)
      const block = await openRecruiters(page, lang)
      const primary = await expectDownloadButton(block, lang)
      await expectDownload(page, primary, CV[lang])
      await expect(recruitersDialog(page, lang), 'como cualquier enlace del pop-up, la descarga lo cierra').toBeHidden()
    })
  }
})

test.describe('T911: "Descargar CV" se usa con teclado', () => {
  onlyIn('desktop-chromium')

  test('/es: Tab llega al botón y después a LinkedIn con el foco visible', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es')
    const actions = heroCv(page)
    const primary = actions.locator('[data-cw-cv-download]')
    await primary.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(primary).toBeFocused()
    const ring = await primary.evaluate((element) => {
      const style = getComputedStyle(element)
      return { visible: element.matches(':focus-visible'), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) }
    })
    expect(ring.visible).toBe(true)
    expect(ring.outline).not.toBe('none')
    expect(ring.width).toBeGreaterThanOrEqual(2)
    await page.keyboard.press('Tab')
    await expect(actions.locator('[data-cw-cv-link]')).toBeFocused()
  })
})
