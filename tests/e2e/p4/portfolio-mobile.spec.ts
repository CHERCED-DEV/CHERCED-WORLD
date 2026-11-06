import { expect, test, type Locator, type Page } from '@playwright/test'
import { getProject, getProjects, projectTitle } from '@/lib/content'
import { blurredSurfaces, MOBILE_WIDTHS } from '../m0/support'
import { hostOf, onlyIn, skipIntro, stubExternalSites } from '../r2/support'

const projects = getProjects()
const live = projects.find((project) => project.links.live)!
const synergos = getProject('12')!
const HEIGHT = 844
const PEEK = 40

type Box = { x: number; y: number; width: number; height: number }

async function box(locator: Locator): Promise<Box> {
  const value = await locator.boundingBox()
  if (!value) throw new Error('sin caja')
  return value
}

async function openPortfolio(page: Page, width: number, lang: 'es' | 'en' = 'es') {
  await page.setViewportSize({ width, height: HEIGHT })
  await skipIntro(page)
  await page.goto(`/${lang}/portfolio`)
  const track = page.locator('[data-cw-carousel]')
  await track.evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - 200, behavior: 'instant' }))
  return track
}

async function headerBottom(page: Page): Promise<number> {
  return page.locator('#header').evaluate((element) => element.getBoundingClientRect().bottom)
}

const card = (page: Page, id: string) => page.locator(`[data-cw-slide="${id}"] article`)

async function centered(page: Page, id: string, width: number) {
  await expect
    .poll(async () => {
      const b = await box(card(page, id))
      return Math.abs(b.x + b.width / 2 - width / 2)
    }, { message: `la tarjeta ${id} queda centrada` })
    .toBeLessThanOrEqual(2)
}

