import { expect, type Page, test } from '@playwright/test'
import { contrastRatio, over, parseColor, requiredRatio, type Rgba, withAlpha } from '@/lib/motion/contrast'
import { decodePng } from './png'

const ROUTES = [
  '/es',
  '/es/aboutMe',
  '/es/services',
  '/es/portfolio',
  '/es/portfolio/1',
  '/es/blog',
  '/es/blog/post1',
  '/es/blog/post5',
  '/es/contactMe',
  '/es/privacy',
  '/es/esta-ruta-no-existe',
]
const NOT_FOUND_ROUTE = '/es/esta-ruta-no-existe'
const FRAMES = 4
const MAX_SCROLL_STEPS = 20
const HIDE_TEXT_ID = 'cw-contrast-hide-text'
const OWNER = 'data-cw-contrast-owner'
const SETTLE_ATTEMPTS = 3
const SETTLE_MS = 150
const FREEZE_STYLE = '*,*::before,*::after{transition:none!important}'

type TextSample = {
  text: string
  color: string
  opacity: number
  fontSize: number
  fontWeight: number
  rects: Array<{ x: number; y: number; width: number; height: number }>
  owner: number
}

type Measure = { worst: number; failed: boolean }

type Failure = { route: string; text: string; ratio: number; required: number; frame: number }

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name === 'no-js', 'el fondo animado necesita JS')
})

async function collectTexts(page: Page): Promise<TextSample[]> {
  const samples = await page.evaluate((ownerAttribute) => {
    type Box = { left: number; top: number; right: number; bottom: number }
    const found: TextSample[] = []
    const owners = new Map<Element, number>()
    for (const tagged of document.querySelectorAll(`[${ownerAttribute}]`)) tagged.removeAttribute(ownerAttribute)
    const viewport: Box = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
    const header = document.querySelector('body > header, header')
    const headerPosition = header ? getComputedStyle(header).position : 'static'
    const headerBottom = header && (headerPosition === 'fixed' || headerPosition === 'sticky') ? header.getBoundingClientRect().bottom : 0
    const leavingUnderHeader = (element: Element, rects: DOMRect[]) =>
      headerBottom > 0 && !header!.contains(element) && rects.some((rect) => rect.top < headerBottom && rect.bottom > 0)

    const isGlass = (element: Element) =>
      element.hasAttribute('data-cw-glass') || getComputedStyle(element).backdropFilter !== 'none'

    const onGlass = (element: Element) => {
      for (let current: Element | null = element; current; current = current.parentElement) {
        if (isGlass(current)) return true
      }
      return false
    }

    const visibleBox = (element: Element): Box | null => {
      const box = { ...viewport }
      let escaped = false
      for (let current: Element | null = element; current && current !== document.documentElement; current = current.parentElement) {
        if (current.matches('.cw-visually-hidden, .cw-skip-link')) return null
        const style = getComputedStyle(current)
        if (style.clip !== 'auto' && style.clip !== '') return null
        if (style.clipPath.startsWith('inset(50%')) return null
        const clips = style.overflowX !== 'visible' || style.overflowY !== 'visible'
        if (clips && !escaped) {
          const rect = current.getBoundingClientRect()
          if (rect.width <= 1 || rect.height <= 1) return null
          box.left = Math.max(box.left, rect.left)
          box.top = Math.max(box.top, rect.top)
          box.right = Math.min(box.right, rect.right)
          box.bottom = Math.min(box.bottom, rect.bottom)
        }
        if (style.position === 'fixed') escaped = true
      }
      return box.right - box.left >= 3 && box.bottom - box.top >= 6 ? box : null
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? ''
      const element = node.parentElement
      if (!text || !element || !onGlass(element)) continue
      if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
      const box = visibleBox(element)
      if (!box) continue
      let opacity = 1
      for (let current: Element | null = element; current; current = current.parentElement) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity)
      }
      if (opacity < 0.05) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const clientRects = [...range.getClientRects()]
      if (leavingUnderHeader(element, clientRects)) continue
      const rects = clientRects
        .map((rect) => {
          const x = Math.ceil(Math.max(box.left, rect.left))
          const y = Math.ceil(Math.max(box.top, rect.top))
          const right = Math.floor(Math.min(box.right, rect.right))
          const bottom = Math.floor(Math.min(box.bottom, rect.bottom))
          return { x, y, width: right - x, height: bottom - y }
        })
        .filter((rect) => rect.width >= 3 && rect.height >= 6)
        .filter((rect) => {
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
          return hit !== null && (hit === element || element.contains(hit) || hit.contains(element))
        })
      if (rects.length === 0) continue
      const style = getComputedStyle(element)
      if (!owners.has(element)) {
        owners.set(element, owners.size)
        element.setAttribute(ownerAttribute, String(owners.get(element)))
      }
      found.push({
        text: text.slice(0, 40),
        color: style.color,
        opacity,
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: Number.parseInt(style.fontWeight, 10),
        rects,
        owner: owners.get(element)!,
      })
    }
    return found
  }, OWNER)
  return samples.filter((sample) => (parseColor(sample.color)?.a ?? 1) * sample.opacity >= 0.05)
}

type Scan = { worstShown: number; low: Array<[number, number, number]> }

