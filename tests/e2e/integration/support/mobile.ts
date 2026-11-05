import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'

export const MOBILE_PROJECTS = ['mobile-375', 'mobile-chromium', 'mobile-412'] as const

export const ALL_WIDTHS = '@anchos'

export const OPEN_SHEET = 'dialog[data-cw-sheet][open]'

export const NEW_CONTROLS = [
  '[data-cw-dock-bar] :is(a[href], button)',
  '[data-cw-lobe]',
  '[data-cw-hand] :is(a[href], button)',
  '[data-cw-hand-top]',
  '[data-cw-scene-dots] :is(a[href], button)',
  '[data-cw-service-stack] :is(a[href], button)',
  '[data-cw-carousel-dots] :is(a[href], button)',
  '[data-cw-prev]',
  '[data-cw-next]',
  '[data-cw-filters] :is(a[href], button)',
  '[data-cw-gallery-steps] :is(a[href], button)',
  '[data-cw-embed-sheet-open]',
  '[data-cw-floating] :is(input, select, textarea)',
  `${OPEN_SHEET} :is([data-cw-sheet-close], [data-cw-sheet-prev], [data-cw-sheet-next], [data-cw-embed-sheet-close], [data-cw-embed-sheet-external])`,  '[data-cw-float-menu]:popover-open :is(a[href], button)',
].join(', ')

export function onlyMobile(): void {
  test.beforeEach(({}, testInfo) => {
    test.skip(!(MOBILE_PROJECTS as readonly string[]).includes(testInfo.project.name), 'patrones móviles: 375, 390 y 412 px')
  })
}

export function widthOf(testInfo: TestInfo): number {
  return testInfo.project.use.viewport?.width ?? 390
}

export async function introSeen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

export async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

export async function openReady(page: Page, path: string): Promise<void> {
  await introSeen(page)
  const response = await page.goto(path)
  expect(response?.status(), `${path} responde`).toBe(200)
  await hydrated(page)
}

export async function settled(locator: Locator): Promise<void> {
  await expect
    .poll(() => locator.evaluate((element) => element.getAnimations().filter((item) => item.playState === 'running').length), {
      message: 'la hoja termina de entrar',
    })
    .toBe(0)
}

export async function dragDown(page: Page, handle: Locator, distance = 300): Promise<void> {
  const box = await handle.boundingBox()
  if (!box) throw new Error('la agarradera no tiene caja visible')
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) await page.mouse.move(x, y + (distance * step) / 10)
  await page.mouse.up()
}

export async function scrollThrough(page: Page, onStep: (y: number) => Promise<void>, stepPx = 600, pause = 80): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0, step = 0; step < 60; y += stepPx, step++) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
    await page.waitForTimeout(pause)
    await onStep(y)
    if (y >= height) break
  }
}

export type SmallTarget = { label: string; width: number; height: number }

export async function smallNewTargets(page: Page, min = 44): Promise<SmallTarget[]> {
  return page.evaluate(
    ({ selector, min }) => {
      const found: Array<{ label: string; width: number; height: number }> = []
      for (const element of document.querySelectorAll(selector)) {
        if (element.closest('[hidden], [inert], dialog:not([open]), [popover]:not(:popover-open), .cw-visually-hidden')) continue
        const style = getComputedStyle(element)
        if (style.display === 'none' || style.visibility === 'hidden' || style.display === 'contents') continue
        const rect = element.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) continue
        if (rect.width >= min - 0.5 && rect.height >= min - 0.5) continue
        const label = (element.getAttribute('aria-label') || (element as HTMLElement).innerText || element.tagName).trim().split('\n')[0]!.slice(0, 40)
        found.push({ label, width: Math.round(rect.width), height: Math.round(rect.height) })
      }
      return found
    },
    { selector: NEW_CONTROLS, min },
  )
}