async function swipe(page: Page, target: Locator, fromRatio: number, toRatio: number) {
  const b = await box(target)
  const cdp = await page.context().newCDPSession(page)
  const y = Math.round(b.y + Math.min(b.height / 2, 160))
  const from = Math.round(b.x + b.width * fromRatio)
  const to = Math.round(b.x + b.width * toRatio)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] })
  for (let step = 1; step <= 12; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(from + ((to - from) * step) / 12), y }] })
    await page.waitForTimeout(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

test.describe('carrusel móvil con asomo, puntos y snap (T841, US12 escenario 1)', () => {
  onlyIn('mobile-chromium')

  for (const width of MOBILE_WIDTHS) {
    test(`${width} px: la tarjeta queda centrada, asoma la siguiente y los botones y puntos la siguen`, async ({ page }) => {
      await openPortfolio(page, width)
      const [first, second] = [projects[0]!.id, projects[1]!.id]
      await centered(page, first, width)
      const next = await box(card(page, second))
      expect(next.x, 'el borde de la siguiente asoma').toBeLessThan(width - 8)
      expect(next.x).toBeGreaterThan(width - PEEK)

      const dots = page.locator('[data-cw-carousel-dots] li')
      await expect(page.locator('[data-cw-carousel-dots]')).toBeVisible()
      await expect(dots).toHaveCount(projects.length)
      await expect(dots.first()).toHaveAttribute('data-current', '')

      for (const control of [page.locator('[data-cw-prev]'), page.locator('[data-cw-next]')]) {
        const b = await box(control)
        expect(b.width).toBeGreaterThanOrEqual(44)
        expect(b.height).toBeGreaterThanOrEqual(44)
      }

      await page.locator('[data-cw-next]').tap()
      await expect(page.locator(`[data-cw-slide="${second}"]`)).toHaveAttribute('data-current', 'true')
      await centered(page, second, width)
      await expect(dots.nth(1)).toHaveAttribute('data-current', '')
      await expect(page.locator('[data-cw-carousel-status]')).toHaveText(`Proyecto 2 de ${projects.length}: ${projectTitle(projects[1]!, 'es')}`)

      await page.locator('[data-cw-prev]').tap()
      await expect(page.locator(`[data-cw-slide="${first}"]`)).toHaveAttribute('data-current', 'true')
      await centered(page, first, width)
    })
  }

  test('deslizar con el dedo pasa a la siguiente y el snap la centra', async ({ page }) => {
    const width = 390
    const track = await openPortfolio(page, width)
    await swipe(page, track, 0.85, 0.15)
    await expect(page.locator(`[data-cw-slide="${projects[1]!.id}"]`)).toHaveAttribute('data-current', 'true')
    await centered(page, projects[1]!.id, width)
    await expect(page.locator('[data-cw-carousel-dots] li').nth(1)).toHaveAttribute('data-current', '')
  })

  test('solo la tarjeta actual desenfoca y la página respeta el presupuesto', async ({ page }) => {
    await openPortfolio(page, 375)
    const blurred = () =>
      page.locator('[data-cw-slide] article').evaluateAll((cards) =>
        cards.filter((element) => !/^(none|blur\(0px\))/.test(getComputedStyle(element).backdropFilter || 'none')).map((element) => element.closest('[data-cw-slide]')?.getAttribute('data-cw-slide')),
      )
    expect(await blurred()).toEqual([projects[0]!.id])
    expect((await blurredSurfaces(page)).length).toBeLessThanOrEqual(3)
    await page.locator('[data-cw-next]').tap()
    await expect.poll(blurred).toEqual([projects[1]!.id])
    expect((await blurredSurfaces(page)).length).toBeLessThanOrEqual(3)
  })
})

test.describe('filtros sticky con conteo (T842, US12 escenario 2)', () => {
  onlyIn('mobile-chromium')

  for (const width of MOBILE_WIDTHS) {
    test(`${width} px: quedan bajo el header al bajar, con chips de 44 px y el conteo al día`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await skipIntro(page)
      await page.goto('/es/portfolio')
      const filters = page.locator('[data-cw-filters]')
      const count = page.locator('[data-cw-filter-count]')
      await expect(count).toHaveText(`Mostrando los ${projects.length} proyectos`)

      for (const chip of await page.locator('[data-cw-era-filter], [data-cw-filter=""]').all()) {
        expect((await box(chip)).height).toBeGreaterThanOrEqual(44)
      }

      await page.locator('[data-cw-era-filter="2024-2026"]').tap()
      const recent = projects.filter((project) => project.era === '2024-2026').length
      await expect(count).toHaveText(`${recent} proyectos de 2024–2026`)
      await expect(page.locator('[data-cw-carousel-status]')).toHaveText(`${recent} proyectos de 2024–2026`)

      const start = (await box(filters)).y + (await page.evaluate(() => window.scrollY))
      await page.evaluate((top) => window.scrollTo({ top: top + 400, behavior: 'instant' }), start)
      await expect.poll(async () => Math.abs((await box(filters)).y - (await headerBottom(page)))).toBeLessThanOrEqual(1)
      await expect(count).toBeInViewport()
      await expect(page.locator('[data-cw-era-filter="2024-2026"]')).toBeInViewport()

      await page.locator('[data-cw-era-filter="2024-2026"]').tap()
      await expect(count).toHaveText(`Mostrando los ${projects.length} proyectos`)
    })
  }
})

