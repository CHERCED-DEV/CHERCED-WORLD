import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

export const MOBILE_WIDTHS = [375, 390, 412] as const

export const MOBILE_HEIGHT = 812

export function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

export async function skipIntro(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
}

let bundle: { js: string; css: string } | null = null

export function harnessBundle(): { js: string; css: string } {
  if (bundle) return bundle
  const out = join(tmpdir(), `cw-m0-harness-${process.pid}`)
  execFileSync(process.execPath, [resolve(__dirname, 'harness', 'build.mjs'), out], { stdio: 'pipe' })
  bundle = { js: readFileSync(join(out, 'harness.js'), 'utf8'), css: readFileSync(join(out, 'harness.css'), 'utf8') }
  return bundle
}

export async function mountHarness(page: Page) {
  const { js, css } = harnessBundle()
  await page.addStyleTag({ content: css })
  await page.addScriptTag({ content: js })
  await expect(page.locator('[data-m0-open]')).toBeVisible()
}

export type Rect = { left: number; top: number; right: number; bottom: number; width: number; height: number }

export async function rectOf(page: Page, selector: string): Promise<Rect> {
  return page.locator(selector).evaluate((element) => {
    const r = element.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
  })
}

export async function blurredSurfaces(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = []
    const width = window.innerWidth
    const height = window.innerHeight
    const shift = (value: string) => {
      const parts = value.split(/\s+/).map((part) => Number.parseFloat(part))
      return { x: parts[0] || 0, y: parts[1] || 0 }
    }
    const opacityOf = (element: Element) => {
      let opacity = 1
      for (let node: Element | null = element; node; node = node.parentElement) opacity *= Number(getComputedStyle(node).opacity)
      return opacity
    }
    for (const element of [document.body, ...document.body.querySelectorAll('*')]) {
      if (element.closest('[hidden], dialog:not([open]), [popover]:not(:popover-open)')) continue
      for (const pseudo of [null, '::before', '::after'] as const) {
        const style = getComputedStyle(element, pseudo)
        const filter = style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter')
        if (!filter || filter === 'none' || /^blur\(0px\)( saturate\([^)]*\))?$/.test(filter)) continue
        if (pseudo && (style.content === 'none' || style.content === 'normal')) continue
        if (style.display === 'none' || style.visibility === 'hidden') continue
        const rect = element.getBoundingClientRect()
        const moved = pseudo ? shift(style.translate === 'none' ? '0 0' : style.translate) : { x: 0, y: 0 }
        const top = rect.top + moved.y
        const left = rect.left + moved.x
        if (rect.width < 1 || rect.height < 1 || top + rect.height <= 0 || top >= height || left + rect.width <= 0 || left >= width) continue
        if (opacityOf(element) < 0.05) continue
        const name = element.id ? `#${element.id}` : `${element.tagName.toLowerCase()}.${String(element.getAttribute('class') ?? '').split(' ')[0]}`
        found.push(`${name}${pseudo ?? ''}`)
      }
    }
    return found
  })
}

export async function waitForSettled(page: Page, selector: string) {
  await expect
    .poll(() =>
      page.locator(selector).evaluate(
        (element) =>
          new Promise<string>((done) => {
            const first = element.getBoundingClientRect().top
            requestAnimationFrame(() => requestAnimationFrame(() => done(String(Math.abs(element.getBoundingClientRect().top - first) < 0.5))))
          }),
      ),
    )
    .toBe('true')
}
