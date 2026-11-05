import { expect, test, type Page } from '@playwright/test'
import { nowRoles } from '@/components/site/home/now'
import homeEn from '@/content/i18n/en/home.json'
import homeEs from '@/content/i18n/es/home.json'
import { getProjects, getSite } from '@/lib/content'

const site = getSite()
const projects = getProjects()
const HOME = { es: homeEs, en: homeEn } as const
const LANGS = ['es', 'en'] as const
const WIDTHS = Array.from({ length: (2560 - 320) / 40 + 1 }, (_, index) => 320 + index * 40)
const ENTER = '[style*="--cw-home-step"]'

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

async function enterState(page: Page) {
  return page.evaluate((selector) => {
    const elements = [...document.querySelectorAll(selector)]
    return {
      count: elements.length,
      minOpacity: Math.min(...elements.map((element) => Number.parseFloat(getComputedStyle(element).opacity))),
      running: elements.reduce((total, element) => total + element.getAnimations().filter((a) => a.playState === 'running').length, 0),
    }
  }, ENTER)
}

test.describe('home sin JavaScript', () => {
  onlyIn('no-js')

  for (const lang of LANGS) {
    test(`/${lang}: banner, "Ahora trabajo en" y enlaces visibles de inmediato`, async ({ page }) => {
      await page.goto(`/${lang}`)
      await expect(page.locator('html')).not.toHaveAttribute('data-js', /.*/)
      const banner = page.locator('[data-cw-home-banner]')
      await expect(banner.getByRole('heading', { level: 1 })).toHaveText(site.home.title[lang])
      await expect(banner.getByText(`${site.home.greeting[lang]} ${site.home.name}`)).toBeVisible()
      await expect(banner.getByRole('navigation').getByRole('link')).toHaveCount(3)

      const now = page.locator('[data-cw-home-now]')
      await expect(now.getByRole('heading', { level: 2 })).toHaveText(HOME[lang]['now.title'])
      const roles = nowRoles(site.about.career, projects, lang)
      await expect(now.getByRole('heading', { level: 3 })).toHaveText(roles.map((role) => role.company))
      for (const role of roles) {
        const item = now.locator(`[data-cw-home-role="${role.id}"]`)
        await expect(item.getByText(role.role, { exact: true })).toBeVisible()
        await expect(item.locator('time')).toHaveAttribute('datetime', role.start)
      }
      await expect(now.locator('[data-cw-home-link="about"]')).toHaveAttribute('href', `/${lang}/aboutMe`)
      await expect(now.locator('[data-cw-home-link="case"]')).toHaveAttribute('href', `/${lang}/portfolio/12`)
      await expect(page.locator('[data-cw-home-cue]')).toHaveAttribute('href', '#home-now')

      const state = await enterState(page)
      expect(state.count).toBeGreaterThan(4)
      expect(state.minOpacity).toBe(1)
      expect(state.running).toBe(0)
    })
  }
})

