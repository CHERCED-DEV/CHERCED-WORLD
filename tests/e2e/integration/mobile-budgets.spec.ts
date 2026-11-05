import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test'
import { blurredSurfaces } from '../m0/support'
import { ALL_WIDTHS, hydrated, introSeen, onlyMobile, OPEN_SHEET, openReady, scrollThrough } from './support/mobile'
import { declaredMotions, feedbackTransitions, keyframeRules, notCompositorOnly, signatureWithProperties, type Declared } from './support/motion-audit'
import { AUDIT_PAGES, EXHAUSTIVE, pendingPage } from './support/pages'

const BASELINE = process.env.E2E_BASELINE_URL ?? ''
const BLUR_BUDGET = 3
const CLS = 0.1
const INP_MS = 200

const BLUR_IN_FULL = new Set(['/es', '/en', '/es/aboutMe', '/es/services', '/es/portfolio', '/es/portfolio/1', '/es/portfolio/12', '/es/blog', '/en/blog/post5', '/es/contactMe', '/es/privacy', '/en/now', '/es/no-existe'])

const MOTION_PAGES = ['/es', '/es/aboutMe', '/es/services', '/es/portfolio', '/es/portfolio/12', '/es/contactMe', '/en/now']

async function midRangeCpu(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
}

test.describe(`presupuesto de cristal: ${BLUR_BUDGET} o menos superficies con blur en cada página (FR-602, SC-602)`, () => {
  onlyMobile()

  for (const path of AUDIT_PAGES) {
    test(`${path}: de arriba abajo`, BLUR_IN_FULL.has(path) ? { tag: ALL_WIDTHS } : { tag: EXHAUSTIVE }, async ({ page }) => {
      const pending = pendingPage(path)
      test.skip(Boolean(pending), pending ?? '')
      test.setTimeout(90_000)
      await introSeen(page)
      await page.goto(path)
      const failures: string[] = []
      await scrollThrough(page, async (y) => {
        const blurred = await blurredSurfaces(page)
        if (blurred.length > BLUR_BUDGET) failures.push(`y=${y}: ${blurred.join(', ')}`)
      }, 640, 60)
      expect(failures).toEqual([])
    })
  }
})

async function collectMotions(page: Page, path: string): Promise<Declared[]> {
  await introSeen(page)
  const response = await page.goto(path)
  expect(response?.status(), `${path} responde`).toBe(200)
  await page.waitForTimeout(400)
  const scan = async () => {
    const pause = await page.addStyleTag({ content: '*, *::before, *::after { animation-play-state: paused !important; }' })
    const found = await declaredMotions(page)
    await pause.evaluate((element) => element.remove())
    return found
  }
  const seen: Declared[] = [...(await scan())]
  await scrollThrough(page, async () => {}, 700, 120)
  seen.push(...(await scan()))
  if (!BASELINE) return seen
  return [...seen.filter((motion) => !motion.signature.startsWith('animación ')), ...(await keyframeRules(page))]
}

async function baselineMotions(browser: Browser, testInfo: TestInfo, path: string): Promise<Declared[]> {
  const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = testInfo.project.use
  const context = await browser.newContext({ baseURL: BASELINE, viewport, deviceScaleFactor, isMobile, hasTouch, userAgent })
  try {
    return await collectMotions(await context.newPage(), path)
  } finally {
    await context.close()
  }
}

test.describe('las animaciones nuevas solo mueven transform y opacity (FR-653)', () => {
  onlyMobile()

  for (const path of MOTION_PAGES) {
    test(`${path}`, async ({ page, browser }, testInfo) => {
      test.setTimeout(240_000)
      const pending = pendingPage(path)
      test.skip(Boolean(pending), pending ?? '')
      const current = await collectMotions(page, path)
      if (BASELINE) {
        const before = new Set((await baselineMotions(browser, testInfo, path)).map(signatureWithProperties))
        const added = current.filter((motion) => !before.has(signatureWithProperties(motion)))
        testInfo.annotations.push({ type: 'transiciones de color, sombra o luz (permitidas)', description: feedbackTransitions(added).join(' · ') || 'ninguna' })
        expect(notCompositorOnly(added), `animaciones y transiciones que no existían en ${BASELINE}`).toEqual([])
      } else {
        const mine = current.filter((motion) => motion.mobile006)
        testInfo.annotations.push({ type: 'base', description: 'sin E2E_BASELINE_URL: se revisan las piezas móviles de la 006' })
        testInfo.annotations.push({ type: 'transiciones de color, sombra o luz (permitidas)', description: feedbackTransitions(mine).join(' · ') || 'ninguna' })
        expect(notCompositorOnly(mine), 'animaciones y transiciones de las piezas móviles de la 006').toEqual([])
      }
    })
  }
})

