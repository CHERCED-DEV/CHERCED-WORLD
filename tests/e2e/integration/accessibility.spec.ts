import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { getProjects } from '@/lib/content'
import { EXHAUSTIVE, LANGS, pendingPage, skipIntro } from './support/pages'

const ROUTES: readonly string[] = LANGS.flatMap((lang) => [...getProjects().map((project) => `/${lang}/portfolio/${project.id}`), `/${lang}/now`, `/${lang}/services`])

test.use({ trace: 'off' })

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'axe sobre el DOM de escritorio; r2 y l1 cubren móvil')
})

for (const scheme of ['dark', 'light'] as const) {
  test.describe(`accesibilidad de los casos, Servicios y /now en tema ${scheme} (SC-405, SC-413)`, () => {
    for (const route of ROUTES) {
      test(`${route} sin violaciones críticas ni serias`, scheme === 'dark' ? {} : { tag: EXHAUSTIVE }, async ({ page, context }, testInfo) => {
        const pending = pendingPage(route)
        test.skip(Boolean(pending), pending ?? '')
        await context.route(/^https?:\/\/(?!localhost)/, (request) => request.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>externo</title>' }))
        await skipIntro(page)
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        const response = await page.goto(route)
        expect(response?.status(), `${route} responde`).toBe(200)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const results = await new AxeBuilder({ page })
          .include('#main')
          .exclude('[data-cw-embed-frame]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        const minor = results.violations.filter((violation) => violation.impact !== 'critical' && violation.impact !== 'serious')
        testInfo.annotations.push({ type: 'axe', description: `${route} ${scheme}: ${results.passes.length} reglas pasan, ${minor.length} menores o moderadas` })
        expect(blocking).toEqual([])
      })
    }
  })
}
