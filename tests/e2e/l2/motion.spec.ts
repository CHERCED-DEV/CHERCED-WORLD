import { expect, type Page, test } from '@playwright/test'

const NAV_ES: Array<[label: string, path: string]> = [
  ['Inicio', '/es'],
  ['Sobre mí', '/es/aboutMe'],
  ['Servicios', '/es/services'],
  ['Portafolio', '/es/portfolio'],
  ['Blog', '/es/blog'],
  ['Contáctame', '/es/contactMe'],
]

type FrameStats = { fps: number; callsPerFrame: number; calls: number }

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
}

async function instrumentFrames(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __cwFrames: Map<number, number> }
    w.__cwFrames = new Map()
    const original = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (callback) =>
      original((time) => {
        w.__cwFrames.set(time, (w.__cwFrames.get(time) ?? 0) + 1)
        callback(time)
      })
  })
}

async function measureFrames(page: Page, ms = 1500): Promise<FrameStats> {
  return page.evaluate(async (duration) => {
    const w = window as unknown as { __cwFrames: Map<number, number> }
    w.__cwFrames.clear()
    const probe = (await new Promise<number[]>((resolve) => {
      const deltas: number[] = []
      let last: number | null = null
      const start = performance.now()
      const tick = (time: number) => {
        if (last !== null) deltas.push(time - last)
        last = time
        if (time - start < duration) requestAnimationFrame(tick)
        else resolve(deltas)
      }
      requestAnimationFrame(tick)
    })).sort((a, b) => a - b)
    const counts = [...w.__cwFrames.values()].map((count) => count - 1).sort((a, b) => a - b)
    return {
      fps: Math.round(1000 / probe[probe.length >> 1]),
      callsPerFrame: counts[counts.length >> 1] ?? 0,
      calls: counts.reduce((sum, count) => sum + count, 0),
    }
  }, ms)
}

