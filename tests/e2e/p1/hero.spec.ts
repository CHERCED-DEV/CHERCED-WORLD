import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { WINK_MAX_MS, WINK_SEEN_KEY } from '@/components/site/home/wink'
import siteEn from '@/content/i18n/en/site.json'
import siteEs from '@/content/i18n/es/site.json'
import { getSite } from '@/lib/content'

const site = getSite()
const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]
const LABEL = { es: siteEs['home.previousTitleLabel'], en: siteEn['home.previousTitleLabel'] } as const
const CV = {
  es: 'Descargar CV en español (PDF, 175 kB)',
  en: 'Download CV in English (PDF, 173 kB)',
} as const
const CHIP = {
  es: 'Armenia, Colombia · UTC−5 · Abierto a reubicación',
  en: 'Armenia, Colombia · UTC−5 · Open to relocation',
} as const
const WORDS = '[data-cw-home-banner] [data-cw-wink-word]'
const STRIKE = '[data-cw-home-banner] [data-cw-wink-strike]'

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

function wink(page: Page) {
  return page.locator('html').getAttribute('data-cw-wink')
}

async function winkAnimations(page: Page) {
  return page.evaluate(
    ({ words, strike }) =>
      [...document.querySelectorAll(`${words}, ${strike}`)].flatMap((element) =>
        element.getAnimations().map((animation) => ({
          state: animation.playState,
          end: Number(animation.effect?.getComputedTiming().endTime ?? 0),
        })),
      ),
    { words: WORDS, strike: STRIKE },
  )
}

async function finalState(page: Page) {
  return page.evaluate(
    ({ words, strike }) => {
      const line = document.querySelector<HTMLElement>(strike)
      const text = line?.parentElement
      return {
        masked: [...document.querySelectorAll(words)].filter((word) => getComputedStyle(word).maskImage !== 'none').length,
        strike: line && text ? Math.round((line.getBoundingClientRect().width / text.getBoundingClientRect().width) * 100) : 0,
        animations: [...document.querySelectorAll(`${words}, ${strike}`)].reduce((total, element) => total + element.getAnimations().length, 0),
      }
    },
    { words: WORDS, strike: STRIKE },
  )
}

async function expectBanner(page: Page, lang: Lang) {
  const banner = page.locator('[data-cw-home-banner]')
  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toHaveAccessibleName(site.home.title[lang])
  await expect(h1).toHaveText(site.home.title[lang])
  const previous = banner.locator('[data-cw-home-previous]')
  await expect(previous).toHaveText(`${LABEL[lang]} ${site.home.previousTitle![lang]}`)
  await expect(previous.locator('s')).toBeVisible()
  await expect(previous.locator('.cw-visually-hidden')).toHaveText(LABEL[lang])
  await expect(banner.locator('[data-cw-home-subtitle]')).toHaveText(site.home.subtitle![lang].replaceAll(' · ', ' · '))
  const cv = banner.getByRole('link', { name: CV[lang], exact: true })
  await expect(cv).toBeVisible()
  await expect(cv).toHaveAttribute('href', `/cv/camilo-hernandez-cv-${lang}.pdf`)
  const actions = banner.locator('[data-cw-cv-actions]').first()
  await expect(actions.locator('[data-cw-cv-alternate]')).toBeVisible()
  await expect(actions.locator('[data-cw-cv-link]'), 'A1: LinkedIn queda como ícono, no como botón').toHaveCount(0)
  await expect(banner.locator('[data-cw-availability]')).toContainText(CHIP[lang])
}

test.describe('hero sin JavaScript (FR-401, FR-402)', () => {
  onlyIn('no-js')

  for (const lang of LANGS) {
    test(`/${lang}: estado final en el HTML del servidor`, async ({ page }) => {
      await page.goto(`/${lang}`)
      await expect(page.locator('html')).not.toHaveAttribute('data-js', /.*/)
      await expectBanner(page, lang)
      expect(await wink(page)).toBeNull()
      expect(await finalState(page)).toEqual({ masked: 0, strike: 100, animations: 0 })
      const mail = page.locator('[data-cw-home-banner] nav').getByRole('link').first()
      await expect(mail).toHaveAttribute('href', /^mailto:/)
      await expect(page.locator('[data-cw-home-banner] [data-cw-email-trigger]')).toBeHidden()
    })
  }
})

