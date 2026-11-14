import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Request } from '@playwright/test'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import { labCatalog } from '@/content/ailab/catalog'

const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]
const COPY = { es, en } as const
const THEMES = {
  es: ['Voz', 'Arquitectura que se toca', 'Agentes y plugins', 'Juegos que aprenden'],
  en: ['Voice', 'Architecture you can touch', 'Agents and plugins', 'Games that learn'],
} as const
const CARD_ORDER = ['V5', 'V1', 'V2', 'V3', 'V4', 'R1', 'A6', 'A2', 'A3', 'A5', 'A4', 'J1', 'J2']
const HEAVY = /huggingface\.co|hf\.co|cdn\.jsdelivr\.net|\.wasm(\?|$)|\.onnx(\?|$)|\.safetensors(\?|$)|pyodide/i
const CONSENT_KEY = 'cw-ailab-consent'

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function open(page: Page, lang: Lang, ready = true): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/ai-lab`)
  if (ready) await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

function watchHeavy(page: Page): Request[] {
  const heavy: Request[] = []
  page.on('request', (request) => {
    if (HEAVY.test(request.url())) heavy.push(request)
  })
  return heavy
}

function card(page: Page, id: string) {
  return page.locator(`[data-cw-lab-card="${id}"]`)
}

function consent(page: Page) {
  return page.locator('dialog[open]').filter({ has: page.locator('[data-cw-lab-consent-text]') })
}

async function storedConsent(page: Page): Promise<string[]> {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[], CONSENT_KEY)
}

async function blockingViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test.describe('la página del laboratorio en ES y EN (US1, FR-301)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab: título, intro, privacidad y trece tarjetas por tema, con estado y dónde corren`, async ({ page }) => {
      const response = await page.goto(`/${lang}/ai-lab`)
      expect(response?.status()).toBe(200)
      const main = page.locator('#main')
      await expect(main.getByRole('heading', { level: 1 })).toHaveText('AI LAB')
      await expect(main.getByText(COPY[lang]['ailab.intro'])).toBeVisible()
      await expect(main.locator('[data-cw-ailab-privacy]')).toContainText(COPY[lang]['ailab.privacy'])
      await expect(main.getByRole('heading', { level: 2 })).toHaveText([...THEMES[lang]])
      await expect(main.locator('[data-cw-lab-card]')).toHaveCount(CARD_ORDER.length)
      expect(await main.locator('[data-cw-lab-card]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-cw-lab-card')))).toEqual(
        CARD_ORDER,
      )
      for (const experiment of labCatalog) {
        const item = card(page, experiment.id)
        await expect(item.getByRole('heading', { level: 3 })).toHaveText(experiment.title[lang])
        await expect(item.locator(`[data-cw-lab-status="${experiment.status}"]`)).toBeVisible()
        await expect(item.locator(`[data-cw-lab-runs="${experiment.runsIn}"]`)).toHaveText(COPY[lang][`ailab.runsIn.${experiment.runsIn}`])
        await expect(item.locator('[data-cw-lab-privacy]')).toContainText(experiment.privacy[lang])
      }
      await expect(page).toHaveTitle(`${COPY[lang]['ailab.meta.title']} · Camilo Hernández`)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', COPY[lang]['ailab.meta.description'])
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/ai-lab$/)
    })
  }
})

test.describe('0 bytes de modelos al cargar (SC-301, FR-304, FR-310)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('cargar y recorrer la página no descarga modelos, pesos, .wasm ni runtimes', async ({ page }) => {
    const heavy = watchHeavy(page)
    await open(page, 'es')
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
        window.scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 40))
      }
    })
    await page.waitForLoadState('networkidle')
    expect(heavy.map((request) => request.url())).toEqual([])
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => entry.name))
    expect(resources.filter((name) => /huggingface|jsdelivr|\.wasm|\.onnx/.test(name))).toEqual([])
    expect(await storedConsent(page)).toEqual([])
    expect(await page.evaluate(async () => (await caches.keys()).filter((name) => /transformers|cw-ailab/.test(name)))).toEqual([])
    expect(await page.evaluate(async () => (await indexedDB.databases()).map((db) => db.name))).not.toContain('cw-ailab')
  })
})

