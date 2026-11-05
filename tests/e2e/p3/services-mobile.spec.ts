import { expect, test, type Locator, type Page } from '@playwright/test'
import { SERVICE_IDS } from '@/content/types'
import { getSite } from '@/lib/content'
import { blurredSurfaces, MOBILE_WIDTHS, onlyIn, skipIntro } from '../m0/support'

const { services } = getSite()
const HEIGHT = 844
const ACCENT = 'rgb(37, 237, 158)'

const items = (page: Page) => page.locator('[data-cw-service-stack] > li')
const card = (page: Page, id: string) => page.locator(`article[data-cw-service="${id}"]`)

async function open(page: Page, width = 390, height = HEIGHT) {
  await page.setViewportSize({ width, height })
  await skipIntro(page)
  await page.goto('/es/services')
}

async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)
}

async function stackTo(page: Page, index: number) {
  const top = await page.locator('[data-cw-service-stack]').evaluate((list, i) => {
    const lis = [...list.children] as HTMLElement[]
    let y = list.getBoundingClientRect().top + window.scrollY
    for (let k = 0; k < i; k++) y += lis[k]!.offsetHeight + Number.parseFloat(getComputedStyle(lis[k]!).marginBottom)
    return y - Number.parseFloat(getComputedStyle(lis[i]!).top)
  }, index)
  await scrollTo(page, Math.ceil(top) + 2)
  await expect(items(page).nth(index)).toHaveAttribute('data-cw-stack', 'active')
}

async function scaleOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const transform = getComputedStyle(element).transform
    return transform === 'none' ? 1 : new DOMMatrixReadOnly(transform).a
  })
}

async function shadeOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) => Number(getComputedStyle(element, '::after').opacity))
}

async function hits(locator: Locator): Promise<boolean> {
  return locator.evaluate((element) => {
    const r = element.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return hit !== null && (hit === element || element.contains(hit))
  })
}

