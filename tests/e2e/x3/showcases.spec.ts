import { readFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect as baseExpect, test, type Locator, type Page } from '@playwright/test'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'

const expect = baseExpect.configure({ timeout: 15_000 })

test.describe.configure({ timeout: 90_000 })

const HEAVY = /huggingface\.co|hf\.co|cdn\.jsdelivr\.net|\.wasm(\?|$)|\.whl(\?|$)|\.onnx(\?|$)|pyodide\.(mjs|asm)/i
const CONSENT_KEY = 'cw-ailab-consent'
const ESTIMATE_PY = readFileSync(path.resolve('lib/ailab/pyodide/estimate.py'), 'utf8').replace(/\r\n/g, '\n')

type FakeState = {
  created: number
  terminated: number
  sources: string[]
  inputs: Array<{ items: Array<{ id: string; count: number; a: number; b: number; c: number }> }>
  totals: number[]
  failLoad: boolean
  holdMs: number
}

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function fakePyodide(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Item = { id: string; kind: string; count: number; a: number; b: number; c: number }
    type Input = { items: Item[]; prices: Record<string, number>; ratios: Record<string, number>; contingency: number }
    const state = { created: 0, terminated: 0, sources: [] as string[], inputs: [] as Input[], totals: [] as number[], failLoad: false, holdMs: 40 }
    Object.assign(window, { __x3: state })
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const round = (value: number, digits = 0) => Math.floor(value * 10 ** digits + 0.5) / 10 ** digits
    const compute = (input: Input) => {
      const items = input.items.map((item) => {
        const volume = item.count * item.a * item.b * item.c
        const formwork =
          item.kind === 'beam' ? item.count * (item.a + 2 * item.b) * item.c
          : item.kind === 'slab' ? item.count * item.a * item.b
          : item.count * 2 * (item.a + item.b) * item.c
        return { id: item.id, volume: round(volume, 2), formwork: round(formwork, 2), steel: round(volume * (input.ratios[item.kind] ?? 0)) }
      })
      const sum = (key: 'volume' | 'formwork' | 'steel') => items.reduce((total, item) => total + item[key], 0)
      const concrete = round(sum('volume'), 2)
      const quantities: Array<[string, number, string]> = [
        ['concrete', concrete, 'm3'],
        ['steel', round(sum('steel')), 'kg'],
        ['formwork', round(sum('formwork'), 2), 'm2'],
        ['labor', concrete, 'm3'],
      ]
      const lines = quantities.map(([id, quantity, unit]) => ({ id, quantity, unit, price: input.prices[id] ?? 0, cost: round(quantity * (input.prices[id] ?? 0)) }))
      const subtotal = lines.reduce((total, line) => total + line.cost, 0)
      const contingency = round(subtotal * input.contingency)
      return { items, lines, subtotal, contingency, total: subtotal + contingency }
    }
    class FakeWorker extends EventTarget {
      dead = false
      constructor() {
        super()
        state.created += 1
      }
      emit(data: unknown) {
        if (!this.dead) this.dispatchEvent(new MessageEvent('message', { data }))
      }
      postMessage(message: { cw?: string; id?: number; payload?: { type: string; source?: string; input?: Input } }) {
        if (this.dead || message?.cw !== 'call' || message.id === undefined || !message.payload) return
        void this.handle(message.id, message.payload)
      }
      async handle(id: number, payload: { type: string; source?: string; input?: Input }) {
        if (payload.type === 'load') {
          state.sources.push(payload.source ?? '')
          for (const stage of ['core', 'numpy', 'source']) {
            await wait(state.holdMs)
            this.emit({ cw: 'progress', id, payload: { stage } })
          }
          if (state.failLoad) {
            this.emit({ cw: 'error', id, error: { name: 'TypeError', message: 'Failed to fetch' } })
            return
          }
          this.emit({ cw: 'result', id, payload: { type: 'ready', ms: 900, pyodide: '0.29.0', python: '3.13.2', numpy: '2.2.5' } })
          return
        }
        const input = payload.input!
        state.inputs.push(input)
        await wait(10)
        const estimate = compute(input)
        state.totals.push(estimate.total)
        this.emit({ cw: 'result', id, payload: { type: 'estimate', estimate, ms: 4.2 } })
      }
      terminate() {
        this.dead = true
        state.terminated += 1
      }
    }
    Object.defineProperty(window, 'Worker', { value: FakeWorker, configurable: true, writable: true })
  })
}

