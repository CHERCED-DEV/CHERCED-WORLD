import { expect, test, type Page } from '@playwright/test'

const WIDTHS = [320, 375, 390, 768, 1024, 1280, 1440] as const
const LANGS = ['es', 'en'] as const
const PAGES = [
  '',
  '/aboutMe',
  '/services',
  '/portfolio',
  '/portfolio/1',
  '/blog',
  '/blog/post1',
  '/contactMe',
  '/privacy',
] as const

const MIN_TARGET = 24

type Finding = { width: number; kind: 'overflow' | 'target' | 'overlap'; detail: string }

async function audit(page: Page, width: number): Promise<Finding[]> {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
  await page.waitForTimeout(150)
  return page.evaluate(
    ({ width, minTarget }) => {
      const findings: { width: number; kind: 'overflow' | 'target' | 'overlap'; detail: string }[] = []
      const label = (el: Element) =>
        (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.tagName).trim().split('\n')[0].slice(0, 40)
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden],dialog:not([open]),[popover]:not(:popover-open)')
      }

      const scrollWidth = document.documentElement.scrollWidth
      if (scrollWidth > window.innerWidth + 1) {
        const wide = [...document.querySelectorAll('body *')]
          .filter((el) => visible(el) && el.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).split(' ')[0]}`)
        findings.push({ width, kind: 'overflow', detail: `scrollWidth ${scrollWidth} > ${window.innerWidth} (${wide.join(', ')})` })
      }

      const interactive = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button]')].filter(
        (el) => visible(el) && !el.closest('.cw-visually-hidden, .cw-skip-link') && getComputedStyle(el).display !== 'inline',
      )
      for (const el of interactive) {
        const r = el.getBoundingClientRect()
        if (r.width < minTarget || r.height < minTarget) {
          findings.push({ width, kind: 'target', detail: `"${label(el)}" ${Math.round(r.width)}x${Math.round(r.height)}` })
        }
      }

      const header = document.querySelector('#header')
      if (header) {
        const controls = [...header.querySelectorAll('a[href], button')].filter(visible).map((el) => ({ el, r: el.getBoundingClientRect() }))
        for (let i = 0; i < controls.length; i++) {
          for (let j = i + 1; j < controls.length; j++) {
            const a = controls[i].r
            const b = controls[j].r
            if (controls[i].el.contains(controls[j].el) || controls[j].el.contains(controls[i].el)) continue
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
              findings.push({ width, kind: 'overlap', detail: `"${label(controls[i].el)}" x "${label(controls[j].el)}"` })
            }
          }
        }
      }
      return findings
    },
    { width, minTarget: MIN_TARGET },
  )
}

test.describe('auditoría responsive (320 a 1440 px)', () => {
  for (const lang of LANGS) {
    for (const path of PAGES) {
      const url = `/${lang}${path}`
      test(`${url} sin scroll horizontal, objetivos táctiles ≥ ${MIN_TARGET} px y header sin solapes`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop-chromium', 'solo en desktop-chromium; el viewport lo fija la prueba')
        await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
        await page.goto(url, { waitUntil: 'networkidle' })
        const findings: Finding[] = []
        for (const width of WIDTHS) {
          findings.push(...(await audit(page, width)))
          if (width === 320 || width === 768 || width === 1440) {
            await testInfo.attach(`${lang}${path.replaceAll('/', '-') || '-home'}-${width}.png`, {
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