function scan(sample: TextSample, pixels: ReturnType<typeof decodePng>, required: number): Scan {
  const base = parseColor(sample.color)
  if (!base) return { worstShown: Number.POSITIVE_INFINITY, low: [] }
  const text = withAlpha(base, sample.opacity)
  let worstShown = Number.POSITIVE_INFINITY
  const low: Array<[number, number, number]> = []
  for (const rect of sample.rects) {
    for (let y = rect.y + 1; y < rect.y + rect.height - 1; y++) {
      for (let x = rect.x + 1; x < rect.x + rect.width - 1; x++) {
        if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) continue
        const i = (y * pixels.width + x) * 4
        const background: Rgba = { r: pixels.data[i], g: pixels.data[i + 1], b: pixels.data[i + 2], a: 1 }
        const ratio = contrastRatio(over(text, background), background)
        if (ratio < required) low.push([x, y, ratio])
        else if (ratio < worstShown) worstShown = ratio
      }
    }
  }
  return { worstShown, low }
}

function sampleKey(sample: TextSample): string {
  return JSON.stringify([sample.text, sample.color, sample.opacity, sample.fontSize, sample.fontWeight, sample.rects])
}

async function setTextHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate(
    ({ id, hidden }) => {
      document.getElementById(id)?.remove()
      if (!hidden) return
      const style = document.createElement('style')
      style.id = id
      style.textContent =
        '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}'
      document.head.append(style)
    },
    { id: HIDE_TEXT_ID, hidden },
  )
}

async function measure(page: Page, samples: TextSample[]): Promise<Measure[]> {
  await setTextHidden(page, true)
  const pixels = decodePng(await page.screenshot({ scale: 'css' }))
  const scans = samples.map((sample) => scan(sample, pixels, requiredRatio(sample.fontSize, sample.fontWeight)))
  const shown = await page.evaluate(
    ({ ownerAttribute, checks }) =>
      checks.map(({ owner, points }) => {
        const element = document.querySelector(`[${ownerAttribute}="${owner}"]`)
        return points.map(([x, y]) => {
          if (!element) return true
          const hit = document.elementFromPoint(x + 0.5, y + 0.5)
          return hit === null || hit === element || element.contains(hit) || hit.contains(element)
        })
      }),
    { ownerAttribute: OWNER, checks: samples.map((sample, index) => ({ owner: sample.owner, points: scans[index]!.low.map(([x, y]) => [x, y] as [number, number]) })) },
  )
  await setTextHidden(page, false)
  return scans.map((result, index) => {
    const visible = result.low.filter((_, point) => shown[index]![point])
    const worst = visible.reduce((min, [, , ratio]) => Math.min(min, ratio), result.worstShown)
    return { worst, failed: visible.length > 0 }
  })
}

async function auditFrame(page: Page, route: string, frame: number, failures: Failure[]): Promise<number> {
  let minimum = Number.POSITIVE_INFINITY
  const done = new Set<string>()
  let pending = await collectTexts(page)
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS && pending.length > 0; attempt++) {
    const results = await measure(page, pending)
    const after = await collectTexts(page)
    const unchanged = new Set(after.map(sampleKey))
    const last = attempt === SETTLE_ATTEMPTS - 1
    pending.forEach((sample, index) => {
      const key = sampleKey(sample)
      if (done.has(key) || (!unchanged.has(key) && !last)) return
      done.add(key)
      const { worst, failed } = results[index]!
      minimum = Math.min(minimum, worst)
      const required = requiredRatio(sample.fontSize, sample.fontWeight)
      if (failed) failures.push({ route, text: sample.text, ratio: Number(worst.toFixed(2)), required, frame })
    })
    pending = after.filter((sample) => !done.has(sampleKey(sample)))
    if (pending.length > 0 && !last) await page.waitForTimeout(SETTLE_MS)
  }
  return minimum
}

async function auditViewport(page: Page, route: string, failures: Failure[], touch: boolean): Promise<number> {
  let minimum = Number.POSITIVE_INFINITY
  const viewport = page.viewportSize() ?? { width: 1280, height: 800 }
  if (touch) await page.mouse.move(-1, -1)
  for (let frame = 0; frame < FRAMES; frame++) {
    if (!touch) await page.mouse.move(viewport.width * (0.3 + 0.13 * frame), viewport.height * (0.35 + 0.1 * frame), { steps: 4 })
    await page.waitForTimeout(180)
    minimum = Math.min(minimum, await auditFrame(page, route, frame, failures))
  }
  return minimum
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(`contraste del texto sobre glass en tema ${theme}`, () => {
    for (const route of ROUTES) {
      test(`${route}`, async ({ page }, testInfo) => {
        test.setTimeout(240_000)
        await page.emulateMedia({ colorScheme: theme })
        await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
        const response = await page.goto(route)
        test.skip(
          response?.status() === 404 && route !== NOT_FOUND_ROUTE,
          `${route} todavía no existe en esta rama; se audita al integrar su lane`,
        )
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.locator('[data-cw-background]')).toHaveAttribute('data-state', 'running')
        await page.addStyleTag({ content: FREEZE_STYLE })
        await page.waitForTimeout(600)

        const failures: Failure[] = []
        let minimum = Number.POSITIVE_INFINITY
        let audited = 0
        const total = await page.evaluate(() => document.documentElement.scrollHeight)
        const step = await page.evaluate(() => window.innerHeight - 80)
        for (let top = 0, i = 0; i < MAX_SCROLL_STEPS; top += step, i++) {
          await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)
          minimum = Math.min(minimum, await auditViewport(page, route, failures, testInfo.project.use.hasTouch === true))
          audited += 1
          if (top + step >= total) break
        }

        testInfo.annotations.push({
          type: 'contraste',
          description: `${route} ${theme}: mínimo ${minimum.toFixed(2)}:1 en ${audited} vista(s) × ${FRAMES} cuadros`,
        })
        expect(minimum, 'debe haber texto sobre glass que auditar').toBeLessThan(Number.POSITIVE_INFINITY)
        expect(failures).toEqual([])
      })
    }
  })
}
