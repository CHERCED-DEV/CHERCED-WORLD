import { expect, test, type Page } from '@playwright/test'
import { winkEnd } from '@/components/site/home/wink'
import { blurredSurfaces } from '../m0/support'

const MOBILE_WIDTHS = [375, 390, 412] as const
const SWEEP = '[data-cw-home-banner] [data-cw-home-sweep]'
const CARD = '[data-cw-home-banner] [data-cw-glass]'
const ROLES = '[data-cw-home-role]'
const CUE = '[data-cw-home-cue]'

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function open(page: Page, path = '/es') {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path)
}

async function sweepAnimations(page: Page) {
  return page.evaluate((selector) => {
    const layer = document.querySelector(selector)
    return document
      .getAnimations()
      .filter((animation) => (animation.effect as KeyframeEffect | null)?.target === layer)
      .map((animation) => {
        const effect = animation.effect as KeyframeEffect
        const timing = effect.getComputedTiming()
        return {
          state: animation.playState,
          pseudo: effect.pseudoElement,
          timeline: animation.timeline === document.timeline ? 'document' : 'scroll',
          delay: Number(timing.delay),
          duration: Number(timing.duration),
          iterations: timing.iterations,
          properties: [...new Set(effect.getKeyframes().flatMap((frame) => Object.keys(frame)))].filter(
            (key) => !['offset', 'computedOffset', 'easing', 'composite'].includes(key),
          ),
        }
      })
  }, SWEEP)
}

async function roleState(page: Page) {
  return page.evaluate((selector) =>
    [...document.querySelectorAll<HTMLElement>(selector)].map((role) => {
      const style = getComputedStyle(role)
      const sweep = role.querySelector(':scope > [data-cw-sweep]')
      return {
        level: role.getAttribute('data-cw-float'),
        animation: style.animationName,
        scrollDriven: role.getAnimations().some((animation) => animation.timeline !== document.timeline),
        translate: style.translate,
        background: style.backgroundColor,
        border: Number.parseFloat(style.borderTopWidth),
        filter: style.backdropFilter,
        sweep: sweep ? getComputedStyle(sweep).display : null,
      }
    }),
  ROLES)
}

async function cueAnimations(page: Page, part: 'link' | 'icon' = 'link') {
  return page.evaluate(
    ({ selector, part }) => {
      const cue = document.querySelector(selector) as HTMLElement
      const target = part === 'link' ? cue : (cue.querySelector('svg') as SVGElement)
      return target.getAnimations().map((animation) => {
        const effect = animation.effect as KeyframeEffect
        return {
          name: (animation as CSSAnimation).animationName,
          duration: Number(effect.getComputedTiming().duration),
          iterations: effect.getComputedTiming().iterations,
          properties: [...new Set(effect.getKeyframes().flatMap((frame) => Object.keys(frame)))].filter(
            (key) => !['offset', 'computedOffset', 'easing', 'composite'].includes(key),
          ),
        }
      })
    },
    { selector: CUE, part },
  )
}

async function contentBoxes(page: Page) {
  return page.evaluate(() =>
    ['h1', '[data-cw-home-subtitle]', '[data-cw-cv-link]', '[data-cw-availability]'].map((selector) => {
      const element = document.querySelector(`[data-cw-home-banner] ${selector}`) as HTMLElement
      return { top: element.offsetTop, height: element.offsetHeight }
    }),
  )
}

test.describe('home en móvil: banner (006 US10, FR-633)', () => {
  onlyIn('mobile-chromium')

  test('el marco recibe un barrido de una vez al cargar, después del guiño y sin mover el layout', async ({ page }) => {
    await open(page)
    const [sweep] = await sweepAnimations(page)
    expect(sweep).toEqual({
      state: 'running',
      pseudo: '::before',
      timeline: 'document',
      delay: winkEnd(),
      duration: 700,
      iterations: 1,
      properties: ['transform'],
    })
    expect(await sweepAnimations(page)).toHaveLength(1)
    const before = await contentBoxes(page)
    await expect.poll(async () => (await sweepAnimations(page)).map((animation) => animation.state), { timeout: 6000 }).toEqual(['finished'])
    expect(await contentBoxes(page)).toEqual(before)
    expect(await page.locator(SWEEP).evaluate((element) => getComputedStyle(element, '::before').transform)).toMatch(
      /^matrix\(1, 0, 0, 1, \d+(\.\d+)?, 0\)$/,
    )
  })

  test('la luz del cristal sigue al dedo en el banner y se apaga al soltar', async ({ page }) => {
    await open(page)
    const card = page.locator(CARD).first()
    await expect(card).toHaveAttribute('data-cw-light', '')
    const box = (await card.boundingBox())!
    const point = { x: Math.round(box.x + box.width * 0.3), y: Math.round(box.y + 24) }
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await expect(card).toHaveAttribute('data-cw-touching', '')
    const light = await card.evaluate((element) => ({
      x: element.style.getPropertyValue('--cw-mx'),
      y: element.style.getPropertyValue('--cw-my'),
    }))
    expect(light.x).toMatch(/px|%/)
    expect(light.y).toMatch(/px|%/)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(card).not.toHaveAttribute('data-cw-touching', /.*/)
  })

  test('el banner se queda sin blur propio: el presupuesto no cambia', async ({ page }) => {
    await open(page)
    await expect(page.locator(CARD).first()).not.toHaveAttribute('data-cw-blur', /.*/)
    await expect(page.locator('main [data-cw-blur]')).toHaveCount(0)
    for (const top of [0, 500, 1000, 1500]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)
      await page.waitForTimeout(60)
      const blurred = await blurredSurfaces(page)
      expect(blurred.length, `y=${top}: ${blurred.join(', ')}`).toBeLessThanOrEqual(3)
    }
  })
})

