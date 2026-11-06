import AxeBuilder from '@axe-core/playwright'
import { test, type Page } from '@playwright/test'
import {
  COPY,
  INTEGRATED,
  LANGS,
  SOON,
  answerConsent,
  blockHeavy,
  card,
  consent,
  expect,
  fakeSpeech,
  fakeWorkers,
  obraWithPython,
  onlyIn,
  open,
  openDemo,
  prepareDemo,
} from './support'

test.describe.configure({ timeout: 180_000 })

const SCHEMES = ['dark', 'light'] as const

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const H1_TREE = '[data-cw-lab-card="A2"] [role="tree"]'

type Scope = { include?: string[]; exclude?: string[]; disable?: string[] }

async function serious(page: Page, { include = [], exclude = [], disable = [] }: Scope = {}): Promise<string[]> {
  let builder = new AxeBuilder({ page }).withTags(TAGS)
  for (const selector of include) builder = builder.include(selector)
  for (const selector of exclude) builder = builder.exclude(selector)
  if (disable.length > 0) builder = builder.disableRules(disable)
  const results = await builder.analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test.describe('T762 · axe en la página y con cada experimento abierto, en tema oscuro y claro (SC-306)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    for (const scheme of SCHEMES) {
      const theme = scheme === 'dark' ? 'oscuro' : 'claro'

      test(`/${lang}/ai-lab en tema ${theme}: 0 violaciones serias o críticas con V1 a V4, A2, A3, A5, R1, A4 (Despacho), J1 y J2 abiertos a la vez`, async ({ page, context }) => {
        await blockHeavy(context)
        await fakeWorkers(page)
        await fakeSpeech(page)
        await page.emulateMedia({ colorScheme: scheme })
        await open(page, lang)
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
        for (const id of INTEGRATED) await prepareDemo(page, id, lang)
        for (const id of SOON) await expect((await openDemo(page, id)).locator('[data-cw-lab-soon]')).toBeVisible()
        const found: Record<string, string[]> = {}
        found['demos abiertas'] = await serious(page, { include: ['#main'] })
        expect(found).toEqual(Object.fromEntries(Object.keys(found).map((key) => [key, []])))
      })

      test(`/${lang}/ai-lab en tema ${theme}: 0 violaciones serias o críticas en la página recién cargada, el consentimiento y Obra con y sin permiso`, async ({ page, context }) => {
        await blockHeavy(context)
        await fakeWorkers(page)
        await page.emulateMedia({ colorScheme: scheme })
        await open(page, lang)
        await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
        const found: Record<string, string[]> = {}
        found['página recién cargada'] = await serious(page)

        await card(page, 'V1').locator('[data-cw-lab-open]').click()
        await expect(consent(page)).toBeVisible()
        await consent(page).evaluate((node) => Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished)))
        found['diálogo de consentimiento'] = await serious(page, { include: ['dialog[open]'] })
        await answerConsent(page, 'cancel')
        await expect(card(page, 'V1').locator('[data-cw-lab-declined]')).toBeVisible()
        found['V1 sin permiso'] = await serious(page, { include: ['[data-cw-lab-card="V1"]'] })

        const a4 = await openDemo(page, 'A4')
        await obraWithPython(page, a4)
        await a4.locator('[data-cw-obra-field="P-1:a"]').fill('x')
        await expect(a4.locator('[data-cw-obra-field="P-1:a"]')).toHaveAttribute('aria-invalid', 'true')
        found['A4 Obra con Python y un valor inválido'] = await serious(page, { include: ['[data-cw-lab-card="A4"]'] })

        await card(page, 'A4').locator('[data-cw-lab-revoke]').click()
        await expect(a4.locator('[data-cw-obra-status="idle"]')).toBeVisible()
        await a4.locator('[data-cw-obra-run]').click()
        await answerConsent(page, 'cancel', 'Pyodide 0.29.0')
        await expect(a4.locator('[data-cw-obra-status="declined"]')).toHaveText(COPY[lang]['ailab.a4.obra.declined'])
        found['A4 Obra sin permiso'] = await serious(page, { include: ['[data-cw-lab-card="A4"]'] })

        expect(found).toEqual(Object.fromEntries(Object.keys(found).map((key) => [key, []])))
      })
    }
  }
})

test.describe('T762 · H1: el árbol de A2 cumple «Label in Name» (WCAG 2.5.3, regla label-content-name-mismatch)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab: cada carpeta del árbol tiene en su nombre accesible el texto que se ve`, async ({ page }) => {
      await open(page, lang)
      const stage = await openDemo(page, 'A2')
      await expect(stage.locator('[role="tree"]')).toBeVisible()
      expect(await serious(page, { include: [H1_TREE] })).toEqual([])
    })
  }
})