test.describe('sin JavaScript (US1 escenario 5)', () => {
  onlyIn('no-js')

  test('se leen las tarjetas con su "Cómo funciona" y su código, y se avisa que la demo necesita JS', async ({ page }) => {
    await page.goto('/es/ai-lab')
    const notices = page.locator('[data-cw-lab-noscript]')
    await expect(notices).toHaveCount(CARD_ORDER.length)
    for (const notice of await notices.all()) {
      await expect(notice).toBeVisible()
      await expect(notice).toHaveText(es['ailab.noscript'])
    }
    await expect(page.locator('[data-cw-lab-open]').first()).toBeHidden()
    await expect(page.locator('[data-cw-lab-clear]')).toBeHidden()
    const v1 = card(page, 'V1')
    await v1.locator('[data-cw-lab-part="how"] summary').click()
    await expect(v1.locator('[data-cw-adr]').first()).toBeVisible()
    await expect(v1.locator('[data-cw-lab-flow] li')).toHaveCount(3)
    await v1.locator('[data-cw-lab-part="code"] summary').click()
    const code = labCatalog.find((experiment) => experiment.id === 'V1')!.code!
    await expect(v1.locator('[data-cw-lab-code] code')).toContainText(code.snippet.split('\n')[0]!.trim())
    await expect(v1.locator('[data-cw-lab-repo]')).toHaveAttribute('href', `https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/${code.repoPath}`)
    await expect(v1.locator('[data-cw-lab-downloads] li').first()).toHaveText(
      'Whisper base (int8) · 77 MB · desde huggingface.co + motor ONNX Runtime Web · 27 MB · desde este sitio',
    )
  })
})

test.describe('consentimiento antes de descargar (US1 escenarios 3 y 4, FR-310, FR-311)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('"Probar" muestra qué, cuánto pesa y de dónde; "Ahora no" no descarga y la tarjeta sigue usable', async ({ page }) => {
    const heavy = watchHeavy(page)
    await open(page, 'es')
    const v1 = card(page, 'V1')
    await v1.locator('[data-cw-lab-open]').click()
    const dialog = consent(page)
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Antes de descargar' })).toBeVisible()
    await expect(dialog.locator('[data-cw-lab-consent-text]')).toHaveText(
      'Este experimento descarga Whisper base (int8) (77 MB) desde huggingface.co. Queda guardado en tu navegador para la próxima vez. Para correrlo, tu navegador también baja el motor ONNX Runtime Web (27 MB) desde este sitio, si no lo tiene ya.',
    )
    expect(await blockingViolations(page)).toEqual([])
    await dialog.locator('[data-cw-lab-consent-cancel]').click()
    await expect(dialog).toBeHidden()
    await expect(v1.locator('[data-cw-lab-declined]')).toHaveText(es['ailab.consent.declined'])
    await expect(v1.locator('[data-cw-lab-open]')).toBeVisible()
    await v1.locator('[data-cw-lab-part="how"] summary').click()
    await expect(v1.locator('[data-cw-adr]').first()).toBeVisible()
    expect(await storedConsent(page)).toEqual([])
    expect(heavy.map((request) => request.url())).toEqual([])
  })

  test('Esc también cuenta como "Ahora no"', async ({ page }) => {
    await open(page, 'es')
    await card(page, 'V1').locator('[data-cw-lab-open]').click()
    await expect(consent(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(consent(page)).toBeHidden()
    await expect(card(page, 'V1').locator('[data-cw-lab-declined]')).toBeVisible()
    expect(await storedConsent(page)).toEqual([])
  })

  test('aceptar vale para la sesión, abre la demo y el permiso se puede retirar', async ({ page }) => {
    const heavy = watchHeavy(page)
    await page.addInitScript(() => {
      class SilentWorker extends EventTarget {
        postMessage() {}
        terminate() {}
      }
      Object.defineProperty(window, 'Worker', { value: SilentWorker, configurable: true, writable: true })
    })
    await open(page, 'es')
    const v1 = card(page, 'V1')
    await v1.locator('[data-cw-lab-open]').click()
    await consent(page).locator('[data-cw-lab-consent-accept]').click()
    await expect(consent(page)).toBeHidden()
    await expect(v1.locator('[data-cw-lab-stage]')).toBeVisible()
    await expect(v1.locator('[data-cw-lab-stage]')).toBeFocused()
    await expect(v1.locator('[data-cw-lab-failed]')).toHaveCount(0)
    expect(await storedConsent(page)).toEqual(['V1:Whisper base (int8)'])
    await expect(v1.locator('[data-cw-lab-granted]')).toContainText('Diste permiso para descargar Whisper base (int8) en esta sesión.')

    await v1.locator('[data-cw-lab-close]').click()
    await expect(v1.locator('[data-cw-lab-open]')).toBeFocused()
    await v1.locator('[data-cw-lab-open]').click()
    await expect(consent(page)).toHaveCount(0)
    await expect(v1.locator('[data-cw-lab-stage]')).toBeVisible()

    await v1.locator('[data-cw-lab-revoke]').click()
    await expect(page.getByText(es['ailab.consent.revoked'])).toBeVisible()
    await expect(v1.locator('[data-cw-lab-granted]')).toHaveCount(0)
    await expect(v1.locator('[data-cw-lab-stage]')).toHaveCount(0)
    expect(await storedConsent(page)).toEqual([])
    await v1.locator('[data-cw-lab-open]').click()
    await expect(consent(page)).toBeVisible()
    expect(heavy.map((request) => request.url())).toEqual([])
  })

  test('un experimento sin descargas abre sin preguntar, y todo se opera con teclado', async ({ page }) => {
    await open(page, 'es')
    const r1 = card(page, 'R1')
    await r1.locator('[data-cw-lab-open]').focus()
    await page.keyboard.press('Enter')
    await expect(consent(page)).toHaveCount(0)
    await expect(r1.locator('[data-cw-lab-stage]')).toBeFocused()
    const close = r1.locator('[data-cw-lab-close]')
    for (let presses = 0; presses < 30 && !(await close.evaluate((node) => node === document.activeElement)); presses += 1) await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(r1.locator('[data-cw-lab-open]')).toBeFocused()
  })

  test('en inglés el diálogo dice lo mismo', async ({ page }) => {
    await open(page, 'en')
    await card(page, 'V1').locator('[data-cw-lab-open]').click()
    await expect(consent(page).locator('[data-cw-lab-consent-text]')).toHaveText(
      'This experiment downloads Whisper base (int8) (77 MB) from huggingface.co. It stays in your browser for next time. To run it, your browser also fetches the ONNX Runtime Web engine (27 MB) from this site, if it does not have it yet.',
    )
    await expect(consent(page).locator('[data-cw-lab-consent-accept]')).toHaveText('Download and try')
    await expect(consent(page).locator('[data-cw-lab-consent-cancel]')).toHaveText('Not now')
  })
})