test.describe('entrada escalonada', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('se revela en orden, dura poco más de un segundo y termina visible', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es', { waitUntil: 'domcontentloaded' })
    const timing = await page.evaluate((selector) =>
      [...document.querySelectorAll(selector)].map((element) => {
        const style = getComputedStyle(element)
        return { delay: Number.parseFloat(style.animationDelay) * 1000, duration: Number.parseFloat(style.animationDuration) * 1000 }
      }),
    ENTER)
    const delays = timing.map((item) => item.delay)
    expect(delays.length).toBeGreaterThan(4)
    expect([...delays].sort((a, b) => a - b)).toEqual(delays)
    expect(Math.max(...timing.map((item) => item.delay + item.duration))).toBeLessThanOrEqual(1200)
    await expect.poll(() => enterState(page), { timeout: 5000 }).toMatchObject({ minOpacity: 1, running: 0 })
  })

  test('"Ahora trabajo en" se revela una sola vez al entrar en pantalla', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es')
    const roles = page.locator('[data-cw-home-role]')
    await expect(roles.first()).toHaveAttribute('data-cw-reveal', 'pending')
    await page.locator('[data-cw-home-now]').scrollIntoViewIfNeeded()
    for (const role of await roles.all()) await expect(role).toHaveAttribute('data-cw-reveal', 'in')
    await expect.poll(() => roles.last().evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(roles.first()).toHaveAttribute('data-cw-reveal', 'in')
  })

  test('con movimiento reducido se ve completo de inmediato', async ({ page }) => {
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es', { waitUntil: 'domcontentloaded' })
    const state = await enterState(page)
    expect(state.minOpacity).toBe(1)
    expect(state.running).toBe(0)
    const electrons = await page.evaluate(() =>
      [...document.querySelectorAll('[data-cw-home-orbit] span span')].flatMap((element) => element.getAnimations()).length,
    )
    expect(electrons).toBe(0)
  })

  test('espera a que termine la intro', async ({ page }) => {
    await page.clock.install()
    await page.goto('/es', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'pending')
    expect((await enterState(page)).minOpacity).toBe(0)
    await page.clock.runFor(1600)
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen')
    await expect.poll(() => enterState(page), { timeout: 2500 }).toMatchObject({ minOpacity: 1 })
  })

  test('el home pide el fondo a intensidad completa', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es')
    await expect(page.locator('[data-cw-background]')).toHaveAttribute('data-bg-intensity', 'full')
  })
})

