import { expect, test } from '@playwright/test'
import { getProjects } from '@/lib/content'
import { auditContrast, FRAMES, FREEZE_STYLE } from './support/contrast'
import { EXHAUSTIVE, pendingPage, skipIntro } from './support/pages'

const COVERED_BY_L2 = new Set(['/es/portfolio/1'])
const IN_FULL = new Set(['/es/portfolio/12', '/es/now'])

const ROUTES: readonly string[] = [...getProjects().map((project) => `/es/portfolio/${project.id}`), '/es/now'].filter((route) => !COVERED_BY_L2.has(route))

test.use({ trace: 'off' })

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name === 'no-js', 'el fondo animado necesita JS')
})

for (const theme of ['dark', 'light'] as const) {
  test.describe(`contraste sobre glass de los casos y /now en tema ${theme} (FR-446)`, () => {
    for (const route of ROUTES) {
      test(route, IN_FULL.has(route) ? {} : { tag: EXHAUSTIVE }, async ({ page }, testInfo) => {
        const pending = pendingPage(route)
        test.skip(Boolean(pending), pending ?? '')
        test.setTimeout(240_000)
        await page.emulateMedia({ colorScheme: theme })
        await skipIntro(page)
        const response = await page.goto(route)
        expect(response?.status(), `${route} responde`).toBe(200)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.locator('[data-cw-background]')).toHaveAttribute('data-state', 'running')
        await page.addStyleTag({ content: FREEZE_STYLE })
        await page.waitForTimeout(600)
        const { minimum, audited, failures } = await auditContrast(page, route)
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