test.describe('caso de estudio en móvil (T843, T844)', () => {
  onlyIn('mobile-chromium')

  for (const width of MOBILE_WIDTHS) {
    test(`${width} px: las tarjetas ADR se apilan con un top escalonado`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await skipIntro(page)
      await page.goto('/es/portfolio/12')
      const cards = page.locator('[data-cw-adr]')
      await expect(cards).toHaveCount(synergos.adrCards!.length)
      expect(await cards.first().evaluate((element) => getComputedStyle(element).position)).toBe('sticky')
      const last = cards.last()
      await last.evaluate((element) => {
        const stuckAt = Number.parseFloat(getComputedStyle(element).top)
        const target = element.getBoundingClientRect().top + window.scrollY - (stuckAt + 40)
        window.scrollTo({ top: target, behavior: 'instant' })
      })
      const header = await headerBottom(page)
      const tops = await cards.evaluateAll((items) => items.slice(0, -1).map((item) => item.getBoundingClientRect().top))
      for (let i = 0; i < tops.length; i++) {
        expect(Math.abs(tops[i]! - (header + 12 + i * 14)), `tarjeta ${i + 1}: top ${tops[i]} con header ${header}`).toBeLessThanOrEqual(1.5)
      }
      for (let i = 1; i < tops.length; i++) expect(tops[i]!).toBeGreaterThan(tops[i - 1]!)
    })
  }

  test('una galería de una sola captura no ofrece pasos ni gesto', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio/12')
    await expect(page.locator('[data-cw-gallery-step]')).toHaveCount(0)
    await expect(page.locator('[data-cw-gallery-stage]')).not.toHaveCSS('touch-action', 'pan-y')
  })

  for (const width of MOBILE_WIDTHS) {
    test(`${width} px: el embebido abre en una hoja a pantalla completa con "Cerrar" y "Abrir en una pestaña nueva"`, async ({ page, context }) => {
      const log = await stubExternalSites(context)
      await page.setViewportSize({ width, height: HEIGHT })
      await skipIntro(page)
      await page.goto(`/es/portfolio/${live.id}`)
      const open = page.locator('[data-cw-embed-sheet-open]')
      await open.evaluate((element) => element.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(800)
      await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(0)
      expect(log.urls.filter((url) => hostOf(url) === hostOf(live.links.live!)), 'no carga con scroll programático').toEqual([])
      expect((await box(open)).height).toBeGreaterThanOrEqual(44)

      await open.tap()
      const sheet = page.locator('[data-cw-embed] dialog[data-cw-sheet][open]')
      await expect(sheet).toBeVisible()
      await expect(sheet).toHaveAttribute('aria-modal', 'true')
      await expect.poll(async () => (await box(sheet)).height).toBeGreaterThanOrEqual(HEIGHT - 1)
      expect((await box(sheet)).width).toBeGreaterThanOrEqual(width - 1)
      await expect(sheet.locator('[data-cw-embed-frame]')).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups')
      await expect(page.frameLocator('dialog[data-cw-sheet] [data-cw-embed-frame]').locator('#stub')).toHaveText('Sitio de prueba')

      const external = sheet.locator('[data-cw-embed-sheet-external]')
      await expect(external).toHaveText('Abrir el sitio en una pestaña nueva')
      await expect(external).toHaveAttribute('href', live.links.live!)
      await expect(external).toHaveAttribute('target', '_blank')
      await expect(external).toHaveAttribute('rel', 'noopener noreferrer')
      const close = sheet.locator('[data-cw-embed-sheet-close]')
      await expect(close).toHaveText('Cerrar el sitio en vivo')
      for (const action of [external, close]) {
        const b = await box(action)
        expect(b.height).toBeGreaterThanOrEqual(44)
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x + b.width).toBeLessThanOrEqual(width + 0.5)
      }
      expect((await blurredSurfaces(page)).length).toBeLessThanOrEqual(3)

      await close.tap()
      await expect(page.locator('[data-cw-embed] dialog[data-cw-sheet]')).toBeHidden()
      await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(0)
      await expect(open).toBeFocused()
    })
  }

  test('la hoja del embebido también se cierra con Esc y arrastrando', async ({ page, context }) => {
    await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/en/portfolio/${live.id}`)
    const open = page.locator('[data-cw-embed-sheet-open]')
    await open.scrollIntoViewIfNeeded()
    await open.tap()
    const sheet = page.locator('[data-cw-embed] dialog[data-cw-sheet]')
    await expect(sheet).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(open).toBeFocused()

    await open.tap()
    await expect(sheet).toBeVisible()
    await expect.poll(async () => (await box(sheet)).y).toBeLessThanOrEqual(1)
    const grip = await box(sheet.locator('[data-cw-sheet-drag]'))
    const x = grip.x + grip.width / 3
    await page.mouse.move(x, grip.y + 10)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) await page.mouse.move(x, grip.y + 10 + i * 30)
    await page.mouse.up()
    await expect(sheet).toBeHidden()
    await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(0)
  })
})

test.describe('con movimiento reducido se conserva lo de hoy', () => {
  onlyIn('mobile-chromium')

  test('sin asomo, sin puntos, filtros y tarjetas ADR en su lugar, y la hoja igual se abre', async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await stubExternalSites(context)
    const width = 390
    await openPortfolio(page, width)
    const first = await box(card(page, projects[0]!.id))
    expect(first.width).toBeGreaterThan(width - 30)
    expect((await box(card(page, projects[1]!.id))).x).toBeGreaterThanOrEqual(width)
    await expect(page.locator('[data-cw-carousel-dots]')).toBeHidden()
    await expect(page.locator('[data-cw-filter-count]')).toBeHidden()
    expect(await page.locator('[data-cw-filters]').evaluate((element) => getComputedStyle(element).position)).toBe('static')

    await page.goto('/es/portfolio/12')
    expect(await page.locator('[data-cw-adr]').first().evaluate((element) => getComputedStyle(element).position)).not.toBe('sticky')

    await page.goto(`/es/portfolio/${live.id}`)
    await page.locator('[data-cw-embed-sheet-open]').scrollIntoViewIfNeeded()
    await page.locator('[data-cw-embed-sheet-open]').tap()
    await expect(page.locator('[data-cw-embed] dialog[data-cw-sheet]')).toBeVisible()
    await page.locator('[data-cw-embed-sheet-close]').tap()
    await expect(page.locator('[data-cw-embed] dialog[data-cw-sheet]')).toBeHidden()
  })
})

test.describe('sin JS se conserva lo de hoy', () => {
  onlyIn('no-js')

  test('a 390 px: la lista de tarjetas completa, sin puntos, conteo ni filtros', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: HEIGHT })
    await page.goto('/es/portfolio')
    await expect(page.locator('[data-cw-slide]')).toHaveCount(projects.length)
    await expect(page.locator('[data-cw-carousel-dots]')).toBeHidden()
    await expect(page.locator('[data-cw-filter-count]')).toBeHidden()
    await expect(page.locator('[data-cw-era-filter]').first()).toBeHidden()
    const cards = await page.locator('[data-cw-slide] article').evaluateAll((items) => items.map((item) => item.getBoundingClientRect().left))
    expect(new Set(cards.map((left) => Math.round(left))).size).toBe(1)
    await page.goto('/es/portfolio/12')
    expect(await page.locator('[data-cw-adr]').first().evaluate((element) => getComputedStyle(element).position)).not.toBe('sticky')
  })
})

test.describe('en escritorio nada cambia (FR-651)', () => {
  onlyIn('desktop-chromium')

  test('1280 px: diapositiva a todo el carril, sin puntos ni conteo, filtros y ADR en su lugar', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const track = await box(page.locator('[data-cw-carousel]'))
    const slide = await box(page.locator(`[data-cw-slide="${projects[0]!.id}"]`))
    expect(Math.abs(slide.width - track.width)).toBeLessThanOrEqual(1)
    expect(await page.locator(`[data-cw-slide="${projects[0]!.id}"]`).evaluate((element) => getComputedStyle(element).marginRight)).toBe('0px')
    await expect(page.locator('[data-cw-carousel-dots]')).toBeHidden()
    await expect(page.locator('[data-cw-filter-count]')).toBeHidden()
    expect(await page.locator('[data-cw-filters]').evaluate((element) => getComputedStyle(element).position)).toBe('static')
    await page.goto('/es/portfolio/12')
    expect(await page.locator('[data-cw-adr]').first().evaluate((element) => getComputedStyle(element).position)).toBe('relative')
    await expect(page.locator('[data-cw-gallery-step]')).toHaveCount(0)
  })
})