test.describe('Servicios en móvil: pila sticky (US11, FR-634, T838)', () => {
  onlyIn('mobile-chromium')

  for (const width of MOBILE_WIDTHS) {
    test(`${width} px: se apila con top escalonado, la de atrás más pequeña y oscura, y solo la activa desenfoca`, async ({ page }) => {
      await open(page, width)
      await expect(items(page)).toHaveCount(6)
      const tops = await items(page).evaluateAll((lis) => lis.map((li) => [getComputedStyle(li).position, Number.parseFloat(getComputedStyle(li).top)] as const))
      expect(new Set(tops.map(([position]) => position))).toEqual(new Set(['sticky']))
      const values = tops.map(([, top]) => top)
      expect(values).toEqual([...values].sort((a, b) => a - b))
      expect(values[1]! - values[0]!).toBeGreaterThan(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)

      await stackTo(page, 2)
      const [behind, active, next] = [items(page).nth(1), items(page).nth(2), items(page).nth(3)]
      await expect(behind).toHaveAttribute('data-cw-stack', 'behind')
      await expect(items(page).nth(0)).toHaveAttribute('data-cw-stack', 'behind')
      await expect(next).not.toHaveAttribute('data-cw-stack', /.+/)
      await expect.poll(() => scaleOf(behind)).toBeLessThan(1)
      await expect.poll(() => shadeOf(behind)).toBeGreaterThan(0)
      await expect.poll(() => scaleOf(items(page).nth(0))).toBeLessThan(await scaleOf(behind))
      expect(await scaleOf(active)).toBe(1)
      expect(await shadeOf(active)).toBe(0)

      await expect(page.locator('article[data-cw-service][data-cw-blur]')).toHaveCount(1)
      await expect(card(page, SERVICE_IDS[2]!)).toHaveAttribute('data-cw-blur', '')
      expect((await blurredSurfaces(page)).length).toBeLessThanOrEqual(3)
      expect(await hits(active.locator('[data-cw-service-want]'))).toBe(true)
      expect(await hits(active.locator('[data-cw-service-flip]'))).toBe(true)
    })
  }

  test('cada tarjeta queda completa sobre el dock cuando llega a su sitio, con "Quiero esto" a un toque', async ({ page }) => {
    await open(page, 375, 812)
    for (const [index, id] of SERVICE_IDS.entries()) {
      await stackTo(page, index)
      const want = card(page, id).locator('[data-cw-service-want]')
      expect(await hits(want), id).toBe(true)
      const bottom = await items(page).nth(index).evaluate((li) => li.getBoundingClientRect().bottom)
      expect(bottom, id).toBeLessThanOrEqual(812 - 80 + 1)
    }
  })

  test('de las tarjetas de atrás solo asoma su franja, también cuando la pila se va', async ({ page }) => {
    await open(page)
    const peeks = () =>
      page.evaluate(() => {
        const header = document.querySelector('header#header')!.getBoundingClientRect().bottom
        const found: string[] = []
        for (let y = Math.ceil(header) + 1; y < window.innerHeight - 100; y += 4) {
          const li = document.elementFromPoint(window.innerWidth / 2, y)?.closest('[data-cw-service-stack] > li')
          if (li?.getAttribute('data-cw-stack') !== 'behind') continue
          const offset = y - li.getBoundingClientRect().top
          if (offset > 28) found.push(`${li.querySelector('article')?.getAttribute('data-cw-service')} a ${Math.round(offset)} px de su borde`)
        }
        return found
      })
    for (const index of [2, 5]) {
      await stackTo(page, index)
      await expect(items(page).nth(index - 1)).toHaveCSS('clip-path', /^inset\(/)
      await expect(items(page).nth(index)).toHaveCSS('clip-path', 'none')
      expect(await peeks()).toEqual([])
    }
    for (const step of [120, 240, 360, 480]) {
      await page.evaluate(() => window.scrollBy({ top: 120, behavior: 'instant' }))
      expect(await peeks(), `${step} px después`).toEqual([])
    }
  })
})

test.describe('Servicios en móvil: giro con toque y botón visible (US11, FR-652, T839)', () => {
  onlyIn('mobile-chromium')

  test('"Ver qué recibes" se ve, mide 44 px o más y gira con háptica; tocar la tarjeta también', async ({ page }) => {
    await page.addInitScript(() => {
      const calls: number[] = []
      Object.defineProperty(window, '__cwVibrate', { value: calls })
      Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (pattern: number) => (calls.push(pattern), true) })
    })
    await open(page)
    await stackTo(page, 1)
    const current = card(page, 'software-factory')
    const flip = current.locator('[data-cw-service-flip]')
    const want = current.locator('[data-cw-service-want]')
    await expect(flip).toBeVisible()
    await expect(flip).toHaveText('Ver qué recibes')
    for (const target of [flip, want]) {
      const b = await target.boundingBox()
      expect(b?.height ?? 0).toBeGreaterThanOrEqual(44)
      expect(b?.width ?? 0).toBeGreaterThanOrEqual(44)
    }
    await flip.tap()
    await expect(flip).toHaveAttribute('aria-expanded', 'true')
    await expect(current.getByText(services.items[1]!.deliverables[0]!.es)).toBeVisible()
    await current.locator('[data-cw-face="back"] h4').tap()
    await expect(flip).toHaveAttribute('aria-expanded', 'false')
    await expect(current.getByText(services.items[1]!.description.es)).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __cwVibrate: number[] }).__cwVibrate)).toEqual([8, 8])
  })
})

test.describe('Servicios en móvil: Cómo trabajo se ilumina con el scroll (US11, T839)', () => {
  onlyIn('mobile-chromium')

  const glow = (page: Page, index: number) => page.locator('[data-cw-step]').nth(index).locator('[data-cw-step-glow]')
  const opacity = (locator: Locator) => locator.evaluate((element) => Number(getComputedStyle(element).opacity))

  test('los pasos son una línea vertical que se enciende al pasar por la mitad de la pantalla y se apaga al volver', async ({ page }) => {
    await open(page)
    const dots = await page.locator('[data-cw-step]').evaluateAll((steps) =>
      steps.map((step) => {
        const r = step.getBoundingClientRect()
        return { left: Math.round(r.left), top: r.top }
      }),
    )
    expect(new Set(dots.map((dot) => dot.left)).size).toBe(1)
    expect(dots.map((dot) => dot.top)).toEqual([...dots.map((dot) => dot.top)].sort((a, b) => a - b))

    const placeStep = async (index: number, ratio: number) => {
      const top = await page.locator('[data-cw-step]').nth(index).evaluate((step, r) => step.getBoundingClientRect().top + window.scrollY - window.innerHeight * r, ratio)
      await scrollTo(page, top)
    }
    await placeStep(0, 0.3)
    await expect.poll(() => opacity(glow(page, 0))).toBeGreaterThan(0.95)
    await expect.poll(() => opacity(glow(page, 4))).toBeLessThan(0.05)
    await placeStep(4, 0.3)
    await expect.poll(() => opacity(glow(page, 4))).toBeGreaterThan(0.95)
    await placeStep(0, 0.9)
    await expect.poll(() => opacity(glow(page, 0))).toBeLessThan(0.05)
  })
})

