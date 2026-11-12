import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import en from '@/content/i18n/en/fun.json'
import es from '@/content/i18n/es/fun.json'

const TEXT = { es, en } as const

const BUTTON = 'footer#footer [data-cw-no-tocar]'

test.use({ trace: 'off' })

async function prepare(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
      localStorage.removeItem('cw-fun-wakes')
    } catch {}
    const counter = window as unknown as { __funSynthetic: number }
    counter.__funSynthetic = 0
    for (const type of ['click', 'submit', 'auxclick']) {
      document.addEventListener(
        type,
        (event) => {
          if (!event.isTrusted || type === 'submit') counter.__funSynthetic += 1
        },
        true,
      )
    }
  })
}

async function open(page: Page, path: string) {
  await prepare(page)
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

async function actorBox(page: Page) {
  return page.locator('[data-cw-fun-actor]').boundingBox()
}

async function synthetic(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __funSynthetic: number }).__funSynthetic)
}

async function buttonHasFocus(page: Page): Promise<boolean> {
  return page.evaluate((selector) => document.activeElement === document.querySelector(selector), BUTTON)
}

test.describe('No tocar: el botón', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`/${lang}: aparece en el footer, debajo del tío Bob, con 44 px o más`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === 'no-js', 'sin JS lo cubre la prueba de abajo')
      const button = await open(page, `/${lang}/privacy`)
      await expect(button).toBeVisible()
      await expect(button).toHaveText(TEXT[lang]['fun.button'])
      const egg = await page.locator('footer#footer [data-cw-footer-egg]').boundingBox()
      const box = await button.boundingBox()
      expect(box!.y).toBeGreaterThan(egg!.y)
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.width).toBeGreaterThanOrEqual(44)
      await expect(page.locator('[data-cw-fun]')).toHaveCount(0)
    })
  }

  test('sin JS no se muestra', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-js', 'solo en el proyecto sin JS')
    await page.goto('/es/privacy')
    await expect(page.locator('footer#footer [data-cw-footer-egg]')).toBeVisible()
    await expect(page.locator(BUTTON)).toBeHidden()
  })
})

