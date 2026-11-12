import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const HEIGHTS: Record<number, number> = { 375: 812, 390: 844, 412: 915 }

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

const PAGES = [
  { path: '/es/aboutMe', name: 'Escenas de Sobre mí' },
  { path: '/es/services', name: 'Secciones de Servicios' },
  { path: '/en/services', name: 'Services sections' },
  { path: '/es/portfolio/1', name: 'Secciones del caso' },
  { path: '/es/synergos', name: 'Secciones de Synergos' },
  { path: '/es/ai-lab', name: 'Secciones del AI Lab' },
  { path: '/en/now', name: 'Now sections' },
] as const

const nav = (page: Page) => page.locator('[data-cw-scene-nav]')
const tab = (page: Page) => page.locator('[data-cw-scene-tab]')
const active = (page: Page) => nav(page).locator('a[aria-current="true"]')

async function open(page: Page, { lang = 'es', width, path }: { lang?: 'es' | 'en'; width?: number; path?: string } = {}) {
  if (width) await page.setViewportSize({ width, height: HEIGHTS[width] ?? 844 })
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path ?? `/${lang}/aboutMe`)
  await expect(nav(page)).toHaveAttribute('data-cw-measured', '')
}

async function glide(page: Page, distance: number) {
  const step = Math.sign(distance) * 120
  for (let moved = 0; Math.abs(moved) < Math.abs(distance); moved += step) {
    await page.evaluate((delta) => window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' }), step)
    await page.waitForTimeout(20)
  }
}

function opacities(page: Page): Promise<string[]> {
  return nav(page)
    .locator('li')
    .evaluateAll((items) => items.map((item) => getComputedStyle(item).opacity))
}

async function gapUnderHeader(page: Page): Promise<number> {
  const header = (await page.locator('#header').boundingBox())!
  return Math.round((await tab(page).boundingBox())!.y - (header.y + header.height))
}

test.describe('índice de Sobre mí como pestaña fija en celular', () => {
  test('375, 390 y 412 px: pegada al borde izquierdo bajo el header, punta derecha redonda, sin desbordar ni tapar el dock', async ({ page }) => {
    onlyIn('mobile-chromium')
    test.setTimeout(120_000)
    for (const width of [375, 390, 412]) {
      await open(page, { width })
      const box = (await tab(page).boundingBox())!
      expect(box.x, `${width} px`).toBe(0)
      expect(await gapUnderHeader(page), `${width} px`).toBeGreaterThanOrEqual(6)
      expect(await gapUnderHeader(page), `${width} px`).toBeLessThanOrEqual(9)
      expect(box.x + box.width, `${width} px`).toBeLessThanOrEqual(width - 14)
      const shape = await tab(page).evaluate((node) => {
        const style = getComputedStyle(node)
        return [style.borderTopLeftRadius, style.borderBottomLeftRadius, style.borderLeftWidth, Number.parseFloat(style.borderTopRightRadius) >= 20]
      })
      expect(shape, `${width} px`).toEqual(['0px', '0px', '0px', true])
      const gap = await gapUnderHeader(page)
      await glide(page, 1600)
      await expect.poll(() => gapUnderHeader(page), { message: `${width} px al bajar` }).toBe(gap)
      const dock = (await page.locator('[data-cw-dock-bar]').boundingBox())!
      expect((await tab(page).boundingBox())!.y + 48, `${width} px`).toBeLessThan(dock.y)
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width} px`).toBeLessThanOrEqual(width)
    }
  })

  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: al bajar se compacta en la escena actual con su número y su línea; al subir se despliega entera`, async ({ page }) => {
      onlyIn('mobile-chromium')
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await open(page, { lang })
      await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
      await page.locator('#scene-career').evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 300, behavior: 'instant' }))
      await glide(page, 360)
      await expect(nav(page)).toHaveAttribute('data-cw-compact', '')
      await expect(active(page)).toHaveAttribute('data-cw-scene-link', 'scene-career')
      await expect(nav(page).locator('[data-cw-scene-badge]')).toHaveText('02')
      await expect.poll(() => opacities(page)).toEqual(['0', '1', '0', '0'])
      await expect
        .poll(async () => {
          const link = (await active(page).boundingBox())!
          const box = (await tab(page).boundingBox())!
          return link.x >= 24 && link.x + link.width <= box.x + box.width && box.x + box.width < 200
        })
        .toBe(true)
      expect(await active(page).evaluate((node) => getComputedStyle(node, '::after').content)).not.toBe('none')
      await glide(page, -240)
      await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
      await expect.poll(() => opacities(page)).toEqual(['1', '1', '1', '1'])
      await expect.poll(async () => (await tab(page).boundingBox())!.x).toBe(0)
    })
  }

  test('tocar la pestaña compacta la despliega sin mover la página; tocar otra escena lleva a ella', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page)
    await glide(page, 1500)
    await expect(nav(page)).toHaveAttribute('data-cw-compact', '')
    await expect.poll(() => opacities(page).then((values) => values.filter((value) => value === '1').length)).toBe(1)
    const y = await page.evaluate(() => window.scrollY)
    await active(page).tap()
    await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
    expect(await page.evaluate(() => window.scrollY)).toBe(y)
    expect(new URL(page.url()).hash).toBe('')
    await expect.poll(() => opacities(page)).toEqual(['1', '1', '1', '1'])
    const heading = nav(page).locator('[data-cw-scene-link="scene-heading"]')
    await heading.tap()
    await expect(page).toHaveURL(/#scene-heading$/)
    await expect(heading).toHaveAttribute('aria-current', 'true')
  })

  test('el indicador se desliza hasta la escena activa en vez de saltar', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page)
    const indicator = nav(page).locator('[data-cw-scene-indicator]')
    expect(await indicator.evaluate((node) => getComputedStyle(node).transitionProperty)).toContain('transform')
    for (const id of ['scene-career', 'scene-knowledge', 'scene-who']) {
      await page.locator(`#${id}`).evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - 200, behavior: 'instant' }))
      const link = nav(page).locator(`[data-cw-scene-link="${id}"]`)
      await expect(link).toHaveAttribute('aria-current', 'true')
      await expect
        .poll(async () => {
          const pill = (await indicator.boundingBox())!
          const box = (await link.boundingBox())!
          return Math.abs(pill.x - box.x) < 1.5 && Math.abs(pill.width - box.width) < 1.5
        }, { message: id })
        .toBe(true)
    }
  })

  test('con movimiento reducido no se compacta ni anima', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    await glide(page, 2000)
    await page.waitForTimeout(300)
    await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
    expect(await opacities(page)).toEqual(['1', '1', '1', '1'])
    expect((await tab(page).boundingBox())!.x).toBe(0)
    const durations = await page.evaluate(() =>
      ['[data-cw-scene-tab]', '[data-cw-scene-indicator]', '[data-cw-scene-nav] li', '[data-cw-scene-badge]'].flatMap((selector) =>
        getComputedStyle(document.querySelector(selector)!).transitionDuration.split(',').map((value) => Number.parseFloat(value)),
      ),
    )
    expect(durations.every((value) => value < 0.001)).toBe(true)
  })

  test('con teclado el foco despliega la pestaña, se ve entero y no queda tapado (WCAG 2.4.11)', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page)
    await glide(page, 1500)
    await expect(nav(page)).toHaveAttribute('data-cw-compact', '')
    await page.evaluate(() => document.getElementById('main')!.focus({ preventScroll: true }))
    await page.keyboard.press('Tab')
    const links = nav(page).getByRole('link')
    for (let index = 0; index < 4; index++) {
      if (index > 0) await page.keyboard.press('Tab')
      const link = links.nth(index)
      await expect(link).toBeFocused()
      await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
      await expect
        .poll(
          () =>
            link.evaluate((node) => {
              const box = node.getBoundingClientRect()
              const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
              return getComputedStyle(node.parentElement!).opacity === '1' && getComputedStyle(node).outlineStyle !== 'none' && box.left >= 0 && box.right <= innerWidth && hit !== null && node.contains(hit)
            }),
          { message: `enlace ${index + 1}` },
        )
        .toBe(true)
    }
    for (let step = 0; step < 3; step++) {
      await page.keyboard.press('Tab')
      await expect
        .poll(() =>
          page.evaluate(() => {
            const focused = document.activeElement as HTMLElement
            const tab = document.querySelector('[data-cw-scene-tab]')!.getBoundingClientRect()
            return focused.closest('[data-cw-scene-nav]') !== null || focused.getBoundingClientRect().top >= tab.bottom
          }),
        )
        .toBe(true)
    }
  })

  test('cumple WCAG 2.2 AA desplegada y compacta, en claro y en oscuro', async ({ page }) => {
    onlyIn('mobile-chromium')
    test.setTimeout(120_000)
    for (const scheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'no-preference' })
      await page.addInitScript((value) => {
        try {
          localStorage.setItem('cw-theme', value)
        } catch {}
      }, scheme)
      await open(page)
      for (const compact of [false, true]) {
        if (compact) {
          await glide(page, 1500)
          await expect(nav(page)).toHaveAttribute('data-cw-compact', '')
          await expect.poll(() => opacities(page).then((values) => values.filter((value) => value === '0').length)).toBe(3)
        }
        const results = await new AxeBuilder({ page }).include('[data-cw-scene-nav]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
        expect(results.violations.map((violation) => `${scheme}${compact ? ' compacta' : ''}: ${violation.id}`)).toEqual([])
      }
    }
  })

  test('en escritorio sigue centrada bajo el header, con números y sin compactarse', async ({ page }) => {
    onlyIn('desktop-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page)
    const center = await page.evaluate(() => document.documentElement.clientWidth / 2)
    const box = (await tab(page).boundingBox())!
    expect(Math.abs(box.x + box.width / 2 - center)).toBeLessThan(2)
    expect(box.height).toBe(44)
    expect(await tab(page).evaluate((node) => getComputedStyle(node).borderTopLeftRadius)).toBe('999px')
    await expect(nav(page).getByRole('link').first()).toHaveText(/^01\s*Quién soy$/)
    await glide(page, 1500)
    await page.waitForTimeout(400)
    await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
    expect(await opacities(page)).toEqual(['1', '1', '1', '1'])
  })

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('queda fija bajo el header y entera, con sus cuatro escenas', async ({ page }) => {
      onlyIn('mobile-chromium')
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/es/aboutMe')
      const links = page.getByRole('navigation', { name: 'Escenas de Sobre mí' }).getByRole('link')
      await expect(links).toHaveCount(4)
      for (const link of await links.all()) await expect(link).toBeVisible()
      const gap = await gapUnderHeader(page)
      expect(gap).toBeGreaterThanOrEqual(6)
      expect(gap).toBeLessThanOrEqual(9)
      await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
      await expect.poll(() => gapUnderHeader(page)).toBe(gap)
      expect((await tab(page).boundingBox())!.x).toBe(0)
      await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
      expect(await opacities(page)).toEqual(['1', '1', '1', '1'])
    })
  })
})

