import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { synergosShowcase } from '@/content/synergos-showcase'
import { gotoReady, onlyIn, openPalette, palette, skipIntro } from '../p6/support'

test.describe.configure({ timeout: 90_000 })

const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]

const copy = synergosShowcase.copy
const VERTICALS = synergosShowcase.lines.filter((line) => line.kind === 'vertical')
const COUNTED = { es: 'Conteo del 5 de noviembre de 2026', en: 'Counted on November 5, 2026' } as const

async function open(page: Page, lang: Lang, path = '/synergos') {
  await skipIntro(page)
  await page.goto(`/${lang}${path}`)
}

async function blocking(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test.describe('/synergos con y sin JavaScript (FR-901, FR-902)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of LANGS) {
    test(`/${lang}/synergos: las seis secciones, los verticales, la línea en texto y la fecha del conteo`, async ({ page }) => {
      await open(page, lang)
      const main = page.locator('#main')
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('Synergos')
      for (const heading of [copy.what.title, copy.verticals.title, copy.line.title, copy.mvp.title, copy.build.title]) {
        await expect(main.getByRole('heading', { level: 2, name: heading[lang], exact: true })).toBeVisible()
      }
      await expect(main.locator('[data-cw-vertical]')).toHaveCount(VERTICALS.length)
      await expect(main.locator('[data-cw-vertical] h3')).toHaveText(VERTICALS.map((line) => line.name[lang]))
      await expect(main.locator('[data-cw-line-item]')).toHaveCount(synergosShowcase.lines.length)
      await expect(main.locator('[data-cw-milestone]')).toHaveCount(synergosShowcase.milestones.length)
      await expect(main.locator('[data-cw-synergos-counted] time')).toHaveAttribute('datetime', synergosShowcase.countedAt)
      await expect(main.locator('[data-cw-synergos-counted]')).toContainText(COUNTED[lang])
      await expect(main.locator('[data-cw-synergos-counted]')).toBeVisible()
      await expect(main.locator('[data-cw-synergos-link="case"]')).toHaveAttribute('href', `/${lang}/portfolio/12`)
      await expect(main.locator('[data-cw-synergos-link="build-case"]')).toHaveAttribute('href', `/${lang}/portfolio/13`)
      await expect(main.locator('[data-cw-synergos-link="catalog"]')).toHaveAttribute('href', 'https://synergos-ui.synergos-labs.workers.dev/')
      await expect(main.locator('[data-cw-synergos-repo]')).toHaveCount(3)
    })
  }

  test('sin JS el rol de cada capa se lee y la lista de líneas se abre', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-js', 'solo sin JS')
    await open(page, 'es')
    for (const id of ['cdn', 'umbraco', 'micro-frontends']) await expect(page.locator(`[data-cw-diagram-role="${id}"]`)).toBeVisible()
    await page.locator('[data-cw-line-list] summary').click()
    await expect(page.locator('[data-cw-line-item]').first()).toBeVisible()
    await expect(page.locator('[data-cw-line-item="001"]')).toContainText('001 Núcleo · activa · 102 de 104 tareas')
  })
})