test.describe('"Borrar lo que el laboratorio guardó" (US1 escenario 6, FR-312)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('borra los modelos en caché, lo que aprendieron los juegos y el permiso, y lo confirma', async ({ page }) => {
    await open(page, 'es')
    await page.evaluate(async (key) => {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('cw-ailab', 1)
        request.onupgradeneeded = () => request.result.createObjectStore('games')
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction('games', 'readwrite')
          tx.objectStore('games').put({ version: 1, curve: [0.2] }, 'J1:rival')
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        request.onerror = () => reject(request.error)
      })
      await (await caches.open('transformers-cache')).put('/modelo-falso', new Response('pesos'))
      await (await caches.open('cache-ajena')).put('/otra', new Response('x'))
      sessionStorage.setItem(key, JSON.stringify(['V1:Whisper base (int8)']))
    }, CONSENT_KEY)
    await page.locator('[data-cw-lab-clear]').click()
    await expect(page.getByText(es['ailab.clear.done'])).toBeVisible()
    expect(await page.evaluate(async () => (await indexedDB.databases()).map((db) => db.name))).not.toContain('cw-ailab')
    expect(await page.evaluate(async () => (await caches.keys()).sort())).toEqual(['cache-ajena'])
    expect(await storedConsent(page)).toEqual([])
  })
})

test.describe('cómo se llega, accesibilidad y móvil', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('el footer enlaza al laboratorio en cada idioma', async ({ page }) => {
    for (const lang of LANGS) {
      await open(page, lang, false)
      await expect(page.locator('footer#footer [data-cw-footer-ai-lab]')).toHaveAttribute('href', `/${lang}/ai-lab`)
      await expect(page.locator('footer#footer [data-cw-footer-ai-lab]')).toHaveText('AI Lab')
    }
  })

  test('sin violaciones serias de accesibilidad, en tema claro y oscuro', async ({ page }) => {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await open(page, 'es')
      expect(await blockingViolations(page), colorScheme).toEqual([])
    }
  })

  test('sin desbordes horizontales y, en móvil, el diálogo es una hoja', async ({ page }, testInfo) => {
    await open(page, 'es')
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(widths.scroll).toBeLessThanOrEqual(widths.client)
    await card(page, 'V1').locator('[data-cw-lab-open]').click()
    const dialog = consent(page)
    await expect(dialog).toBeVisible()
    const sheet = await dialog.getAttribute('data-cw-sheet')
    expect(sheet).toBe('')
    if (testInfo.project.name === 'mobile-chromium') {
      const box = await dialog.boundingBox()
      const viewport = page.viewportSize()
      expect(box && viewport ? Math.round(box.y + box.height) : 0).toBeGreaterThanOrEqual((viewport?.height ?? 0) - 2)
      expect(Math.round(box?.width ?? 0)).toBe(viewport?.width)
    }
  })
})

test.describe('sitemap e imagen OG (A-707)', () => {
  onlyIn('desktop-chromium')

  test('el sitemap lista /ai-lab en ES y EN, y la imagen OG es un PNG', async ({ page, request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    expect(xml).toMatch(/<loc>[^<]*\/es\/ai-lab<\/loc>/)
    expect(xml).toMatch(/<loc>[^<]*\/en\/ai-lab<\/loc>/)
    await open(page, 'es', false)
    const image = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(image).toMatch(/\/es\/ai-lab\/opengraph-image\/og/)
    const png = await request.get(new URL(image ?? '').pathname + new URL(image ?? '').search)
    expect(png.status()).toBe(200)
    expect(png.headers()['content-type']).toBe('image/png')
  })
})
