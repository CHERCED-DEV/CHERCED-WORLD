import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { FIGURE_FLOATS } from '@/components/site/about/AboutFigures'

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function open(page: Page, width = 390) {
  await page.setViewportSize({ width, height: 844 })
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto('/es/aboutMe')
}

const dot = (page: Page, id: string) => page.locator(`[data-cw-scene-dot="${id}"]`)

async function current(page: Page): Promise<string[]> {
  return page.locator('[data-cw-scene-dot][data-current]').evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.cwSceneDot!))
}

test.describe('puntos de progreso de las escenas en < sm (T831, FR-631, US9)', () => {
  onlyIn('mobile-chromium')

  for (const width of [375, 390]) {
    test(`${width} px: tres puntos fijos a la derecha, de 44 px, sin tapar el índice ni desbordar`, async ({ page }) => {
      await open(page, width)
      const dots = page.locator('[data-cw-scene-dot]')
      await expect(dots).toHaveCount(3)
      for (const item of await dots.all()) {
        await expect(item).toBeVisible()
        const box = (await item.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.x + box.width).toBeLessThanOrEqual(width)
      }
      await expect(page.getByRole('navigation', { name: 'Escenas de Sobre mí' }).getByRole('link')).toHaveCount(3)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      await expect.poll(() => current(page)).toEqual(['scene-who'])
    })
  }

  test('el punto de la escena visible se pone verde al hacer scroll', async ({ page }) => {
    await open(page)
    for (const id of ['scene-knowledge', 'scene-career', 'scene-who']) {
      await page.locator(`#${id}`).evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' }))
      await expect.poll(() => current(page), { message: id }).toEqual([id])
    }
    await expect.poll(() => dot(page, 'scene-who').evaluate((node) => getComputedStyle(node, '::before').backgroundColor)).toBe('rgb(37, 237, 158)')
  })

  test('tocar un punto lleva a su escena, con el título debajo del índice', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    for (const [id, heading] of [
      ['scene-career', '#about-career'],
      ['scene-knowledge', '#about-knowledge'],
      ['scene-who', '#about-title'],
    ] as const) {
      await expect(async () => {
        await dot(page, id).tap()
        await expect.poll(() => current(page), { timeout: 1000 }).toEqual([id])
      }).toPass()
      const navBottom = await page.locator('[data-cw-scene-nav] ol').evaluate((node) => node.getBoundingClientRect().bottom)
      await expect.poll(async () => (await page.locator(heading).boundingBox())!.y, { message: id }).toBeGreaterThanOrEqual(navBottom)
      await expect.poll(() => page.locator(`#${id}`).evaluate((node) => node.getBoundingClientRect().top), { message: id }).toBeLessThanOrEqual(navBottom + 40)
    }
  })

  test('los puntos son un atajo táctil: fuera del árbol accesible y del orden de Tab', async ({ page }) => {
    await open(page)
    await expect(page.locator('[data-cw-scene-dots]')).toHaveAttribute('aria-hidden', 'true')
    for (const item of await page.locator('[data-cw-scene-dot]').all()) await expect(item).toHaveAttribute('tabindex', '-1')
    const results = await new AxeBuilder({ page }).include('[data-cw-scene-dots]').include('[data-cw-scene-nav]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })

  test('desde 480 px no hay puntos: el índice de escenas basta', async ({ page }) => {
    await open(page, 600)
    await expect(page.locator('[data-cw-scene-dots]')).toBeHidden()
  })

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('no hay puntos; el índice con anclas sigue', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/es/aboutMe')
      await expect(page.locator('[data-cw-scene-dots]')).toBeHidden()
      await expect(page.getByRole('navigation', { name: 'Escenas de Sobre mí' }).getByRole('link')).toHaveCount(3)
    })
  })
})

test.describe('"En cifras" y retrato en móvil (T832, T833, FR-632)', () => {
  onlyIn('mobile-chromium')

  for (const width of [375, 390]) {
    test(`${width} px: cuadrícula 2×2 de tarjetas flotantes con barrido, sin desbordes`, async ({ page }) => {
      await open(page, width)
      const figures = page.locator('[data-cw-about="figures"] [data-cw-figure]')
      await expect(figures).toHaveCount(4)
      await figures.first().scrollIntoViewIfNeeded()
      const boxes = await Promise.all((await figures.all()).map(async (item) => (await item.boundingBox())!))
      expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(24)
      expect(Math.abs(boxes[2]!.y - boxes[3]!.y)).toBeLessThan(24)
      expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y + boxes[0]!.height / 2)
      expect(boxes[1]!.x).toBeGreaterThan(boxes[0]!.x + boxes[0]!.width / 2)
      for (const box of boxes) expect(box.x + box.width).toBeLessThanOrEqual(width)
      for (const [index, item] of (await figures.all()).entries()) {
        await expect(item).toHaveAttribute('data-cw-float', String(FIGURE_FLOATS[index]))
        await expect(item.locator('[data-cw-sweep]')).toHaveCount(1)
        expect(await item.locator('[data-cw-figure-value]').evaluate((node) => node.scrollWidth <= node.parentElement!.clientWidth + 1), 'la cifra cabe').toBe(true)
      }
      await expect(figures.locator('[data-cw-sweep]').first()).toBeVisible()
    })
  }

  test('el retrato lleva el barrido en su marco y el texto de "Quién soy" va a la izquierda', async ({ page }) => {
    await open(page)
    await expect(page.locator('[data-cw-portrait] > [data-cw-sweep]')).toHaveCount(1)
    await expect(page.locator('[data-cw-portrait] > [data-cw-sweep]')).toBeVisible()
    const align = await page.locator('#about-title ~ * p').first().evaluate((node) => getComputedStyle(node).textAlign)
    expect(align).not.toBe('justify')
  })

  test('con movimiento reducido no hay barrido ni desfase en las cifras ni en el retrato', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    await expect(page.locator('[data-cw-portrait] > [data-cw-sweep]')).toBeHidden()
    for (const item of await page.locator('[data-cw-figure]').all()) {
      await expect(item.locator('[data-cw-sweep]')).toBeHidden()
      const running = await item.evaluate((node) => node.getAnimations().filter((animation) => animation.playState === 'running').length)
      expect(running).toBe(0)
    }
  })
})

test.describe('el escritorio no cambia', () => {
  onlyIn('desktop-chromium')

  test('sin puntos de escena ni barridos; las cifras siguen en su cuadrícula', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-scene-dots]')).toBeHidden()
    for (const sweep of await page.locator('[data-cw-sweep]').all()) await expect(sweep).toBeHidden()
    for (const item of await page.locator('[data-cw-figure]').all()) await expect(item).toHaveCSS('translate', 'none')
  })
})