async function canvasSnapshot(page: Page): Promise<string> {
  return page.locator('[data-cw-background] canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())
}

async function navigateTo(page: Page, label: string, mobile: boolean) {
  if (mobile) {
    await page.locator('[data-cw-menu-button]').click()
    await page.locator('[data-cw-float-menu]').getByRole('link', { name: label, exact: true }).click()
  } else {
    await page.locator('header nav').getByRole('link', { name: label, exact: true }).click()
  }
}

test.describe('GlitteringSea v2', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('una sola animación tras 10 navegaciones, con la misma fluidez', async ({ page }, testInfo) => {
    const mobile = testInfo.project.name === 'mobile-chromium'
    await skipIntro(page)
    await instrumentFrames(page)
    await page.goto('/es/aboutMe')
    const background = page.locator('[data-cw-background]')
    await expect(background).toHaveAttribute('data-state', 'running')
    await page.evaluate(() => {
      ;(window as unknown as { __cwCanvas: Element | null }).__cwCanvas = document.querySelector('[data-cw-background] canvas')
    })
    const first = await measureFrames(page)

    const homeReady = (await page.request.get('/es')).status() === 200
    const stops = homeReady ? NAV_ES : NAV_ES.slice(1)
    for (let i = 1; i <= 10; i++) {
      const [label, path] = stops[(i + 1) % stops.length]
      await navigateTo(page, label, mobile)
      await page.waitForURL((url) => url.pathname === path)
    }
    const [homeLabel, homePath] = stops[0]
    await navigateTo(page, homeLabel, mobile)
    await page.waitForURL((url) => url.pathname === homePath)
    if (!homeReady) {
      testInfo.annotations.push({ type: 'pendiente', description: 'el home /es es de L1; aquí se vuelve a /es/aboutMe y se repite al integrar' })
    }

    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(background).toHaveCount(1)
    await expect(background).toHaveAttribute('data-state', 'running')
    expect(
      await page.evaluate(
        () => document.querySelector('[data-cw-background] canvas') === (window as unknown as { __cwCanvas: Element | null }).__cwCanvas,
      ),
    ).toBe(true)
    const after = await measureFrames(page)

    testInfo.annotations.push({
      type: 'fps',
      description: `${testInfo.project.name}: ${first.fps} fps al entrar, ${after.fps} fps tras 10 navegaciones; ${await background.getAttribute('data-particles')} partículas, mediana del motor ${await background.getAttribute('data-frame-ms')} ms`,
    })
    expect(first.callsPerFrame).toBe(1)
    expect(after.callsPerFrame).toBe(1)
    expect(after.fps).toBeGreaterThanOrEqual(Math.floor(first.fps * 0.8))
  })

  test('se pausa con la pestaña oculta y se reanuda al volver', async ({ page }) => {
    await skipIntro(page)
    await instrumentFrames(page)
    await page.goto('/es/aboutMe')
    const background = page.locator('[data-cw-background]')
    await expect(background).toHaveAttribute('data-state', 'running')

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(background).toHaveAttribute('data-state', 'paused')
    const paused = await canvasSnapshot(page)
    const idle = await measureFrames(page, 600)
    expect(idle.calls).toBe(0)
    expect(await canvasSnapshot(page)).toBe(paused)

    await page.evaluate(() => {
      const doc = document as unknown as Record<string, unknown>
      delete doc.hidden
      delete doc.visibilityState
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(background).toHaveAttribute('data-state', 'running')
    expect((await measureFrames(page, 600)).callsPerFrame).toBe(1)
    expect(await canvasSnapshot(page)).not.toBe(paused)
  })

  test('las partículas siguen al puntero o al toque', async ({ page }, testInfo) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const background = page.locator('[data-cw-background]')
    await expect(background).toHaveAttribute('data-state', 'running')
    await expect(background).toHaveAttribute('data-pointer', 'off')

    if (testInfo.project.name === 'mobile-chromium') {
      await page.evaluate(() => {
        const touch = new Touch({ identifier: 1, target: document.body, clientX: 150, clientY: 420 })
        window.dispatchEvent(new TouchEvent('touchstart', { touches: [touch] }))
      })
      await expect(background).toHaveAttribute('data-pointer', 'on')
      await page.evaluate(() => window.dispatchEvent(new TouchEvent('touchend', { touches: [] })))
      await expect(background).toHaveAttribute('data-pointer', 'off')
    } else {
      await page.mouse.move(400, 400)
      await page.mouse.move(640, 420, { steps: 8 })
      await expect(background).toHaveAttribute('data-pointer', 'on')
      await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerout', { relatedTarget: null })))
      await expect(background).toHaveAttribute('data-pointer', 'off')
    }
  })

  test('recolorea con cw:theme-change: blancas en oscuro, negras en claro', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-background]')).toHaveAttribute('data-state', 'running')
    await page.waitForTimeout(800)

    const tone = () =>
      page.locator('[data-cw-background] canvas').evaluate((canvas: HTMLCanvasElement) => {
        const context = canvas.getContext('2d')
        if (!context) return null
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
        let sum = 0
        let weight = 0
        for (let i = 0; i < data.length; i += 16) {
          const alpha = data[i + 3] / 255
          if (alpha < 0.15) continue
          sum += ((data[i] + data[i + 1] + data[i + 2]) / 3) * alpha
          weight += alpha
        }
        return weight > 0 ? sum / weight : null
      })

    expect(await tone()).toBeGreaterThan(170)
    await page.locator('[data-cw-theme-toggle]').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.waitForTimeout(300)
    expect(await tone()).toBeLessThan(90)
  })

  test('con reducir movimiento el fondo queda estático y reacciona al cambio de preferencia', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipIntro(page)
    await instrumentFrames(page)
    await page.goto('/es/aboutMe')
    const background = page.locator('[data-cw-background]')
    await expect(background).toHaveAttribute('data-state', 'static')

    const before = await canvasSnapshot(page)
    expect((await measureFrames(page, 800)).calls).toBe(0)
    await page.mouse.move(300, 300)
    await page.mouse.move(600, 500, { steps: 6 })
    expect(await canvasSnapshot(page)).toBe(before)

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(background).toHaveAttribute('data-state', 'running')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(background).toHaveAttribute('data-state', 'static')
  })
})

