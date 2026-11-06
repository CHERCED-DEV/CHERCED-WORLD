import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { formatNowDate, NOW_BLOCKS } from '@/components/site/now/model'
import siteEn from '@/content/i18n/en/site.json'
import siteEs from '@/content/i18n/es/site.json'
import { now } from '@/content/now'

const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]
const DICT = { es: siteEs, en: siteEn } as const
const HEADINGS = {
  es: ['Construyendo', 'Aprendiendo', 'Entrenando para', 'Fuera del teclado', 'Mis lemas'],
  en: ['Building', 'Learning', 'Training for', 'Off the keyboard', 'My mottos'],
} as const

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function open(page: Page, lang: Lang) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/now`)
}

async function expectContent(page: Page, lang: Lang) {
  const main = page.locator('#main')
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(DICT[lang]['nowPage.title'])
  await expect(main.getByRole('heading', { level: 2 })).toHaveText([...HEADINGS[lang]])
  const time = main.locator('[data-cw-now-updated] time')
  await expect(time).toHaveAttribute('datetime', now.updatedAt)
  await expect(time).toHaveText(formatNowDate(now.updatedAt, lang))
  await expect(main.locator('[data-cw-now-updated]')).toHaveText(
    DICT[lang]['nowPage.updated'].replace('{date}', formatNowDate(now.updatedAt, lang)),
  )
  for (const id of NOW_BLOCKS) {
    const block = main.locator(`[data-cw-now-block="${id}"] li`)
    await expect(block).toHaveText(now[id].map((entry) => entry[lang]))
  }
  const mottos = main.locator('[data-cw-now-motto]')
  await expect(mottos).toHaveText(now.mottos.map((motto) => motto[lang]))
  const latin = main.locator('[lang="la"]')
  await expect(latin).toHaveCount(1)
  await expect(latin).toHaveText('Veni, vidi, vici.')
  await expect(latin).toBeVisible()
}

test.describe('/now con y sin JavaScript (FR-490, US10)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of LANGS) {
    test(`/${lang}/now: cinco bloques, fecha de actualización y lema en latín`, async ({ page }) => {
      await open(page, lang)
      await expectContent(page, lang)
    })

    test(`/${lang}/now: no publica la fecha de HYROX`, async ({ page }) => {
      await open(page, lang)
      const text = ((await page.locator('#main').textContent()) ?? '').replace(formatNowDate(now.updatedAt, lang), '')
      expect(text).toContain(lang === 'es' ? 'HYROX Río de Janeiro' : 'HYROX Rio de Janeiro')
      expect(text).not.toMatch(/\b(19|20)\d{2}\b/)
    })
  }
})

test.describe('/now: metadatos, enlace del footer y OG (FR-471, FR-472)', () => {
  onlyIn('desktop-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/now: título, descripción, canónica y alternativas`, async ({ page }) => {
      await open(page, lang)
      await expect(page).toHaveTitle(`${DICT[lang]['nowPage.title']} · Camilo Hernández`)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', DICT[lang]['meta.now.description'])
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/${lang}/now$`))
      await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', /\/es\/now$/)
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/now$/)
    })

    test(`/${lang}/now: publica su PNG de 1200 × 630 con texto alternativo`, async ({ page, request }) => {
      await open(page, lang)
      const image = page.locator('meta[property="og:image"]')
      await expect(image).toHaveCount(1)
      const url = new URL((await image.getAttribute('content'))!)
      expect(url.pathname).toBe(`/${lang}/now/opengraph-image/og`)
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
        'content',
        `${DICT[lang]['nowPage.title']}: ${DICT[lang]['meta.now.description']}`,
      )
      const response = await request.get(`${url.pathname}${url.search}`)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
      const png = await response.body()
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
    })
  }

  test('el enlace "Ahora" del footer abre la página sin recargar', async ({ page }) => {
    await open(page, 'es')
    await page.goto('/es/privacy')
    await page.evaluate(() => {
      ;(window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument = true
    })
    await page.locator('footer#footer [data-cw-footer-now]').click()
    await page.waitForURL('**/es/now')
    await expect(page.locator('#main').getByRole('heading', { level: 1 })).toHaveText('Ahora')
    expect(await page.evaluate(() => (window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument)).toBe(true)
  })
})

test.describe('/now: accesibilidad y responsive', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const scheme of ['dark', 'light'] as const) {
    for (const lang of LANGS) {
      test(`/${lang}/now en tema ${scheme}: sin violaciones críticas ni serias`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await open(page, lang)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const results = await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }

  test('sin desbordes de 320 a 2560 px', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'el barrido corre en escritorio')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'es')
    const findings: string[] = []
    for (const width of [320, 390, 768, 1024, 1440, 2560]) {
      await page.setViewportSize({ width, height: 900 })
      await page.waitForTimeout(60)
      const issues = await page.evaluate(() => {
        const found: string[] = []
        if (document.documentElement.scrollWidth > window.innerWidth + 1) found.push(`scroll ${document.documentElement.scrollWidth}`)
        for (const element of document.querySelectorAll('#main h1, #main h2, #main p, #main li')) {
          const rect = element.getBoundingClientRect()
          if (rect.left < -0.5 || rect.right > window.innerWidth + 0.5) found.push(`${element.tagName} se sale`)
          if (element.scrollWidth > element.clientWidth + 1) found.push(`${element.tagName} desborda`)
        }
        return found
      })
      findings.push(...issues.map((issue) => `${width}px: ${issue}`))
    }
    expect(findings).toEqual([])
  })
})
