import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { AUDIT_PAGES, EXHAUSTIVE, pendingPage, skipIntro, slugOf } from './support/pages'

const MIN_WIDTH = 320
const MAX_WIDTH = 2560
const STEP = 40
const KEY_WIDTHS: readonly number[] = [320, 390, 768, 1024, 1440, 2560]
const GRID_WIDTHS = Array.from({ length: (MAX_WIDTH - MIN_WIDTH) / STEP + 1 }, (_, index) => MIN_WIDTH + index * STEP)
const SWEEP_WIDTHS: readonly number[] = GRID_WIDTHS.filter((width) => !KEY_WIDTHS.includes(width))

const CLASSIC_SCROLLBAR_FROM = 768

const MIN_TARGET = 24
const TOLERANCE = 1.5
const MAX_RATIO_DRIFT = 0.02
const MAX_SCREENSHOTS = 2

type Kind = 'overflow' | 'target' | 'overlap' | 'clip' | 'image'

type Finding = { width: number; kind: Kind; detail: string }

async function loadEveryImage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const images = [...document.images]
    for (const image of images) if (image.loading === 'lazy') image.loading = 'eager'
    await Promise.race([
      Promise.all(images.map((image) => (image.complete ? Promise.resolve() : image.decode().catch(() => undefined)))),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ])
  })
}

async function resizeTo(page: Page, width: number): Promise<void> {
  await page.setViewportSize({ width, height: width < CLASSIC_SCROLLBAR_FROM ? 844 : 900 })
  await page.evaluate(async (overlay) => {
    const id = 'cw-audit-overlay-scrollbar'
    const current = document.getElementById(id)
    if (overlay && !current) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = 'html { scrollbar-width: none !important; }'
      document.head.append(style)
    }
    if (!overlay && current) current.remove()
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  }, width < CLASSIC_SCROLLBAR_FROM)
}

