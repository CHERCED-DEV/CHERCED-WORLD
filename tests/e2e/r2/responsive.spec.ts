import { expect, test, type Page } from '@playwright/test'
import { getProjects } from '@/lib/content'
import { onlyIn, skipIntro, stubExternalSites } from './support'

const STEP = 40
const WIDTHS = Array.from({ length: (2560 - 320) / STEP + 1 }, (_, i) => 320 + i * STEP)
const SHOTS = new Set([320, 390, 768, 1280, 2560])
const MIN_TARGET = 24
const PATHS = ['/portfolio', ...getProjects().map((project) => `/portfolio/${project.id}`)]

type Finding = { width: number; kind: 'overflow' | 'target' | 'clip'; detail: string }

async function audit(page: Page, width: number): Promise<Finding[]> {
  await page.setViewportSize({ width, height: width < 768 ? 844 : width >= 1920 ? 1200 : 900 })
  await page.waitForTimeout(40)
  return page.evaluate(
    ({ width, minTarget }) => {
      const findings: { width: number; kind: 'overflow' | 'target' | 'clip'; detail: string }[] = []
      const label = (el: Element) =>
        (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.tagName).trim().split('\n')[0]!.slice(0, 40)
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return (
          r.width > 0 &&
          r.height > 0 &&
          cs.visibility !== 'hidden' &&
          cs.display !== 'none' &&
          !el.closest('[hidden],dialog:not([open]),[popover]:not(:popover-open)')
        )
      }
      if (document.documentElement.scrollWidth > window.innerWidth + 1) {
        const wide = [...document.querySelectorAll('#main *')]
          .filter((el) => visible(el) && el.getBoundingClientRect().right > window.innerWidth + 1 && !el.closest('[data-cw-carousel], ul'))
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).split(' ')[0]}`)
        findings.push({ width, kind: 'overflow', detail: `scrollWidth ${document.documentElement.scrollWidth} (${wide.join(', ')})` })
      }
      const main = document.querySelector('#main')!
      for (const el of main.querySelectorAll('a[href], button, [role=button]')) {
        if (!visible(el) || el.closest('.cw-visually-hidden') || getComputedStyle(el).display === 'inline') continue
        const r = el.getBoundingClientRect()
        if (r.width < minTarget || r.height < minTarget) findings.push({ width, kind: 'target', detail: `"${label(el)}" ${Math.round(r.width)}x${Math.round(r.height)}` })
      }
      for (const el of main.querySelectorAll('h1, h2, h3, p, li, span')) {
        if (!visible(el) || el.closest('[data-cw-carousel], [data-cw-filter-scroll], ul[class*="filterList"], .cw-visually-hidden')) continue
        const html = el as HTMLElement
        const cs = getComputedStyle(html)
        if (cs.textOverflow === 'ellipsis' || cs.webkitLineClamp !== 'none') continue
        if (html.scrollWidth > html.clientWidth + 2 && cs.overflowX !== 'visible') {
          findings.push({ width, kind: 'clip', detail: `${html.tagName.toLowerCase()} "${label(html)}"` })
        }
      }
      return findings
    },
    { width, minTarget: MIN_TARGET },
  )
}

test.describe('responsive del portafolio y los 12 casos (320 a 2560 px, cada 40 px)', () => {
  onlyIn('desktop-chromium')

  for (const lang of ['es', 'en'] as const) {
    for (const path of PATHS) {
      const url = `/${lang}${path}`
      test(`${url}`, async ({ page, context }, testInfo) => {
        test.setTimeout(180_000)
        await stubExternalSites(context)
        await skipIntro(page)
        await page.goto(url, { waitUntil: 'networkidle' })
        const findings: Finding[] = []
        for (const width of WIDTHS) {
          findings.push(...(await audit(page, width)))
          if (lang === 'es' && SHOTS.has(width)) {
            await testInfo.attach(`${lang}${path.replaceAll('/', '-')}-${width}.png`, {
              body: await page.screenshot({ fullPage: true }),
              contentType: 'image/png',
            })
          }
        }
        expect(findings, findings.map((f) => `${f.width}px ${f.kind}: ${f.detail}`).join('\n')).toEqual([])
      })
    }
  }
})
