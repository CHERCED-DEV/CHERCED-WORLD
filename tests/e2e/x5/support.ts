import { expect as baseExpect, test, type BrowserContext, type Locator, type Page, type Request, type TestInfo } from '@playwright/test'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'

export const expect = baseExpect.configure({ timeout: 15_000 })

export const LANGS = ['es', 'en'] as const

export type Lang = (typeof LANGS)[number]

export const COPY = { es, en } as const

export const INTEGRATED = ['V1', 'V2', 'V3', 'V4', 'A2', 'A3', 'A5', 'R1', 'A4'] as const

export type DemoId = (typeof INTEGRATED)[number]

export const GAMES = ['J1', 'J2'] as const

export type CardId = DemoId | (typeof GAMES)[number] | 'V5' | 'A6'

export const CONSENT_KEY = 'cw-ailab-consent'

export const HEAVY =
  /huggingface\.co|hf\.co|cdn\.jsdelivr\.net|\.wasm(\?|$)|\.onnx(\?|$)|\.onnx_data|\.safetensors(\?|$)|\.whl(\?|$)|\.tflite(\?|$)|pyodide|numpy|ort-wasm|onnxruntime/i

export const WORKER_CHUNK = /turbopack-worker|whisper\.worker|pyodide[\\/]worker|\.worker\.(js|mjs|ts)(\?|$)/i

export function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

export async function blockHeavy(context: BrowserContext): Promise<void> {
  await context.route(HEAVY, (route) => route.abort())
}

