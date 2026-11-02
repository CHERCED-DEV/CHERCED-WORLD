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
  '/es/contactMe',
  '/es/privacy',
  '/es/esta-ruta-no-existe',
]
const FRAMES = 4
const MAX_SCROLL_STEPS = 20
const HIDE_TEXT_ID = 'cw-contrast-hide-text'
const FREEZE_STYLE = '*,*::before,*::after{transition:none!important}'

type TextSample = {
  text: string
  color: string
  opacity: number
  fontSize: number
  fontWeight: number
  rects: Array<{ x: number; y: number; width: number; height: number }>
}

type Failure = { route: string; text: string; ratio: number; required: number; frame: number }

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name === 'no-js', 'el fondo animado necesita JS')
})

async function collectTexts(page: Page): Promise<TextSample[]> {
  const samples = await page.evaluate(() => {
    type Box = { left: number; top: number; right: number; bottom: number }
    const found: TextSample[] = []
    const viewport: Box = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }

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
      const rects = [...range.getClientRects()]
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
      found.push({
        text: text.slice(0, 40),
        color: style.color,
        opacity,
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: Number.parseInt(style.fontWeight, 10),
        rects,
      })
    }
    return found
  })
  return samples.filter((sample) => (parseColor(sample.color)?.a ?? 1) * sample.opacity >= 0.05)
}

function worstRatio(sample: TextSample, pixels: ReturnType<typeof decodePng>): number {
  const base = parseColor(sample.color)
  if (!base) return Number.POSITIVE_INFINITY
  const text = withAlpha(base, sample.opacity)
  let worst = Number.POSITIVE_INFINITY
  for (const rect of sample.rects) {
    for (let y = rect.y + 1; y < rect.y + rect.height - 1; y++) {
      for (let x = rect.x + 1; x < rect.x + rect.width - 1; x++) {
        if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) continue
        const i = (y * pixels.width + x) * 4
        const background: Rgba = { r: pixels.data[i], g: pixels.data[i + 1], b: pixels.data[i + 2], a: 1 }
        const ratio = contrastRatio(over(text, background), background)
        if (ratio < worst) worst = ratio
      }
    }
  }
  return worst
}

async function auditViewport(page: Page, route: string, failures: Failure[]): Promise<number> {
  const samples = await collectTexts(page)
  let minimum = Number.POSITIVE_INFINITY
  await page.evaluate((id) => {
    const style = document.createElement('style')
    style.id = id
    style.textContent =
      '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}'
    document.head.append(style)
  }, HIDE_TEXT_ID)

  const viewport = page.viewportSize() ?? { width: 1280, height: 800 }
  for (let frame = 0; frame < FRAMES; frame++) {
    await page.mouse.move(viewport.width * (0.3 + 0.13 * frame), viewport.height * (0.35 + 0.1 * frame), { steps: 4 })
    await page.waitForTimeout(180)
    const pixels = decodePng(await page.screenshot({ scale: 'css' }))
    for (const sample of samples) {
      const ratio = worstRatio(sample, pixels)
      const required = requiredRatio(sample.fontSize, sample.fontWeight)
      minimum = Math.min(minimum, ratio)
      if (ratio < required) failures.push({ route, text: sample.text, ratio: Number(ratio.toFixed(2)), required, frame })
    }
  }

  await page.evaluate((id) => document.getElementById(id)?.remove(), HIDE_TEXT_ID)
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
        test.skip(response?.status() === 404, `${route} todavía no existe en esta rama; se audita al integrar su lane`)
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
          minimum = Math.min(minimum, await auditViewport(page, route, failures))
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
