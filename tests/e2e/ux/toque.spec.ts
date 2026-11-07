import { expect, test, type Page } from '@playwright/test'
import { hydrated, MOBILE_WIDTH, onlyIn, open } from './support'

async function smallTargets(page: Page, selector: string, min = 44): Promise<string[]> {
  return page.locator(selector).evaluateAll(
    (elements, min) =>
      elements.flatMap((element) => {
        const style = getComputedStyle(element)
        if (style.display === 'none' || style.visibility === 'hidden') return []
        const rect = element.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) return []
        if (rect.width >= min - 0.5 && rect.height >= min - 0.5) return []
        return [`"${(element.textContent ?? '').trim().slice(0, 40)}" ${Math.round(rect.width)}x${Math.round(rect.height)}`]
      }),
    min,
  )
}

const CASES: ReadonlyArray<{ code: string; path: string; selector: string; before?: (page: Page) => Promise<void> }> = [
  {
    code: 'M2 fuentes del mapa',
    path: '/es/aboutMe',
    selector: '[data-cw-brain] :is([data-cw-source], [data-cw-platzi], [data-cw-sources-toggle])',
    before: async (page) => {
      await page.locator('[data-cw-sources-toggle]').scrollIntoViewIfNeeded()
      await page.locator('[data-cw-sources-toggle]').click()
    },
  },
  { code: 'M3 enlaces de "Casos" en Servicios', path: '/es/services', selector: '[data-cw-service-case] h3 a' },
  { code: 'M4 etiquetas y RSS del blog', path: '/es/blog', selector: '[data-cw-tag-nav] a, [data-cw-blog-rss]' },
  { code: 'M4 etiquetas e índice del post', path: '/es/blog/post4', selector: '[data-cw-post-tag], [data-cw-toc-link]' },
  { code: 'M5 política de privacidad del AI Lab', path: '/es/ai-lab', selector: '[data-cw-ailab-privacy] a' },
  { code: 'enlaces del footer', path: '/es', selector: 'footer#footer a' },
]

test.describe(`M2 a M5: áreas táctiles de 44 px a ${MOBILE_WIDTH} px (010)`, () => {
  onlyIn('mobile-chromium')

  for (const item of CASES) {
    test(item.code, async ({ page }) => {
      await page.setViewportSize({ width: MOBILE_WIDTH, height: 812 })
      await open(page, item.path)
      await hydrated(page)
      await item.before?.(page)
      expect(await page.locator(item.selector).count(), item.selector).toBeGreaterThan(0)
      expect(await smallTargets(page, item.selector)).toEqual([])
    })
  }
})