test.describe('/synergos: el diagrama en escritorio y en móvil', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('escritorio pinta los carriles en horizontal; móvil, en vertical hacia el director', async ({ page }, testInfo) => {
    await open(page, 'es')
    const wide = page.locator('[data-cw-line-svg="wide"]')
    const tall = page.locator('[data-cw-line-svg="tall"]')
    if (testInfo.project.name === 'desktop-chromium') {
      await expect(wide).toBeVisible()
      await expect(tall).toBeHidden()
    } else {
      await expect(tall).toBeVisible()
      await expect(wide).toBeHidden()
    }
    const shown = testInfo.project.name === 'desktop-chromium' ? wide : tall
    await expect(shown).toHaveAttribute('role', 'img')
    await expect(shown.locator('[data-cw-lane]')).toHaveCount(14)
  })

  test('la lista de líneas se abre con el teclado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'en')
    const summary = page.locator('[data-cw-line-list] summary')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-cw-line-list]')).toHaveAttribute('open', '')
    await expect(page.locator('[data-cw-line-item="007"]')).toContainText('007 Events · paused · 1 of 59 tasks')
  })

  test('los pulsos solo corren en las líneas activas y se apagan con movimiento reducido', async ({ page }, testInfo) => {
    await open(page, 'es')
    const variant = testInfo.project.name === 'desktop-chromium' ? 'wide' : 'tall'
    const svg = page.locator(`[data-cw-line-svg="${variant}"]`)
    const lanes = await svg.locator('[data-cw-lane]').evaluateAll((nodes) =>
      nodes.map((node) => ({ state: node.getAttribute('data-state'), pulses: node.querySelectorAll('[data-cw-pulse]').length })),
    )
    for (const lane of lanes) expect(lane.pulses).toBe(lane.state === 'active' ? 1 : 0)
    const running = await svg.locator('[data-cw-pulse]').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName))
    expect(running.every((name) => name !== 'none')).toBe(true)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const stopped = await page.locator('[data-cw-pulse]').evaluateAll((nodes) =>
      nodes.map((node) => ({ display: getComputedStyle(node).display, animation: getComputedStyle(node).animationName })),
    )
    for (const pulse of stopped) {
      expect(pulse.display).toBe('none')
      expect(pulse.animation).toBe('none')
    }
    expect(await page.locator('[data-cw-director]').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName))).toEqual(['none', 'none'])
  })

  for (const scheme of ['dark', 'light'] as const) {
    for (const lang of LANGS) {
      test(`/${lang}/synergos en tema ${scheme}: sin violaciones críticas ni serias`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await open(page, lang)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await page.locator('[data-cw-line-list] summary').click()
        expect(await blocking(page)).toEqual([])
      })
    }
  }
})

test.describe('/synergos: responsive (FR-905)', () => {
  onlyIn('desktop-chromium')

  test('sin scroll horizontal ni desbordes de 320 a 1440 px', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'es')
    const findings: string[] = []
    for (const width of [320, 360, 390, 414, 600, 768, 900, 992, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.waitForTimeout(60)
      const issues = await page.evaluate(() => {
        const found: string[] = []
        if (document.documentElement.scrollWidth > window.innerWidth + 1) found.push(`scroll ${document.documentElement.scrollWidth}`)
        for (const element of document.querySelectorAll('#main h1, #main h2, #main h3, #main p, #main li, #main a, #main dd, #main dt')) {
          const rect = element.getBoundingClientRect()
          if (rect.width === 0) continue
          if (rect.left < -0.5 || rect.right > window.innerWidth + 0.5) found.push(`${element.tagName} se sale`)
          if (element.scrollWidth > element.clientWidth + 1) found.push(`${element.tagName} desborda: ${element.textContent?.slice(0, 40)}`)
        }
        for (const svg of document.querySelectorAll<SVGSVGElement>('[data-cw-line-svg]')) {
          const box = svg.getBoundingClientRect()
          if (box.width === 0) continue
          for (const text of svg.querySelectorAll('text')) {
            const rect = text.getBoundingClientRect()
            if (rect.left < box.left - 1 || rect.right > box.right + 1) found.push(`texto del diagrama se sale: ${text.textContent}`)
          }
        }
        return found
      })
      findings.push(...issues.map((issue) => `${width}px: ${issue}`))
    }
    expect(findings).toEqual([])
  })

  test('a 320 px los carriles en vertical se leen: texto de 10 px o más', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await open(page, 'es')
    const tall = page.locator('[data-cw-line-svg="tall"]')
    await expect(tall).toBeVisible()
    const sizes = await tall.evaluate((svg: SVGSVGElement) => {
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
      return [...svg.querySelectorAll('[data-cw-lane] text')].map((node) => Number.parseFloat(getComputedStyle(node).fontSize) * scale)
    })
    expect(sizes).toHaveLength(28)
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(10)
  })
})

