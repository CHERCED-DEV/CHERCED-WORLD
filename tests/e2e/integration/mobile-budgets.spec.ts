import { expect, test, type Browser, type Page, type TestInfo } from '@playwright/test'
import { blurredSurfaces } from '../m0/support'
import { ALL_WIDTHS, hydrated, introSeen, onlyMobile, OPEN_SHEET, openReady, scrollThrough } from './support/mobile'
import { declaredMotions, feedbackTransitions, keyframeRules, notCompositorOnly, signatureWithProperties, type Declared } from './support/motion-audit'
import { AUDIT_PAGES, EXHAUSTIVE, pendingPage } from './support/pages'

const BASELINE = process.env.E2E_BASELINE_URL ?? ''
const BLUR_BUDGET = 3
const CLS = 0.1
const INP_MS = 200
const INP_ROUNDS = 5
const INP_PAUSE_MS = 400

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
    await pause.evaluate((element) => (element as Element).remove())
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

type Interaction = { name: string; start: number; blocking: number; duration: number }

const NO_INTERACTION: Interaction = { name: 'ninguna', start: 0, blocking: 0, duration: 0 }

async function watchInteractions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const store: Interaction[] = []
    ;(window as unknown as { __cwInteractions: Interaction[] }).__cwInteractions = store
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEventTiming & { interactionId?: number }>) {
        if (entry.interactionId) store.push({ name: entry.name, start: entry.startTime, blocking: entry.processingEnd - entry.startTime, duration: entry.duration })
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit)
  })
}

async function interactions(page: Page): Promise<Interaction[]> {
  return page.evaluate(() => (window as unknown as { __cwInteractions: Interaction[] }).__cwInteractions)
}

function worstOf(entries: Interaction[]): Interaction {
  return entries.reduce((worst, entry) => (entry.blocking > worst.blocking ? entry : worst), NO_INTERACTION)
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

const INTERACTIONS: ReadonlyArray<{ path: string; what: string; run: (page: Page, round: number) => Promise<void> }> = [
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
    what: 'tocar un lóbulo distinto en cada toque, pasar al siguiente y cerrar la hoja',
    run: async (page, round) => {
      const lobes = page.locator('[data-cw-lobe]')
      const lobe = lobes.nth(round % (await lobes.count()))
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
      const stack = page.locator('[data-cw-service-stack]')
      const flip = stack.locator('button[aria-expanded]').first()
      const atFirstCard = async () => {
        await stack.evaluate((list) => {
          const first = list.firstElementChild
          const stick = first ? Number.parseFloat(getComputedStyle(first).top) || 0 : 0
          window.scrollTo({ top: list.getBoundingClientRect().top + window.scrollY - stick, behavior: 'instant' })
        })
        await expect
          .poll(() => stack.evaluate((list) => list.getAnimations({ subtree: true }).filter((item) => item instanceof CSSTransition && item.playState === 'running').length), {
            message: 'la pila termina sus transiciones antes del toque',
          })
          .toBe(0)
      }
      await atFirstCard()
      await flip.tap()
      await expect(flip).toHaveAttribute('aria-expanded', 'true')
      await atFirstCard()
      await flip.tap()
      await expect(flip).toHaveAttribute('aria-expanded', 'false')
    },
  },
  {
    path: '/es/portfolio/12',
    what: 'pasar la galería y enfocar una capa del diagrama',
    run: async (page, round) => {
      const next = page.locator('[data-cw-gallery-step="next"]')
      if ((await next.count()) > 0) {
        await next.scrollIntoViewIfNeeded()
        await next.tap()
      }
      const layers = page.locator('[data-cw-diagram-layer]')
      const layer = layers.nth((round + 1) % (await layers.count()))
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

    test(`${path}: ${what}, con la mediana de ${INP_ROUNDS} toques en espera y procesamiento por debajo de ${INP_MS} ms`, async ({ page }, testInfo) => {
      test.setTimeout(180_000)
      await watchInteractions(page)
      await openReady(page, path)
      await midRangeCpu(page)
      const windows: Array<[number, number]> = []
      for (let round = 0; round < INP_ROUNDS; round++) {
        const start = await page.evaluate(() => performance.now())
        await run(page, round)
        await page.waitForTimeout(INP_PAUSE_MS)
        windows.push([start, await page.evaluate(() => performance.now())])
      }
      await page.waitForTimeout(600)
      const all = await interactions(page)
      const rounds = windows.map(([from, to]) => worstOf(all.filter((entry) => entry.start >= from && entry.start < to)))
      const values = rounds.map((entry) => Math.round(entry.blocking))
      const middle = median(values)
      rounds.forEach((entry, round) =>
        testInfo.annotations.push({
          type: 'INP',
          description: `${path}, toque ${round + 1}: ${entry === NO_INTERACTION ? 'ninguna pasó de 16 ms' : entry.name} ${Math.round(entry.blocking)} ms de espera y procesamiento (${Math.round(entry.duration)} ms hasta pintar en Chromium sin GPU)`,
        }),
      )
      const detail = `mediana ${middle} ms de ${values.join(', ')} ms`
      testInfo.annotations.push({ type: 'INP mediana', description: `${path}: ${detail}` })
      expect(middle, detail).toBeLessThan(INP_MS)
    })
  }
})