test.describe('No tocar: el muñeco', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'escritorio; el celular tiene su propia prueba')
  })

  test('al tocarlo regaña, persigue y finge picar: sin clics reales, sin navegar y sin robar el foco', async ({ page, context }) => {
    const button = await open(page, '/es/privacy')
    const url = page.url()
    await button.click()
    await expect(page.locator('[data-cw-fun-actor]')).toBeVisible()
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(es['fun.warned'])
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(es['fun.warned'])
    expect(await buttonHasFocus(page)).toBe(true)

    const link = page.locator('footer#footer [data-cw-footer-now]')
    const target = (await link.boundingBox())!
    const before = await actorBox(page)
    await page.mouse.move(target.x - 40, target.y - 40, { steps: 8 })
    await expect.poll(async () => (await actorBox(page))!.x, { timeout: 3_000 }).not.toBe(before!.x)
    await expect(page.locator('[data-cw-fun-tap]').first()).toBeAttached({ timeout: 6_000 })
    await expect(page.locator('[data-cw-fun-actor][data-pose="poke"]')).toBeAttached({ timeout: 6_000 })

    expect(page.url()).toBe(url)
    expect(await synthetic(page)).toBe(0)
    expect(await buttonHasFocus(page)).toBe(true)
    expect(context.pages()).toHaveLength(1)
    const layer = await page.locator('[data-cw-fun]').evaluate((element) => getComputedStyle(element).pointerEvents)
    expect(layer).toBe('none')
  })

  test('se calma solo volviendo al botón pasado el minuto; antes ruega', async ({ page }) => {
    await page.clock.install()
    const button = await open(page, '/es/privacy')
    await button.click()
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(es['fun.warned'])

    await button.click()
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(es['fun.line.10'])
    await expect(page.locator('[data-cw-fun-actor]')).toBeVisible()
    await button.click()
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(/^Todavía no\. Me quedan \d+ segundos de cansonería\.$/)
    await expect(button).not.toHaveAttribute('data-ready')

    await page.clock.fastForward(61_000)
    await expect(button).toHaveAttribute('data-ready', '')
    await button.click()
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(es['fun.bye'])
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(es['fun.bye'])
    await page.clock.fastForward(3_000)
    await expect(page.locator('[data-cw-fun]')).toHaveCount(0)
    await expect(button).not.toHaveAttribute('data-awake')
    expect(await synthetic(page)).toBe(0)
  })

  test('Esc lo deja quieto al instante y "Quieto" lo suelta (WCAG 2.2.2)', async ({ page }) => {
    const button = await open(page, '/es/privacy')
    await button.click()
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(es['fun.warned'])
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-phase', 'sulking')
    await expect(page.locator('[data-cw-fun-actor]')).toHaveAttribute('data-pose', 'sulk')
    const calm = page.locator('[data-cw-fun-calm]')
    await expect(calm).toHaveAttribute('aria-pressed', 'true')
    await expect(calm).toHaveAttribute('aria-keyshortcuts', 'Escape')
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(es['fun.sulk'])

    const still = await actorBox(page)
    await page.mouse.move(40, 120, { steps: 6 })
    await page.waitForTimeout(2_500)
    expect(await actorBox(page)).toEqual(still)
    await expect(page.locator('[data-cw-fun-tap]')).toHaveCount(0)
    const animated = await page.locator('[data-cw-fun-actor] svg').evaluate((svg) => svg.getAnimations({ subtree: true }).length)
    expect(animated).toBe(0)

    await calm.click()
    await expect(calm).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-phase', 'awake')
    await expect(page.locator('[data-cw-fun-live]')).toHaveText(es['fun.free'])
  })

  test('con movimiento reducido no persigue: aparece quieto en una esquina y habla', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const button = await open(page, '/en/privacy')
    await button.click()
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-reduced', '')
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(en['fun.warned'])
    const viewport = page.viewportSize()!
    const corner = (await actorBox(page))!
    expect(corner.x + corner.width).toBeGreaterThan(viewport.width - 40)
    expect(corner.y + corner.height).toBeGreaterThan(viewport.height - 40)
    await page.mouse.move(60, 140, { steps: 6 })
    await page.waitForTimeout(2_200)
    expect(await actorBox(page)).toEqual(corner)
    await expect(page.locator('[data-cw-fun-tap]')).toHaveCount(0)
  })

  for (const scheme of ['dark', 'light'] as const) {
    test(`sin violaciones críticas ni serias de axe con el muñeco despierto y quieto, tema ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const button = await open(page, '/es/privacy')
      await button.click()
      await expect(page.locator('[data-cw-fun-line]')).toHaveText(es['fun.warned'])
      for (const state of ['despierto', 'quieto'] as const) {
        if (state === 'quieto') await page.keyboard.press('Escape')
        const results = await new AxeBuilder({ page })
          .include('[data-cw-fun]')
          .include(BUTTON)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${state} ${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      }
    })
  }
})

test.describe('No tocar: en el celular', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'solo en el celular')
  })

  test('el toque lo despierta, sigue el dedo y "Quieto" se alcanza con el pulgar', async ({ page }) => {
    const button = await open(page, '/es/privacy')
    const url = page.url()
    await button.tap()
    await expect(page.locator('[data-cw-fun-line]')).toHaveText(es['fun.warned'])
    const before = (await actorBox(page))!
    const viewport = page.viewportSize()!
    await page.locator('footer#footer [data-cw-footer-egg]').tap()
    await expect.poll(async () => (await actorBox(page))!.y, { timeout: 3_000 }).toBeLessThan(before.y)
    expect(page.url()).toBe(url)
    expect(await synthetic(page)).toBe(0)

    const calm = page.locator('[data-cw-fun-calm]')
    const box = (await calm.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    await calm.tap()
    await expect(calm).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cw-fun]')).toHaveAttribute('data-phase', 'sulking')
  })
})