test.describe('home en móvil: "Ahora trabajo en" y la señal de scroll (006 US10, US4)', () => {
  onlyIn('mobile-chromium')

  for (const width of MOBILE_WIDTHS) {
    test(`${width} px: tarjetas flotantes con desfases distintos, barrido y cristal sólido`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 })
      await open(page)
      const roles = await roleState(page)
      expect(roles.length).toBeGreaterThan(1)
      for (const [index, role] of roles.entries()) {
        expect(role.animation).toBe('cw-float')
        expect(role.scrollDriven).toBe(true)
        expect(role.filter).toBe('none')
        expect(role.border).toBeGreaterThanOrEqual(1)
        expect(role.background).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
        expect(role.sweep).toBe('block')
        if (index > 0) expect(role.level).not.toBe(roles[index - 1]!.level)
      }

      await page.locator('[data-cw-home-now]').scrollIntoViewIfNeeded()
      const shifts: number[][] = []
      for (const offset of [-200, 0, 200]) {
        await page.evaluate((delta) => window.scrollBy({ top: delta, behavior: 'instant' }), offset)
        await page.waitForTimeout(80)
        shifts.push((await roleState(page)).map((role) => Number.parseFloat(role.translate.split(' ')[1] ?? '0')))
      }
      for (const set of shifts) for (const shift of set) expect(Math.abs(shift)).toBeLessThanOrEqual(12)
      expect(new Set(shifts.map((set) => set.join(','))).size).toBeGreaterThan(1)
      const viewport = page.viewportSize()!.width
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport)
    })
  }

  test('la señal respira cada 4,5 s, la mitad del ritmo ambiental, sin mover su área táctil y por encima del dock', async ({ page }) => {
    await open(page)
    const ambient = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cw-duration-ambient')),
    )
    const [breath] = await cueAnimations(page)
    expect(breath).toMatchObject({ duration: (ambient * 1000) / 2, iterations: Infinity, properties: ['opacity'] })
    expect(breath?.name).toMatch(/home-cue-breathe$/)
    const [drift] = await cueAnimations(page, 'icon')
    expect(drift).toMatchObject({ duration: breath!.duration, iterations: Infinity, properties: ['transform'] })
    expect(drift?.name).toMatch(/home-cue-drift$/)
    const drop = await page.locator(`${CUE} span`).first().evaluate((line) => getComputedStyle(line, '::after').animationDuration)
    expect(Number.parseFloat(drop) * 1000).toBe(breath?.duration)

    await expect.poll(() => page.locator('html').getAttribute('data-cw-wink'), { timeout: 8000 }).toBe('done')
    const cue = page.locator(CUE)
    const first = await cue.boundingBox()
    await page.waitForTimeout(400)
    expect(await cue.boundingBox()).toEqual(first)
    const dock = await page.locator('[data-cw-dock-bar]').boundingBox()
    expect(first!.y + first!.height).toBeLessThanOrEqual(dock!.y)
    await cue.click()
    await expect(page).toHaveURL(/\/es#home-now$/)
  })

  test('los objetivos táctiles del home miden 44 × 44 px o más', async ({ page }) => {
    await open(page)
    await expect.poll(() => page.locator('html').getAttribute('data-cw-wink'), { timeout: 6000 }).toBe('done')
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('main a[href], main button')]
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0)
        .filter(({ rect }) => rect.width < 44 || rect.height < 44)
        .map(({ element, rect }) => `${element.getAttribute('aria-label') ?? element.textContent?.trim()} ${Math.round(rect.width)}x${Math.round(rect.height)}`),
    )
    expect(small).toEqual([])
  })
})

test.describe('home en móvil con movimiento reducido o sin JavaScript (FR-650)', () => {
  onlyIn('mobile-chromium')

  test('con movimiento reducido no hay barrido, profundidad ni respiración', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    expect(await sweepAnimations(page)).toEqual([])
    expect(await page.locator(SWEEP).evaluate((element) => getComputedStyle(element).display)).toBe('none')
    for (const role of await roleState(page)) {
      expect(role.animation).toBe('none')
      expect(role.sweep).toBe('none')
    }
    expect(await cueAnimations(page)).toEqual([])
    expect(await cueAnimations(page, 'icon')).toEqual([])
  })

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('se ve como hoy: sin barrido, sin tarjetas flotantes y sin respiración', async ({ page }) => {
      await page.goto('/es')
      await expect(page.locator('html')).not.toHaveAttribute('data-js', /.*/)
      expect(await sweepAnimations(page)).toEqual([])
      for (const role of await roleState(page)) {
        expect(role.animation).toBe('none')
        expect(role.border).toBe(0)
        expect(role.background).toBe('rgba(0, 0, 0, 0)')
        expect(role.sweep).toBe('none')
      }
      expect((await cueAnimations(page)).map((animation) => animation.name)).toEqual([])
      expect(await cueAnimations(page, 'icon')).toEqual([])
    })
  })
})

test.describe('escritorio sin cambios (FR-651)', () => {
  onlyIn('desktop-chromium')

  test('ni barrido, ni tarjetas, ni respiración a 1280 px', async ({ page }) => {
    await open(page)
    expect(await sweepAnimations(page)).toEqual([])
    expect(await page.locator(SWEEP).evaluate((element) => getComputedStyle(element).display)).toBe('none')
    for (const role of await roleState(page)) {
      expect(role.animation).toBe('none')
      expect(role.border).toBe(0)
      expect(role.background).toBe('rgba(0, 0, 0, 0)')
      expect(role.sweep).toBe('none')
    }
    expect(await cueAnimations(page)).toEqual([])
    expect(await cueAnimations(page, 'icon')).toEqual([])
  })
})
