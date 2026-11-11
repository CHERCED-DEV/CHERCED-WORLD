import { expect, test, type Page } from '@playwright/test'
import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import { now } from '@/content/now'

const COMMON = { es: commonEs, en: commonEn } as const

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

async function compounds(page: Page, selector: string) {
  return page.evaluate((selector) => {
    const kept: string[] = []
    const loose: string[] = []
    for (const root of document.querySelectorAll(selector)) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement
        const whole = parent !== null && getComputedStyle(parent).whiteSpace === 'nowrap'
        for (const [word] of (node.textContent ?? '').matchAll(/[^\s ·]+-[^\s ·]+/gu)) {
          if (whole && parent.getClientRects().length === 1) kept.push(word)
          else loose.push(word)
        }
      }
    }
    return { kept, loose }
  }, selector)
}

test.describe('U13: en el celular, las verticales de /synergos no esperan turno', () => {
  test('celular: ninguna tarjeta lleva retraso', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'solo en mobile-chromium')
    await skipIntro(page)
    await page.goto('/es/synergos')
    const delays = await page.locator('[data-cw-vertical]').evaluateAll((cards) => cards.map((card) => getComputedStyle(card).transitionDelay))
    expect(delays.length).toBeGreaterThan(1)
    for (const delay of delays) expect(delay).toMatch(/^0s(, 0s)*$/)
  })

  test('escritorio: la cuadrícula conserva el escalonado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'solo en desktop-chromium')
    await skipIntro(page)
    await page.goto('/es/synergos')
    const delays = await page.locator('[data-cw-vertical]').evaluateAll((cards) => cards.map((card) => getComputedStyle(card).transitionDelay))
    expect(delays.slice(1).every((delay) => /[1-9]/.test(delay))).toBe(true)
  })
})

test.describe('U15: los compuestos en inglés no se parten en el guion', () => {
  onlyIn('mobile-chromium')

  for (const width of [375, 390, 768]) {
    test(`${width} px: "TAILOR-MADE" del H1 de /en/services, títulos del blog y /en/now`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await skipIntro(page)
      for (const [path, selector, words] of [
        ['/en/services', '#services-title', ['TAILOR-MADE']],
        ['/en/blog', '[data-cw-post-card] h2', ['Spec-Driven', 'Full-Stack']],
        ['/en/now', '[data-cw-now-block] p', ['snow-capped']],
      ] as const) {
        await page.goto(path)
        const { kept, loose } = await compounds(page, selector)
        expect(loose, `${path}: compuestos que pueden partirse`).toEqual([])
        for (const word of words) expect(kept, `${path}: ${word}`).toContain(word)
      }
    })
  }
})

test.describe('U16: la barra de "18/" se lee en tema claro', () => {
  onlyIn('desktop-chromium')

  for (const [scheme, color] of [
    ['light', 'rgb(11, 110, 71)'],
    ['dark', 'rgb(37, 237, 158)'],
  ] as const) {
    test(`tema ${scheme}: color de acento legible y fuera del lector de pantalla`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await skipIntro(page)
      await page.goto('/es/synergos/arquitectura')
      const slash = page.locator('#main strong > span[aria-hidden="true"]', { hasText: '/' })
      await expect(slash).toHaveCount(1)
      await expect(slash).toHaveCSS('color', color)
    })
  }
})

test.describe('U17: el 404 de un post o de un caso ofrece su sección', () => {
  onlyIn('desktop-chromium', 'no-js')

  for (const [route, lang, section] of [
    ['/es/blog/no-existe', 'es', 'blog'],
    ['/en/blog/no-existe', 'en', 'blog'],
    ['/es/blog/tag/no-existe-esta-etiqueta', 'es', 'blog'],
    ['/es/portfolio/99', 'es', 'portfolio'],
    ['/en/portfolio/99', 'en', 'portfolio'],
  ] as const) {
    test(`${route}: "Volver al inicio" sigue primero y debajo va a /${lang}/${section}`, async ({ page }) => {
      await skipIntro(page)
      const response = await page.goto(route)
      expect(response?.status()).toBe(404)
      const view = page.locator('[data-cw-not-found]')
      const links = view.getByRole('link')
      await expect(links).toHaveCount(2)
      await expect(links.first()).toHaveText(COMMON[lang]['notFound.cta'])
      await expect(links.first()).toHaveAttribute('href', `/${lang}`)
      const exit = view.locator('[data-cw-not-found-exit]')
      await expect(exit).toHaveText(COMMON[lang][`notFound.${section}`])
      await expect(exit).toHaveAttribute('href', `/${lang}/${section}`)
    })
  }

  test('una ruta que no es post ni caso no agrega salida, aunque el cliente la pida', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-cw-missing': 'blog' })
    const response = await page.goto('/es/no-existe')
    expect(response?.status()).toBe(404)
    await expect(page.locator('[data-cw-not-found]').getByRole('link')).toHaveCount(1)
    await expect(page.locator('[data-cw-not-found-exit]')).toHaveCount(0)
  })
})

test.describe('U18: /now enlaza lo que menciona', () => {
  onlyIn('desktop-chromium', 'no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`/${lang}/now: Synergos y el AI Lab llevan a su página`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}/now`)
      const links = page.locator('[data-cw-now-link]')
      const leads = now.building.filter((entry) => entry.href).map((entry) => entry[lang].slice(0, entry[lang].indexOf(':')))
      await expect(links).toHaveText(leads)
      await expect(links.nth(0)).toHaveAttribute('href', `/${lang}/synergos`)
      await expect(links.nth(1)).toHaveAttribute('href', `/${lang}/ai-lab`)
    })
  }
})
