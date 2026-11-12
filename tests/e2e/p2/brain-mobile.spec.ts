import { expect, test, type Locator, type Page } from '@playwright/test'
import { brainData } from '@/components/site/about/brain'
import { getProjects, getSite } from '@/lib/content'
import { blurredSurfaces } from '../m0/support'

const { about } = getSite()
const data = { es: brainData(about, getProjects(), 'es', 'Actualidad'), en: brainData(about, getProjects(), 'en', 'Present') }
const WIDTHS = [375, 390, 412] as const
const SHEET = 'dialog[data-cw-sheet]:has([data-cw-terminal])'
const BLUR_BUDGET = 3

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function openMap(page: Page, width: number = 390, lang: 'es' | 'en' = 'es', hash = '') {
  await page.setViewportSize({ width, height: 844 })
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
    const calls: number[] = []
    ;(window as unknown as { __cwVibrate: number[] }).__cwVibrate = calls
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (pattern: number) => {
        calls.push(pattern)
        return true
      },
    })
  })
  await page.goto(`/${lang}/aboutMe${hash}`)
  const map = page.locator('[data-cw-brain-map]')
  await map.scrollIntoViewIfNeeded()
  await expect(map).toBeVisible()
  await expect(page.locator(SHEET)).toHaveCount(1)
  return map
}

const lobe = (page: Page, id: string) => page.locator(`[data-cw-lobe="${id}"]`)
const sheet = (page: Page) => page.locator(`${SHEET}[open]`)
const counter = (page: Page) => page.locator(`${SHEET} [data-cw-sheet-nav] p`)

async function tapLobe(page: Page, id: string) {
  await expect(async () => {
    await lobe(page, id).tap()
    await expect(sheet(page)).toBeVisible({ timeout: 1000 })
  }).toPass()
}

async function settled(locator: Locator) {
  await expect.poll(() => locator.evaluate((node) => node.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0)
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 8) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
}