test.describe('Servicios en móvil: el CTA final no queda tapado (US6, US11)', () => {
  onlyIn('mobile-chromium')

  for (const width of MOBILE_WIDTHS) {
    test(`${width} px: "Escríbeme" se ve entero y responde al toque al final de la página`, async ({ page }) => {
      await open(page, width)
      await scrollTo(page, 1_000_000)
      await page.evaluate(() => window.scrollBy({ top: -1, behavior: 'instant' }))
      await scrollTo(page, 1_000_000)
      const cta = page.locator('[data-cw-services-contact]')
      await expect(cta).toBeInViewport({ ratio: 1 })
      expect(await hits(cta)).toBe(true)
      await expect(page.locator('[data-cw-assistant-button]')).toBeHidden()
      const [link, dock] = await Promise.all([cta.boundingBox(), page.locator('[data-cw-dock-bar]').boundingBox()])
      if (link && dock && (await page.locator('[data-cw-dock-bar]').isVisible())) expect(link.y + link.height).toBeLessThanOrEqual(dock.y)
    })
  }
})

test.describe('Servicios en móvil: respaldos (FR-650, SC-607)', () => {
  test('con movimiento reducido se listan sin apilarse, todo encendido y sin animaciones nuevas', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'móvil')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    expect(new Set(await items(page).evaluateAll((lis) => lis.map((li) => getComputedStyle(li).position)))).toEqual(new Set(['static']))
    await page.locator('[data-cw-service-stack] > li').nth(2).scrollIntoViewIfNeeded()
    await expect(page.locator('[data-cw-stack]')).toHaveCount(0)
    await expect(page.locator('article[data-cw-service][data-cw-blur]')).toHaveCount(0)
    await expect(page.locator('[data-cw-step-glow]').first()).toBeHidden()
    const lit = await page.locator('[data-cw-step]').evaluateAll((steps) => steps.map((step) => getComputedStyle(step, '::before').borderTopColor))
    expect(lit).toEqual(Array(5).fill(ACCENT))
    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === 'running')
          .filter((animation) => {
            const target = (animation.effect as KeyframeEffect | null)?.target
            return target instanceof Element && target.closest('[data-cw-services-block]') !== null
          }).length,
    )
    expect(running).toBe(0)
  })

  test('sin JS, a 390 px, las tarjetas son la lista de hoy con las dos caras', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-js', 'sin JS')
    await open(page)
    expect(new Set(await items(page).evaluateAll((lis) => lis.map((li) => getComputedStyle(li).position)))).toEqual(new Set(['static']))
    const current = card(page, 'ai-harness')
    await expect(current.getByText(services.items[0]!.description.es)).toBeVisible()
    await expect(current.getByText(services.items[0]!.deliverables[0]!.es)).toBeVisible()
    await expect(current.locator('[data-cw-service-flip]')).toBeHidden()
    await expect(page.locator('[data-cw-step-glow]').first()).toBeHidden()
  })

  test('en escritorio no hay pila, ni marcas de blur, ni la línea nueva', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'escritorio')
    await skipIntro(page)
    await page.goto('/es/services')
    expect(new Set(await items(page).evaluateAll((lis) => lis.map((li) => getComputedStyle(li).position)))).toEqual(new Set(['static']))
    await page.locator('[data-cw-steps]').scrollIntoViewIfNeeded()
    await expect(page.locator('[data-cw-stack]')).toHaveCount(0)
    await expect(page.locator('article[data-cw-service][data-cw-blur]')).toHaveCount(0)
    await expect(page.locator('[data-cw-step-glow]').first()).toBeHidden()
    const flip = await card(page, 'ai-harness').locator('[data-cw-service-flip]').boundingBox()
    expect(flip?.height).toBe(36)
  })
})
