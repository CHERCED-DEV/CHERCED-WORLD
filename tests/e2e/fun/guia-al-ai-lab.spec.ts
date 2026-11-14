import { expect, test, type Locator, type Page } from '@playwright/test'
import { FUN_GUIDE_GRACE_MS, FUN_GUIDE_LINES, FUN_GUIDE_TAP_MS } from '@/content/fun'
import en from '@/content/i18n/en/fun.json'
import es from '@/content/i18n/es/fun.json'

const BUTTON = 'footer#footer [data-cw-no-tocar]'

const LINK = 'footer#footer [data-cw-footer-ai-lab]'

const EGG = 'footer#footer [data-cw-footer-egg]'

const FIRST_WAKE_MS = 20_000

const ARRIVE_MS = 15_000

type Box = { x: number; y: number; width: number; height: number }

test.use({ trace: 'off' })

function arrivalLines(dict: Record<string, string>): RegExp {
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^(${FUN_GUIDE_LINES.map((line) => escape(dict[`fun.guide.line.${line}`]!)).join('|')})$`)
}

async function open(page: Page, path: string): Promise<Locator> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
      localStorage.removeItem('cw-fun-wakes')
    } catch {}
    const counter = window as unknown as { __funSynthetic: number }
    counter.__funSynthetic = 0
    document.addEventListener(
      'click',
      (event) => {
        if (!event.isTrusted) counter.__funSynthetic += 1
      },
      true,
    )
  })
  const response = await page.goto(path)
  expect(response?.status()).toBe(200)
  const button = page.locator(BUTTON)
  await page.waitForFunction((selector) => {
    const element = document.querySelector(selector)
    return Boolean(element) && Object.keys(element!).some((key) => key.startsWith('__reactProps'))
  }, BUTTON)
  await button.scrollIntoViewIfNeeded()
  return button
}

async function wake(page: Page, button: Locator, warned: string, how: 'click' | 'tap' = 'click'): Promise<void> {
  if (how === 'tap') await button.tap()
  else await button.click()
  await expect(page.locator('[data-cw-fun-line]')).toHaveText(warned, { timeout: FIRST_WAKE_MS })
  await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-guide', 'counting')
}

async function toBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await expect(page.locator(LINK)).toBeInViewport({ ratio: 1 })
}

async function toTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page.locator(LINK)).not.toBeInViewport()
}

function gap(a: Box, b: Box): number {
  const dx = Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width))
  const dy = Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height))
  return Math.hypot(dx, dy)
}

async function actorBox(page: Page): Promise<Box> {
  return (await page.locator('[data-cw-fun-actor]').boundingBox())!
}

async function synthetic(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __funSynthetic: number }).__funSynthetic)
}

async function times(count: number, act: () => Promise<void>): Promise<void> {
  for (let index = 0; index < count; index++) await act()
}

test.describe('019: el chibi lleva al AI Lab (escritorio)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'escritorio; el celular tiene su propia prueba')
  })

  test('a la sexta interacción corre al enlace del pie, lo toca y lleva al AI Lab, sin clics sintéticos', async ({ page }) => {
    const button = await open(page, '/es/privacy')
    await wake(page, button, es['fun.warned'])
    await toBottom(page)
    const egg = page.locator(EGG)
    const layer = page.locator('[data-cw-fun]')

    await times(5, () => egg.click())
    await expect(layer).toHaveAttribute('data-guide', 'counting')
    expect(page.url()).toMatch(/\/es\/privacy$/)

    await egg.click()
    await expect(layer).toHaveAttribute('data-guide', 'running')
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(es['fun.guide.go'])
    const link = (await page.locator(LINK).boundingBox())!
    await expect.poll(async () => gap(await actorBox(page), link), { timeout: 4_000 }).toBeLessThan(24)
    await expect(page.locator('[data-cw-fun-tap]').first()).toBeAttached({ timeout: 4_000 })

    await page.waitForURL('**/es/ai-lab', { timeout: ARRIVE_MS })
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(arrivalLines(es))
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(arrivalLines(es))
    await page.waitForTimeout(3_000)
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(arrivalLines(es))
    await expect(layer).toHaveAttribute('data-guide', 'done')
    await expect(layer).toHaveAttribute('data-phase', 'awake')
    expect(await synthetic(page)).toBe(0)
  })

  test('con el pie fuera de vista va al dock de arriba', async ({ page }) => {
    const button = await open(page, '/es/privacy')
    await wake(page, button, es['fun.warned'])
    await toTop(page)
    const heading = page.locator('main h1').first()
    await times(6, () => heading.click())
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-guide', 'running')
    const header = (await page.locator('header#header').boundingBox())!
    await expect.poll(async () => (await actorBox(page)).y, { timeout: 4_000 }).toBeLessThan(header.y + header.height + 40)
    await expect.poll(async () => (await page.locator('[data-cw-fun-tap]').first().boundingBox())?.y ?? 9_999, { timeout: 4_000 }).toBeLessThan(
      header.y + header.height,
    )
    await page.waitForURL('**/es/ai-lab', { timeout: ARRIVE_MS })
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(arrivalLines(es))
  })

  test('las teclas también cuentan; escribir en un campo y el propio huevo no', async ({ page }) => {
    const button = await open(page, '/es/privacy')
    await wake(page, button, es['fun.warned'])
    await page.keyboard.press('x')
    await page.keyboard.press('x')
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-guide', 'counting')
    await toBottom(page)
    await page.locator(EGG).click()
    await times(5, () => page.keyboard.press('x'))
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-guide', 'running')
    await page.waitForURL('**/es/ai-lab', { timeout: ARRIVE_MS })
  })

  test('Esc a mitad de carrera lo detiene, no navega y no lo vuelve a intentar en ese despertar', async ({ page }) => {
    const button = await open(page, '/es/privacy')
    await wake(page, button, es['fun.warned'])
    await toBottom(page)
    const egg = page.locator(EGG)
    const layer = page.locator('[data-cw-fun]')
    await times(6, () => egg.click())
    await expect(layer).toHaveAttribute('data-guide', 'running')
    await page.keyboard.press('Escape')
    await expect(layer).toHaveAttribute('data-phase', 'sulking')
    await expect(layer).toHaveAttribute('data-guide', 'done')
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(es['fun.sulk'])
    const still = await actorBox(page)
    await page.waitForTimeout(FUN_GUIDE_GRACE_MS + FUN_GUIDE_TAP_MS + 1_000)
    expect(page.url()).toMatch(/\/es\/privacy$/)
    expect(await actorBox(page)).toEqual(still)

    await page.locator('[data-cw-fun-calm]').click()
    await expect(layer).toHaveAttribute('data-phase', 'awake')
    await times(8, () => egg.click())
    await page.waitForTimeout(2_500)
    expect(page.url()).toMatch(/\/es\/privacy$/)
    await expect(layer).toHaveAttribute('data-guide', 'done')
  })

  test('si ya está en el AI Lab no lo lleva a ningún lado: solo celebra', async ({ page }) => {
    const button = await open(page, '/es/ai-lab')
    await wake(page, button, es['fun.warned'])
    await toBottom(page)
    await times(6, () => page.locator(EGG).click())
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-guide', 'done')
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(es['fun.guide.here'])
    await page.waitForTimeout(FUN_GUIDE_GRACE_MS + FUN_GUIDE_TAP_MS + 500)
    expect(page.url()).toMatch(/\/es\/ai-lab$/)
  })

  test('con movimiento reducido salta en vez de correr, toca y navega; al llegar vuelve a su esquina', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const button = await open(page, '/en/privacy')
    await wake(page, button, en['fun.warned'])
    await toBottom(page)
    const actor = page.locator('[data-cw-fun-actor]')
    const corner = await actorBox(page)
    await times(6, () => page.locator(EGG).click())
    await expect(actor).toHaveAttribute('data-at', '')
    const link = (await page.locator(LINK).boundingBox())!
    expect(gap(await actorBox(page), link)).toBeLessThan(24)
    await page.waitForURL('**/en/ai-lab', { timeout: ARRIVE_MS })
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(arrivalLines(en))
    await expect(actor).not.toHaveAttribute('data-at', '')
    const back = await actorBox(page)
    expect(Math.abs(back.x - corner.x)).toBeLessThan(24)
    expect(Math.abs(back.y - corner.y)).toBeLessThan(4)
  })
})

test.describe('019: el chibi lleva al AI Lab (celular)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'solo en el celular')
  })

  test('con el pie fuera de vista va al dock de abajo y navega', async ({ page }) => {
    const button = await open(page, '/es/privacy')
    await wake(page, button, es['fun.warned'], 'tap')
    await toTop(page)
    const menu = page.locator('[data-cw-dock-bar] [data-cw-menu-button]')
    await expect(menu).toBeInViewport({ ratio: 1 })
    const heading = page.locator('main h1').first()
    await times(6, () => heading.tap())
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-guide', 'running')
    const dock = (await menu.boundingBox())!
    await expect.poll(async () => gap(await actorBox(page), dock), { timeout: 4_000 }).toBeLessThan(24)
    await page.waitForURL('**/es/ai-lab', { timeout: ARRIVE_MS })
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(arrivalLines(es))
    expect(await synthetic(page)).toBe(0)
  })
})

test.describe('019: "AI Lab" brilla', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'el estilo es el mismo en todos los anchos')
  })

  async function glow(page: Page, selector: string) {
    return page.locator(selector).evaluate((element) => {
      const own = getComputedStyle(element)
      const before = getComputedStyle(element, '::before')
      const after = getComputedStyle(element, '::after')
      return {
        color: own.color,
        shadow: own.textShadow,
        content: before.content,
        rays: before.animationName,
        image: before.backgroundImage,
        breathe: after.animationName,
      }
    })
  }

  for (const scheme of ['dark', 'light'] as const) {
    test(`solo "AI Lab" lleva los rayos dorados animados, con el texto a todo contraste, tema ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      for (const path of ['/es/privacy', '/en/ai-lab']) {
        await open(page, path)
        const lab = await glow(page, LINK)
        expect(lab.color, path).toBe(scheme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)')
        expect(lab.shadow, path).not.toBe('none')
        expect(lab.image, path).toMatch(/conic-gradient/)
        expect(lab.rays, path).toMatch(/ai-lab-rays/)
        expect(lab.breathe, path).toMatch(/ai-lab-breathe/)
        const now = await glow(page, 'footer#footer [data-cw-footer-now]')
        expect(now.content, path).toBe('none')
        expect(now.color, path).not.toBe(lab.color)
      }
    })
  }

  test('con movimiento reducido el brillo queda quieto', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/privacy')
    const lab = await glow(page, LINK)
    expect(lab.image).toMatch(/conic-gradient/)
    expect(lab.rays).toBe('none')
    expect(lab.breathe).toBe('none')
  })
})