test.describe('mapa compacto a 375, 390 y 412 px (T820, FR-620, SC-604, SC-605)', () => {
  onlyIn('mobile-chromium')

  for (const width of WIDTHS) {
    test(`${width} px: el mapa cuadrado entra completo, sin scroll horizontal y con lóbulos de 64 px o más`, async ({ page }) => {
      const map = await openMap(page, width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      const box = (await map.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1)
      await expect(page.locator('[data-cw-brain-compact]')).toBeVisible()
      await expect(page.locator('[data-cw-brain] svg:not([data-cw-brain-compact])')).toBeHidden()
      await expect(page.locator('[data-cw-brain] [data-cw-brain-map] > div[aria-hidden]').filter({ hasText: 'CAMILO' })).toBeVisible()
      const lobes = page.locator('[data-cw-lobe]')
      await expect(lobes).toHaveCount(6)
      await expect(lobes).toHaveText(data.es.lobes.map((item) => item.name))
      for (const item of await lobes.all()) {
        const rect = (await item.boundingBox())!
        expect(rect.width, await item.textContent() ?? '').toBeGreaterThanOrEqual(64)
        expect(rect.height).toBeGreaterThanOrEqual(64)
        expect(rect.x).toBeGreaterThanOrEqual(box.x)
        expect(rect.y).toBeGreaterThanOrEqual(box.y)
        expect(rect.x + rect.width).toBeLessThanOrEqual(box.x + box.width + 0.5)
        expect(rect.y + rect.height).toBeLessThanOrEqual(box.y + box.height + 0.5)
        expect(await item.evaluate((node) => node.scrollWidth <= node.clientWidth + 1), 'el nombre cabe en el círculo').toBe(true)
      }
      const sources = page.locator('[data-cw-source], [data-cw-brain] [data-cw-platzi]')
      await expect(page.locator('[data-cw-sources-heading]:visible')).toHaveText(['Aplicado en'])
      await expect(sources.filter({ visible: true }), 'M2: se ven las 6 primeras').toHaveCount(6)
      await page.locator('[data-cw-sources-toggle]').tap()
      await expect(page.locator('[data-cw-sources-toggle]')).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('[data-cw-sources-heading]:visible')).toHaveCount(2)
      for (const control of await sources.all()) {
        expect((await control.boundingBox())!.height, 'M2: objetivo táctil de 44 px').toBeGreaterThanOrEqual(44)
      }
      const [rain, after] = await Promise.all([page.locator('[data-cw-rain]').boundingBox(), map.boundingBox()])
      expect(Math.abs(rain!.y - after!.y), 'la lluvia sigue sobre el mapa (las dos cajas medidas juntas tras abrir "Ver todas")').toBeLessThanOrEqual(1)
      expect(Math.abs(rain!.height - after!.height)).toBeLessThanOrEqual(1)
      await expect(page.locator('[data-cw-terminal]')).toBeHidden()
    })

    test(`${width} px: un toque abre la hoja del lóbulo con su panel y "en palabras"`, async ({ page }) => {
      await openMap(page, width)
      for (const [index, item] of data.es.lobes.entries()) {
        await tapLobe(page, item.id)
        await expect(lobe(page, item.id)).toHaveAttribute('aria-pressed', 'true')
        const open = sheet(page)
        await expect(open.locator('[data-cw-terminal-body]')).toHaveAttribute('data-cw-terminal-body', item.id)
        await expect(open.getByRole('heading', { level: 3, name: item.name, exact: true })).toBeVisible()
        await expect(open.locator('[data-cw-brain-skill]')).toHaveCount(item.skills.length)
        await expect(open.locator('[data-cw-meta="applied"]')).toBeVisible()
        await expect(counter(page)).toHaveText(`${index + 1} / 6`)
        if (item.words) await expect(open.locator(`[data-cw-sheet-words="${item.id}"] p`)).toHaveText(item.words)
        else await expect(open.locator('[data-cw-sheet-words]')).toHaveCount(0)
        await expect(page.locator('[data-cw-words]')).toBeHidden()
        await open.locator('[data-cw-sheet-close]').tap()
        await expect(page.locator(`${SHEET}[open]`)).toHaveCount(0)
      }
    })
  }

  test('la hoja es un diálogo con nombre y el lóbulo lo anuncia; vibra una vez al elegir', async ({ page }) => {
    await openMap(page)
    await expect(lobe(page, 'backend-cloud')).toHaveAttribute('aria-haspopup', 'dialog')
    await tapLobe(page, 'backend-cloud')
    await expect(page.getByRole('dialog', { name: 'Backend y nube' })).toBeVisible()
    await expect(sheet(page)).toHaveAttribute('aria-modal', 'true')
    expect(await page.evaluate(() => (window as unknown as { __cwVibrate: number[] }).__cwVibrate)).toEqual([8])
    for (const control of [sheet(page).locator('[data-cw-sheet-close]'), sheet(page).locator('[data-cw-sheet-prev]'), sheet(page).locator('[data-cw-sheet-next]')]) {
      const rect = (await control.boundingBox())!
      expect(rect.width).toBeGreaterThanOrEqual(44)
      expect(rect.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('deslizar y Anterior/Siguiente cambian de lóbulo, y el mapa de atrás sigue la selección (T822)', async ({ page }) => {
    await openMap(page)
    await tapLobe(page, 'frontend')
    await settled(sheet(page))
    await expect(counter(page)).toHaveText('1 / 6')
    const body = (await sheet(page).locator('[data-cw-sheet-body]').boundingBox())!
    const y = body.y + Math.min(body.height / 2, 200)
    await drag(page, { x: 330, y }, { x: 80, y: y + 10 })
    await expect(counter(page)).toHaveText('2 / 6')
    await expect(sheet(page).locator('[data-cw-terminal-body]')).toHaveAttribute('data-cw-terminal-body', 'architecture')
    await expect(lobe(page, 'architecture')).toHaveAttribute('aria-pressed', 'true')
    await expect(lobe(page, 'frontend')).toHaveAttribute('aria-pressed', 'false')
    await drag(page, { x: 80, y }, { x: 330, y: y + 10 })
    await expect(counter(page)).toHaveText('1 / 6')
    await drag(page, { x: 200, y }, { x: 205, y: y + 140 })
    await expect(counter(page)).toHaveText('1 / 6')
    await sheet(page).locator('[data-cw-sheet-prev]').tap()
    await expect(counter(page)).toHaveText('6 / 6')
    await expect(lobe(page, 'business')).toHaveAttribute('aria-pressed', 'true')
    await expect(lobe(page, 'business')).toHaveAttribute('data-cw-blur', '')
    await sheet(page).locator('[data-cw-sheet-next]').tap()
    await expect(counter(page)).toHaveText('1 / 6')
    await expect(page.locator('[data-cw-compact-synapses="frontend"]')).toHaveAttribute('data-on', '')
    await expect(page.locator('[data-cw-compact-synapses="business"]')).not.toHaveAttribute('data-on', /.*/)
  })

  test('con teclado: Enter abre, el foco queda dentro, Esc cierra y devuelve el foco al lóbulo', async ({ page }) => {
    await openMap(page)
    await expect(async () => {
      await lobe(page, 'applied-ai').focus()
      await page.keyboard.press('Enter')
      await expect(sheet(page)).toBeVisible({ timeout: 1000 })
    }).toPass()
    await expect(sheet(page).getByRole('heading', { level: 3 })).toBeFocused()
    const visited = new Set<string>()
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const where = await page.evaluate(() => {
        const active = document.activeElement
        if (!active || active === document.body) return 'fuera de la página'
        return active.closest('dialog[open]') ? (active.getAttribute('data-cw-sheet-next') !== null ? 'siguiente' : 'hoja') : 'página'
      })
      expect(where, `Tab ${i + 1}`).not.toBe('página')
      visited.add(where)
    }
    expect(visited.has('siguiente')).toBe(true)
    await page.keyboard.press('Escape')
    await expect(page.locator(`${SHEET}[open]`)).toHaveCount(0)
    await expect(lobe(page, 'applied-ai')).toBeFocused()
    await expect(lobe(page, 'applied-ai')).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(lobe(page, 'practices')).toBeFocused()
    await expect(page.locator(`${SHEET}[open]`)).toHaveCount(0)
  })

  test('el terminal se escribe dentro de la hoja y cat <lóbulo>.lobe mueve la hoja y el mapa', async ({ page }) => {
    await openMap(page)
    await tapLobe(page, 'frontend')
    const input = sheet(page).getByRole('textbox', { name: 'Escribe un comando' })
    await input.fill('whoami')
    await input.press('Enter')
    await expect(sheet(page).getByRole('log').locator('[data-cw-term-line]')).toContainText(['arquitecto'])
    await input.fill('cat business.lobe')
    await input.press('Enter')
    await expect(counter(page)).toHaveText('6 / 6')
    await expect(lobe(page, 'business')).toHaveAttribute('aria-pressed', 'true')
  })

  test('solo el lóbulo activo lleva data-cw-blur y el presupuesto de 3 se cumple con y sin hoja', async ({ page }) => {
    await openMap(page, 375)
    await expect(page.locator('[data-cw-lobe][data-cw-blur]')).toHaveCount(1)
    await expect(page.locator('[data-cw-lobe][data-cw-blur]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cw-brain] [data-cw-blur]:not([data-cw-lobe])')).toHaveCount(0)
    const closed = await blurredSurfaces(page)
    expect(closed.length, closed.join(', ')).toBeLessThanOrEqual(BLUR_BUDGET)
    await tapLobe(page, 'practices')
    await settled(sheet(page))
    await expect(page.locator('[data-cw-lobe][data-cw-blur]')).toHaveCount(1)
    await expect(lobe(page, 'practices')).toHaveAttribute('data-cw-blur', '')
    const open = await blurredSurfaces(page)
    expect(open.length, open.join(', ')).toBeLessThanOrEqual(BLUR_BUDGET)
  })

  test('una fuente también abre la hoja, sin flechas de lóbulo', async ({ page }) => {
    await openMap(page)
    await expect(async () => {
      if ((await page.locator('[data-cw-sources-toggle]').getAttribute('aria-expanded')) !== 'true') await page.locator('[data-cw-sources-toggle]').tap()
      await page.locator('[data-cw-source="unad"]').tap()
      await expect(sheet(page)).toBeVisible({ timeout: 1000 })
    }).toPass()
    await expect(sheet(page).locator('[data-cw-terminal-body]')).toHaveAttribute('data-cw-terminal-body', 'unad')
    await expect(sheet(page).locator('[data-cw-sheet-nav]')).toHaveCount(0)
    await expect(page.locator('[data-cw-lobe][data-cw-blur]')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __cwVibrate: number[] }).__cwVibrate)).toEqual([])
  })

  test('el ancla #lobe-<id> abre la hoja de ese lóbulo en móvil', async ({ page }) => {
    await openMap(page, 390, 'en', '#lobe-architecture')
    await expect(sheet(page)).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Architecture' })).toBeVisible()
    await expect(counter(page)).toHaveText('2 / 6')
    await expect(sheet(page).locator('[data-cw-principle]')).toHaveCount(about.principles!.length)
    await expect(lobe(page, 'architecture')).toHaveAttribute('aria-pressed', 'true')
  })

  test('la lluvia corre acotada al mapa mientras se ve', async ({ page }) => {
    await openMap(page)
    const canvas = page.locator('[data-cw-rain]')
    await expect
      .poll(
        () =>
          canvas.evaluate((node: HTMLCanvasElement) => {
            const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data
            for (let i = 3; i < pixels.length; i += 4 * 53) if (pixels[i]! > 0) return true
            return false
          }),
        { timeout: 10_000 },
      )
      .toBe(true)
    await expect.poll(() => page.locator('[data-cw-packet]').first().evaluate((node) => node.getAnimations().length)).toBeGreaterThan(0)
  })
})

test.describe('sin JavaScript en móvil (T824, FR-624)', () => {
  onlyIn('mobile-chromium')
  test.use({ javaScriptEnabled: false })

  for (const width of [375, 412]) {
    test(`${width} px: los chips y las listas completas de hoy, sin mapa ni hoja`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto('/es/aboutMe')
      await expect(page.locator('[data-cw-brain]')).toBeHidden()
      for (const item of data.es.lobes) {
        const list = page.locator(`[data-cw-lobe-list="${item.id}"]`)
        await expect(list).toBeVisible()
        await expect(list.locator('[data-cw-brain-skill]')).toHaveCount(item.skills.length)
      }
      await expect(page.locator('[data-cw-words]')).toBeVisible()
      await expect(page.locator(`${SHEET}`)).toHaveCount(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    })
  }
})
