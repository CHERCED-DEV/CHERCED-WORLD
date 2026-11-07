import { expect, test } from '@playwright/test'

const WELCOME = {
  es: 'Notas de un arquitecto que trabaja con agentes: decisiones, errores y lo que los tests no vieron.',
  en: "Notes from an architect who works with agents: decisions, mistakes and what the tests didn't catch.",
} as const

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

test.describe('copy del blog sin JavaScript (FR-503)', () => {
  onlyIn('no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`/${lang}/blog muestra la bienvenida nueva y la anuncia como descripción`, async ({ page }) => {
      await page.goto(`/${lang}/blog`)
      await expect(page.getByText(WELCOME[lang], { exact: true })).toBeVisible()
      await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', WELCOME[lang])
      await expect(page.locator('head meta[property="og:description"]')).toHaveAttribute('content', WELCOME[lang])
    })
  }
})

test.describe('sitemap con etiquetas (A-507)', () => {
  onlyIn('desktop-chromium')

  test('lista cada etiqueta solo en los idiomas donde tiene posts', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc ?? '/').pathname)
    expect(locs).toContain('/es/blog/tag/carrera')
    expect(locs).toContain('/en/blog/tag/career')
    expect(locs).toContain('/es/blog/tag/humor')
    expect(locs).toContain('/en/blog/tag/humor')
    expect(locs).toContain('/es/blog/tag/pruebas')
    expect(locs).toContain('/en/blog/tag/testing')
    expect(locs).not.toContain('/en/blog/tag/carrera')
    expect(locs).not.toContain('/es/blog/tag/career')
    expect(locs.filter((loc) => /^\/(es|en)\/blog\/post\d+$/.test(loc))).toHaveLength(12)
  })
})