test.describe('intro de marca', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  async function recordIntro(page: Page) {
    await page.addInitScript(() => {
      const w = window as unknown as { __cwIntro: { first: number | null; last: number | null } }
      w.__cwIntro = { first: null, last: null }
      const poll = () => {
        const intro = document.querySelector('[data-cw-intro]')
        if (intro) {
          const style = getComputedStyle(intro)
          if (style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0) {
            const now = performance.now()
            w.__cwIntro.first ??= now
            w.__cwIntro.last = now
          }
        }
        requestAnimationFrame(poll)
      }
      requestAnimationFrame(poll)
    })
  }

  const introTimes = (page: Page) =>
    page.evaluate(() => (window as unknown as { __cwIntro: { first: number | null; last: number | null } }).__cwIntro)

  test('dura como máximo 1,5 s y se muestra una vez por sesión', async ({ page }, testInfo) => {
    await recordIntro(page)
    await page.goto('/es/aboutMe')
    const intro = page.locator('[data-cw-intro]')
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen', { timeout: 3000 })
    await expect(intro).toBeHidden()
    await expect(intro).toContainText('CHERCED')
    expect(await page.evaluate(() => sessionStorage.getItem('cw-intro-seen'))).toBe('1')

    const { first, last } = await introTimes(page)
    expect(first).not.toBeNull()
    const visibleFor = (last ?? 0) - (first ?? 0)
    testInfo.annotations.push({ type: 'intro', description: `${testInfo.project.name}: visible ${Math.round(visibleFor)} ms, oculta a los ${Math.round(last ?? 0)} ms de la navegación` })
    expect(visibleFor).toBeLessThanOrEqual(1500)

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen')
    await page.waitForTimeout(300)
    expect((await introTimes(page)).first).toBeNull()

    await page.goto('/es/services')
    await page.waitForTimeout(300)
    expect((await introTimes(page)).first).toBeNull()
  })

  test('el primer clic salta la intro y además activa lo que se clicó', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'el clic en la navegación es de escritorio')
    await page.goto('/es/aboutMe', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'pending')
    await page.locator('header nav').getByRole('link', { name: 'Servicios', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen')
    await expect(page.locator('[data-cw-intro]')).toBeHidden()
    await page.waitForURL('**/es/services')
  })

  test('una tecla salta la intro sin perder su efecto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'teclado en escritorio')
    await page.goto('/es/aboutMe', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'pending')
    await page.keyboard.press('Tab')
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen')
    await expect(page.locator(':focus')).toHaveClass(/cw-skip-link/)
  })

  test('un toque salta la intro', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'toque en móvil')
    await page.goto('/es/aboutMe', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'pending')
    await page.touchscreen.tap(30, 780)
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen')
    await expect(page.locator('[data-cw-intro]')).toBeHidden()
  })

  test('con reducir movimiento la intro es estática y se anuncia', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe', { waitUntil: 'domcontentloaded' })
    const intro = page.locator('[data-cw-intro]')
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'pending')
    await expect(intro).toHaveAttribute('role', 'status')
    await expect(intro.getByText('CHERCED')).toBeVisible()
    const moving = await intro.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getComputedTiming().activeDuration !== 0)
        .filter((animation) => (animation.effect as KeyframeEffect | null)?.target !== element).length,
    )
    expect(moving).toBe(0)
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'seen', { timeout: 2000 })
  })
})

test.describe('preferencias del sistema', () => {
  onlyIn('desktop-chromium')

  test('con reducir transparencia las superficies glass son sólidas', async ({ page }) => {
    await skipIntro(page)
    const session = await page.context().newCDPSession(page)
    await session.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-transparency', value: 'reduce' },
        { name: 'prefers-color-scheme', value: 'dark' },
      ],
    })
    await page.goto('/es/aboutMe')
    const header = page.locator('header#header')
    await expect(header).toHaveCSS('background-color', 'rgb(17, 17, 17)')
    expect(await header.evaluate((element) => getComputedStyle(element).backdropFilter)).toMatch(/none|blur\(0px\)/)
    await expect(page.locator('[data-cw-background]')).toHaveAttribute('data-state', 'running')
  })
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('no hay intro ni fondo animado, y el contenido se ve', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-intro]')).toBeHidden()
    await expect(page.locator('[data-cw-background]')).toBeHidden()
    await expect(page.locator('header#header')).toBeVisible()
  })
})
