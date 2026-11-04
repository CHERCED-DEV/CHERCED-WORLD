import { expect, test, type Page } from '@playwright/test'

const WIDTHS = Array.from({ length: (2560 - 320) / 40 + 1 }, (_, index) => 320 + index * 40)
const PAGES = ['/es/blog', '/en/blog', '/es/blog/post5', '/en/blog/post5', '/es/blog/post4', '/en/blog/post1', '/en/blog/catalog']
const MIN_TARGET = 24

type Finding = { width: number; detail: string }

async function audit(page: Page, width: number): Promise<Finding[]> {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
  await page.waitForTimeout(60)
  return page.evaluate(
    ({ width, minTarget }) => {
      const findings: { width: number; detail: string }[] = []
      const name = (element: Element) =>
        `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}.${String((element as HTMLElement).className).split(' ')[0] ?? ''}`
      const visible = (element: Element) => {
        const box = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && !element.closest('[hidden],dialog:not([open]),[popover]:not(:popover-open)')
      }
      const insideScroller = (element: Element) => {
        for (let current = element.parentElement; current && current !== document.body; current = current.parentElement) {
          const style = getComputedStyle(current)
          if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowX === 'hidden' || style.overflowX === 'clip') return true
        }
        return false
      }

      if (document.documentElement.scrollWidth > window.innerWidth + 1) {
        findings.push({ width, detail: `scroll horizontal: ${document.documentElement.scrollWidth} > ${window.innerWidth}` })
      }

      const scope = document.querySelector('[data-cw-post], [data-cw-blog-index]')
      if (scope) {
        for (const element of scope.querySelectorAll('*')) {
          if (!visible(element) || insideScroller(element)) continue
          const box = element.getBoundingClientRect()
          if (box.right > window.innerWidth + 1 || box.left < -1) findings.push({ width, detail: `se sale de la pantalla: ${name(element)}` })
        }
        const targets = scope.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea')
        for (const element of targets) {
          if (!visible(element) || element.closest('.cw-visually-hidden') || getComputedStyle(element).display === 'inline') continue
          const box = element.getBoundingClientRect()
          if (box.width < minTarget || box.height < minTarget) {
            findings.push({ width, detail: `objetivo de ${Math.round(box.width)}x${Math.round(box.height)}: ${name(element)}` })
          }
        }
        const toc = scope.querySelector('[data-cw-toc]')
        const body = scope.querySelector('[data-cw-post-body]')
        if (toc && body) {
          const a = toc.getBoundingClientRect()
          const b = body.getBoundingClientRect()
          if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) {
            findings.push({ width, detail: 'el índice se monta sobre el cuerpo' })
          }
        }
      }
      return findings
    },
    { width, minTarget: MIN_TARGET },
  )
}

test.describe('blog de 320 a 2560 px en pasos de 40', () => {
  for (const path of PAGES) {
    test(`${path} sin desbordes, objetivos ≥ ${MIN_TARGET} px y sin solapes del índice`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop-chromium', 'el viewport lo fija la prueba')
      test.setTimeout(180_000)
      await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path, { waitUntil: 'networkidle' })
      const findings: Finding[] = []
      for (const width of WIDTHS) findings.push(...(await audit(page, width)))
      expect(findings, findings.map((finding) => `${finding.width}px ${finding.detail}`).join('\n')).toEqual([])
    })
  }
})
