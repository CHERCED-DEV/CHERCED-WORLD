import { expect, test, type ElementHandle, type Page } from '@playwright/test'

export type Lang = 'es' | 'en'

export const PAGES: ReadonlyArray<{ name: string; path: string }> = [
  { name: 'Home', path: '' },
  { name: 'Sobre mí', path: '/aboutMe' },
  { name: 'Synergos', path: '/synergos' },
  { name: 'Arquitectura Synergos', path: '/synergos/arquitectura' },
  { name: 'Servicios', path: '/services' },
  { name: 'Portafolio', path: '/portfolio' },
  { name: 'caso 12', path: '/portfolio/12' },
  { name: 'Blog', path: '/blog' },
  { name: 'post 1', path: '/blog/post1' },
  { name: 'post 6', path: '/blog/post6' },
  { name: 'Contacto', path: '/contactMe' },
  { name: 'Ahora', path: '/now' },
  { name: 'AI Lab', path: '/ai-lab' },
]

export const MOBILE_WIDTH = 375

export const PRIMARY = [
  'a[class*="_solid"]',
  'button[class*="_solid"]',
  '[data-cw-cv-download]',
  '[data-cw-cv-alternate]',
  '[data-cw-synergos-cta]',
  '[data-cw-recruiters-open]',
  '[data-cw-service-want]',
  '[data-cw-hand-prev]',
  '[data-cw-hand-next]',
  '[data-cw-hand-top]',
  '[data-cw-deck-card]',
  '[data-cw-contact-submit]',
].join(', ')

export function onlyIn(...projects: string[]): void {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

export async function open(page: Page, path: string): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  const response = await page.goto(path)
  expect(response?.status(), `${path} responde`).toBe(200)
}

export async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 60_000 })
}

export async function scrollThrough(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
    await page.waitForTimeout(40)
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
}

export type TextHit = { text: string; size: number; where: string }

export async function textHits(page: Page, check: 'justify' | 'small' | 'hyphens', min = 12): Promise<TextHit[]> {
  return page.evaluate(
    ({ check, min }) => {
      const hidden = (element: Element) => {
        if (element.closest('[aria-hidden="true"], [hidden], [inert], dialog:not([open]), [popover]:not(:popover-open), .cw-visually-hidden, noscript, template, script, style, nextjs-portal')) return true
        for (let current: Element | null = element; current; current = current.parentElement) {
          const style = getComputedStyle(current)
          if (style.display === 'none' || style.visibility === 'hidden' || style.contentVisibility === 'hidden') return true
          if (style.clipPath === 'inset(50%)' || style.clip === 'rect(0px, 0px, 0px, 0px)') return true
        }
        const rect = element.getBoundingClientRect()
        return rect.width < 1 || rect.height < 1
      }
      const label = (element: Element) => {
        const tag = element.tagName.toLowerCase()
        const marker = [...element.attributes].find((attribute) => attribute.name.startsWith('data-cw-'))
        return `${tag}${marker ? `[${marker.name}]` : ''}`
      }
      const effectiveSize = (element: Element) => {
        const size = parseFloat(getComputedStyle(element).fontSize)
        if (element instanceof SVGElement) {
          const svg = element.ownerSVGElement ?? (element as SVGSVGElement)
          const matrix = (svg as SVGGraphicsElement).getScreenCTM?.()
          if (matrix) return size * Math.hypot(matrix.a, matrix.b)
        }
        return size
      }
      const seen = new Set<Element>()
      const hits: Array<{ text: string; size: number; where: string }> = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const text = node.textContent?.trim() ?? ''
        const element = node.parentElement
        if (!text || !element || seen.has(element)) continue
        seen.add(element)
        if (hidden(element)) continue
        const style = getComputedStyle(element)
        const size = effectiveSize(element)
        const flagged =
          check === 'justify'
            ? style.textAlign === 'justify' || style.textAlignLast === 'justify'
            : check === 'hyphens'
              ? style.hyphens === 'auto'
              : size < min - 0.01
        if (flagged) hits.push({ text: text.slice(0, 50), size: Math.round(size * 10) / 10, where: label(element) })
      }
      return hits
    },
    { check, min },
  )
}

export type Cover = { target: string; by: string; overlap: number }

export async function coveredPrimaries(page: Page): Promise<{ checked: number; covered: Cover[] }> {
  const handles = (await page.locator(PRIMARY).elementHandles()) as ElementHandle<HTMLElement>[]
  const covered: Cover[] = []
  let checked = 0
  for (const handle of handles) {
    const visible = await handle.evaluate((element) => {
      if (element.closest('dialog:not([open]), [hidden], [inert], [aria-hidden="true"], noscript')) return false
      for (let current: Element | null = element; current; current = current.parentElement) {
        const style = getComputedStyle(current)
        if (style.display === 'none' || style.visibility === 'hidden') return false
      }
      const rect = element.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })
    if (!visible) continue
    checked++
    await handle.evaluate((element) => element.scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'instant' }))
    await page.waitForTimeout(60)
    const found = await handle.evaluate((element) => {
      const name = (element.getAttribute('aria-label') || (element as HTMLElement).innerText || element.tagName).trim().split('\n')[0]!.slice(0, 40)
      const rect = element.getBoundingClientRect()
      const blockers: Array<{ by: string; overlap: number }> = []
      for (const [by, selector] of [
        ['dock', '[data-cw-dock-bar]'],
        ['asistente', '[data-cw-assistant-button]'],
      ] as const) {
        const blocker = document.querySelector(selector)
        if (!blocker) continue
        const style = getComputedStyle(blocker)
        if (style.display === 'none' || style.display === 'contents' || style.visibility === 'hidden') continue
        const box = blocker.getBoundingClientRect()
        const width = Math.min(rect.right, box.right) - Math.max(rect.left, box.left)
        const height = Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top)
        if (width > 0.5 && height > 0.5) blockers.push({ by, overlap: Math.round(width * height) })
      }
      const center = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
      if (center && center !== element && !element.contains(center) && !center.contains(element)) {
        const owner = center.closest('[data-cw-dock-bar], [data-cw-assistant-button]')
        if (owner) blockers.push({ by: owner.hasAttribute('data-cw-dock-bar') ? 'dock (centro)' : 'asistente (centro)', overlap: 1 })
      }
      return { name, blockers }
    })
    for (const blocker of found.blockers) covered.push({ target: found.name, by: blocker.by, overlap: blocker.overlap })
  }
  return { checked, covered }
}
