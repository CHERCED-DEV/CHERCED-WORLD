import { expect, test, type Locator, type Page } from '@playwright/test'
import { auditPage, formatFindings, openPage, prepareContext, returnTo, scrollToEnd } from './support/controls'
import { AUDIT_PAGES, BLOG_INDEXES, langOf, skipIntro } from './support/pages'

const WITH_JS = ['desktop-chromium', 'mobile-chromium']

test.use({ trace: 'off' })

test.beforeEach(async ({ page, context, baseURL }, testInfo) => {
  test.skip(!WITH_JS.includes(testInfo.project.name), 'la auditoría activa controles con JavaScript; sin JS los cubren l0, l1 y l4')
  await skipIntro(page)
  await prepareContext(context, baseURL ?? '')
})

test.describe('auditoría de interacción (US1, FR-201)', () => {
  for (const path of AUDIT_PAGES) {
    // Una enmienda al shell de R0 hace pasar /es y /en (el logo no sube al inicio), /es/privacy y /en/privacy ("Privacidad" no hace nada), /es/contactMe y /en/contactMe ("Buzón" no hace nada) y /es/inbox ("Regresar" vuelve a la misma página)
    test(`${path}: cada control visible tiene un efecto verificable`, async ({ page, context }, testInfo) => {
      test.setTimeout(300_000)
      const audit = await auditPage(page, context, path, langOf(path))
      const failed = audit.controls.filter((control) => !control.ok).length
      testInfo.annotations.push({ type: 'inventario', description: `${audit.controls.length} controles, ${failed} sin efecto verificable` })
      await testInfo.attach('inventario.json', { body: JSON.stringify(audit, null, 2), contentType: 'application/json' })
      expect(audit.controls.length, 'la página no tiene controles visibles').toBeGreaterThan(0)
      expect(formatFindings(audit), `controles sin efecto verificable en ${path}`).toBe('')
    })
  }
})

test.describe('volver arriba (FR-202)', () => {
  for (const path of AUDIT_PAGES) {
    test(`${path}: desde el final sube al tope y deja el foco en main`, async ({ page }) => {
      test.setTimeout(90_000)
      await openPage(page, path)
      const from = await scrollToEnd(page)
      await page.locator('footer [data-cw-back-to-top]').click()
      await expect
        .poll(() => page.evaluate(() => window.scrollY), { message: `scrollY tras "Volver arriba" desde ${from}`, timeout: 5000 })
        .toBeLessThanOrEqual(4)
      await expect(page.locator('main#main')).toBeFocused()
    })
  }
})

async function opensPost(page: Page, index: string, activate: () => Promise<void>, expected: string): Promise<string | null> {
  await returnTo(page, index)
  try {
    await activate()
  } catch (error) {
    return `no se puede activar (${(error instanceof Error ? error.message : String(error)).split('\n')[0]})`
  }
  const landed = await page
    .waitForURL((url) => url.pathname === expected, { timeout: 8000 })
    .then(() => true)
    .catch(() => false)
  return landed ? null : `se queda en ${new URL(page.url()).pathname}`
}

async function clickWithin(card: Locator, part: Locator): Promise<void> {
  await part.scrollIntoViewIfNeeded()
  const [outer, inner] = await Promise.all([card.boundingBox(), part.boundingBox()])
  if (!outer || !inner) throw new Error('la parte de la tarjeta no tiene caja visible')
  await card.click({ position: { x: inner.x - outer.x + inner.width / 2, y: inner.y - outer.y + inner.height / 2 }, timeout: 5000 })
}

test.describe('tarjetas del blog (D-07)', () => {
  for (const index of BLOG_INDEXES) {
    test(`${index}: toda la tarjeta y su "Leer más" abren el post`, async ({ page }) => {
      test.setTimeout(240_000)
      await openPage(page, index)
      const ids = await page.locator('[data-cw-post-card]').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-cw-post-card') ?? ''))
      expect(ids.length, 'el índice no tiene tarjetas').toBeGreaterThan(0)
      const readMore = langOf(index) === 'es' ? /leer más/i : /read more/i
      const problems: string[] = []
      for (const id of ids) {
        const expected = `${index}/${id}`
        const card = () => page.locator(`[data-cw-post-card="${id}"]`)
        const probes: Array<[string, () => Promise<void>]> = [
          ['el título', () => card().getByRole('heading').first().click({ timeout: 5000 })],
          ['la imagen', () => clickWithin(card(), card().locator('img').first())],
          [
            'una esquina vacía de la tarjeta',
            async () => {
              const box = await card().boundingBox()
              await card().click({ position: { x: 12, y: (box?.height ?? 40) - 12 }, timeout: 5000 })
            },
          ],
          ['"Leer más"', () => clickWithin(card(), card().getByText(readMore).first())],
        ]
        await returnTo(page, index)
        const visibleMore = await expect(card().getByText(readMore).first())
          .toBeVisible({ timeout: 5000 })
          .then(() => true)
          .catch(() => false)
        if (!visibleMore) problems.push(`${id}: no tiene un "Leer más" visible`)
        for (const [part, activate] of probes) {
          if (part === '"Leer más"' && !visibleMore) continue
          const problem = await opensPost(page, index, activate, expected)
          if (problem) problems.push(`${id}: clic en ${part} no abre ${expected}; ${problem}`)
        }
      }
      expect(problems.join('\n'), `tarjetas de ${index}`).toBe('')
    })
  }
})
