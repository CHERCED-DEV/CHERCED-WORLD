import { expect, test, type Page } from '@playwright/test'

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

async function open(page: Page, path: string) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path)
}

async function scrollTo(page: Page, selector: string, ratio: number) {
  for (let pass = 0; pass < 3; pass++) {
    await page.locator(selector).evaluate((node, value) => {
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - window.innerHeight * value, behavior: 'instant' })
    }, ratio)
    await page.waitForTimeout(250)
  }
}

function scale(page: Page, selector: string, axis: 'x' | 'y'): Promise<number[]> {
  return page.locator(selector).evaluateAll(
    (nodes, axis) =>
      nodes.map((node) => {
        const transform = getComputedStyle(node, '::after').transform
        if (transform === 'none') return 1
        const values = transform.match(/matrix\(([^)]+)\)/)![1]!.split(',').map(Number)
        return Number((axis === 'x' ? values[0]! : values[3]!).toFixed(2))
      }),
    axis,
  )
}

const pills = '[data-cw-scene-link]'

test.describe('013: animaciones guiadas por scroll', () => {
  test('C1: las escenas leídas quedan llenas, la actual va a medias y las de abajo en cero', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/aboutMe')
    for (let pass = 0; pass < 3; pass++) {
      await page.locator('#scene-knowledge').evaluate((node) => {
        const box = node.getBoundingClientRect()
        window.scrollTo({ top: box.top + window.scrollY + box.height / 2 - window.innerHeight / 2, behavior: 'instant' })
      })
      await page.waitForTimeout(250)
    }
    await expect
      .poll(async () => {
        const [who, career, knowledge, heading] = await scale(page, pills, 'x')
        return who === 1 && career === 1 && knowledge! > 0 && knowledge! < 1 && heading === 0
      })
      .toBe(true)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect.poll(() => scale(page, pills, 'x')).toEqual([1, 1, 1, 1])
  })

  test('C1 en celular: los hilos entre puntos se llenan y el último punto no tiene hilo', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/aboutMe')
    expect(await page.locator('[data-cw-scene-dot]').last().evaluate((node) => getComputedStyle(node, '::after').display)).toBe('none')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect.poll(async () => (await scale(page, '[data-cw-scene-dot]', 'y')).slice(0, 3)).toEqual([1, 1, 1])
  })

  test('C1 con movimiento reducido: sin líneas en el índice', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/aboutMe')
    const contents = await page.locator(pills).evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node, '::after').content))
    expect(contents).toEqual(['none', 'none', 'none', 'none'])
  })

  test('C4: la ruta de "Hacia dónde voy" se traza al llegar y queda completa', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/aboutMe')
    const branches = '[data-cw-heading-map] ol > li'
    const spine = () =>
      page.locator('[data-cw-heading-map] ol').evaluate((node) => {
        const transform = getComputedStyle(node, '::before').transform
        return transform === 'none' ? 1 : Number(transform.match(/matrix\(([^)]+)\)/)![1]!.split(',').map(Number)[3]!.toFixed(2))
      })
    await scrollTo(page, '[data-cw-heading-map]', 0.98)
    await expect.poll(spine).toBeLessThan(0.3)
    expect((await scale(page, branches, 'x')).at(-1)).toBe(0)
    await scrollTo(page, '[data-cw-heading-map]', 0.3)
    await expect.poll(spine).toBe(1)
    await expect.poll(() => scale(page, branches, 'x')).toEqual([1, 1, 1, 1])
  })

  test('C4 con movimiento reducido: el trazo está completo desde el principio', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/aboutMe')
    await scrollTo(page, '[data-cw-heading-map]', 0.98)
    expect(await scale(page, '[data-cw-heading-map] ol > li', 'x')).toEqual([1, 1, 1, 1])
  })

  test('C2: en celular la imagen centrada está en 1 y la que llega crece durante el gesto', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/portfolio')
    const media = '[data-cw-slide-media]'
    const state = () =>
      page.locator(media).evaluateAll((nodes) =>
        nodes.slice(0, 2).map((node) => {
          const style = getComputedStyle(node)
          return [Number(Number(style.opacity).toFixed(2)), Number(Number(style.scale).toFixed(2))]
        }),
      )
    const track = page.locator('[data-cw-slide]').first().locator('..')
    await track.scrollIntoViewIfNeeded()
    await expect.poll(state).toEqual([
      [1, 1],
      [0.55, 0.92],
    ])
    await track.evaluate((node) => {
      node.style.scrollSnapType = 'none'
      node.scrollTo({ left: node.clientWidth / 2, behavior: 'instant' })
    })
    await expect
      .poll(async () => {
        const [current, next] = await state()
        return current![0]! < 1 && next![0]! > 0.55 && next![1]! > 0.92
      })
      .toBe(true)
    expect(await page.locator('[data-cw-slide]').first().locator('h3').evaluate((node) => getComputedStyle(node).opacity)).toBe('1')
  })

  test('C2 con movimiento reducido: la imagen no se anima', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/portfolio')
    const names = await page.locator('[data-cw-slide-media]').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName))
    expect(new Set(names)).toEqual(new Set(['none']))
  })

  const C8_CARD = '[data-cw-home-banner] > [data-cw-glass]'
  const C8_PANEL = '[data-cw-home-now] > [data-cw-glass]'

  type GpuBenchmarking = {
    MOUSE_INPUT: number
    smoothScrollBy: (distance: number, done: () => void, x: number, y: number, source: number, direction: string, speed: number, precise: boolean) => void
  }

  async function c8Stops(page: Page) {
    return page.locator(C8_PANEL).evaluate((node) => {
      const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
      return {
        panel: Math.round(node.getBoundingClientRect().top + window.scrollY - padding),
        max: Math.round(document.documentElement.scrollHeight - window.innerHeight),
      }
    })
  }

  async function c8Rest(page: Page) {
    let last = Number.NaN
    let still = 0
    for (let pass = 0; pass < 60 && still < 2; pass++) {
      await page.waitForTimeout(300)
      const y = await page.evaluate(() => Math.round(window.scrollY))
      still = y === last ? still + 1 : 0
      last = y
    }
    return last
  }

  async function c8ToPanel(page: Page, panelStop: number) {
    await page.locator('main').focus()
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 15_000 }).toBe(panelStop)
  }

  for (const lang of ['es', 'en'] as const) {
    test(`C8 (${lang}): una flecha pasa del hero al panel y vuelve, bajo el panel se recorre libre hasta el pie, y cada parada queda en 1`, async ({ page }) => {
      onlyIn('desktop-chromium', 'mobile-chromium')
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await open(page, `/${lang}`)
      const card = page.locator(C8_CARD)
      const panel = page.locator(C8_PANEL)
      const fade = (locator: typeof card) => locator.evaluate((node) => Number(Number(getComputedStyle(node).opacity).toFixed(2)))
      const { panel: panelStop, max } = await c8Stops(page)
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe('y mandatory')
      expect(await page.locator('#footer').evaluate((node) => getComputedStyle(node).scrollSnapAlign)).toBe('none')
      expect(await panel.evaluate((node) => getComputedStyle(node).scrollSnapStop)).toBe('always')
      await expect.poll(() => fade(card)).toBe(1)
      const press = async (key: string, stop: number) => {
        await page.keyboard.press(key)
        await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 15_000 }).toBe(stop)
      }
      await c8ToPanel(page, panelStop)
      await expect.poll(() => fade(panel)).toBe(1)
      expect(await panel.evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBeGreaterThan(0)
      await page.keyboard.press('ArrowDown')
      const free = await c8Rest(page)
      expect(free, 'bajo el panel una flecha avanza un paso, no salta al pie').toBeGreaterThan(panelStop)
      expect(free).toBeLessThanOrEqual(panelStop + 100)
      await press('End', max)
      let up = max
      for (let page_ = 0; page_ < 12 && up > panelStop; page_++) {
        await page.keyboard.press('PageUp')
        up = await c8Rest(page)
      }
      expect(up, 'subiendo por páginas desde el pie, la última parada es el panel').toBe(panelStop)
      await press('ArrowUp', 0)
      await expect.poll(() => fade(card)).toBe(1)
    })
  }

  test('C8: una ráfaga de rueda bajo el panel avanza sin rebotar al panel ni saltar al pie', async ({ page }) => {
    onlyIn('desktop-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es')
    const { panel: panelStop, max } = await c8Stops(page)
    await c8ToPanel(page, panelStop)
    await page.evaluate(() => {
      const trail: number[] = []
      ;(window as unknown as { __c8: number[] }).__c8 = trail
      const tick = () => {
        trail.push(Math.round(window.scrollY))
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.mouse.move(640, 400)
    for (let step = 0; step < 8; step++) {
      await page.mouse.wheel(0, 30)
      await page.waitForTimeout(40)
    }
    const rest = await c8Rest(page)
    const trail = await page.evaluate(() => (window as unknown as { __c8: number[] }).__c8)
    let peak = trail[0]!
    const back = trail.some((y) => {
      peak = Math.max(peak, y)
      return y < peak - 2
    })
    expect(back, 'la ráfaga no rebota hacia el panel').toBe(false)
    expect(rest).toBeGreaterThan(panelStop + 150)
    expect(rest, 'la ráfaga no salta hasta el pie').toBeLessThan(max)
  })

  test('C8: con la rueda del mouse, un golpe más desde el panel no salta al pie y uno de vuelta regresa al panel', async ({ browser, baseURL }) => {
    onlyIn('desktop-chromium')
    test.setTimeout(120_000)
    const wheel = await browser.browserType().launch({ args: ['--enable-gpu-benchmarking'] })
    try {
      const page = await wheel.newPage({ baseURL, viewport: { width: 1280, height: 800 }, reducedMotion: 'no-preference' })
      await open(page, '/es')
      const { panel: panelStop, max } = await c8Stops(page)
      const notch = (direction: 'down' | 'up') =>
        page.evaluate(
          (direction) =>
            new Promise<void>((resolve) => {
              const bench = (window as unknown as { chrome: { gpuBenchmarking: GpuBenchmarking } }).chrome.gpuBenchmarking
              bench.smoothScrollBy(100, resolve, innerWidth / 2, innerHeight / 2, bench.MOUSE_INPUT, direction, 100_000, false)
            }),
          direction,
        )
      await notch('down')
      expect(await c8Rest(page), 'un golpe pasa del hero al panel').toBe(panelStop)
      await notch('down')
      const below = await c8Rest(page)
      expect(below).toBeGreaterThan(panelStop)
      expect(below, 'el segundo golpe no salta hasta el pie').toBeLessThan(max)
      expect(below - panelStop).toBeLessThanOrEqual(210)
      await notch('up')
      expect(await c8Rest(page), 'un golpe de vuelta regresa al panel').toBe(panelStop)
      await notch('up')
      expect(await c8Rest(page), 'y otro, al hero').toBe(0)
    } finally {
      await wheel.close()
    }
  })

  test('C8 en celular: en el hero el dedo vuelve a la parada y bajo el panel se queda donde lo suelta', async ({ page }) => {
    onlyIn('mobile-chromium')
    test.setTimeout(120_000)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es')
    const { panel: panelStop, max } = await c8Stops(page)
    const cdp = await page.context().newCDPSession(page)
    const drag = async (distance: number) => {
      const x = 195
      const from = 600
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: from }] })
      for (let step = 1; step <= 12; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: from - (distance * step) / 12 }] })
        await page.waitForTimeout(40)
      }
      await page.waitForTimeout(250)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    await drag(150)
    expect(await c8Rest(page), 'en el hero un arrastre corto vuelve al hero').toBe(0)
    await c8ToPanel(page, panelStop)
    await drag(180)
    const rest = await c8Rest(page)
    expect(rest, 'bajo el panel el dedo recorre libre').toBeGreaterThan(panelStop + 100)
    expect(rest).toBeLessThan(max)
  })

  test('C8: la tarjeta se aleja y el panel llega durante el paso', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es')
    const midway = await page.evaluate(async () => {
      document.documentElement.style.scrollSnapType = 'none'
      const panel = document.querySelector('[data-cw-home-now] > [data-cw-glass]')!
      const stop = panel.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: stop / 2, behavior: 'instant' })
      await new Promise((resolve) => setTimeout(resolve, 300))
      const card = getComputedStyle(document.querySelector('[data-cw-home-banner] > [data-cw-glass]')!)
      return { card: Number(card.opacity), scale: Number(card.scale), panel: Number(getComputedStyle(panel).opacity) }
    })
    expect(midway.card).toBeLessThan(1)
    expect(midway.scale).toBeLessThan(1)
    expect(midway.panel).toBeGreaterThan(0.35)
    expect(midway.panel).toBeLessThan(1)
  })

  test('C8: si el hero no cabe, se recorre libre hasta ver la tarjeta completa', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.setViewportSize({ width: 375, height: 600 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es')
    const bottom = await page.evaluate(async () => {
      const card = document.querySelector('[data-cw-home-banner] > [data-cw-glass]')!
      const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)
      const target = card.getBoundingClientRect().bottom + window.scrollY - (window.innerHeight - padding)
      window.scrollTo({ top: target, behavior: 'instant' })
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { card: card.getBoundingClientRect().bottom, limit: window.innerHeight - padding, y: window.scrollY, opacity: Number(getComputedStyle(card).opacity) }
    })
    expect(bottom.y).toBeGreaterThan(0)
    expect(bottom.card).toBeLessThanOrEqual(bottom.limit + 1)
    expect(bottom.opacity).toBeGreaterThan(0.9)
  })

  test('C8 con movimiento reducido: sin snap y sin animación', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es')
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toBe('none')
    const names = await page
      .locator('[data-cw-home-banner] > [data-cw-glass], [data-cw-home-now] > [data-cw-glass]')
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName))
    expect(names).toEqual(['none', 'none'])
  })

  test('la barra de lectura de Synergos se ve y avanza con movimiento reducido, sin brillo', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/synergos')
    const bar = page.locator('[data-cw-scroll-progress]')
    expect(await bar.evaluate((node) => getComputedStyle(node).display)).toBe('block')
    const value = () =>
      bar.evaluate((node) => {
        const transform = getComputedStyle(node).transform
        return transform === 'none' ? 1 : Number(transform.match(/matrix\(([^)]+)\)/)![1]!.split(',')[0])
      })
    expect(await value()).toBeLessThan(0.1)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect.poll(value).toBeGreaterThan(0.9)
    expect(await bar.evaluate((node) => getComputedStyle(node).boxShadow)).toBe('none')
  })
})