export async function open(page: Page, lang: Lang = 'es', { ready = true }: { ready?: boolean } = {}): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/ai-lab`)
  if (ready) await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

export function card(page: Page, id: CardId): Locator {
  return page.locator(`[data-cw-lab-card="${id}"]`)
}

export function stageOf(page: Page, id: CardId): Locator {
  return card(page, id).locator('[data-cw-lab-stage]')
}

export function consent(page: Page): Locator {
  return page.locator('dialog[open]').filter({ has: page.locator('[data-cw-lab-consent-text]') })
}

export async function settle(page: Page, { javaScript = true }: { javaScript?: boolean } = {}): Promise<void> {
  if (!javaScript) {
    await page.waitForTimeout(150)
    return
  }
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

export async function answerConsent(page: Page, choice: 'accept' | 'cancel', text?: string): Promise<void> {
  const dialog = consent(page)
  await expect(dialog).toBeVisible()
  if (text) await expect(dialog.locator('[data-cw-lab-consent-text]')).toContainText(text)
  await dialog.evaluate((node) => Promise.all(node.getAnimations({ subtree: true }).map((animation) => animation.finished)))
  await dialog.locator(`[data-cw-lab-consent-${choice}]`).click()
}

export async function storedConsent(page: Page): Promise<string[]> {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[], CONSENT_KEY)
}

export async function openDemo(page: Page, id: CardId, { answer = 'accept' }: { answer?: 'accept' | 'cancel' } = {}): Promise<Locator> {
  const item = card(page, id)
  const stage = item.locator('[data-cw-lab-stage]')
  if (await stage.isVisible()) return stage
  await item.locator('[data-cw-lab-open]').click()
  await expect(consent(page).or(stage).first()).toBeVisible()
  if (await consent(page).isVisible()) await answerConsent(page, answer)
  await expect(stage).toBeVisible()
  await expect(stage.locator('[data-cw-lab-loading]')).toHaveCount(0, { timeout: 30_000 })
  await expect(stage.locator('[data-cw-lab-failed]')).toHaveCount(0)
  return stage
}

export type FakeCall = { url: string; type: string; model?: string; language?: string; samples: number; input?: string; source?: number }

export type FakeWorkerState = { created: string[]; terminated: number; calls: FakeCall[]; transcript: string }

export async function fakeWorkers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Item = { id: string; kind: string; count: number; a: number; b: number; c: number }
    type Input = { items: Item[]; prices: Record<string, number>; ratios: Record<string, number>; contingency: number }
    type Payload = { type: string; model?: string; language?: string; audio?: Float32Array; source?: string; input?: Input }
    const state = {
      created: [] as string[],
      terminated: 0,
      calls: [] as Array<{ url: string; type: string; model?: string; language?: string; samples: number; input?: string; source?: number }>,
      transcript: 'hola',
    }
    Object.assign(window, { __x5: state })
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const round = (value: number, digits = 0) => Math.floor(value * 10 ** digits + 0.5) / 10 ** digits
    const estimate = (input: Input) => {
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
      url: string
      dead = false
      constructor(url: string | URL) {
        super()
        this.url = String(url)
        state.created.push(this.url)
      }
      emit(data: unknown) {
        if (!this.dead) this.dispatchEvent(new MessageEvent('message', { data }))
      }
      postMessage(message: { cw?: string; id?: number; payload?: Payload }) {
        if (this.dead || message?.cw !== 'call' || message.id === undefined || !message.payload) return
        void this.handle(message.id, message.payload)
      }
      async handle(id: number, payload: Payload) {
        const samples = payload.audio?.length ?? 0
        state.calls.push({
          url: this.url,
          type: payload.type,
          model: payload.model,
          language: payload.language,
          samples,
          input: payload.input ? JSON.stringify(payload.input) : undefined,
          source: payload.source?.length,
        })
        await wait(30)
        if (payload.type === 'load' && payload.model) {
          this.emit({ cw: 'progress', id, payload: { stage: 'download', loaded: 1, total: 1 } })
          this.emit({ cw: 'progress', id, payload: { stage: 'prepare', device: 'wasm' } })
          this.emit({ cw: 'result', id, payload: { type: 'loaded', model: payload.model, device: 'wasm', ms: 160 } })
          return
        }
        if (payload.type === 'transcribe') {
          const seconds = samples / 16_000
          const segments = [{ start: 0, end: Math.max(0.5, seconds), text: state.transcript }]
          this.emit({ cw: 'progress', id, payload: { stage: 'transcribe', done: 1, total: 1, segments } })
          this.emit({ cw: 'result', id, payload: { type: 'transcript', model: payload.model, device: 'wasm', text: state.transcript, segments, seconds, ms: 842 } })
          return
        }
        if (payload.type === 'load') {
          for (const stage of ['core', 'numpy', 'source']) this.emit({ cw: 'progress', id, payload: { stage } })
          this.emit({ cw: 'result', id, payload: { type: 'ready', ms: 900, pyodide: '0.29.0', python: '3.13.2', numpy: '2.2.5' } })
          return
        }
        if (payload.type === 'estimate' && payload.input) this.emit({ cw: 'result', id, payload: { type: 'estimate', estimate: estimate(payload.input), ms: 4.2 } })
      }
      terminate() {
        this.dead = true
        state.terminated += 1
      }
    }
    Object.defineProperty(window, 'Worker', { value: FakeWorker, configurable: true, writable: true })
  })
}

export async function workerState(page: Page): Promise<FakeWorkerState> {
  return page.evaluate(() => (window as unknown as { __x5: FakeWorkerState }).__x5)
}

export async function setTranscript(page: Page, text: string): Promise<void> {
  await page.evaluate((value) => {
    ;(window as unknown as { __x5: FakeWorkerState }).__x5.transcript = value
  }, text)
}

export type FakeVoice = { name: string; lang: string; voiceURI: string; localService: boolean; default: boolean }

export const FAKE_VOICES: FakeVoice[] = [
  { name: 'Paulina', lang: 'es-CO', voiceURI: 'paulina', localService: true, default: false },
  { name: 'Google español', lang: 'es-ES', voiceURI: 'google-es', localService: false, default: false },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', localService: true, default: true },
  { name: 'Aria Online', lang: 'en-US', voiceURI: 'aria-online', localService: false, default: false },
]

export const ONLINE_VOICE: Record<Lang, string> = { es: 'google-es', en: 'aria-online' }

export type SpeechState = { spoken: Array<{ text: string; lang: string; voice: string | null }>; speaking: boolean }

export async function fakeSpeech(page: Page, voices: FakeVoice[] | null = FAKE_VOICES): Promise<void> {
  await page.addInitScript((list) => {
    if (list === null) {
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: undefined, configurable: true, writable: true })
      return
    }
    type Utterance = { text: string; lang: string; voice: { name: string } | null; onstart: ((event: object) => void) | null; onend: ((event: object) => void) | null; onerror: ((event: { error: string }) => void) | null }
    const state = { spoken: [] as Array<{ text: string; lang: string; voice: string | null }>, speaking: false, voices: [] as unknown[] }
    let current: Utterance | null = null
    const listeners = new Set<() => void>()
    class FakeUtterance {
      lang = ''
      voice = null
      rate = 1
      pitch = 1
      volume = 1
      onstart = null
      onend = null
      onerror = null
      constructor(public text: string) {}
    }
    const synth = {
      getVoices: () => state.voices,
      speak(utterance: Utterance) {
        state.spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name ?? null })
        current = utterance
        state.speaking = true
        utterance.onstart?.({})
      },
      cancel() {
        const utterance = current
        current = null
        state.speaking = false
        utterance?.onerror?.({ error: 'interrupted' })
      },
      pause() {},
      resume() {},
      addEventListener(type: string, listener: () => void) {
        if (type === 'voiceschanged') listeners.add(listener)
      },
      removeEventListener(_type: string, listener: () => void) {
        listeners.delete(listener)
      },
    }
    Object.assign(window, {
      __x5speech: {
        state,
        end: () => {
          const utterance = current
          if (!utterance) return
          current = null
          state.speaking = false
          utterance.onend?.({})
        },
      },
    })
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true })
    setTimeout(() => {
      state.voices = list
      for (const listener of listeners) listener()
    }, 100)
  }, voices)
}

export async function speechState(page: Page): Promise<SpeechState> {
  return page.evaluate(() => (window as unknown as { __x5speech: { state: SpeechState } }).__x5speech.state)
}

function commentChunk(text: string): Buffer {
  const body = Buffer.from(`${text}\0`, 'latin1')
  const pad = Buffer.alloc(body.length % 2)
  const icmt = Buffer.alloc(8)
  icmt.write('ICMT', 0, 'latin1')
  icmt.writeUInt32LE(body.length, 4)
  const info = Buffer.concat([Buffer.from('INFO', 'latin1'), icmt, body, pad])
  const head = Buffer.alloc(8)
  head.write('LIST', 0, 'latin1')
  head.writeUInt32LE(info.length, 4)
  return Buffer.concat([head, info])
}

export function wav(seconds: number, comment?: string): Buffer {
  const rate = 16_000
  const samples = Math.round(seconds * rate)
  const list = comment ? commentChunk(comment) : Buffer.alloc(0)
  const data = Buffer.alloc(44 + samples * 2)
  data.write('RIFF', 0)
  data.writeUInt32LE(36 + samples * 2 + list.length, 4)
  data.write('WAVEfmt ', 8)
  data.writeUInt32LE(16, 16)
  data.writeUInt16LE(1, 20)
  data.writeUInt16LE(1, 22)
  data.writeUInt32LE(rate, 24)
  data.writeUInt32LE(rate * 2, 28)
  data.writeUInt16LE(2, 32)
  data.writeUInt16LE(16, 34)
  data.write('data', 36)
  data.writeUInt32LE(samples * 2, 40)
  for (let index = 0; index < samples; index += 1) data.writeInt16LE(Math.round(0.3 * Math.sin((2 * Math.PI * 220 * index) / rate) * 32_767), 44 + index * 2)
  return Buffer.concat([data, list])
}

export async function stepToEnd(stage: Locator): Promise<void> {
  const next = stage.locator('[data-cw-saga-next]')
  for (let index = 0; index < 20 && (await stage.locator('[data-cw-saga-outcome]').count()) === 0; index += 1) await next.click()
  await expect(stage.locator('[data-cw-saga-outcome]')).toBeVisible()
}

export async function obraWithPython(page: Page, stage: Locator): Promise<void> {
  await stage.locator('[data-cw-showcase-tab="obra"]').click()
  await expect(stage.locator('[data-cw-showcase-panel="obra"]')).toBeVisible()
  if ((await stage.locator('[data-cw-obra-status="ready"]').count()) > 0) return
  await stage.locator('[data-cw-obra-run]').click()
  await answerConsent(page, 'accept', 'Pyodide 0.29.0')
  await answerConsent(page, 'accept', 'numpy')
  await expect(consent(page)).toHaveCount(0)
  await expect(stage.locator('[data-cw-obra-status="ready"]')).toBeVisible()
  await expect(stage.locator('[data-cw-obra-total]')).toBeVisible()
}

export type Prepared = { stage: Locator; views: Array<{ name: string; show: () => Promise<void> }> }

export async function prepareDemo(page: Page, id: DemoId, lang: Lang): Promise<Prepared> {
  const stage = await openDemo(page, id)
  const only = (name: string) => [{ name, show: async () => {} }]
  switch (id) {
    case 'V1': {
      await expect(stage.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
      await setTranscript(page, lang === 'es' ? 'Una transcripción de prueba, con su marca de tiempo.' : 'A test transcript, with its timestamp.')
      await stage.locator('[data-cw-v1-upload]').setInputFiles({ name: 'prueba-del-laboratorio.wav', mimeType: 'audio/wav', buffer: wav(2) })
      await expect(stage.locator('[data-cw-v1-timing]')).toBeVisible()
      return { stage, views: only('V1') }
    }
    case 'V2': {
      const select = stage.locator('[data-cw-speech-voice]')
      await expect(select).toBeVisible()
      await select.selectOption(ONLINE_VOICE[lang])
      await expect(stage.locator('[data-cw-speech-online]')).toBeVisible()
      return { stage, views: only('V2') }
    }
    case 'V3': {
      await expect(stage.locator('[data-cw-speech-voice]')).toBeVisible()
      await stage.locator('[data-cw-speech-play]').click()
      await expect(stage.locator('[data-cw-speech-status="playing"]')).toBeVisible()
      await stage.locator('[data-cw-v3-plan] summary').click()
      await expect(stage.locator('[data-cw-v3-skipped]')).toBeVisible()
      return { stage, views: only('V3') }
    }
    case 'V4': {
      await stage.locator('[data-cw-v4-text]').fill(lang === 'es' ? 'una frase que no es un comando' : 'a phrase that is not a command')
      await stage.locator('[data-cw-v4-submit]').click()
      await expect(stage.locator('[data-cw-v4-outcome="unknown"]')).toBeVisible()
      await expect(stage.locator('[data-cw-v4-commands]')).toHaveAttribute('open', '')
      return { stage, views: only('V4') }
    }
    case 'A2': {
      const items = stage.locator('[role="tree"] [role="treeitem"]')
      await expect(items.first()).toBeVisible()
      await items.last().click()
      await expect(stage.locator('[data-cw-plugin-what]')).toBeVisible()
      return { stage, views: only('A2') }
    }
    case 'A3': {
      await stage.locator('[data-cw-skill-download]').click()
      await expect(stage.locator('[data-cw-skill-field="name"]')).toHaveAttribute('aria-invalid', 'true')
      await stage.locator('[data-cw-skill-field="name"]').fill(lang === 'es' ? 'Revisar Recetas Con Tildes Á' : 'Review Recipes With Spaces')
      await expect(stage.locator('[data-cw-skill-suggest]')).toBeVisible()
      return { stage, views: only('A3') }
    }
    case 'A5': {
      await expect(stage.locator('[data-cw-glassbox]')).toHaveAttribute('data-cw-glassbox', 'ready', { timeout: 30_000 })
      await stage.locator('[data-cw-glass-example]').first().click()
      const first = stage.locator('[data-cw-glass-result]').first()
      await expect(first).toBeVisible()
      await first.locator('[data-cw-glass-why] summary').click()
      await expect(first.locator('[data-cw-glass-total]')).toBeVisible()
      return { stage, views: only('A5') }
    }
    case 'R1': {
      await stepToEnd(stage)
      return { stage, views: only('R1') }
    }
    case 'A4': {
      await expect(stage.locator('[data-cw-showcase="despacho"]')).toBeVisible()
      return {
        stage,
        views: [
          {
            name: 'A4 Despacho',
            show: async () => {
              await stage.locator('[data-cw-showcase-tab="despacho"]').click()
              await expect(stage.locator('[data-cw-showcase-panel="despacho"]')).toBeVisible()
            },
          },
          {
            name: 'A4 Obra',
            show: async () => {
              await obraWithPython(page, stage)
              const field = stage.locator('[data-cw-obra-field="P-1:a"]')
              if ((await field.getAttribute('aria-invalid')) !== 'true') {
                await field.fill('x')
                await expect(field).toHaveAttribute('aria-invalid', 'true')
              }
            },
          },
        ],
      }
    }
  }
}

export type LayoutReport = { escapes: string[]; cut: string[]; overlaps: string[]; small: string[] }

export async function layoutReport(scope: Locator, { minTarget = 0 }: { minTarget?: number } = {}): Promise<LayoutReport> {
  return scope.evaluate((root, min) => {
    const describe = (node: Element) => {
      const data = [...node.attributes].find((attribute) => attribute.name.startsWith('data-cw-'))
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
      return `${node.tagName.toLowerCase()}${data ? `[${data.name}${data.value ? `="${data.value}"` : ''}]` : ''}${text ? ` «${text}»` : ''}`
    }
    const shown = (node: Element) => {
      const style = getComputedStyle(node)
      if (style.visibility !== 'visible' || style.display === 'none' || Number(style.opacity) === 0) return false
      const rect = node.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return false
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        const outer = getComputedStyle(parent)
        if (Number(outer.opacity) === 0 || outer.display === 'none') return false
        if (parent.getBoundingClientRect().width < 2) return false
      }
      return true
    }
    const scrolls = (value: string) => value === 'auto' || value === 'scroll'
    const clips = (value: string) => value === 'hidden' || value === 'clip'
    const insideScroller = (node: Element, axis: 'x' | 'y') => {
      for (let parent = node.parentElement; parent && parent !== root; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (scrolls(axis === 'x' ? style.overflowX : style.overflowY)) return true
      }
      return false
    }
    const box = root.getBoundingClientRect()
    const elements = [...root.querySelectorAll('*')].filter(shown)
    const escapes: string[] = []
    for (const node of elements) {
      if (insideScroller(node, 'x')) continue
      const rect = node.getBoundingClientRect()
      if (rect.left < box.left - 1 || rect.right > box.right + 1) escapes.push(`${describe(node)}: ${Math.round(rect.left - box.left)}..${Math.round(rect.right - box.left)} de ${Math.round(box.width)} px`)
    }
    const cut: string[] = []
    for (const node of elements) {
      if (['input', 'textarea', 'select', 'option', 'svg', 'code', 'pre'].includes(node.tagName.toLowerCase()) || node.closest('svg')) continue
      const texts = [...node.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? '').trim() !== '')
      if (texts.length === 0) continue
      const style = getComputedStyle(node)
      const clamp = style.getPropertyValue('-webkit-line-clamp')
      if (clamp && clamp !== 'none' && node.scrollHeight > node.clientHeight + 1) {
        cut.push(`${describe(node)}: line-clamp`)
        continue
      }
      if (style.textOverflow === 'ellipsis' && node.scrollWidth > node.clientWidth + 1) {
        cut.push(`${describe(node)}: ellipsis`)
        continue
      }
      const range = document.createRange()
      for (const text of texts) {
        range.selectNodeContents(text)
        const rect = range.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        let problem = ''
        for (let parent: Element | null = node; parent && !problem; parent = parent.parentElement) {
          const outer = getComputedStyle(parent)
          const frame = parent.getBoundingClientRect()
          if (scrolls(outer.overflowX) || scrolls(outer.overflowY)) break
          if (clips(outer.overflowX) && (rect.left < frame.left - 1 || rect.right > frame.right + 1)) problem = `cortado a lo ancho por ${describe(parent).slice(0, 60)}`
          if (clips(outer.overflowY) && (rect.top < frame.top - 1 || rect.bottom > frame.bottom + 1)) problem = `cortado a lo alto por ${describe(parent).slice(0, 60)}`
        }
        if (problem) {
          cut.push(`${describe(node)}: ${problem}`)
          break
        }
      }
    }
    const controls = [
      ...root.querySelectorAll(
        'button, a[href], select, textarea, summary, input:not([type="radio"]):not([type="checkbox"]):not([type="file"]):not([type="hidden"]), label:has(input[type="radio"]), label:has(input[type="checkbox"]), label[for], [role="tab"], [role="treeitem"] > *:first-child',
      ),
    ].filter(shown)
    const overlaps: string[] = []
    for (let first = 0; first < controls.length; first += 1) {
      for (let second = first + 1; second < controls.length; second += 1) {
        const a = controls[first]!
        const b = controls[second]!
        if (a.contains(b) || b.contains(a)) continue
        const ra = a.getBoundingClientRect()
        const rb = b.getBoundingClientRect()
        const width = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left)
        const height = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
        if (width > 2 && height > 2) overlaps.push(`${describe(a)} ⟂ ${describe(b)} (${Math.round(width)}×${Math.round(height)} px)`)
      }
    }
    const small: string[] = []
    if (min > 0) {
      const ownTarget = (node: Element) => {
        if (!node.matches('label[for]')) return true
        const control = document.getElementById(node.getAttribute('for') ?? '')
        return Boolean(control?.matches('input[type="file"], input[type="radio"], input[type="checkbox"]'))
      }
      for (const node of controls) {
        if (node.matches('a') || node.closest('[data-cw-code], pre') || !ownTarget(node)) continue
        const rect = node.getBoundingClientRect()
        if (rect.height < min - 0.5) small.push(`${describe(node)}: ${Math.round(rect.height)} px de alto`)
      }
    }
    return { escapes, cut, overlaps, small }
  }, minTarget)
}

export async function pageOverflow(page: Page): Promise<{ scroll: number; client: number; inner: number; body: number }> {
  return page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    inner: window.innerWidth,
    body: document.body.scrollWidth,
  }))
}

export async function attachShot(testInfo: TestInfo, name: string, target: Locator | Page): Promise<void> {
  const body = await target.screenshot({ animations: 'disabled' })
  await testInfo.attach(name, { body, contentType: 'image/png' })
}

export type Traffic = { requests: Request[]; heavy: string[]; sockets: string[] }

export function recordTraffic(context: BrowserContext, page: Page): Traffic {
  const traffic: Traffic = { requests: [], heavy: [], sockets: [] }
  context.on('request', (request) => {
    traffic.requests.push(request)
    if (HEAVY.test(request.url())) traffic.heavy.push(`${request.method()} ${request.url()}`)
  })
  page.on('websocket', (socket) => traffic.sockets.push(socket.url()))
  return traffic
}

function variants(text: string): string[] {
  const lower = text.toLowerCase()
  return [...new Set([lower, encodeURIComponent(text).toLowerCase(), encodeURIComponent(text).replace(/%20/g, '+').toLowerCase()])]
}

export async function carrying(requests: Request[], needles: string[]): Promise<string[]> {
  const found: string[] = []
  for (const request of requests) {
    let url = request.url()
    try {
      url = decodeURIComponent(url)
    } catch {}
    const headers = Object.values(await request.allHeaders().catch(() => request.headers())).join('\n')
    const body = request.postDataBuffer()?.toString('latin1') ?? ''
    const utf8 = request.postDataBuffer()?.toString('utf8') ?? ''
    const haystack = `${request.url()}\n${url}\n${headers}\n${body}\n${utf8}`.toLowerCase()
    for (const needle of needles) {
      if (variants(needle).some((variant) => haystack.includes(variant))) found.push(`${needle} → ${request.method()} ${request.url()}`)
    }
  }
  return found
}