test.describe('guiño del hero (FR-460, US7)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    test(`/${lang}: tacha y escribe en 2 s o menos, y termina en el estado final`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}`, { waitUntil: 'domcontentloaded' })
      expect(await wink(page)).toBe('play')
      await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(site.home.title[lang])
      const expected = site.home.title[lang].split(' ').length + 1
      await expect.poll(async () => (await winkAnimations(page)).length).toBe(expected)
      const animations = await winkAnimations(page)
      expect(Math.max(...animations.map((animation) => animation.end))).toBeLessThanOrEqual(WINK_MAX_MS)
      expect(await page.evaluate((key) => sessionStorage.getItem(key), WINK_SEEN_KEY)).toBe('1')
      await expect.poll(() => wink(page), { timeout: 5000 }).toBe('done')
      expect(await finalState(page)).toEqual({ masked: 0, strike: 100, animations: 0 })
      await expectBanner(page, lang)
    })
  }

  test('una vez por sesión: ni al recargar ni al volver por navegación', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es')
    await expect.poll(() => wink(page), { timeout: 5000 }).toBe('done')

    await page.reload({ waitUntil: 'domcontentloaded' })
    expect(await wink(page)).toBe('done')
    expect((await finalState(page)).animations).toBe(0)

    await page.evaluate(() => {
      ;(window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument = true
    })
    await page.locator('[data-cw-home-link="about"]').click()
    await page.waitForURL('**/es/aboutMe')
    await page.goBack()
    await page.waitForURL(/\/es$/)
    await expect(page.locator('[data-cw-home-banner]')).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument)).toBe(true)
    expect(await wink(page)).toBe('done')
    expect((await finalState(page)).animations).toBe(0)
  })

  test('si el home llega por navegación, el guiño corre esa primera vez', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/privacy')
    expect(await wink(page)).toBeNull()
    await page.evaluate(() => {
      ;(window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument = true
    })
    await page.locator('#header a[href="/es"]').first().click()
    await page.waitForURL(/\/es$/)
    await expect(page.locator('[data-cw-home-banner]')).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument)).toBe(true)
    await expect.poll(() => wink(page)).toMatch(/play|done/)
    await expect.poll(() => wink(page), { timeout: 5000 }).toBe('done')
    expect(await page.evaluate((key) => sessionStorage.getItem(key), WINK_SEEN_KEY)).toBe('1')
  })

  test('con movimiento reducido se ve el estado final sin animar ni gastar el guiño', async ({ page }) => {
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es', { waitUntil: 'domcontentloaded' })
    expect(await wink(page)).toBeNull()
    expect(await finalState(page)).toEqual({ masked: 0, strike: 100, animations: 0 })
    expect(await page.evaluate((key) => sessionStorage.getItem(key), WINK_SEEN_KEY)).toBeNull()
    await expectBanner(page, 'es')
  })

  test('espera a que termine la intro', async ({ page }) => {
    const start = Date.now()
    await page.clock.install({ time: start })
    await page.clock.pauseAt(start + 1000)
    await page.goto('/es', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'pending')
    expect(await wink(page)).toBe('play')
    expect(await winkAnimations(page)).toEqual([])
    expect((await finalState(page)).masked).toBeGreaterThan(0)
    await page.clock.runFor(1600)
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen')
    await expect.poll(async () => (await winkAnimations(page)).length).toBeGreaterThan(0)
  })

  test('no mueve el layout: el título y lo que sigue quedan en su sitio', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    expect(await wink(page)).toBe('play')
    const boxes = () =>
      page.evaluate(() =>
        ['h1', '[data-cw-home-subtitle]', '[data-cw-cv-download]', '[data-cw-availability]'].map((selector) => {
          const element = document.querySelector(`[data-cw-home-banner] ${selector}`) as HTMLElement
          return { top: element.offsetTop, height: element.offsetHeight, width: element.offsetWidth }
        }),
      )
    const during = await boxes()
    await expect.poll(() => wink(page), { timeout: 5000 }).toBe('done')
    expect(await boxes()).toEqual(during)
  })
})

