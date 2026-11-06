import { readFile } from 'node:fs/promises'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect as baseExpect, test, type Locator, type Page, type Request } from '@playwright/test'
import { defaultDownload, labExperiment } from '@/content/ailab/catalog'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import { ONNX_RUNTIME } from '@/lib/ailab/voice/models'

const expect = baseExpect.configure({ timeout: 15_000 })

const FAKE_MIC = path.resolve('tests/e2e/x1/fixtures/voice-tone.wav')

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-audio-capture=${FAKE_MIC}`],
  },
})

const HEAVY = /huggingface\.co|hf\.co|cdn\.jsdelivr\.net|\.wasm(\?|$)|\.onnx(\?|$)/i
const CONSENT_KEY = 'cw-ailab-consent'
const SRT_CUE = /^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n.+$/

type FakeScript = { text?: string; segments?: Array<{ start: number; end: number; text: string }>; failLoad?: boolean; loadHoldMs?: number }

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function fakeWhisper(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Payload = { type: string; model: string; language?: string; audio?: Float32Array }
    const state = {
      created: 0,
      terminated: 0,
      paused: false,
      calls: [] as Array<{ type: string; model: string; language?: string; seconds: number }>,
      script: {} as { text?: string; segments?: Array<{ start: number; end: number; text: string }>; failLoad?: boolean; loadHoldMs?: number },
    }
    Object.assign(window, { __x1: state })
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    const SIZES: Record<string, number> = { tiny: 41_000_000, base: 77_000_000, small: 249_000_000 }
    class FakeWorker extends EventTarget {
      dead = false
      cancelled = new Set<number>()
      constructor() {
        super()
        state.created += 1
      }
      emit(data: unknown) {
        if (!this.dead) this.dispatchEvent(new MessageEvent('message', { data }))
      }
      postMessage(message: { cw: string; id?: number; payload?: Payload }) {
        if (this.dead || !message || typeof message !== 'object') return
        if (message.cw === 'pause') state.paused = true
        else if (message.cw === 'resume') state.paused = false
        else if (message.cw === 'cancel' && message.id !== undefined) this.cancelled.add(message.id)
        else if (message.cw === 'call' && message.id !== undefined && message.payload) void this.handle(message.id, message.payload)
      }
      async handle(id: number, payload: Payload) {
        const seconds = payload.audio ? payload.audio.length / 16_000 : 0
        state.calls.push({ type: payload.type, model: payload.model, language: payload.language, seconds })
        if (payload.type === 'load') {
          const total = SIZES[payload.model] ?? 1
          for (const part of [0.2, 0.6, 1]) {
            await wait(40)
            this.emit({ cw: 'progress', id, payload: { stage: 'download', loaded: Math.round(total * part), total } })
          }
          if (state.script.failLoad) {
            this.emit({ cw: 'error', id, error: { name: 'TypeError', message: 'Failed to fetch' } })
            return
          }
          this.emit({ cw: 'progress', id, payload: { stage: 'prepare', device: 'wasm' } })
          await wait(state.script.loadHoldMs ?? 40)
          this.emit({ cw: 'result', id, payload: { type: 'loaded', model: payload.model, device: 'wasm', ms: 160 } })
          return
        }
        const segments = state.script.segments ?? [{ start: 0, end: Math.max(0.5, seconds), text: state.script.text ?? 'hola' }]
        this.emit({ cw: 'progress', id, payload: { stage: 'transcribe', done: 0, total: segments.length, segments: [] } })
        for (const [index, segment] of segments.entries()) {
          await wait(60)
          if (this.cancelled.has(id)) return
          this.emit({ cw: 'progress', id, payload: { stage: 'transcribe', done: index + 1, total: segments.length, segments: [segment] } })
        }
        this.emit({
          cw: 'result',
          id,
          payload: { type: 'transcript', model: payload.model, device: 'wasm', text: segments.map((item) => item.text).join(' '), segments, seconds, ms: 842 },
        })
      }
      terminate() {
        this.dead = true
        state.terminated += 1
      }
    }
    Object.defineProperty(window, 'Worker', { value: FakeWorker, configurable: true, writable: true })
  })
}

async function script(page: Page, value: FakeScript): Promise<void> {
  await page.evaluate((next) => {
    ;(window as unknown as { __x1: { script: FakeScript } }).__x1.script = next
  }, value)
}

async function fake<T>(page: Page, read: (state: { created: number; terminated: number; paused: boolean; calls: Array<{ type: string; model: string; language?: string; seconds: number }> }) => T): Promise<T> {
  return page.evaluate(`(${read.toString()})(window.__x1)`) as Promise<T>
}

function guardNetwork(page: Page): { heavy: string[]; sent: string[] } {
  const heavy: string[] = []
  const sent: string[] = []
  page.on('request', (request: Request) => {
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

type VoiceId = 'V1' | 'V2' | 'V3' | 'V4'

function card(page: Page, id: VoiceId): Locator {
  return page.locator(`[data-cw-lab-card="${id}"]`)
}

function consent(page: Page): Locator {
  return page.locator('dialog[open]').filter({ has: page.locator('[data-cw-lab-consent-text]') })
}

async function accept(page: Page): Promise<void> {
  await consent(page).locator('[data-cw-lab-consent-accept]').click()
  await expect(consent(page)).toBeHidden()
}

async function tryDemo(page: Page, id: VoiceId): Promise<Locator> {
  const item = card(page, id)
  const stage = item.locator('[data-cw-lab-stage]')
  await item.locator('[data-cw-lab-open]').click()
  await expect(consent(page).or(stage).first()).toBeVisible()
  if (await consent(page).isVisible()) await accept(page)
  await expect(stage).toBeVisible()
  await expect(item.locator(`[data-cw-voice="${id}"]`)).toBeVisible()
  if (id === 'V4' && (await item.locator('[data-cw-v4-voice="off"]').count()) > 0) {
    await item.locator('[data-cw-v4-activate]').click()
    await accept(page)
  }
  return item
}

const V4_ASKS_ON_TRY = defaultDownload(labExperiment('V4')) !== null

type FakeVoice = { name: string; lang: string; voiceURI: string; localService: boolean; default: boolean }

const FAKE_VOICES: FakeVoice[] = [
  { name: 'Google español', lang: 'es-ES', voiceURI: 'google-es', localService: false, default: false },
  { name: 'Paulina', lang: 'es-CO', voiceURI: 'paulina', localService: true, default: false },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', localService: true, default: true },
  { name: 'Aria Online', lang: 'en-US', voiceURI: 'aria-online', localService: false, default: false },
]

type SpeechState = { spoken: Array<{ text: string; lang: string; voice: string | null; rate: number }>; cancels: number; auto: number; speaking: boolean }

async function fakeSpeech(page: Page, options: { voices?: FakeVoice[] | null; auto?: number } = {}): Promise<void> {
  await page.addInitScript(
    ({ voices, auto }) => {
      if (voices === null) {
        Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: undefined, configurable: true, writable: true })
        return
      }
      type Utterance = { text: string; lang: string; voice: { name: string } | null; rate: number; onstart: ((event: object) => void) | null; onend: ((event: object) => void) | null; onerror: ((event: { error: string }) => void) | null }
      const state = { spoken: [] as Array<{ text: string; lang: string; voice: string | null; rate: number }>, cancels: 0, auto, speaking: false, voices: [] as unknown[] }
      let current: Utterance | null = null
      const listeners = new Set<() => void>()
      const finish = (utterance: Utterance) => {
        if (current !== utterance) return
        current = null
        state.speaking = false
        utterance.onend?.({})
      }
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
          state.spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name ?? null, rate: utterance.rate })
          current = utterance
          state.speaking = true
          utterance.onstart?.({})
          if (state.auto > 0) setTimeout(() => finish(utterance), state.auto)
        },
        cancel() {
          state.cancels += 1
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
        removeEventListener(type: string, listener: () => void) {
          listeners.delete(listener)
        },
      }
      Object.assign(window, {
        __x1speech: {
          state,
          end: () => {
            if (current) finish(current)
          },
        },
      })
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true })
      setTimeout(() => {
        state.voices = voices
        for (const listener of listeners) listener()
      }, 150)
    },
    { voices: options.voices === undefined ? FAKE_VOICES : options.voices, auto: options.auto ?? 0 },
  )
}

async function speech(page: Page): Promise<SpeechState> {
  return page.evaluate(() => (window as unknown as { __x1speech: { state: SpeechState } }).__x1speech.state)
}

async function endUtterance(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as { __x1speech: { end: () => void } }).__x1speech.end())
}

async function autoSpeech(page: Page, ms: number): Promise<void> {
  await page.evaluate((value) => {
    ;(window as unknown as { __x1speech: { state: SpeechState } }).__x1speech.state.auto = value
  }, ms)
}

function wav(seconds: number, rate = 16_000, bits: 8 | 16 = 16): Buffer {
  const bytes = bits / 8
  const samples = Math.round(seconds * rate)
  const buffer = Buffer.alloc(44 + samples * bytes)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + samples * bytes, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(rate, 24)
  buffer.writeUInt32LE(rate * bytes, 28)
  buffer.writeUInt16LE(bytes, 32)
  buffer.writeUInt16LE(bits, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(samples * bytes, 40)
  for (let index = 0; index < samples; index += 1) {
    const value = 0.3 * Math.sin((2 * Math.PI * 220 * index) / rate)
    if (bits === 16) buffer.writeInt16LE(Math.round(value * 32_767), 44 + index * 2)
    else buffer.writeUInt8(Math.round(128 + value * 127), 44 + index)
  }
  return buffer
}

async function blockingViolations(page: Page, include: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).include(include).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test.describe('V1 Transcriptor (US2, FR-350)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('nada se crea antes de "Probar"; al aceptar, carga base en un worker y lo dice, sin descargas reales', async ({ page }) => {
    const network = guardNetwork(page)
    await fakeWhisper(page)
    await open(page)
    expect(await fake(page, (state) => state.created)).toBe(0)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-local]')).toHaveText(es['ailab.v1.local'])
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await expect(v1.locator('[data-cw-voice-engine] [role="status"]')).toHaveText('Whisper base (int8) está listo y corre con WASM en tu equipo.')
    await expect(v1.locator('[data-cw-v1-device-hint]')).toContainText('prueba Tiny (41 MB)')
    expect(await fake(page, (state) => state.calls)).toEqual([{ type: 'load', model: 'base', seconds: 0 }])
    await expect(v1.locator('[data-cw-v1-model="base"]')).toBeChecked()
    await expect(v1.locator('[data-cw-v1-language="es"]')).toBeChecked()
    expect(network.heavy).toEqual([])
  })

  test('sube un audio, ve la transcripción con marcas y el tiempo medido, y exporta .txt y .srt válidos', async ({ page }) => {
    const network = guardNetwork(page)
    await fakeWhisper(page)
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await script(page, {
      segments: [
        { start: 0, end: 2.4, text: 'Hola, esta es una prueba.' },
        { start: 2.4, end: 4.9, text: 'Corre en el navegador.' },
      ],
    })
    await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: 'prueba.wav', mimeType: 'audio/wav', buffer: wav(5) })
    await expect(v1.locator('[data-cw-v1-segment]')).toHaveCount(2, { timeout: 15_000 })
    await expect(v1.locator('[data-cw-v1-segment]').first()).toHaveText('00:00Hola, esta es una prueba.')
    await expect(v1.locator('[data-cw-v1-timing]')).toHaveText('Tardó 0,8 s para 00:05 de audio, con Whisper base (int8) y WASM, medido en tu equipo.')
    await expect(v1.locator('[data-cw-v1-work] [role="status"]')).toHaveText(es['ailab.v1.status.done'])
    const calls = await fake(page, (state) => state.calls)
    expect(calls.at(-1)).toEqual({ type: 'transcribe', model: 'base', language: 'es', seconds: 5 })

    const [srtFile] = await Promise.all([page.waitForEvent('download'), v1.locator('[data-cw-v1-export="srt"]').click()])
    expect(srtFile.suggestedFilename()).toMatch(/^transcripcion-\d{4}-\d{2}-\d{2}-\d{4}\.srt$/)
    const srt = await readFile((await srtFile.path())!, 'utf8')
    const cues = srt.trimEnd().split('\n\n')
    expect(cues).toHaveLength(2)
    for (const cue of cues) expect(cue).toMatch(SRT_CUE)
    expect(cues[0]).toBe('1\n00:00:00,000 --> 00:00:02,400\nHola, esta es una prueba.')

    const [txtFile] = await Promise.all([page.waitForEvent('download'), v1.locator('[data-cw-v1-export="txt"]').click()])
    expect(txtFile.suggestedFilename()).toMatch(/\.txt$/)
    expect(await readFile((await txtFile.path())!, 'utf8')).toBe('[00:00 - 00:02] Hola, esta es una prueba.\n[00:02 - 00:04] Corre en el navegador.\n')
    expect(network.heavy).toEqual([])
    expect(network.sent).toEqual([])
  })

  test('graba con el micrófono (fuente falsa) y transcribe en inglés', async ({ page }) => {
    const network = guardNetwork(page)
    await fakeWhisper(page)
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await script(page, { text: 'Hello from the fake microphone.' })
    await v1.locator('[data-cw-v1-language="en"]').check()
    await v1.locator('[data-cw-v1-record]').click()
    await expect(v1.locator('[data-cw-v1-record="recording"]')).toBeVisible({ timeout: 15_000 })
    await expect(v1.locator('[data-cw-v1-work] [role="status"]')).toHaveText(es['ailab.v1.recording'])
    await page.waitForTimeout(1300)
    await v1.locator('[data-cw-v1-record]').click()
    await expect(v1.locator('[data-cw-v1-segment]')).toHaveText(['00:00Hello from the fake microphone.'], { timeout: 15_000 })
    const last = (await fake(page, (state) => state.calls)).at(-1)
    expect(last).toMatchObject({ type: 'transcribe', model: 'base', language: 'en' })
    expect(last?.seconds).toBeGreaterThan(0.8)
    expect(network.sent).toEqual([])
  })

  test('cambiar a tiny o small pide su propio permiso con su peso; cancelar la carga no deja nada a medias', async ({ page }) => {
    await fakeWhisper(page)
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await v1.locator('[data-cw-v1-model="small"]').check()
    await v1.locator('[data-cw-v1-load="small"]').click()
    await expect(consent(page).locator('[data-cw-lab-consent-text]')).toHaveText(
      'Este experimento descarga Whisper small (int8) (249 MB) desde huggingface.co. Queda guardado en tu navegador para la próxima vez.',
    )
    await consent(page).locator('[data-cw-lab-consent-cancel]').click()
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '[]'), CONSENT_KEY)).toEqual(['V1:Whisper base (int8)'])

    await v1.locator('[data-cw-v1-model="tiny"]').check()
    await script(page, { loadHoldMs: 60_000 })
    await v1.locator('[data-cw-v1-load="tiny"]').click()
    await consent(page).locator('[data-cw-lab-consent-accept]').click()
    await expect(v1.locator('[data-cw-voice-engine="loading"] [role="status"]')).toContainText('Whisper tiny (int8)')
    await expect(v1.locator('[data-cw-voice-progress]')).toBeVisible()
    await v1.locator('[data-cw-voice-cancel-load]').click()
    await expect(v1.locator('[data-cw-voice-engine] [role="status"]')).toHaveText(es['ailab.v1.status.cancelled'])
    expect(await fake(page, (state) => state.terminated)).toBe(1)
    await script(page, {})
    await v1.locator('[data-cw-voice-retry]').click()
    await expect(v1.locator('[data-cw-voice-engine] [role="status"]')).toHaveText('Whisper tiny (int8) está listo y corre con WASM en tu equipo.')
    await expect(v1.locator('[data-cw-v1-device-hint]')).toHaveCount(0)
    expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '[]'), CONSENT_KEY)).toEqual(['V1:Whisper base (int8)', 'V1:Whisper tiny (int8)'])
  })

  test('una descarga que falla se puede reintentar sin recargar', async ({ page }) => {
    await fakeWhisper(page)
    await page.addInitScript(() => {
      ;(window as unknown as { __x1: { script: object } }).__x1.script = { failLoad: true }
    })
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="error"] [role="status"]')).toHaveText(es['ailab.v1.status.loadFailed'])
    await script(page, {})
    await v1.locator('[data-cw-voice-retry]').click()
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
  })

  test('avisa antes de procesar un audio de más de 10 minutos y uno que no se puede leer', async ({ page }) => {
    await fakeWhisper(page)
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: 'larga.wav', mimeType: 'audio/wav', buffer: wav(601, 8000, 8) })
    await expect(v1.locator('[data-cw-v1-long]')).toContainText('«larga.wav» dura 10:01: más de 10 minutos puede tardar mucho en tu equipo.')
    expect((await fake(page, (state) => state.calls)).filter((call) => call.type === 'transcribe')).toEqual([])
    await v1.locator('[data-cw-v1-long-cancel]').click()
    await expect(v1.locator('[data-cw-v1-long]')).toHaveCount(0)

    await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: 'rota.mp3', mimeType: 'audio/mpeg', buffer: Buffer.from('esto no es audio, es texto plano'.repeat(20)) })
    await expect(v1.locator('[data-cw-v1-problem="unreadable"]')).toHaveText('No pude leer «rota.mp3». Prueba con MP3, M4A, WAV, OGG o WebM.')
    expect((await fake(page, (state) => state.calls)).filter((call) => call.type === 'transcribe')).toEqual([])
  })

  test('cancelar la transcripción, y pausa con la pestaña oculta', async ({ page }) => {
    await fakeWhisper(page)
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await script(page, { segments: Array.from({ length: 80 }, (_, index) => ({ start: index, end: index + 1, text: `parte ${index + 1}` })) })
    await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: 'prueba.wav', mimeType: 'audio/wav', buffer: wav(3) })
    await expect(v1.locator('[data-cw-v1-work="working"]')).toBeVisible()
    await expect(v1.locator('[data-cw-v1-work] [role="status"]')).toContainText('Transcribiendo: fragmento')
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(v1.locator('[data-cw-voice-engine] [role="status"]')).toContainText(es['ailab.worker.paused'])
    expect(await fake(page, (state) => state.paused)).toBe(true)
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(await fake(page, (state) => state.paused)).toBe(false)
    await v1.locator('[data-cw-v1-cancel]').click()
    await expect(v1.locator('[data-cw-v1-work="idle"]')).toBeVisible()
    await expect(v1.locator('[data-cw-v1-timing]')).toHaveCount(0)
    await expect(v1.locator('[data-cw-v1-upload]')).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('el foco no se pierde: Grabar sigue enfocado mientras transcribe', async ({ page }) => {
    await fakeWhisper(page)
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await script(page, { text: 'Con el teclado.' })
    const record = v1.locator('[data-cw-v1-record]')
    await record.focus()
    await page.keyboard.press('Enter')
    await expect(v1.locator('[data-cw-v1-record="recording"]')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(900)
    await page.keyboard.press('Enter')
    await expect(v1.locator('[data-cw-v1-segment]')).toHaveText(['00:00Con el teclado.'], { timeout: 15_000 })
    await expect(record).toBeFocused()
  })

  test('micrófono negado o ausente: lo dice y ofrece subir un archivo', async ({ page }) => {
    await fakeWhisper(page)
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotAllowedError'))
    })
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await v1.locator('[data-cw-v1-record]').click()
    await expect(v1.locator('[data-cw-v1-mic-issue="denied"]')).toHaveText(es['ailab.v1.mic.denied'])
    await expect(v1.locator('[data-cw-v1-upload]')).toBeEnabled()
    await page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotFoundError'))
    })
    await v1.locator('[data-cw-v1-record]').click()
    await expect(v1.locator('[data-cw-v1-mic-issue="no-mic"]')).toHaveText(es['ailab.v1.mic.noMic'])
  })

  test('un navegador sin MediaRecorder no muestra "Grabar" y explica que se puede subir un archivo', async ({ page }) => {
    await fakeWhisper(page)
    await page.addInitScript(() => {
      Object.defineProperty(window, 'MediaRecorder', { value: undefined, configurable: true })
    })
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-v1-record]')).toHaveCount(0)
    await expect(v1.locator('[data-cw-v1-mic-issue="unsupported"]')).toHaveText(es['ailab.v1.mic.unsupported'])
  })

  test('en inglés y sin violaciones serias de accesibilidad con la transcripción abierta', async ({ page }) => {
    await fakeWhisper(page)
    await open(page, 'en')
    const v1 = await tryDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine] [role="status"]')).toHaveText('Whisper base (int8) is ready and runs with WASM on your device.')
    await expect(v1.locator('[data-cw-v1-language="en"]')).toBeChecked()
    await script(page, { text: 'Hello world.' })
    await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: 'test.wav', mimeType: 'audio/wav', buffer: wav(2) })
    await expect(v1.locator('[data-cw-v1-timing]')).toHaveText('It took 0.8 sec for 00:02 of audio, with Whisper base (int8) and WASM, measured on your device.')
    await expect(v1.locator('[data-cw-v1-export="srt"]')).toHaveText(en['ailab.v1.export.srt'])
    expect(await blockingViolations(page, '[data-cw-lab-card="V1"]')).toEqual([])
  })
})

test.describe('V4 Navega hablando (US5, FR-351)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('la alternativa escrita ejecuta el comando de la paleta, lo anuncia y navega', async ({ page }) => {
    const network = guardNetwork(page)
    await fakeWhisper(page)
    await open(page)
    const v4 = await tryDemo(page, 'V4')
    await expect(v4.locator('[data-cw-voice-engine] [role="status"]')).toHaveText('Whisper tiny (int8) está listo: mantén el botón y di un comando, o escríbelo.')
    expect(await fake(page, (state) => state.calls)).toEqual([{ type: 'load', model: 'tiny', seconds: 0 }])
    await v4.locator('[data-cw-v4-text]').fill('¡Llévame al blog!')
    await v4.locator('[data-cw-v4-text]').press('Enter')
    await expect(v4.locator('[data-cw-v4-outcome="run"] [role="status"]')).toHaveText('Escribiste: «¡Llévame al blog!». Ejecuto: Ir al blog.')
    await page.waitForURL(/\/es\/blog$/)
    expect(network.heavy).toEqual([])
    expect(network.sent).toEqual([])
  })

  test('mantener el botón con el teclado graba, Whisper (doble) entiende y cambia el tema; repetirlo dice que ya está', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await fakeWhisper(page)
    await open(page)
    const v4 = await tryDemo(page, 'V4')
    await expect(v4.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await script(page, { text: 'Cambia a tema claro.' })
    const hold = v4.locator('[data-cw-v4-hold]')
    await hold.focus()
    await page.keyboard.down('Space')
    await expect(hold).toHaveAttribute('aria-pressed', 'true')
    await expect(v4.locator('[data-cw-v4-hold="recording"]')).toHaveText(es['ailab.v4.release'], { timeout: 15_000 })
    await page.waitForTimeout(1000)
    await page.keyboard.up('Space')
    await expect(v4.locator('[data-cw-v4-outcome="run"] [role="status"]')).toHaveText('Entendí: «Cambia a tema claro.». Ejecuto: Cambiar a tema claro.', { timeout: 15_000 })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect((await fake(page, (state) => state.calls)).at(-1)).toMatchObject({ type: 'transcribe', model: 'tiny', language: 'es' })
    await expect(hold).toBeFocused()

    await page.keyboard.down('Space')
    await expect(v4.locator('[data-cw-v4-hold="recording"]')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1000)
    await page.keyboard.up('Space')
    await expect(v4.locator('[data-cw-v4-outcome="already"] [role="status"]')).toHaveText('Entendí: «Cambia a tema claro.». El sitio ya está en tema claro.')
  })

  test('mantener con el puntero también funciona; un toque corto pide mantener', async ({ page }) => {
    await fakeWhisper(page)
    await open(page)
    const v4 = await tryDemo(page, 'V4')
    await expect(v4.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await script(page, { text: 'Switch to dark mode' })
    const hold = v4.locator('[data-cw-v4-hold]')
    const box = (await hold.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await expect(v4.locator('[data-cw-v4-hold="recording"]')).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1000)
    await page.mouse.up()
    await expect(v4.locator('[data-cw-v4-outcome] [role="status"]')).toHaveText(
      /^Entendí: «Switch to dark mode»\. (Ejecuto: Cambiar a tema oscuro\.|El sitio ya está en tema oscuro\.)$/,
      { timeout: 15_000 },
    )
    await page.mouse.down()
    await page.mouse.up()
    await expect(v4.locator('[data-cw-v4-outcome="short"] [role="status"]')).toHaveText(es['ailab.v4.status.short'], { timeout: 15_000 })
  })

  test('un comando que no conoce muestra lo que entendió y la lista de comandos, que también se puede usar', async ({ page }) => {
    await fakeWhisper(page)
    await open(page)
    const v4 = await tryDemo(page, 'V4')
    await v4.locator('[data-cw-v4-text]').fill('pizza con piña')
    await v4.locator('[data-cw-v4-submit]').click()
    await expect(v4.locator('[data-cw-v4-outcome="unknown"] [role="status"]')).toHaveText('Escribiste: «pizza con piña». No es un comando que conozca. Prueba con uno de la lista.')
    const list = v4.locator('[data-cw-v4-commands]')
    await expect(list).toHaveAttribute('open', '')
    await expect(list.locator('[data-cw-v4-command]')).toHaveCount(15)
    await expect(list.locator('[data-cw-v4-command="blog"]')).toContainText('Di «llévame al blog»')
    await list.locator('[data-cw-v4-command="portfolio"]').click()
    await expect(v4.locator('[data-cw-v4-outcome="run"] [role="status"]')).toHaveText('Ejecuto: Ir al portafolio.')
    await page.waitForURL(/\/es\/portfolio$/)
  })

  test('sin micrófono, la alternativa escrita sigue ahí; en inglés también', async ({ page }) => {
    await fakeWhisper(page)
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotFoundError'))
    })
    await open(page, 'en')
    const v4 = await tryDemo(page, 'V4')
    await v4.locator('[data-cw-v4-hold]').click()
    await expect(v4.locator('[data-cw-v4-mic-issue="no-mic"]')).toHaveText(en['ailab.v4.mic.noMic'])
    await v4.locator('[data-cw-v4-text]').fill('switch to spanish')
    await v4.locator('[data-cw-v4-text]').press('Enter')
    await expect(v4.locator('[data-cw-v4-outcome="run"] [role="status"]')).toHaveText('You typed: “switch to spanish”. Running: See the site in Spanish.')
    await page.waitForURL(/\/es\/ai-lab$/)
  })

  test('sin violaciones serias de accesibilidad con la demo abierta', async ({ page }) => {
    await fakeWhisper(page)
    await open(page)
    const v4 = await tryDemo(page, 'V4')
    await v4.locator('[data-cw-v4-commands] summary').click()
    expect(await blockingViolations(page, '[data-cw-lab-card="V4"]')).toEqual([])
  })
})

test.describe('V4 sin aceptar ni descargar nada (FR-340, FR-351)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('la alternativa escrita corre sin consentimiento, y la voz se activa aparte con su peso a la vista', async ({ page }) => {
    test.skip(V4_ASKS_ON_TRY, 'espera la enmienda de X0: V4 todavía pide Whisper tiny al pulsar "Probar"')
    const network = guardNetwork(page)
    await fakeWhisper(page)
    await open(page)
    const v4 = card(page, 'V4')
    await v4.locator('[data-cw-lab-open]').click()
    await expect(v4.locator('[data-cw-voice="V4"]')).toBeVisible()
    await expect(consent(page)).toHaveCount(0)
    await expect(v4.locator('[data-cw-v4-voice="off"]')).toBeVisible()
    await expect(v4.locator('[data-cw-v4-activation] p').first()).toHaveText(
      'Escribir el comando no descarga nada. Para hablar, descargo Whisper tiny (int8) (41 MB) desde huggingface.co y el motor ONNX Runtime Web (27 MB) desde este mismo sitio.',
    )
    await expect(v4.locator('[data-cw-v4-hold]')).toHaveCount(0)
    await v4.locator('[data-cw-v4-text]').fill('cambia a inglés')
    await v4.locator('[data-cw-v4-text]').press('Enter')
    await expect(v4.locator('[data-cw-v4-outcome="run"] [role="status"]')).toHaveText('Escribiste: «cambia a inglés». Ejecuto: Ver el sitio en inglés.')
    await page.waitForURL(/\/en\/ai-lab$/)
    expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? '[]'), CONSENT_KEY)).toEqual([])
    expect(await fake(page, (state) => state.created)).toBe(0)
    expect(network.heavy).toEqual([])
  })

  test('"Activar la voz" pide el permiso; "Ahora no" deja escribir y no descarga nada', async ({ page }) => {
    test.skip(V4_ASKS_ON_TRY, 'espera la enmienda de X0: V4 todavía pide Whisper tiny al pulsar "Probar"')
    await fakeWhisper(page)
    await open(page)
    const v4 = card(page, 'V4')
    await v4.locator('[data-cw-lab-open]').click()
    await v4.locator('[data-cw-v4-activate]').click()
    await expect(consent(page).locator('[data-cw-lab-consent-text]')).toContainText('Whisper tiny (int8) (41 MB) desde huggingface.co')
    await consent(page).locator('[data-cw-lab-consent-cancel]').click()
    await expect(v4.locator('[data-cw-v4-activation-status="declined"]')).toHaveText(es['ailab.v4.status.declined'])
    await expect(v4.locator('[data-cw-v4-text]')).toBeEditable()
    expect(await fake(page, (state) => state.created)).toBe(0)
    await v4.locator('[data-cw-v4-activate]').click()
    await accept(page)
    await expect(v4.locator('[data-cw-v4-voice="on"]')).toBeVisible()
    await expect(v4.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await expect(v4.locator('[data-cw-v4-hold]')).toBeVisible()
    expect(await fake(page, (state) => state.calls)).toEqual([{ type: 'load', model: 'tiny', seconds: 0 }])
  })
})

test.describe('V2 Texto → voz (US10, FR-359, FR-321)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('reproducir, pausar, seguir y detener desde el teclado, con la voz local del idioma', async ({ page }) => {
    const network = guardNetwork(page)
    await fakeSpeech(page)
    await open(page)
    const v2 = await tryDemo(page, 'V2')
    await expect(v2.locator('[data-cw-voice-local]')).toHaveText(es['ailab.v2.local'])
    const select = v2.locator('[data-cw-speech-voice]')
    await expect(select).toBeVisible()
    await expect(select.locator('option')).toHaveText(['Paulina (es-CO)', 'Google español (es-ES) · en línea'])
    await expect(select).toHaveValue('paulina')
    await expect(v2.locator('[data-cw-speech-online]')).toHaveCount(0)

    const text = v2.locator('[data-cw-v2-text]')
    await text.fill('Hola desde el teclado. Esta es la segunda frase.')
    await text.press('Control+Enter')
    await expect(v2.locator('[data-cw-speech-status="playing"] [role="status"]')).toHaveText('Leyendo con Paulina.')
    expect((await speech(page)).spoken).toEqual([{ text: 'Hola desde el teclado. Esta es la segunda frase.', lang: 'es-CO', voice: 'Paulina', rate: 1 }])

    const pause = v2.locator('[data-cw-speech-pause]')
    await pause.focus()
    await page.keyboard.press('Enter')
    await expect(v2.locator('[data-cw-speech-status="paused"] [role="status"]')).toHaveText(es['ailab.v2.status.paused'])
    await expect(pause).toHaveText(es['ailab.v2.resume'])
    await expect(pause).toBeFocused()
    expect((await speech(page)).speaking).toBe(false)
    await page.keyboard.press('Space')
    await expect(v2.locator('[data-cw-speech-status="playing"]')).toBeVisible()
    await expect(pause).toHaveText(es['ailab.v2.pause'])
    expect((await speech(page)).spoken).toHaveLength(2)

    await page.keyboard.press('Escape')
    await expect(v2.locator('[data-cw-speech-status="cancelled"] [role="status"]')).toHaveText(es['ailab.v2.status.stopped'])
    await expect(v2.locator('[data-cw-speech-stop]')).toHaveAttribute('aria-disabled', 'true')

    await autoSpeech(page, 40)
    await text.press('Control+Enter')
    await expect(v2.locator('[data-cw-speech-status="finished"] [role="status"]')).toHaveText(es['ailab.v2.status.finished'])

    await v2.locator('[data-cw-v2-language="en"]').check()
    await expect(select).toHaveValue('samantha')
    await text.fill('Hello there.')
    const before = (await speech(page)).spoken.length
    await v2.locator('[data-cw-speech-play]').click()
    await expect.poll(async () => (await speech(page)).spoken.length).toBe(before + 1)
    expect((await speech(page)).spoken.at(-1)).toEqual({ text: 'Hello there.', lang: 'en-US', voice: 'Samantha', rate: 1 })
    await expect(v2.locator('[data-cw-speech-status="finished"]')).toBeVisible()
    expect(network.sent).toEqual([])
    expect(network.heavy).toEqual([])
  })

  test('una voz en línea se advierte antes de reproducir (voz falsa con localService en false)', async ({ page }) => {
    await fakeSpeech(page, { auto: 40 })
    await open(page)
    const v2 = await tryDemo(page, 'V2')
    const select = v2.locator('[data-cw-speech-voice]')
    await expect(select).toHaveValue('paulina')
    await select.selectOption('google-es')
    const warning = v2.locator('[data-cw-speech-online]')
    await expect(warning).toHaveText(
      '«Google español» es una voz en línea: para leer, tu navegador envía el texto a su servicio de voz, fuera de tu equipo. Si no quieres que salga, elige una voz sin la marca «en línea».',
    )
    expect((await speech(page)).spoken).toEqual([])
    const play = v2.locator('[data-cw-speech-play]')
    await expect(play).toHaveAttribute('aria-describedby', (await warning.getAttribute('id'))!)
    await play.click()
    await expect(v2.locator('[data-cw-speech-status="finished"]')).toBeVisible()
    expect((await speech(page)).spoken.at(-1)?.voice).toBe('Google español')
    await select.selectOption('paulina')
    await expect(warning).toHaveCount(0)
    await expect(play).not.toHaveAttribute('aria-describedby')
    expect(await blockingViolations(page, '[data-cw-lab-card="V2"]')).toEqual([])
  })

  test('sin síntesis de voz lo dice y no se rompe; sin voces del idioma no deja reproducir', async ({ page }) => {
    test.slow()
    await fakeSpeech(page, { voices: null })
    await open(page)
    const v2 = await tryDemo(page, 'V2')
    await expect(v2.locator('[data-cw-speech-unsupported]')).toHaveText(es['ailab.v2.unsupported'])
    await expect(v2.locator('[data-cw-speech-play]')).toHaveCount(0)
    await expect(v2.locator('[data-cw-lab-failed]')).toHaveCount(0)
    const v3 = await tryDemo(page, 'V3')
    await expect(v3.locator('[data-cw-speech-unsupported]')).toHaveText(es['ailab.v3.unsupported'])
    await expect(v3.locator('[data-cw-v3-post]')).toBeVisible()

    const other = await page.context().newPage()
    await fakeSpeech(other, { voices: [{ name: 'Thomas', lang: 'fr-FR', voiceURI: 'thomas', localService: true, default: true }] })
    await open(other)
    const v2fr = await tryDemo(other, 'V2')
    await expect(v2fr.locator('[data-cw-speech-voices="none"]')).toHaveText(es['ailab.v2.voices.none'])
    await expect(v2fr.locator('[data-cw-speech-play]')).toHaveAttribute('aria-disabled', 'true')
    await v2fr.locator('[data-cw-speech-play]').click({ force: true })
    expect((await speech(other)).spoken).toEqual([])
    await other.close()
  })
})

test.describe('V3 Escuchar los posts (US10, FR-359, T726)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('lee solo el cuerpo del post de ejemplo, sin el código ni la imagen decorativa, y anuncia la sección', async ({ page }) => {
    const network = guardNetwork(page)
    await fakeSpeech(page)
    await open(page)
    const v3 = await tryDemo(page, 'V3')
    await expect(v3.locator('[data-cw-speech-voice]')).toHaveValue('paulina')
    await v3.locator('[data-cw-speech-play]').click()
    const status = v3.locator('[data-cw-speech-status] [role="status"]')
    await expect(status).toHaveText('Leyendo: Cómo te leo este post')
    await expect(v3.locator('[data-cw-v3-post] h5')).toHaveAttribute('data-cw-v3-reading', '')
    for (let step = 0; step < 4; step += 1) await endUtterance(page)
    await expect(status).toHaveText('Leyendo: Qué leo y qué no')
    await expect(v3.locator('[data-cw-v3-reading]')).toHaveCount(1)

    await v3.locator('[data-cw-speech-pause]').click()
    await expect(status).toHaveText('En pausa en: Qué leo y qué no')
    await expect(v3.locator('[data-cw-v3-reading]')).toHaveCount(1)
    expect((await speech(page)).speaking).toBe(false)
    await v3.locator('[data-cw-speech-pause]').click()
    await expect(status).toHaveText('Leyendo: Qué leo y qué no')

    await autoSpeech(page, 30)
    await endUtterance(page)
    await expect(status).toHaveText(es['ailab.v3.status.finished'])
    const spoken = (await speech(page)).spoken.map((item) => item.text)
    expect(spoken[0]).toBe(es['ailab.v3.sample.title'])
    expect(spoken).toContain(es['ailab.v3.sample.h2'])
    expect(spoken).toContain(es['ailab.v3.sample.figureAlt'])
    expect(spoken).toContain(es['ailab.v3.sample.li2'])
    const corpus = spoken.join('\n')
    for (const code of ['readPost(', 'reader.pause()', 'console.log']) expect(corpus).not.toContain(code)
    expect(new Set((await speech(page)).spoken.map((item) => item.voice))).toEqual(new Set(['Paulina']))

    await v3.locator('[data-cw-v3-plan] summary').click()
    await expect(v3.locator('[data-cw-v3-skipped]')).toHaveText(`Fragmentos que leo: ${new Set(spoken).size}. Bloques de código que salto: 1. Imágenes decorativas que salto: 1.`)
    await expect(v3.locator('[data-cw-v3-chunk="heading"]')).toHaveCount(3)
    await expect(v3.locator('[data-cw-v3-chunk="image"]')).toHaveText([`${es['ailab.v3.kind.image']} ${es['ailab.v3.sample.figureAlt']}`])
    expect(network.sent).toEqual([])
    expect(network.heavy).toEqual([])
  })

  test('en inglés lee con una voz en inglés; Esc detiene, y sin violaciones serias de accesibilidad', async ({ page }) => {
    await fakeSpeech(page)
    await open(page, 'en')
    const v3 = await tryDemo(page, 'V3')
    const select = v3.locator('[data-cw-speech-voice]')
    await expect(select.locator('option')).toHaveText(['Samantha (en-US)', 'Aria Online (en-US) · online'])
    await select.selectOption('aria-online')
    await expect(v3.locator('[data-cw-speech-online]')).toContainText('“Aria Online” is an online voice')
    await select.selectOption('samantha')
    await v3.locator('[data-cw-speech-play]').focus()
    await page.keyboard.press('Enter')
    await expect(v3.locator('[data-cw-speech-status] [role="status"]')).toHaveText('Reading: How this post is read to you')
    expect((await speech(page)).spoken[0]).toEqual({ text: en['ailab.v3.sample.title'], lang: 'en-US', voice: 'Samantha', rate: 1 })
    await page.keyboard.press('Escape')
    await expect(v3.locator('[data-cw-speech-status] [role="status"]')).toHaveText(en['ailab.v3.status.stopped'])
    expect(await blockingViolations(page, '[data-cw-lab-card="V3"]')).toEqual([])
  })
})

test.describe('el motor ONNX Runtime Web sale de este sitio (FR-310)', () => {
  onlyIn('desktop-chromium')

  test('al aceptar V1, el .wasm se pide al propio sitio, pesa lo que dice el copy y nada va a jsDelivr', async ({ page, context, baseURL }) => {
    const wasm: string[] = []
    const cdn: string[] = []
    await context.route(/cdn\.jsdelivr\.net|unpkg\.com/, (route) => {
      cdn.push(route.request().url())
      return route.abort()
    })
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS' }
    await context.route(/huggingface\.co|hf\.co/, (route) => {
      const request = route.request()
      const url = request.url()
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })
      if (/\/config\.json(\?|$)/.test(url)) {
        return route.fulfill({
          headers: cors,
          contentType: 'application/json',
          body: JSON.stringify({ model_type: 'whisper', architectures: ['WhisperForConditionalGeneration'], is_encoder_decoder: true, d_model: 384, encoder_layers: 4, decoder_layers: 4, num_mel_bins: 80, vocab_size: 51865 }),
        })
      }
      if (/\.onnx(\?|$)/.test(url)) return route.fulfill({ headers: cors, contentType: 'application/octet-stream', body: Buffer.alloc(64) })
      return route.fulfill({ status: 404, headers: cors, body: '' })
    })
    await context.route(/\.wasm(\?|$)/, (route) => {
      wasm.push(route.request().url())
      return route.abort()
    })
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('cw-intro-seen', '1')
      } catch {}
    })
    await page.goto('/es/ai-lab')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    expect(wasm).toEqual([])
    const v1 = card(page, 'V1')
    await v1.locator('[data-cw-lab-open]').click()
    await accept(page)
    await expect(v1.locator('[data-cw-v1-engine]')).toContainText('ONNX Runtime Web (27 MB), lo sirve este mismo sitio')
    await expect.poll(() => wasm.length, { timeout: 60_000 }).toBeGreaterThan(0)
    const origin = new URL(baseURL!).origin
    for (const url of wasm) {
      expect(new URL(url).origin).toBe(origin)
      expect(new URL(url).pathname).toMatch(/^\/_next\/static\/media\/ort-wasm-simd-threaded\.asyncify\.[\w-]+\.wasm$/)
    }
    expect(cdn).toEqual([])
    const file = await page.request.get(wasm[0]!, { headers: { 'accept-encoding': 'identity' } })
    expect(file.status()).toBe(200)
    expect((await file.body()).length).toBe(ONNX_RUNTIME.bytes)
  })
})

test.describe('móvil: patrones de la 006 (44 px y sin desbordes)', () => {
  onlyIn('mobile-chromium')

  test('cada control de V1 a V4 mide al menos 44 px de alto y nada desborda a 390 px', async ({ page }) => {
    await fakeWhisper(page)
    await fakeSpeech(page)
    await open(page)
    const v1 = await tryDemo(page, 'V1')
    await script(page, { text: 'Hola.' })
    await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: 'prueba.wav', mimeType: 'audio/wav', buffer: wav(2) })
    await expect(v1.locator('[data-cw-v1-timing]')).toBeVisible()
    const v4 = await tryDemo(page, 'V4')
    await v4.locator('[data-cw-v4-commands] summary').click()
    const v2 = await tryDemo(page, 'V2')
    await expect(v2.locator('[data-cw-speech-voice]')).toBeVisible()
    const v3 = await tryDemo(page, 'V3')
    await expect(v3.locator('[data-cw-speech-voice]')).toBeVisible()
    await v3.locator('[data-cw-v3-plan] summary').click()
    for (const stage of [v1, v4, v2, v3]) {
      const small = await stage
        .locator(
          '[data-cw-voice] button, [data-cw-voice] label:has(input), [data-cw-voice] input[type="text"], [data-cw-voice] select, [data-cw-voice] textarea, [data-cw-voice] summary, [data-cw-voice] label[for]',
        )
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => (node as HTMLElement).offsetParent !== null)
            .map((node) => ({ text: (node.textContent ?? '').trim().slice(0, 30), height: Math.round(node.getBoundingClientRect().height) }))
            .filter((item) => item.height < 44),
        )
      expect(small).toEqual([])
    }
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(widths.scroll).toBeLessThanOrEqual(widths.client)
  })
})