test.describe('/synergos: metadatos, OG y JSON-LD (FR-903)', () => {
  onlyIn('desktop-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/synergos: título, canónica, PNG de 1200 × 630 y CreativeWork de la Person`, async ({ page, request }) => {
      await open(page, lang)
      await expect(page).toHaveTitle(`${copy.title[lang]} · Camilo Hernández`)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', copy.description[lang])
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/${lang}/synergos$`))
      const image = page.locator('meta[property="og:image"]')
      await expect(image).toHaveCount(1)
      const url = new URL((await image.getAttribute('content'))!)
      expect(url.pathname).toBe(`/${lang}/synergos/opengraph-image/og`)
      const response = await request.get(`${url.pathname}${url.search}`)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
      const png = await response.body()
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
      const scripts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')))
      const person = scripts.find((item) => item['@type'] === 'Person')
      const work = scripts.find((item) => item['@type'] === 'CreativeWork')
      expect(work?.author).toEqual({ '@id': person?.['@id'] })
      expect(work?.name).toBe('Synergos')
    })
  }

  test('sitemap.xml y llms.txt la listan; el header y el footer no', async ({ page, request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    for (const lang of LANGS) expect(sitemap).toMatch(new RegExp(`<loc>[^<]*/${lang}/synergos</loc>`))
    const llms = await (await request.get('/llms.txt')).text()
    expect(llms).toMatch(/\[Synergos, my flagship project\]\([^)]*\/en\/synergos\)/)
    await open(page, 'es', '')
    await expect(page.locator('header a[href$="/synergos"], footer a[href$="/synergos"]')).toHaveCount(0)
  })
})

test.describe('los botones "Conoce Synergos" llevan a la página', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('desde Sobre mí, justo debajo de las cifras', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'es', '/aboutMe')
    const button = page.locator('[data-cw-synergos-cta="about"]')
    await expect(button).toHaveText(copy.cta.es)
    const figures = await page.locator('[data-cw-about="figures"]').boundingBox()
    const box = await button.boundingBox()
    expect(box!.y).toBeGreaterThanOrEqual(figures!.y + figures!.height - 1)
    expect(box!.height, 'objetivo táctil de 44 px').toBeGreaterThanOrEqual(44)
    await button.click()
    await page.waitForURL('**/es/synergos')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Synergos')
  })

  test('desde Home, en la tarjeta de Synergos de "Ahora trabajo en"', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'en', '')
    const card = page.locator('[data-cw-home-role="synergos-labs"]')
    await expect(card.locator('[data-cw-home-link="case"]'), 'A6: un solo llamado').toHaveCount(0)
    const button = card.locator('[data-cw-synergos-cta="home"]')
    await expect(button).toHaveText(copy.cta.en)
    await button.scrollIntoViewIfNeeded()
    const box = (await button.boundingBox())!
    expect(Math.min(box.width, box.height), 'objetivo táctil de 44 px').toBeGreaterThanOrEqual(44)
    await button.click()
    await page.waitForURL('**/en/synergos')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Synergos')
  })

  test('desde el caso 12, el enlace destacado del hero', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'es', '/portfolio/12')
    const button = page.locator('header [data-cw-synergos-cta="case"]')
    await expect(button).toBeVisible()
    expect((await button.boundingBox())!.height, 'objetivo táctil de 44 px').toBeGreaterThanOrEqual(44)
    await button.click()
    await page.waitForURL('**/es/synergos')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Synergos')
  })
})

test.describe('paleta: > synergos', () => {
  onlyIn('desktop-chromium')

  test('">synergos" y Enter abren la página', async ({ page }) => {
    await skipIntro(page)
    await gotoReady(page, '/es')
    await openPalette(page)
    await page.keyboard.type('>synergos')
    await expect(palette(page).locator('[data-cw-palette-option="action:synergos"]')).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')
    await page.waitForURL('**/es/synergos')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Synergos')
  })
})