type Vitals = { lcp: number; cls: number }

test.describe('presupuestos del home con el guiño (SC-406)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('LCP ≤ 2,5 s y CLS ≤ 0,1 en la primera visita de la sesión', async ({ page }, testInfo) => {
    await skipIntro(page)
    if (testInfo.project.name === 'mobile-chromium') {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      })
    }
    await page.addInitScript((key) => {
      try {
        sessionStorage.removeItem(key)
      } catch {}
      const store = { lcp: 0, cls: 0 }
      ;(window as unknown as { __cwVitals: typeof store }).__cwVitals = store
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) store.lcp = entry.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
          if (!entry.hadRecentInput) store.cls += entry.value
        }
      }).observe({ type: 'layout-shift', buffered: true })
    }, WINK_SEEN_KEY)
    const measure = async (): Promise<Vitals> => {
      await page.goto('/es', { waitUntil: 'load' })
      await expect.poll(() => wink(page), { timeout: 8000 }).toBe('done')
      await page.waitForTimeout(300)
      return page.evaluate(() => (window as unknown as { __cwVitals: Vitals }).__cwVitals)
    }
    let vitals = await measure()
    if (vitals.lcp > 2500) {
      const retry = await measure()
      vitals = { lcp: Math.min(vitals.lcp, retry.lcp), cls: Math.max(vitals.cls, retry.cls) }
    }
    testInfo.annotations.push({ type: 'vitals', description: `/es LCP=${Math.round(vitals.lcp)}ms CLS=${vitals.cls.toFixed(3)}` })
    expect(vitals.lcp, 'LCP').toBeGreaterThan(0)
    expect(vitals.lcp, 'LCP').toBeLessThanOrEqual(2500)
    expect(vitals.cls, 'CLS').toBeLessThanOrEqual(0.1)
  })
})

test.describe('correo y accesibilidad del banner (FR-464)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('el ícono de correo abre el menú con escribir y copiar', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es')
    const banner = page.locator('[data-cw-home-banner]')
    await expect(banner.locator('[data-cw-email-fallback]')).toBeHidden()
    const trigger = banner.locator('[data-cw-email-trigger]')
    await expect(trigger).toHaveAccessibleName('Opciones de correo')
    await trigger.click()
    const menu = banner.getByRole('menu')
    await expect(menu.getByRole('menuitem')).toHaveText(['Escribirme un correo', 'Copiar correo'])
    await expect(menu.locator('[data-cw-email-write]')).toHaveAttribute('href', /^mailto:/)
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  for (const lang of LANGS) {
    for (const scheme of ['dark', 'light'] as const) {
      test(`/${lang} en tema ${scheme}: sin violaciones críticas ni serias`, async ({ page }) => {
        await skipIntro(page)
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.goto(`/${lang}`)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const results = await new AxeBuilder({ page })
          .include('[data-cw-home-banner]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }
})

test.describe('imagen OG del home (FR-471)', () => {
  onlyIn('desktop-chromium')

  for (const lang of LANGS) {
    test(`/${lang}: publica su PNG con el título de hoy, no el logo`, async ({ page, request }) => {
      await page.goto(`/${lang}`)
      const image = page.locator('meta[property="og:image"]')
      await expect(image).toHaveCount(1)
      const url = new URL((await image.getAttribute('content'))!)
      expect(url.pathname).toBe(`/${lang}/opengraph-image/og`)
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', `Camilo Hernández: ${site.home.title[lang]}`)
      const response = await request.get(`${url.pathname}${url.search}`)
      expect(response.status()).toBe(200)
      const png = await response.body()
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
    })
  }
})