async function fake<T>(page: Page, read: (state: FakeState) => T): Promise<T> {
  return page.evaluate(`(${read.toString()})(window.__x3)`) as Promise<T>
}

async function setFake(page: Page, patch: Partial<FakeState>): Promise<void> {
  await page.evaluate((next) => Object.assign((window as unknown as { __x3: FakeState }).__x3, next), patch)
}

function guardNetwork(page: Page): { heavy: string[]; sent: string[] } {
  const heavy: string[] = []
  const sent: string[] = []
  page.on('request', (request) => {
    if (HEAVY.test(request.url())) heavy.push(request.url())
    if (request.method() !== 'GET' && request.method() !== 'HEAD') sent.push(`${request.method()} ${request.url()}`)
  })
  return { heavy, sent }
}

async function open(page: Page, lang: 'es' | 'en' = 'es'): Promise<void> {
  await page.route(HEAVY, (route) => route.abort())
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/ai-lab`)
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

function card(page: Page, id: 'R1' | 'A4'): Locator {
  return page.locator(`[data-cw-lab-card="${id}"]`)
}

function consent(page: Page): Locator {
  return page.locator('dialog[open]').filter({ has: page.locator('[data-cw-lab-consent-text]') })
}

async function answer(page: Page, choice: 'accept' | 'cancel', text?: string): Promise<void> {
  const dialog = consent(page)
  if (text) await expect(dialog.locator('[data-cw-lab-consent-text]')).toContainText(text)
  await dialog.evaluate((node) => Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished)))
  await dialog.locator(`[data-cw-lab-consent-${choice}]`).click()
}

async function storedConsent(page: Page): Promise<string[]> {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[], CONSENT_KEY)
}

async function tryDemo(page: Page, id: 'R1' | 'A4'): Promise<Locator> {
  const item = card(page, id)
  await item.locator('[data-cw-lab-open]').click()
  await expect(consent(page)).toHaveCount(0)
  await expect(item.locator('[data-cw-lab-stage]')).toBeVisible()
  await expect(item.locator(id === 'R1' ? '[data-cw-saga]' : '[data-cw-showcases]')).toBeVisible()
  return item
}

async function openObra(page: Page): Promise<Locator> {
  const a4 = await tryDemo(page, 'A4')
  await a4.locator('[data-cw-showcase-tab="obra"]').click()
  await expect(a4.locator('[data-cw-showcase-panel="obra"]')).toBeVisible()
  return a4
}

async function acceptConsents(page: Page, a4: Locator): Promise<void> {
  await a4.locator('[data-cw-obra-run]').click()
  await answer(page, 'accept', 'Pyodide 0.29.0 (12 MB)')
  await answer(page, 'accept', 'numpy (Pyodide 0.29.0)')
  await expect(consent(page)).toHaveCount(0)
}

async function acceptPython(page: Page, a4: Locator): Promise<void> {
  await acceptConsents(page, a4)
  await expect(a4.locator('[data-cw-obra-status="ready"]')).toBeVisible()
}

async function blockingViolations(page: Page, include: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

async function entryKeys(r1: Locator): Promise<string[]> {
  return r1.locator('[data-cw-saga-entry]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-key') ?? ''))
}

async function stepToEnd(page: Page, r1: Locator): Promise<void> {
  const next = r1.locator('[data-cw-saga-next]')
  for (let index = 0; index < 20 && (await r1.locator('[data-cw-saga-outcome]').count()) === 0; index += 1) await next.click()
  await expect(r1.locator('[data-cw-saga-outcome]')).toBeVisible()
}

test.describe('R1 Simulador de sagas (US4, FR-354)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('sin fallos, cada paso avanza en el diagrama y en la bitácora, y los apartados se confirman al cobrar', async ({ page }) => {
    const network = guardNetwork(page)
    await open(page)
    const r1 = await tryDemo(page, 'R1')
    const log = r1.locator('[data-cw-saga-log]')
    await expect(log).toHaveAttribute('role', 'log')
    await expect(log).toHaveAttribute('aria-live', 'polite')
    await expect(log).toHaveText(es['ailab.r1.logEmpty'])
    await r1.locator('[data-cw-saga-fail="none"]').check()
    await r1.locator('[data-cw-saga-run]').click()
    await expect(r1.locator('[data-cw-saga-run]')).toHaveText(es['ailab.r1.pause'])
    await expect(r1.locator('[data-cw-saga-step="flight"]')).toHaveAttribute('data-status', 'booked')
    await expect(r1.locator('[data-cw-saga-step="hotel"]')).toHaveAttribute('data-status', 'held')
    await expect(r1.locator('[data-cw-saga-outcome="completed"]')).toHaveText(es['ailab.r1.outcome.completed'], { timeout: 20_000 })
    expect(await entryKeys(r1)).toEqual([
      'start',
      'request.flight',
      'done.flight',
      'request.hotel',
      'done.hotel',
      'request.car',
      'done.car',
      'request.payment',
      'done.payment',
      'confirm.hotel',
      'confirm.car',
      'end.completed',
    ])
    for (const step of ['flight', 'hotel', 'car']) await expect(r1.locator(`[data-cw-saga-step="${step}"]`)).toHaveAttribute('data-status', 'booked')
    await expect(r1.locator('[data-cw-saga-step="payment"]')).toHaveAttribute('data-status', 'charged')
    await expect(r1.locator('[data-cw-saga-entry]').last()).toHaveText(`■${es['ailab.r1.log.end.completed']}`)
    await expect(r1.locator('[data-cw-saga-run]')).toHaveText(es['ailab.r1.again'])
    expect(network.heavy).toEqual([])
    expect(network.sent).toEqual([])
  })

  test('la pasarela se cae en mitad del cobro: compensa en orden inverso, paso a paso y con el teclado', async ({ page }) => {
    await open(page)
    const r1 = await tryDemo(page, 'R1')
    await expect(r1.locator('[data-cw-saga-fail="payment"]')).toBeChecked()
    await expect(r1.locator('[data-cw-saga-step="payment"] [data-cw-saga-doomed]')).toHaveText(es['ailab.r1.doomed'])
    await r1.locator('[data-cw-saga-next]').focus()
    for (let index = 0; index < 9; index += 1) await page.keyboard.press('Enter')
    await expect(r1.locator('[data-cw-saga-progress]')).toHaveText('Evento 9 de 13')
    await expect(r1.locator('[data-cw-saga-fail="hotel"]')).toBeDisabled()
    await expect(r1.locator('[data-cw-saga-step="payment"]')).toHaveAttribute('data-status', 'failed')
    await expect(r1.locator('[data-cw-saga-direction]')).toContainText(es['ailab.r1.direction'])
    await expect(r1.locator('[data-cw-saga-entry]').last()).toContainText(es['ailab.r1.log.fail.payment'])
    for (let index = 0; index < 4; index += 1) await page.keyboard.press('Enter')
    await expect(r1.locator('[data-cw-saga-next]')).toBeFocused()
    expect((await entryKeys(r1)).slice(8)).toEqual(['fail.payment', 'release.car', 'release.hotel', 'cancel.flight', 'end.compensated'])
    await expect(r1.locator('[data-cw-saga-entry][data-key="release.car"]')).toHaveText(`↩${es['ailab.r1.log.release.car'].replace('{ref}', 'AU-88C')}`)
    await expect(r1.locator('[data-cw-saga-entry][data-key="cancel.flight"]')).toContainText('se cancela la reserva VU-7Q2K')
    await expect(r1.locator('[data-cw-saga-step="flight"]')).toHaveAttribute('data-status', 'cancelled')
    await expect(r1.locator('[data-cw-saga-step="hotel"]')).toHaveAttribute('data-status', 'released')
    await expect(r1.locator('[data-cw-saga-step="car"]')).toHaveAttribute('data-status', 'released')
    await expect(r1.locator('[data-cw-saga-outcome="compensated"]')).toHaveText(
      'Saga compensada. Apartados soltados: 2. Reservas canceladas: 1. No se cobró nada y nada quedó a medias.',
    )
    await expect(r1.locator('[data-cw-saga-next]')).toHaveAttribute('aria-disabled', 'true')
    await expect(r1.locator('[data-cw-saga-fail="hotel"]')).toBeEnabled()
    await r1.locator('[data-cw-saga-reset]').click()
    await expect(r1.locator('[data-cw-saga-log]')).toHaveText(es['ailab.r1.logEmpty'])
    await expect(r1.locator('[data-cw-saga-step="flight"]')).toHaveAttribute('data-status', 'pending')
  })

  test('cada punto de fallo deshace exactamente lo que estaba hecho', async ({ page }) => {
    await open(page)
    const r1 = await tryDemo(page, 'R1')
    const expected: Record<string, string[]> = {
      flight: ['fail.flight', 'end.compensated'],
      hotel: ['fail.hotel', 'cancel.flight', 'end.compensated'],
      car: ['fail.car', 'release.hotel', 'cancel.flight', 'end.compensated'],
    }
    for (const [step, tail] of Object.entries(expected)) {
      await r1.locator(`[data-cw-saga-fail="${step}"]`).check()
      await expect(r1.locator('[data-cw-saga-log]')).toHaveText(es['ailab.r1.logEmpty'])
      await stepToEnd(page, r1)
      const keys = await entryKeys(r1)
      expect(keys.slice(keys.indexOf(`fail.${step}`)), step).toEqual(tail)
      await expect(r1.locator(`[data-cw-saga-step="${step}"]`)).toHaveAttribute('data-status', 'failed')
    }
  })

  test('pausar y seguir no pierde el lugar', async ({ page }) => {
    await open(page)
    const r1 = await tryDemo(page, 'R1')
    const run = r1.locator('[data-cw-saga-run]')
    const entries = r1.locator('[data-cw-saga-entry]')
    await run.click()
    await expect.poll(() => entries.count()).toBeGreaterThanOrEqual(3)
    await run.click()
    await expect(run).toHaveText(es['ailab.r1.resume'])
    const before = await entries.allTextContents()
    await page.waitForTimeout(1_600)
    await expect(entries).toHaveCount(before.length)
    await run.click()
    await expect(run).toHaveText(es['ailab.r1.pause'])
    await expect.poll(() => entries.count()).toBeGreaterThan(before.length)
    expect((await entries.allTextContents()).slice(0, before.length), 'sigue desde donde quedó').toEqual(before)
  })

  test('con movimiento reducido no hay animaciones: todo se entiende por la bitácora', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    const r1 = await tryDemo(page, 'R1')
    for (let index = 0; index < 2; index += 1) await r1.locator('[data-cw-saga-next]').click()
    await expect(r1.locator('[data-cw-saga-step="flight"]')).toHaveAttribute('data-status', 'running')
    const motion = await r1.locator('[data-cw-saga-step], [data-cw-saga-entry]').evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node)
        const longest = Math.max(...style.transitionDuration.split(',').map((value) => parseFloat(value)))
        return { key: node.getAttribute('data-cw-saga-step') ?? node.getAttribute('data-key'), animation: style.animationName, longest }
      }),
    )
    expect(motion.filter((item) => item.animation !== 'none' || item.longest > 0.001)).toEqual([])
    await expect(r1.locator('[data-cw-saga-entry]').last()).toHaveText(`→${es['ailab.r1.log.request.flight']}`)
  })

  test('en inglés cuenta lo mismo', async ({ page }) => {
    await open(page, 'en')
    const r1 = await tryDemo(page, 'R1')
    await expect(r1.locator('legend')).toHaveText(en['ailab.r1.fail.legend'])
    await stepToEnd(page, r1)
    await expect(r1.locator('[data-cw-saga-entry][data-key="release.hotel"]')).toContainText('releases the hold HT-3105')
    await expect(r1.locator('[data-cw-saga-outcome="compensated"]')).toContainText('Holds released: 2. Bookings cancelled: 1.')
  })
})

test.describe('A4 Vitrinas: Despacho (US9 escenario 1, FR-358)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('abre sin descargar nada y muestra el caso ficticio, los hechos con su prueba y la cronología', async ({ page }) => {
    const network = guardNetwork(page)
    await fakePyodide(page)
    await open(page)
    const a4 = await tryDemo(page, 'A4')
    await expect(a4.locator('[data-cw-showcase-tab="despacho"]')).toHaveAttribute('aria-selected', 'true')
    const despacho = a4.locator('[data-cw-showcase="despacho"]')
    await expect(despacho.locator('[data-cw-made-up]')).toHaveText(es['ailab.a4.despacho.madeUp'])
    await expect(despacho.locator('[data-cw-made-up]')).toContainText(/datos inventados/i)
    await expect(despacho.getByRole('heading', { level: 5 })).toHaveText('Caso ficticio: la máquina de café que llegó golpeada')
    await expect(despacho.locator('[data-cw-evidence]')).toHaveCount(8)
    await expect(despacho.locator('[data-cw-fact]')).toHaveCount(5)
    await expect(despacho.locator('[data-cw-fact="H2"]')).toHaveAttribute('data-status', 'disputed')
    await expect(despacho.locator('[data-cw-fact="H2"] [data-relation="contradicts"]').first()).toContainText('Contradice')
    await expect(despacho.locator('[data-cw-fact="H5"]')).toContainText('Solo lo dice la clienta')
    await expect(despacho.locator('[data-cw-timeline]')).toHaveCount(9)
    await expect(despacho.locator('[data-cw-timeline="gap"]')).toContainText(es['ailab.a4.despacho.gap'])
    await expect(despacho.locator('[data-cw-timeline][data-certainty="conflict"]')).toContainText('Certeza: En conflicto')
    await expect(despacho.locator('[data-cw-despacho="limits"]')).toHaveText(es['ailab.a4.despacho.limits'])
    expect(await fake(page, (state) => state.created)).toBe(0)
    expect(await storedConsent(page)).toEqual([])
    expect(network.heavy).toEqual([])
    expect(network.sent).toEqual([])
  })

  test('las pestañas de las vitrinas se operan con el teclado', async ({ page }) => {
    await fakePyodide(page)
    await open(page)
    const a4 = await tryDemo(page, 'A4')
    const despacho = a4.locator('[data-cw-showcase-tab="despacho"]')
    const obra = a4.locator('[data-cw-showcase-tab="obra"]')
    await expect(a4.getByRole('tablist')).toHaveAttribute('aria-label', es['ailab.a4.tabs'])
    await despacho.focus()
    await page.keyboard.press('ArrowRight')
    await expect(obra).toBeFocused()
    await expect(obra).toHaveAttribute('aria-selected', 'true')
    await expect(a4.locator('[data-cw-showcase-panel="obra"]')).toBeVisible()
    await expect(a4.locator('[data-cw-showcase-panel="despacho"]')).toBeHidden()
    await page.keyboard.press('Home')
    await expect(despacho).toBeFocused()
    await page.keyboard.press('End')
    await expect(obra).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(despacho).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Tab')
    await expect(a4.locator('[data-cw-showcase-panel="despacho"]')).toBeFocused()
  })
})

test.describe('A4 Vitrinas: Obra con Pyodide (US9 escenarios 2 y 3, FR-358, R-705)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('"Ahora no" no descarga ni crea el worker; la bitácora, los precios de ejemplo y el código siguen ahí', async ({ page }) => {
    const network = guardNetwork(page)
    await fakePyodide(page)
    await open(page)
    const a4 = await openObra(page)
    const obra = a4.locator('[data-cw-showcase="obra"]')
    await expect(obra.locator('[data-cw-made-up]')).toHaveText(es['ailab.a4.obra.madeUp'])
    await expect(obra.locator('[data-cw-obra-status="idle"]')).toHaveText(
      'El estimado lo calcula Python (Pyodide con numpy) en un worker. Para eso descarga 15 MB desde cdn.jsdelivr.net, y solo si aceptas.',
    )
    await expect(obra.locator('[data-cw-obra-example]')).toContainText('Precios y cuantías de ejemplo')
    await expect(obra.locator('[data-cw-obra-price][data-example]')).toHaveCount(6)
    await expect(obra.locator('[data-cw-obra-price="concrete"]')).toContainText('ejemplo')
    await obra.locator('[data-cw-obra-run]').click()
    const dialog = consent(page)
    await expect(dialog.locator('[data-cw-lab-consent-text]')).toHaveText(
      'Este experimento descarga Pyodide 0.29.0 (12 MB) desde cdn.jsdelivr.net. Queda guardado en tu navegador para la próxima vez.',
    )
    await expect(obra.locator('[data-cw-obra-status="asking"]')).toBeVisible()
    await answer(page, 'cancel')
    await expect(obra.locator('[data-cw-obra-status="declined"]')).toHaveText(es['ailab.a4.obra.declined'])
    await expect(obra.locator('[data-cw-obra-run]')).toBeVisible()
    await expect(obra.locator('[data-cw-obra-entry]')).toHaveCount(4)
    await expect(obra.locator('[data-cw-obra-source] code')).toHaveText(ESTIMATE_PY.replace(/\n$/, ''))
    expect(await fake(page, (state) => state.created)).toBe(0)
    expect(await storedConsent(page)).toEqual([])
    expect(network.heavy).toEqual([])
  })

  test('con permiso para Pyodide y numpy calcula en el worker y muestra el código que corrió', async ({ page }) => {
    const network = guardNetwork(page)
    await fakePyodide(page)
    await open(page)
    const a4 = await openObra(page)
    const obra = a4.locator('[data-cw-showcase="obra"]')
    await obra.locator('[data-cw-obra-run]').click()
    await answer(page, 'accept', 'Pyodide 0.29.0 (12 MB)')
    await expect(consent(page).locator('[data-cw-lab-consent-text]')).toHaveText(
      'Este experimento descarga numpy (Pyodide 0.29.0) (3,1 MB) desde cdn.jsdelivr.net. Queda guardado en tu navegador para la próxima vez.',
    )
    await answer(page, 'accept')
    await expect(obra.locator('[data-cw-obra-status="ready"]')).toHaveText(
      'Listo: Pyodide 0.29.0, Python 3.13.2 y numpy 2.2.5 corren en un worker de tu navegador.',
    )
    await expect(obra.locator('[data-cw-obra-total] td')).toHaveText(/^\$\s22\.838\.886$/)
    await expect(obra.locator('[data-cw-obra-line="concrete"]')).toContainText(/13,08 m³ × \$\s620\.000/)
    await expect(obra.locator('[data-cw-obra-computed="C-1"]')).toHaveText(
      'Python calculó 1,46 m³ de concreto, 19,44 m² de formaleta y 233 kg de acero.',
    )
    await expect(obra.locator('[data-cw-obra-announce]')).toHaveText(/^Estimado recalculado: total \$\s22\.838\.886\.$/)
    await expect(obra.locator('[data-cw-obra-ms]')).toHaveText('Calculado con Python en 4,2 ms, en tu navegador.')
    await expect(obra.locator('[data-cw-obra-runs="1"]')).toHaveText('Ejecuciones de estimate_json() en esta sesión: 1. La última tardó 4,2 ms.')
    await expect(obra.locator('[data-cw-obra-source] code')).toHaveText(ESTIMATE_PY.replace(/\n$/, ''))
    expect(await fake(page, (state) => state.sources)).toEqual([ESTIMATE_PY])
    expect(await storedConsent(page)).toEqual(['A4:Pyodide 0.29.0', 'A4:numpy (Pyodide 0.29.0)'])
    await expect(a4.locator('[data-cw-lab-granted]')).toContainText('Pyodide 0.29.0, numpy (Pyodide 0.29.0)')
    await obra.locator('[data-cw-obra-call] summary').click()
    await expect(obra.locator('[data-cw-obra-call] pre')).toContainText('"contingency": 0.05')
    expect(network.heavy).toEqual([])
    expect(network.sent).toEqual([])
  })

  test('cambiar una cantidad recalcula con Python; un valor inválido se marca y no se calcula', async ({ page }) => {
    await fakePyodide(page)
    await open(page)
    const a4 = await openObra(page)
    const obra = a4.locator('[data-cw-showcase="obra"]')
    await acceptPython(page, a4)
    await expect(obra.locator('[data-cw-obra-runs="1"]')).toBeVisible()
    const count = obra.locator('[data-cw-obra-field="C-1:count"]')
    await count.fill('8')
    await expect(obra.locator('[data-cw-obra-entry="C-1"] [data-cw-obra-text]')).toContainText('(cantidad: 8)')
    await expect(obra.locator('[data-cw-obra-runs="2"]')).toBeVisible()
    expect(await fake(page, (state) => state.inputs.at(-1)?.items.find((item) => item.id === 'C-1')?.count)).toBe(8)
    const total = await fake(page, (state) => state.totals.at(-1)!)
    expect(total).toBeGreaterThan(22_838_886)
    await expect(obra.locator('[data-cw-obra-total] td')).toHaveText(new RegExp(`^\\$\\s${total.toLocaleString('es-CO').replace(/\./g, '\\.')}$`))
    await expect(obra.locator('[data-cw-obra-computed="C-1"]')).toContainText('1,94 m³ de concreto')

    const height = obra.locator('[data-cw-obra-field="V-1:c"]')
    await height.fill('cinco')
    await expect(height).toHaveAttribute('aria-invalid', 'true')
    await expect(obra.locator('[data-cw-obra-entry="V-1"] [data-cw-obra-error]')).toHaveText('Escribe una medida entre 0,05 y 30 m.')
    await expect(obra.locator('[data-cw-obra-stale]')).toHaveText(es['ailab.a4.obra.invalid'])
    await page.waitForTimeout(500)
    expect(await fake(page, (state) => state.inputs.length)).toBe(2)
    await height.fill('5,5')
    await expect(height).not.toHaveAttribute('aria-invalid', 'true')
    await expect(obra.locator('[data-cw-obra-runs="3"]')).toBeVisible()
    expect(await fake(page, (state) => state.inputs.at(-1)?.items.find((item) => item.id === 'V-1')?.c)).toBe(5.5)

    await obra.locator('[data-cw-obra-reset]').click()
    await expect(count).toHaveValue('6')
    await expect(obra.locator('[data-cw-obra-total] td')).toHaveText(/^\$\s22\.838\.886$/)
  })

  test('todo se opera con el teclado, incluido escribir un valor', async ({ page }) => {
    await fakePyodide(page)
    await open(page)
    const a4 = await tryDemo(page, 'A4')
    await a4.locator('[data-cw-showcase-tab="despacho"]').focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Tab')
    await expect(a4.locator('[data-cw-showcase-panel="obra"]')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(a4.locator('[data-cw-obra-field="Z-1:count"]')).toBeFocused()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('7')
    await expect(a4.locator('[data-cw-obra-entry="Z-1"] [data-cw-obra-text]')).toContainText('(cantidad: 7)')
    await a4.locator('[data-cw-obra-run]').focus()
    await page.keyboard.press('Enter')
    await expect(consent(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(a4.locator('[data-cw-obra-status="declined"]')).toBeVisible()
    await a4.locator('[data-cw-obra-run]').focus()
    await page.keyboard.press('Enter')
    await expect(consent(page).locator('[data-cw-lab-consent-accept]')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(consent(page).locator('[data-cw-lab-consent-accept]')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(consent(page).locator('[data-cw-lab-consent-text]')).toContainText('numpy (Pyodide 0.29.0)')
    await expect(consent(page).locator('[data-cw-lab-consent-cancel]')).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(a4.locator('[data-cw-obra-status="ready"]')).toBeVisible()
    expect(await fake(page, (state) => state.inputs.at(-1)?.items[0]?.count)).toBe(7)
  })

  test('retirar el permiso apaga Python y la próxima vez vuelve a preguntar', async ({ page }) => {
    await fakePyodide(page)
    await open(page)
    const a4 = await openObra(page)
    const obra = a4.locator('[data-cw-showcase="obra"]')
    await acceptPython(page, a4)
    await a4.locator('[data-cw-lab-revoke]').click()
    await expect(obra.locator('[data-cw-obra-status="idle"]')).toBeVisible()
    await expect(obra.getByText(es['ailab.a4.obra.revoked'])).toBeVisible()
    expect(await fake(page, (state) => state.terminated)).toBe(1)
    expect(await storedConsent(page)).toEqual([])
    await expect(a4.locator('[data-cw-lab-stage]')).toBeVisible()
    await obra.locator('[data-cw-obra-run]').click()
    await expect(consent(page).locator('[data-cw-lab-consent-text]')).toContainText('Pyodide 0.29.0 (12 MB)')
  })

  test('si Python no carga, lo dice y se puede reintentar sin recargar', async ({ page }) => {
    await fakePyodide(page)
    await open(page)
    const a4 = await openObra(page)
    const obra = a4.locator('[data-cw-showcase="obra"]')
    await setFake(page, { failLoad: true })
    await acceptConsents(page, a4)
    await expect(obra.locator('[data-cw-obra-status="failed"]')).toHaveText(es['ailab.a4.obra.failed'])
    await expect(obra.locator('[data-cw-obra-run]')).toHaveText(es['ailab.a4.obra.retry'])
    await setFake(page, { failLoad: false })
    await obra.locator('[data-cw-obra-run]').click()
    await expect(consent(page)).toHaveCount(0)
    await expect(obra.locator('[data-cw-obra-status="ready"]')).toBeVisible()
    await expect(obra.locator('[data-cw-obra-total]')).toBeVisible()
    expect(await fake(page, (state) => state.sources.length)).toBe(2)
  })

  test('en inglés los precios también dicen que son de ejemplo', async ({ page }) => {
    await fakePyodide(page)
    await open(page, 'en')
    const a4 = await openObra(page)
    const obra = a4.locator('[data-cw-showcase="obra"]')
    await expect(obra.locator('[data-cw-made-up]')).toHaveText(en['ailab.a4.obra.madeUp'])
    await expect(obra.locator('[data-cw-obra-example]')).toHaveText('Sample prices and steel ratios: they are not from any supplier or real site.')
    await acceptPython(page, a4)
    await expect(obra.locator('[data-cw-obra-total] td')).toHaveText(/^COP\s22,838,886$/)
  })
})

test.describe('accesibilidad y móvil con las demos abiertas (SC-306, FR-340)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('sin violaciones serias en tema claro y oscuro, con la saga compensada y las dos vitrinas', async ({ page }) => {
    await fakePyodide(page)
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme })
      await open(page)
      await page.evaluate((key) => sessionStorage.removeItem(key), CONSENT_KEY)
      const r1 = await tryDemo(page, 'R1')
      await stepToEnd(page, r1)
      expect(await blockingViolations(page, '[data-cw-lab-card="R1"]'), `R1 ${colorScheme}`).toEqual([])
      const a4 = await tryDemo(page, 'A4')
      expect(await blockingViolations(page, '[data-cw-lab-card="A4"]'), `Despacho ${colorScheme}`).toEqual([])
      await a4.locator('[data-cw-showcase-tab="obra"]').click()
      await acceptPython(page, a4)
      await a4.locator('[data-cw-obra-field="P-1:a"]').fill('x')
      expect(await blockingViolations(page, '[data-cw-lab-card="A4"]'), `Obra ${colorScheme}`).toEqual([])
    }
  })
})

test.describe('móvil: 44 px y sin desbordes a 390 px (patrones de la 006)', () => {
  onlyIn('mobile-chromium')

  test('cada control de R1 y A4 mide al menos 44 px de alto y nada desborda', async ({ page }) => {
    await fakePyodide(page)
    await open(page)
    const r1 = await tryDemo(page, 'R1')
    await stepToEnd(page, r1)
    const a4 = await openObra(page)
    await acceptPython(page, a4)
    for (const stage of [r1, a4]) {
      const small = await stage
        .locator('[data-cw-saga] button, [data-cw-saga] label:has(input), [data-cw-showcases] button:not([data-cw-code] button), [data-cw-showcases] input, [data-cw-showcases] summary')
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => (node as HTMLElement).offsetParent !== null)
            .map((node) => ({ text: (node.textContent ?? '').trim().slice(0, 30), height: Math.round(node.getBoundingClientRect().height) }))
            .filter((item) => item.height < 44),
        )
      expect(small).toEqual([])
    }
    for (const id of ['despacho', 'obra'] as const) {
      await a4.locator(`[data-cw-showcase-tab="${id}"]`).click()
      const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      expect(widths.scroll, id).toBeLessThanOrEqual(widths.client)
    }
  })
})