test.describe('la misma navegación es el estándar de las páginas con varias secciones', () => {
  for (const { path, name } of PAGES) {
    test(`${path}: pestaña fija bajo el header y puntos, cada enlace lleva a una sección que existe`, async ({ page }) => {
      onlyIn('mobile-chromium')
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await open(page, { path })
      const links = page.getByRole('navigation', { name, exact: true }).getByRole('link')
      const count = await links.count()
      expect(count).toBeGreaterThanOrEqual(2)
      const targets = await links.evaluateAll((items) => items.map((item) => Boolean(document.getElementById(item.getAttribute('href')!.slice(1)))))
      expect(targets).toEqual(Array(count).fill(true))
      await expect(page.locator('[data-cw-scene-dot]')).toHaveCount(count)
      const box = (await tab(page).boundingBox())!
      expect(box.x).toBe(0)
      expect(box.x + box.width).toBeLessThanOrEqual(390 - 14)
      const gap = await gapUnderHeader(page)
      expect(gap).toBeGreaterThanOrEqual(6)
      expect(gap).toBeLessThanOrEqual(9)
      const heading = (await page.locator('main h1').first().boundingBox())!
      expect(heading.y, 'el título no queda debajo de la pestaña').toBeGreaterThanOrEqual(box.y + box.height)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
      await glide(page, 1200)
      await expect(nav(page)).toHaveAttribute('data-cw-compact', '')
      await expect.poll(() => gapUnderHeader(page)).toBe(gap)
      await expect.poll(() => opacities(page).then((values) => values.filter((value) => value === '1').length)).toBe(1)
      const index = await active(page).getAttribute('data-cw-scene-index')
      await expect(nav(page).locator('[data-cw-scene-badge]')).toHaveText(index!.padStart(2, '0'))
      await expect(page.locator(`[data-cw-scene-dot][data-current][data-cw-scene-index="${index}"]`)).toHaveCount(1)
      const results = await new AxeBuilder({ page }).include('[data-cw-scene-nav]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(results.violations.map((violation) => violation.id)).toEqual([])
      await glide(page, -240)
      await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
      await expect.poll(() => opacities(page).then((values) => values.every((value) => value === '1'))).toBe(true)
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
      await expect(nav(page), 'sobre el pie se aparta para no tapar lo último de la página').toHaveAttribute('data-cw-over-footer', '')
      await expect.poll(() => tab(page).evaluate((node) => getComputedStyle(node).opacity)).toBe('0')
    })

    test(`${path}: en escritorio queda centrada, entera y sin compactarse`, async ({ page }) => {
      onlyIn('desktop-chromium')
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await open(page, { path })
      const center = await page.evaluate(() => document.documentElement.clientWidth / 2)
      const box = (await tab(page).boundingBox())!
      expect(Math.abs(box.x + box.width / 2 - center)).toBeLessThan(2)
      expect(box.height).toBe(44)
      expect(await tab(page).locator('div').first().evaluate((track) => track.scrollWidth <= track.clientWidth + 1), 'las secciones caben sin desplazar').toBe(true)
      await glide(page, 1200)
      await page.waitForTimeout(400)
      await expect(nav(page)).not.toHaveAttribute('data-cw-compact')
      await expect(page.locator('[data-cw-scene-dots]')).toBeHidden()
    })
  }

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    for (const { path, name } of PAGES.slice(1)) {
      test(`${path}: la navegación queda fija y entera, sin puntos`, async ({ page }) => {
        onlyIn('mobile-chromium')
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto(path)
        const links = page.getByRole('navigation', { name, exact: true }).getByRole('link')
        expect(await links.count()).toBeGreaterThanOrEqual(2)
        await expect(links.first()).toBeVisible()
        await expect(page.locator('[data-cw-scene-dots]')).toBeHidden()
        const gap = await gapUnderHeader(page)
        await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }))
        await expect.poll(() => gapUnderHeader(page)).toBe(gap)
      })
    }
  })
})