test.describe('controles del home', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('la señal del hero baja hasta "Ahora trabajo en"', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es')
    const cue = page.locator('[data-cw-home-cue]')
    await expect(cue).toHaveAccessibleName(homeEs['hero.cue'])
    await expect.poll(() => enterState(page)).toMatchObject({ running: 0 })
    await cue.click()
    await expect(page).toHaveURL(/\/es#home-now$/)
    const section = page.locator('#home-now')
    await expect
      .poll(() => section.evaluate((element) => Math.round(element.getBoundingClientRect().top)), { timeout: 5000 })
      .toBeLessThan(140)
    expect(await section.evaluate((element) => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0)
    await expect(page.locator('#home-now-title')).toBeInViewport()
  })

  for (const lang of LANGS) {
    test(`/${lang}: "${HOME[lang]['now.more']}" abre Sobre mí sin recargar`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}`)
      await page.evaluate(() => {
        ;(window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument = true
      })
      const link = page.locator('[data-cw-home-link="about"]')
      await expect(link).toHaveAccessibleName(HOME[lang]['now.more'])
      await link.click()
      await page.waitForURL(`**/${lang}/aboutMe`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(lang === 'es' ? 'Sobre mí' : 'About me')
      expect(await page.evaluate(() => (window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument)).toBe(true)
    })
  }

  test('el caso de estudio de Synergos abre su página', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es')
    const link = page.locator('[data-cw-home-link="case"]')
    await expect(link).toHaveAccessibleName(`${homeEs['now.caseStudy']}: Synergos`)
    await link.click()
    await page.waitForURL('**/es/portfolio/12')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Synergos')
  })
})

type Finding = { width: number; detail: string }

test.describe('responsive del home (320 a 2560 px, cada 40 px)', () => {
  onlyIn('desktop-chromium')

  for (const lang of LANGS) {
    test(`/${lang} sin desbordes, título partido por palabras (≤ 2 líneas desde 768 px), saludo en una línea y objetivos ≥ 24 px`, async ({ page }) => {
      test.setTimeout(180_000)
      await skipIntro(page)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`/${lang}`, { waitUntil: 'networkidle' })
      const findings: Finding[] = []
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        await page.waitForTimeout(60)
        const found = await page.evaluate(() => {
          const issues: string[] = []
          const lines = (element: Element) => {
            const range = document.createRange()
            range.selectNodeContents(element)
            const rects = [...range.getClientRects()].filter((rect) => rect.width > 0)
            const tops: number[] = []
            for (const rect of rects) if (!tops.some((top) => Math.abs(top - rect.top) < rect.height / 2)) tops.push(rect.top)
            return tops.length
          }
          const inside = (element: Element, label: string) => {
            const rect = element.getBoundingClientRect()
            if (rect.left < -0.5 || rect.right > window.innerWidth + 0.5) issues.push(`${label} se sale (${Math.round(rect.left)}..${Math.round(rect.right)})`)
          }
          const fits = (element: Element, label: string) => {
            if (element.scrollWidth > element.clientWidth + 1) issues.push(`${label} desborda (${element.scrollWidth} > ${element.clientWidth})`)
          }
          if (document.documentElement.scrollWidth > window.innerWidth + 1) issues.push(`scroll horizontal ${document.documentElement.scrollWidth}`)

          const banner = document.querySelector('[data-cw-home-banner]')
          const card = banner?.querySelector('[data-cw-glass]')
          const title = banner?.querySelector('h1')
          const greeting = banner?.querySelector('p')
          if (!banner || !card || !title || !greeting) return ['falta el banner']
          inside(card, 'tarjeta')
          fits(title, 'h1')
          const maxLines = window.innerWidth >= 768 ? 2 : 4
          if (lines(title) > maxLines) issues.push(`h1 en ${lines(title)} líneas`)
          for (const word of title.querySelectorAll('[data-cw-wink-word]')) if (lines(word) !== 1) issues.push(`palabra partida: ${word.textContent}`)
          if (lines(greeting) !== 1) issues.push(`saludo en ${lines(greeting)} líneas`)
          const header = document.querySelector('#header')?.getBoundingClientRect()
          if (header && card.getBoundingClientRect().top < header.bottom) issues.push('la tarjeta queda bajo el header')

          const now = document.querySelector('[data-cw-home-now]')
          const panel = now?.querySelector('[data-cw-glass]')
          if (!now || !panel) return [...issues, 'falta "Ahora trabajo en"']
          inside(panel, 'panel')
          for (const element of now.querySelectorAll('h2, h3, p, a')) {
            inside(element, element.tagName.toLowerCase())
            fits(element, `${element.tagName.toLowerCase()} "${(element.textContent ?? '').trim().slice(0, 24)}"`)
          }
          for (const element of document.querySelectorAll('main a[href], main button')) {
            const rect = element.getBoundingClientRect()
            if (rect.width > 0 && (rect.width < 24 || rect.height < 24)) issues.push(`objetivo ${Math.round(rect.width)}x${Math.round(rect.height)}`)
          }
          return issues
        })
        findings.push(...found.map((detail) => ({ width, detail })))
      }
      expect(findings, findings.map((finding) => `${finding.width}px: ${finding.detail}`).join('\n')).toEqual([])
    })
  }
})

test.describe('capturas de revisión', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const theme of ['dark', 'light'] as const) {
    test(`home en tema ${theme}`, async ({ page }, testInfo) => {
      await skipIntro(page)
      await page.emulateMedia({ colorScheme: theme })
      await page.goto('/es', { waitUntil: 'networkidle' })
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect.poll(() => enterState(page), { timeout: 5000 }).toMatchObject({ minOpacity: 1, running: 0 })
      const hero = `r1-hero-${testInfo.project.name}-${theme}.png`
      await testInfo.attach(hero, { body: await page.screenshot({ path: testInfo.outputPath(hero) }), contentType: 'image/png' })

      await page.locator('[data-cw-home-now]').scrollIntoViewIfNeeded()
      for (const role of await page.locator('[data-cw-home-role]').all()) await expect(role).toHaveAttribute('data-cw-reveal', /in|shown/)
      await page.waitForTimeout(900)
      const now = `r1-now-${testInfo.project.name}-${theme}.png`
      await testInfo.attach(now, { body: await page.screenshot({ path: testInfo.outputPath(now) }), contentType: 'image/png' })

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      const full = `r1-home-${testInfo.project.name}-${theme}.png`
      await testInfo.attach(full, { body: await page.screenshot({ fullPage: true, path: testInfo.outputPath(full) }), contentType: 'image/png' })
    })
  }
})
