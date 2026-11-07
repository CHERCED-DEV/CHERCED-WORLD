import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { brainData } from '@/components/site/about/brain'
import { aboutFigures, figureDigits, figureText } from '@/components/site/about/figures'
import { getProjects, getSite } from '@/lib/content'

const { about } = getSite()
const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]
const data = { es: brainData(about, getProjects(), 'es', 'Actualidad'), en: brainData(about, getProjects(), 'en', 'Present') }
const figures = aboutFigures(about)
const HEIGHT_BUDGET_1440 = Math.floor(5882 * 0.6)
const CV = {
  es: { text: 'Descargar CV', name: 'Descargar CV en español (PDF, 175 kB)', words: 'Mis habilidades, en palabras', principles: 'Principios' },
  en: { text: 'Download CV', name: 'Download CV in English (PDF, 173 kB)', words: 'My skills, in words', principles: 'Principles' },
} as const
const FIGURE_LABELS = {
  es: ['años construyendo para la web', 'piezas desplegables en Synergos', 'decisiones de arquitectura escritas', 'tests automatizados'],
  en: ['years building for the web', 'deployable pieces in Synergos', 'architecture decisions on record', 'automated tests'],
} as const

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function open(page: Page, lang: Lang, hash = '') {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/aboutMe${hash}`)
}

const lobe = (page: Page, id: string) => page.locator(`[data-cw-lobe="${id}"]`)

test.describe('"Quién soy": CV y cifras (T430, T431)', () => {
  onlyIn('desktop-chromium', 'no-js')

  for (const lang of LANGS) {
    test(`${lang}: "Descargar CV" baja el PDF de la página, con el otro idioma al lado y sin LinkedIn (A2)`, async ({ page }) => {
      await open(page, lang)
      const who = page.locator('#scene-who')
      const cv = who.getByRole('link', { name: CV[lang].name, exact: true })
      await expect(cv).toHaveCount(1)
      await expect(cv).toHaveAttribute('href', `/cv/camilo-hernandez-cv-${lang}.pdf`)
      await expect(cv).toContainText(CV[lang].text)
      await expect(cv).toBeVisible()
      await expect(who.locator('[data-cw-cv-alternate]')).toBeVisible()
      await expect(who.locator('[data-cw-cv-link]')).toHaveCount(0)
    })

    test(`${lang}: cuatro cifras con su valor final formateado según el idioma`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await open(page, lang)
      const items = page.locator('[data-cw-about="figures"] [data-cw-figure]')
      await expect(items).toHaveCount(4)
      await expect(items.locator('dt')).toContainText([...FIGURE_LABELS[lang]])
      for (const figure of figures) {
        const item = page.locator(`[data-cw-figure="${figure.id}"]`)
        await expect(item.locator('[data-cw-figure-value]')).toHaveText(figureDigits(figure.value, lang))
        await expect(item.locator('dd .cw-visually-hidden')).toHaveText(figureText(figure, lang))
      }
      await expect(page.locator('[data-cw-figure="tests"] dd .cw-visually-hidden')).toHaveText(lang === 'es' ? '6.600+' : '6,600+')
      for (const gone of ['projects', 'technologies', 'airlines']) await expect(page.locator(`[data-cw-figure="${gone}"]`)).toHaveCount(0)
      await expect(page.locator('[data-cw-figure="pieces"] dt')).toContainText(lang === 'es' ? 'CMS · 20 capacidades · 9 orquestadores' : 'CMS · 20 capabilities · 9 orchestrators')
    })
  }
})

test.describe('principios, "aplicado en" y "en palabras" con JS (T432, T433, T435)', () => {
  onlyIn('desktop-chromium')

  test('los chips de principios solo aparecen bajo Arquitectura, sin porcentaje', async ({ page }) => {
    await open(page, 'es')
    const body = page.locator('[data-cw-terminal-body]')
    await expect(body.locator('[data-cw-principles]')).toHaveCount(0)
    await lobe(page, 'architecture').click()
    const chips = body.getByRole('list', { name: 'Principios' }).getByRole('listitem')
    await expect(chips).toHaveText(about.principles!.map((principle) => principle.short.es))
    await expect(body.locator('[data-cw-principles]')).not.toContainText('%')
    await lobe(page, 'backend-cloud').click()
    await expect(body.locator('[data-cw-principles]')).toHaveCount(0)
  })

  test('cada lóbulo dice dónde se aplicó, separado de dónde se aprendió', async ({ page }) => {
    await open(page, 'en')
    const body = page.locator('[data-cw-terminal-body]')
    for (const item of data.en.lobes) {
      await lobe(page, item.id).click()
      const applied = body.locator('[data-cw-meta="applied"]')
      await expect(applied).toContainText('applied at:')
      for (const id of item.applied) await expect(applied).toContainText(data.en.sources.find((source) => source.id === id)!.label)
      if (item.learned.length > 0) await expect(body.locator('[data-cw-meta="sources"]')).toBeVisible()
      else await expect(body.locator('[data-cw-meta="sources"]')).toHaveCount(0)
      await expect(body.locator('[data-cw-meta="projects"] a')).toHaveCount(item.projects.length)
    }
  })

  for (const lang of LANGS) {
    test(`${lang}: "en palabras" muestra solo el párrafo del lóbulo activo y desaparece sin párrafo`, async ({ page }) => {
      await open(page, lang)
      const words = page.locator('[data-cw-words]')
      await expect(words).toHaveCount(1)
      await words.getByText(CV[lang].words).click()
      for (const item of data[lang].lobes) {
        await lobe(page, item.id).click()
        if (!item.words) {
          await expect(words).toBeHidden()
          continue
        }
        await expect(words).toBeVisible()
        await expect(words.locator('[data-cw-words-lobe]:visible')).toHaveCount(1)
        await expect(words.locator(`[data-cw-words-lobe="${item.id}"]`)).toBeVisible()
        await expect(words.locator(`[data-cw-words-lobe="${item.id}"] p`)).toHaveText(item.words)
      }
      await page.locator('[data-cw-source="unad"]').click()
      await expect(words).toBeHidden()
      await expect(words).not.toContainText(about.skills.description[lang])
      for (const bullet of about.skills.bullets) await expect(words).not.toContainText(bullet[lang])
    })
  }
})

test.describe('sin JavaScript (T432, T433)', () => {
  onlyIn('no-js')

  test('los cinco párrafos se leen, los principios van con Arquitectura y nada del texto de 2023', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const words = page.locator('[data-cw-words]')
    await words.getByText(CV.es.words).click()
    const paragraphs = words.locator('[data-cw-words-lobe]')
    await expect(paragraphs).toHaveCount(5)
    for (const item of data.es.lobes.filter((entry) => entry.words)) {
      await expect(words.locator(`[data-cw-words-lobe="${item.id}"]`)).toBeVisible()
      await expect(words.locator(`[data-cw-words-lobe="${item.id}"] p`)).toHaveText(item.words!)
    }
    await expect(words.locator('[data-cw-words-lobe="practices"]')).toHaveCount(0)
    await expect(words).not.toContainText(about.skills.description.es)
    const architecture = page.locator('[data-cw-lobe-list="architecture"]')
    await expect(architecture.getByRole('list', { name: 'Principios' }).getByRole('listitem')).toHaveText(about.principles!.map((principle) => principle.short.es))
    await expect(page.locator('[data-cw-brain-fallback] [data-cw-principles]')).toHaveCount(1)
    for (const item of data.es.lobes) await expect(page.locator(`[data-cw-lobe-list="${item.id}"] [data-cw-meta="applied"]`)).toBeVisible()
  })

  test('el ancla #lobe-<id> lleva a la lista del lóbulo, debajo del índice de escenas', async ({ page }) => {
    await page.goto('/es/aboutMe#lobe-practices')
    const heading = page.locator('#lobe-practices')
    await expect(heading).toHaveText('Prácticas de ingeniería')
    const navBottom = await page.locator('[data-cw-scene-nav] ol').evaluate((node) => node.getBoundingClientRect().bottom)
    const height = page.viewportSize()!.height
    await expect(async () => {
      const box = await heading.evaluate((node) => node.getBoundingClientRect().toJSON() as { top: number; bottom: number })
      expect(box.top).toBeGreaterThanOrEqual(Math.floor(navBottom) - 1)
      expect(box.bottom).toBeLessThanOrEqual(height)
    }).toPass({ timeout: 10_000 })
  })
})

test.describe('ancla de lóbulo con JS (T437, contrato con P6)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('al cargar con #lobe-<id>, el mapa activa ese lóbulo y queda a la vista', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'es', '#lobe-applied-ai')
    await expect(lobe(page, 'applied-ai')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cw-terminal-body]')).toHaveAttribute('data-cw-terminal-body', 'applied-ai')
    await expect(page.locator('[data-cw-brain-map]')).toBeInViewport()
  })

  test('cambiar el ancla en la misma página, también con router.push, cambia el lóbulo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'en')
    await expect(async () => {
      await lobe(page, 'practices').click()
      await expect(lobe(page, 'practices')).toHaveAttribute('aria-pressed', 'true', { timeout: 500 })
    }).toPass()
    await page.evaluate(() => {
      window.location.hash = 'lobe-business'
    })
    await expect(lobe(page, 'business')).toHaveAttribute('aria-pressed', 'true')
    await page.evaluate(() => (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push('/en/aboutMe#lobe-architecture'))
    await expect(lobe(page, 'architecture')).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/#lobe-architecture$/)
  })

  test('llegar desde otra página con router.push activa el lóbulo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'es')
    await page.goto('/es/services')
    await page.waitForFunction(() => typeof (window as unknown as { next?: { router?: unknown } }).next?.router === 'object')
    await page.evaluate(() => (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push('/es/aboutMe#lobe-backend-cloud'))
    await expect(page).toHaveURL(/\/es\/aboutMe#lobe-backend-cloud$/)
    await expect(lobe(page, 'backend-cloud')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cw-brain-map]')).toBeInViewport()
  })

  test('un ancla que no es de lóbulo no cambia nada', async ({ page }) => {
    await open(page, 'es', '#lobe-craft')
    await expect(lobe(page, 'frontend')).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('presupuestos y accesibilidad', () => {
  onlyIn('desktop-chromium')

  test('a 1440 px la página sigue dentro del 60 % de la altura de antes de las escenas (002)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const lang of LANGS) {
      await open(page, lang)
      await page.waitForLoadState('load')
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      test.info().annotations.push({ type: `altura ${lang}`, description: `${height}px (tope ${HEIGHT_BUDGET_1440}px)` })
      expect(height, lang).toBeLessThanOrEqual(HEIGHT_BUDGET_1440)
    }
  })

  test('sin violaciones de axe en "Quién soy" y "Lo que sé", con el terminal usado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'es')
    await lobe(page, 'architecture').click()
    const input = page.getByRole('textbox', { name: 'Escribe un comando' })
    for (const command of ['help', 'ls projects/', 'cat lemas.md']) {
      await input.fill(command)
      await input.press('Enter')
    }
    await page.locator('[data-cw-words] summary').click()
    const results = await new AxeBuilder({ page })
      .include('#scene-who')
      .include('#scene-knowledge')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)).toEqual([])
  })
})

test.describe('imagen OG de Sobre mí (T438, FR-471)', () => {
  onlyIn('desktop-chromium')

  for (const [lang, alt] of [
    ['es', 'Sobre mí: Software Solutions Engineer · AI-First'],
    ['en', 'About me: Software Solutions Engineer · AI-First'],
  ] as const) {
    test(`${lang}: la página publica su PNG de 1200 × 630 con texto alternativo`, async ({ page, request }) => {
      await page.goto(`/${lang}/aboutMe`)
      const image = page.locator('meta[property="og:image"]')
      await expect(image).toHaveCount(1)
      const url = new URL((await image.getAttribute('content'))!)
      expect(url.pathname).toBe(`/${lang}/aboutMe/opengraph-image/og`)
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', alt)
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200')
      const response = await request.get(`${url.pathname}${url.search}`)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
      const png = await response.body()
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
    })
  }
})