type Interaction = { name: string; blocking: number; duration: number }

async function watchInteractions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store: Interaction[] = []
    ;(window as unknown as { __cwInteractions: Interaction[] }).__cwInteractions = store
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEventTiming & { interactionId?: number }>) {
        if (entry.interactionId) store.push({ name: entry.name, blocking: entry.processingEnd - entry.startTime, duration: entry.duration })
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit)
  })
}

async function worstInteraction(page: Page): Promise<Interaction> {
  await page.waitForTimeout(600)
  const all = await page.evaluate(() => (window as unknown as { __cwInteractions: Interaction[] }).__cwInteractions)
  return all.reduce((worst, entry) => (entry.blocking > worst.blocking ? entry : worst), { name: 'ninguna', blocking: 0, duration: 0 })
}

const INTERACTIONS: ReadonlyArray<{ path: string; what: string; run: (page: Page) => Promise<void> }> = [
  {
    path: '/es',
    what: 'abrir y cerrar el menú del dock',
    run: async (page) => {
      await page.locator('[data-cw-menu-button]').tap()
      await expect(page.locator('[data-cw-float-menu]')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.locator('[data-cw-float-menu]')).toBeHidden()
    },
  },
  {
    path: '/es/aboutMe',
    what: 'tocar un lóbulo, pasar al siguiente y cerrar la hoja',
    run: async (page) => {
      const lobe = page.locator('[data-cw-lobe]').first()
      await lobe.scrollIntoViewIfNeeded()
      await lobe.tap()
      const sheet = page.locator(OPEN_SHEET)
      await expect(sheet).toBeVisible()
      await sheet.locator('[data-cw-sheet-next]').tap()
      await sheet.locator('[data-cw-sheet-close]').tap()
      await expect(page.locator(OPEN_SHEET)).toHaveCount(0)
    },
  },
  {
    path: '/es/services',
    what: 'girar la primera tarjeta de la pila',
    run: async (page) => {
      const flip = page.locator('[data-cw-service-stack] button[aria-expanded]').first()
      await flip.scrollIntoViewIfNeeded()
      await flip.tap()
      await expect(flip).toHaveAttribute('aria-expanded', 'true')
      await flip.tap()
    },
  },
  {
    path: '/es/portfolio/12',
    what: 'pasar la galería y enfocar una capa del diagrama',
    run: async (page) => {
      const next = page.locator('[data-cw-gallery-step="next"]')
      if ((await next.count()) > 0) {
        await next.scrollIntoViewIfNeeded()
        await next.tap()
      }
      const layer = page.locator('[data-cw-diagram-layer]').nth(1)
      await layer.scrollIntoViewIfNeeded()
      await layer.tap()
      await expect(layer).toHaveAttribute('aria-pressed', 'true')
    },
  },
]

test.describe(`con la CPU 4× más lenta: CLS < ${CLS} e INP < ${INP_MS} ms (SC-603)`, () => {
  onlyMobile()

  for (const { path, what, run } of INTERACTIONS) {
    test(`${path}: CLS de la carga y del recorrido`, { tag: ALL_WIDTHS }, async ({ page }, testInfo) => {
      test.setTimeout(120_000)
      await introSeen(page)
      await page.addInitScript(() => {
        const store = { cls: 0 }
        ;(window as unknown as { __cwShift: typeof store }).__cwShift = store
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!entry.hadRecentInput) store.cls += entry.value
        }).observe({ type: 'layout-shift', buffered: true })
      })
      await midRangeCpu(page)
      await page.goto(path, { waitUntil: 'load' })
      await hydrated(page)
      await scrollThrough(page, async () => {}, 500, 250)
      const cls = await page.evaluate(() => (window as unknown as { __cwShift: { cls: number } }).__cwShift.cls)
      testInfo.annotations.push({ type: 'CLS', description: `${path}: ${cls.toFixed(3)}` })
      expect(cls).toBeLessThan(CLS)
    })

    test(`${path}: ${what}, con espera y procesamiento por debajo de ${INP_MS} ms`, async ({ page }, testInfo) => {
      test.setTimeout(120_000)
      await watchInteractions(page)
      await openReady(page, path)
      await midRangeCpu(page)
      await run(page)
      const worst = await worstInteraction(page)
      const detail = `${worst.name}: ${Math.round(worst.blocking)} ms de espera y procesamiento (${Math.round(worst.duration)} ms hasta pintar en Chromium sin GPU)`
      testInfo.annotations.push({ type: 'INP', description: `${path}: ${detail}` })
      expect(worst.blocking, detail).toBeLessThan(INP_MS)
    })
  }
})
