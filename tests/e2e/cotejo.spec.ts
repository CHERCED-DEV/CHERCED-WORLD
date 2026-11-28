import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'
import { expect, test, type Page, type Request } from '@playwright/test'
import ailabEn from '@/content/i18n/en/ailab.json'
import ailabEs from '@/content/i18n/es/ailab.json'
import cotejoEs from '@/content/i18n/es/cotejo.json'

const HEAVY = /huggingface\.co|hf\.co|cdn\.jsdelivr\.net|\.wasm(\?|$)|\.onnx(\?|$)|\.safetensors(\?|$)/i
const CONSENT_KEY = 'cw-ailab-consent'

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

function watch(page: Page): { heavy: Request[]; all: Request[] } {
  const seen = { heavy: [] as Request[], all: [] as Request[] }
  page.on('request', (request) => {
    seen.all.push(request)
    if (HEAVY.test(request.url())) seen.heavy.push(request)
  })
  return seen
}

async function openCotejo(page: Page, lang: 'es' | 'en' = 'es') {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/ai-lab`)
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 120_000 })
  const card = page.locator('[data-cw-lab-card="A11"]')
  await card.scrollIntoViewIfNeeded()
  await card.locator('[data-cw-lab-open]').click()
  const stage = card.locator('[data-cw-cotejo]')
  await expect(stage).toHaveAttribute('data-cw-cotejo-ready', '', { timeout: 120_000 })
  return { card, stage }
}

async function analyzeSample(page: Page, lang: 'es' | 'en' = 'es') {
  const opened = await openCotejo(page, lang)
  await opened.stage.locator('[data-cw-cotejo-run]').click()
  await expect(opened.stage.locator('[data-cw-cotejo-metrics]')).toBeVisible({ timeout: 60_000 })
  return opened
}

test.describe('Cotejo en el AI Lab (047, historia 1)', () => {
  test.setTimeout(240_000)

  test.describe('con la muestra', () => {
    onlyIn('desktop-chromium', 'mobile-chromium')

    test('la capa determinista corre en el worker, sin descargar nada, y mide su precisión y su recall', async ({ page }) => {
      const seen = watch(page)
      const { stage } = await analyzeSample(page)
      await expect(stage.locator('[data-cw-cotejo-status]')).toContainText('584 líneas')
      await expect(stage.locator('[data-cw-cotejo-precision]')).toContainText('1,00')
      await expect(stage.locator('[data-cw-cotejo-recall]')).toContainText('0,91')
      await expect(stage.locator('[data-cw-cotejo-finding]')).toHaveCount(31)
      await expect(stage.locator('[data-cw-cotejo-family="value-conflict"] [data-cw-cotejo-finding]')).toHaveCount(3)
      const conflict = stage.locator('[data-cw-cotejo-finding][data-rule="conflict.value"]').first()
      await conflict.locator('button').click()
      const detail = conflict.locator('[data-cw-cotejo-detail]')
      await expect(detail).toBeVisible()
      await expect(detail.locator('[data-marked]')).toHaveCount(2)
      await expect(detail.locator('[data-cw-cotejo-truth]')).toHaveAttribute('data-cw-cotejo-truth', /^S0[89]|S10$/)
      await expect(detail).toContainText(cotejoEs['cotejo.detail.refute'])
      expect(seen.heavy.map((request) => request.url())).toEqual([])
      const width = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(width).toBeLessThanOrEqual(0)
    })

    test('«posiblemente implementado» baja el índice del sitio y compara el puente', async ({ page }) => {
      const seen = watch(page)
      const { stage } = await analyzeSample(page)
      await stage.locator('[data-cw-cotejo-trace-run]').click()
      const trace = stage.locator('[data-cw-cotejo-trace="ready"]')
      await expect(trace).toBeVisible({ timeout: 120_000 })
      await expect(trace.locator('[data-cw-cotejo-trace-variant]')).toHaveCount(3)
      await expect(trace.locator('[data-cw-cotejo-trace-variant="glossary"]')).toHaveAttribute('data-hits', /^\d+$/)
      await expect(trace.locator('[data-cw-cotejo-trace-row="FR-011"]')).toContainText('app/[lang]/feed.xml/')
      await expect(trace).not.toContainText('ya existe:')
      expect(seen.heavy.map((request) => request.url())).toEqual([])
    })
  })

  test.describe('en el escritorio', () => {
    onlyIn('desktop-chromium')

    test('sin red después de cargar la página, la capa determinista sigue completa', async ({ page, context }) => {
      const { stage } = await openCotejo(page)
      await context.setOffline(true)
      await stage.locator('[data-cw-cotejo-run]').click()
      await expect(stage.locator('[data-cw-cotejo-metrics]')).toBeVisible({ timeout: 30_000 })
      await expect(stage.locator('[data-cw-cotejo-recall]')).toContainText('0,91')
      await context.setOffline(false)
    })

    test('la spec pegada no sale del dispositivo, y más de 3.000 líneas se rechazan antes de analizar', async ({ page }) => {
      const seen = watch(page)
      const { stage } = await openCotejo(page)
      await stage.locator('[data-cw-cotejo-source="pasted"]').check()
      await expect(stage.locator('[data-cw-cotejo-private]')).toHaveText(cotejoEs['cotejo.paste.private'])
      const marker = 'marca-privada-4711'
      const spec = `# Especificación de la funcionalidad: Prueba\n\n## Requisitos\n\n- **FR-001**: El sistema DEBE responder rápido con la ${marker}.\n- **FR-002**: El sistema DEBE citar FR-009.\n`
      await stage.locator('[data-cw-cotejo-paste]').fill(spec)
      const before = seen.all.length
      await stage.locator('[data-cw-cotejo-run]').click()
      await expect(stage.locator('[data-cw-cotejo-no-truth]')).toBeVisible({ timeout: 30_000 })
      await expect(stage.locator('[data-cw-cotejo-finding]').first()).toBeVisible()
      const after = seen.all.slice(before)
      expect(after.filter((request) => request.url().includes(marker) || (request.postData() ?? '').includes(marker))).toEqual([])
      await stage.locator('[data-cw-cotejo-paste]').fill(Array.from({ length: 3001 }, (_, i) => `Línea ${i}`).join('\n'))
      await expect(stage.locator('[data-cw-cotejo-run]')).toBeDisabled()
      await expect(stage.locator('[data-cw-cotejo-count]')).toHaveAttribute('data-cw-cotejo-count', '3001')
      await expect(stage.locator('[data-cw-cotejo-count]')).toContainText('3.001')
    })

    test('las capas semánticas no bajan nada sin permiso, y al decir que no la capa determinista sigue', async ({ page }) => {
      const seen = watch(page)
      const { stage } = await analyzeSample(page)
      await stage.locator('[data-cw-cotejo-embeddings]').click()
      const dialog = page.locator('dialog[open]').filter({ has: page.locator('[data-cw-lab-consent-text]') })
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('[data-cw-lab-consent-text]')).toContainText('multilingual-e5-small (int8) (118 MB)')
      await dialog.locator('[data-cw-lab-consent-cancel]').click()
      await expect(stage.locator('[data-cw-cotejo-layer-state="declined"]')).toBeVisible()
      await expect(stage.locator('[data-cw-cotejo-nli]')).toBeDisabled()
      await expect(stage.locator('[data-cw-cotejo-finding]')).toHaveCount(31)
      expect(seen.heavy.map((request) => request.url())).toEqual([])
      expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[], CONSENT_KEY)).toEqual([])
    })

    test('descarga el SARIF 2.1.0 del mismo reporte', async ({ page }) => {
      const { stage } = await analyzeSample(page)
      const [download] = await Promise.all([page.waitForEvent('download'), stage.locator('[data-cw-cotejo-download-sarif]').click()])
      expect(download.suggestedFilename()).toBe('cotejo-muestra-es.sarif')
      const sarif = JSON.parse(await readFile((await download.path())!, 'utf8')) as { version: string; runs: Array<{ properties: { totalFindings: number } }> }
      expect(sarif.version).toBe('2.1.0')
      expect(sarif.runs[0]?.properties.totalFindings).toBe(31)
    })

    test('se usa entero con el teclado y no tiene violaciones serias de accesibilidad', async ({ page }) => {
      const { stage } = await analyzeSample(page)
      const first = stage.locator('[data-cw-cotejo-finding] button').first()
      await first.focus()
      await page.keyboard.press('Enter')
      await expect(first).toHaveAttribute('aria-expanded', 'true')
      await expect(stage.locator('[data-cw-cotejo-detail]').first()).toBeVisible()
      await page.keyboard.press('Space')
      await expect(first).toHaveAttribute('aria-expanded', 'false')
      const results = await new AxeBuilder({ page }).include('[data-cw-lab-card="A11"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      const blocking = results.violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
      expect(blocking).toEqual([])
    })

    test('en inglés, la muestra en inglés cuenta como falsos positivos los dos «how many»', async ({ page }) => {
      const { stage } = await analyzeSample(page, 'en')
      await expect(stage.locator('[data-cw-cotejo-precision]')).toContainText('0.94')
      await expect(stage.locator('[data-cw-cotejo-in-truth="none"]')).toHaveCount(2)
    })
  })

  test.describe('sin JavaScript', () => {
    onlyIn('no-js')

    for (const [lang, copy] of [
      ['es', ailabEs],
      ['en', ailabEn],
    ] as const) {
      test(`/${lang}/ai-lab: la tarjeta A11 se lee con su título, su resumen y su privacidad, y avisa que la demo necesita JavaScript`, async ({ page }) => {
        await page.goto(`/${lang}/ai-lab`)
        const card = page.locator('[data-cw-lab-card="A11"]')
        await expect(card.getByRole('heading', { level: 3 })).toHaveText(copy['ailab.a11.title'])
        await expect(card).toContainText(copy['ailab.a11.summary'])
        await expect(card.locator('[data-cw-lab-privacy]')).toContainText(copy['ailab.a11.privacy'])
        await expect(card.locator('[data-cw-lab-noscript]')).toHaveText(copy['ailab.noscript'])
        await expect(card.locator('[data-cw-lab-downloads] li')).toHaveCount(3)
        await expect(card.locator('[data-cw-cotejo]')).toHaveCount(0)
      })
    }
  })
})