async function audit(page: Page, width: number): Promise<Finding[]> {
  return page.evaluate(
    ({ width, minTarget, tolerance, maxDrift }) => {
      const findings: Array<{ width: number; kind: 'overflow' | 'target' | 'overlap' | 'clip' | 'image'; detail: string }> = []
      const label = (el: Element) =>
        (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.getAttribute('alt') || el.tagName).trim().split('\n')[0]!.slice(0, 40)
      const path = (el: Element) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).split(' ')[0]}`
      const hiddenScope = '[hidden], dialog:not([open]), [popover]:not(:popover-open), [inert], details:not([open]) > :not(summary)'
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest(hiddenScope)
      }

      const viewport = document.documentElement.clientWidth
      const scrollWidth = document.documentElement.scrollWidth
      if (scrollWidth > viewport + 1) {
        const wide = [...document.querySelectorAll('body *')]
          .filter((el) => visible(el) && el.getBoundingClientRect().right > viewport + 1)
          .slice(0, 3)
          .map(path)
        findings.push({ width, kind: 'overflow', detail: `scrollWidth ${scrollWidth} > ${viewport} (${wide.join(', ')})` })
      }

      const interactive = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button]')].filter(
        (el) => visible(el) && !el.closest('.cw-visually-hidden, .cw-skip-link') && getComputedStyle(el).display !== 'inline',
      )
      for (const el of interactive) {
        const own = el.getBoundingClientRect()
        const labels = [...((el as HTMLInputElement).labels ?? [])].map((item) => item.getBoundingClientRect())
        const reachable = [own, ...labels].some((rect) => rect.width >= minTarget && rect.height >= minTarget)
        if (!reachable) {
          findings.push({ width, kind: 'target', detail: `"${label(el)}" ${Math.round(own.width)}x${Math.round(own.height)}` })
        }
      }

      const header = document.querySelector('#header')
      if (header) {
        const controls = [...header.querySelectorAll('a[href], button')].filter(visible).map((el) => ({ el, r: el.getBoundingClientRect() }))
        for (let i = 0; i < controls.length; i++) {
          for (let j = i + 1; j < controls.length; j++) {
            const a = controls[i]!.r
            const b = controls[j]!.r
            if (controls[i]!.el.contains(controls[j]!.el) || controls[j]!.el.contains(controls[i]!.el)) continue
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
              findings.push({ width, kind: 'overlap', detail: `"${label(controls[i]!.el)}" x "${label(controls[j]!.el)}"` })
            }
          }
        }
      }

      type Clipper = { el: Element; x: boolean; y: boolean; box: DOMRect }
      type ClipInfo = { clippers: Clipper[]; scrolled: boolean; srOnly: boolean; ellipsis: DOMRect | null }
      const clipping = new Map<Element, ClipInfo>()
      const decorative = '[aria-hidden="true"], .cw-visually-hidden, .cw-skip-link, script, style, noscript, template, svg'
      const clipInfo = (el: Element): ClipInfo => {
        const cached = clipping.get(el)
        if (cached) return cached
        const cs = getComputedStyle(el)
        const scrolls = (value: string) => value === 'auto' || value === 'scroll'
        let info: ClipInfo
        if (el !== document.documentElement && el !== document.body && (scrolls(cs.overflowX) || scrolls(cs.overflowY))) {
          info = { clippers: [], scrolled: true, srOnly: false, ellipsis: null }
        } else {
          const parent = el.parentElement
          const inherited = parent && el !== document.body ? clipInfo(parent) : { clippers: [], scrolled: false, srOnly: false, ellipsis: null }
          const clips = (value: string) => value === 'hidden' || value === 'clip'
          const x = clips(cs.overflowX) && cs.textOverflow !== 'ellipsis'
          const y = clips(cs.overflowY) && (cs.getPropertyValue('-webkit-line-clamp') || 'none') === 'none'
          const r = el.getBoundingClientRect()
          const srOnly =
            inherited.srOnly ||
            ((x || y) && (r.width <= 1 || r.height <= 1)) ||
            /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip) ||
            /inset\(50%\)/.test(cs.clipPath)
          const own: Clipper[] =
            (x || y) && el !== document.documentElement && el !== document.body && r.width > 1 && r.height > 1
              ? [{ el, x, y, box: new DOMRect(r.left + el.clientLeft, r.top + el.clientTop, el.clientWidth, el.clientHeight) }]
              : []
          const ellipsis = clips(cs.overflowX) && cs.textOverflow === 'ellipsis' && r.width > 1 ? new DOMRect(r.left, r.top, r.width, r.height) : null
          info = { clippers: [...own, ...inherited.clippers], scrolled: inherited.scrolled, srOnly, ellipsis: ellipsis ?? inherited.ellipsis }
        }
        clipping.set(el, info)
        return info
      }
      const reported = new Set<Element>()
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const range = document.createRange()
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent?.trim() ?? ''
        const parent = node.parentElement
        if (!text || !parent || parent.closest(decorative) || !visible(parent)) continue
        range.selectNodeContents(node)
        const full = range.getBoundingClientRect()
        if (full.width < 1 || full.height < 1) continue
        const info = clipInfo(parent)
        if (info.scrolled || info.srOnly) continue
        const left = info.ellipsis ? Math.max(full.left, info.ellipsis.left) : full.left
        const right = info.ellipsis ? Math.min(full.right, info.ellipsis.right) : full.right
        const r = new DOMRect(left, full.top, Math.max(0, right - left), full.height)
        for (const clipper of info.clippers) {
          if (reported.has(clipper.el)) continue
          const b = clipper.box
          const outX = clipper.x && (r.left < b.left - tolerance || r.right > b.right + tolerance)
          const outY = clipper.y && (r.top < b.top - tolerance || r.bottom > b.bottom + tolerance)
          if (!outX && !outY) continue
          reported.add(clipper.el)
          findings.push({ width, kind: 'clip', detail: `"${text.slice(0, 30)}" recortado por ${path(clipper.el)} (${outX ? 'horizontal' : 'vertical'})` })
          break
        }
        if (r.right > viewport + tolerance || r.left < -tolerance) {
          findings.push({ width, kind: 'clip', detail: `"${text.slice(0, 30)}" sale del viewport (${Math.round(r.left)}–${Math.round(r.right)} de ${viewport})` })
        }
      }

      for (const image of document.images) {
        if (!visible(image) || !image.complete || !image.naturalWidth || !image.naturalHeight) continue
        if (/\.svg(\?|$)|^data:image\/svg/.test(image.currentSrc || image.src)) continue
        const cs = getComputedStyle(image)
        if (cs.objectFit !== 'fill') continue
        const r = image.getBoundingClientRect()
        const px = (value: string) => Number.parseFloat(value) || 0
        const w = r.width - px(cs.borderLeftWidth) - px(cs.borderRightWidth) - px(cs.paddingLeft) - px(cs.paddingRight)
        const h = r.height - px(cs.borderTopWidth) - px(cs.borderBottomWidth) - px(cs.paddingTop) - px(cs.paddingBottom)
        if (w < 2 || h < 2) continue
        const natural = image.naturalWidth / image.naturalHeight
        const drift = Math.abs(w / h - natural) / natural
        if (drift > maxDrift && Math.abs(h - w / natural) > tolerance) {
          findings.push({
            width,
            kind: 'image',
            detail: `"${label(image)}" se ve a ${Math.round(w)}x${Math.round(h)} y es ${image.naturalWidth}x${image.naturalHeight} (${Math.round(drift * 100)} % deformada)`,
          })
        }
      }
      return findings
    },
    { width, minTarget: MIN_TARGET, tolerance: TOLERANCE, maxDrift: MAX_RATIO_DRIFT },
  )
}

function ranges(widths: number[]): string {
  const sorted = [...new Set(widths)].sort((a, b) => a - b)
  const parts: string[] = []
  let start = sorted[0]
  let previous = sorted[0]
  for (const width of [...sorted.slice(1), Number.NaN]) {
    if (width === (previous ?? 0) + STEP) {
      previous = width
      continue
    }
    parts.push(start === previous ? `${start}` : `${start}–${previous}`)
    start = width
    previous = width
  }
  return parts.join(', ')
}

function summarize(findings: Finding[]): string {
  const grouped = new Map<string, number[]>()
  for (const finding of findings) {
    const key = `${finding.kind}: ${finding.detail
      .replace(/scrollWidth \d+ > \d+/, 'scrollWidth > ancho')
      .replace(/\(-?\d+–-?\d+ de \d+\)/, '')
      .replace(/se ve a \d+x\d+ y es (\d+x\d+) \(\d+ % deformada\)/, 'es $1 y se ve deformada')
      .replace(/\d+x\d+$/, 'menos de 24 px')
      .trim()}`
    grouped.set(key, [...(grouped.get(key) ?? []), finding.width])
  }
  return [...grouped].map(([key, widths]) => `${ranges(widths)} px ${key}`).join('\n')
}

test.use({ trace: 'off', launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

const CHECKS = `sin scroll horizontal, objetivos ≥ ${MIN_TARGET} px, header sin solapes, texto sin recortes e imágenes sin deformar`

async function sweep(page: Page, testInfo: TestInfo, path: string, widths: readonly number[]): Promise<void> {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'solo en desktop-chromium; el viewport lo fija la prueba')
  const pending = pendingPage(path)
  test.skip(Boolean(pending), pending ?? '')
  test.setTimeout(180_000)
  await skipIntro(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: MIN_WIDTH, height: 844 })
  await page.goto(path, { waitUntil: 'networkidle' })
  await loadEveryImage(page)
  const findings: Finding[] = []
  let shots = 0
  for (const width of widths) {
    await resizeTo(page, width)
    const found = await audit(page, width)
    findings.push(...found)
    if (found.length > 0 && shots < MAX_SCREENSHOTS) {
      shots += 1
      await testInfo.attach(`${slugOf(path)}-${width}.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
    }
  }
  testInfo.annotations.push({ type: 'anchos', description: `${widths.length} anchos: ${ranges([...widths])} px` })
  expect(summarize(findings), `hallazgos responsive en ${path}`).toBe('')
}

test.describe(`auditoría responsive en los anchos clave (${KEY_WIDTHS.join(', ')} px)`, () => {
  for (const path of AUDIT_PAGES) {
    test(`${path}: ${CHECKS}`, async ({ page }, testInfo) => sweep(page, testInfo, path, KEY_WIDTHS))
  }
})

test.describe(`auditoría responsive en el resto de anchos (${MIN_WIDTH} a ${MAX_WIDTH} px, cada ${STEP} px)`, () => {
  for (const path of AUDIT_PAGES) {
    test(`${path}: ${CHECKS}`, { tag: EXHAUSTIVE }, async ({ page }, testInfo) => sweep(page, testInfo, path, SWEEP_WIDTHS))
  }
})
