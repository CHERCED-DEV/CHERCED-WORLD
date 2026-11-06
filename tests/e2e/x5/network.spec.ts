import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { test, type Page } from '@playwright/test'
import {
  COPY,
  HEAVY,
  LANGS,
  WORKER_CHUNK,
  answerConsent,
  blockHeavy,
  card,
  carrying,
  consent,
  expect,
  fakeSpeech,
  fakeWorkers,
  obraWithPython,
  onlyIn,
  open,
  openDemo,
  recordTraffic,
  setTranscript,
  speechState,
  storedConsent,
  wav,
  workerState,
  type Lang,
} from './support'

test.use({
  permissions: ['microphone'],
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
})

test.describe.configure({ timeout: 180_000 })

async function leftovers(page: Page): Promise<{ resources: string[]; caches: string[]; databases: string[] }> {
  return page.evaluate(
    async ({ heavy, chunk }) => {
      const heavyRe = new RegExp(heavy.source, heavy.flags)
      const chunkRe = new RegExp(chunk.source, chunk.flags)
      const resources = performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => heavyRe.test(name) || chunkRe.test(name))
      const caches = (await window.caches.keys()).filter((name) => /transformers|cw-ailab|pyodide/i.test(name))
      const databases = (await indexedDB.databases()).map((db) => db.name ?? '').filter((name) => /cw-ailab|pyodide|transformers/i.test(name))
      return { resources, caches, databases }
    },
    { heavy: { source: HEAVY.source, flags: HEAVY.flags }, chunk: { source: WORKER_CHUNK.source, flags: WORKER_CHUNK.flags } },
  )
}

async function closeDemo(page: Page, id: Parameters<typeof card>[1]): Promise<void> {
  await card(page, id).locator('[data-cw-lab-close]').click()
  await expect(card(page, id).locator('[data-cw-lab-open]')).toBeFocused()
}

async function touchEverythingWithoutConsent(page: Page, lang: Lang): Promise<void> {
  const copy = COPY[lang]

  const v1 = card(page, 'V1')
  await v1.locator('[data-cw-lab-open]').click()
  await answerConsent(page, 'cancel', 'Whisper base (int8)')
  await expect(v1.locator('[data-cw-lab-declined]')).toHaveText(copy['ailab.consent.declined'])
  await v1.locator('[data-cw-lab-part="how"] summary').click()
  await v1.locator('[data-cw-lab-part="code"] summary').click()
  await expect(v1.locator('[data-cw-lab-stage]')).toHaveCount(0)

  const v2 = await openDemo(page, 'V2')
  await expect(v2.locator('[data-cw-speech-voice]')).toBeVisible()
  await v2.locator('[data-cw-v2-text]').fill(lang === 'es' ? 'Un texto para escuchar.' : 'Some text to listen to.')
  await v2.locator('[data-cw-speech-rate]').selectOption('1.25')
  await v2.locator(`[data-cw-v2-language="${lang === 'es' ? 'en' : 'es'}"]`).check()
  await v2.locator(`[data-cw-v2-language="${lang}"]`).check()
  await v2.locator('[data-cw-speech-play]').click()
  await expect(v2.locator('[data-cw-speech-status="playing"]')).toBeVisible()
  await v2.locator('[data-cw-speech-pause]').click()
  await expect(v2.locator('[data-cw-speech-status="paused"]')).toBeVisible()
  await v2.locator('[data-cw-speech-stop]').click()
  await closeDemo(page, 'V2')

  const v3 = await openDemo(page, 'V3')
  await expect(v3.locator('[data-cw-speech-voice]')).toBeVisible()
  await v3.locator('[data-cw-speech-play]').click()
  await expect(v3.locator('[data-cw-speech-status="playing"]')).toBeVisible()
  await v3.locator('[data-cw-speech-stop]').click()
  await v3.locator('[data-cw-v3-plan] summary').click()
  await expect(v3.locator('[data-cw-v3-skipped]')).toBeVisible()

  const v4 = await openDemo(page, 'V4')
  await expect(consent(page)).toHaveCount(0)
  await v4.locator('[data-cw-v4-text]').fill(lang === 'es' ? 'pizza con piña' : 'pineapple pizza')
  await v4.locator('[data-cw-v4-text]').press('Enter')
  await expect(v4.locator('[data-cw-v4-outcome="unknown"]')).toBeVisible()
  await v4.locator('[data-cw-v4-activate]').click()
  await answerConsent(page, 'cancel', 'Whisper tiny (int8)')
  await expect(v4.locator('[data-cw-v4-activation-status="declined"]')).toBeVisible()

  const a2 = await openDemo(page, 'A2')
  const tree = a2.locator('[role="tree"]')
  await tree.locator('[role="treeitem"]').first().focus()
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await tree.locator('[role="treeitem"]').nth(2).click()
  await expect(a2.locator('[data-cw-plugin-what]')).toBeVisible()

  const a3 = await openDemo(page, 'A3')
  await a3.locator('[data-cw-skill-example]').click()
  const pending = page.waitForEvent('download')
  await a3.locator('[data-cw-skill-download]').click()
  await pending

  const a5 = await openDemo(page, 'A5')
  await expect(a5.locator('[data-cw-glassbox]')).toHaveAttribute('data-cw-glassbox', 'ready', { timeout: 30_000 })
  await a5.locator('[data-cw-glass-query]').fill('sagas')
  await expect(a5.locator('[data-cw-glass-result]').first()).toBeVisible()
  await a5.locator('[data-cw-glass-result]').first().locator('[data-cw-glass-why] summary').click()

  const r1 = await openDemo(page, 'R1')
  await r1.locator('[data-cw-saga-fail="hotel"]').check()
  for (let index = 0; index < 4; index += 1) await r1.locator('[data-cw-saga-next]').click()

  const a4 = await openDemo(page, 'A4')
  await expect(a4.locator('[data-cw-showcase="despacho"]')).toBeVisible()
  await a4.locator('[data-cw-showcase-tab="obra"]').click()
  await a4.locator('[data-cw-obra-field="C-1:count"]').fill('8')
  await a4.locator('[data-cw-obra-run]').click()
  await answerConsent(page, 'cancel', 'Pyodide 0.29.0')
  await expect(a4.locator('[data-cw-obra-status="declined"]')).toBeVisible()

  for (const id of ['J1', 'J2'] as const) {
    const stage = await openDemo(page, id)
    await expect(stage.locator('[data-cw-lab-soon]')).toHaveText(copy['ailab.try.soon'])
  }
}

test.describe('T760 · 0 bytes de modelos, pesos, .wasm, Pyodide o numpy antes del consentimiento (SC-301, FR-310)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab: abrir y tocar cada demo diciendo «Ahora no» no pide nada pesado ni crea workers`, async ({ page, context }) => {
      const traffic = recordTraffic(context, page)
      await blockHeavy(context)
      const workers: string[] = []
      page.on('worker', (worker) => workers.push(worker.url()))
      await fakeSpeech(page)
      await open(page, lang)
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
          window.scrollTo(0, y)
          await new Promise((resolve) => setTimeout(resolve, 30))
        }
      })

      await touchEverythingWithoutConsent(page, lang)
      await page.waitForLoadState('networkidle')

      expect(traffic.heavy, 'peticiones a modelos, pesos, .wasm o runtimes').toEqual([])
      expect(traffic.requests.filter((request) => WORKER_CHUNK.test(request.url())).map((request) => request.url()), 'código de workers').toEqual([])
      expect(workers, 'workers creados').toEqual([])
      expect(await leftovers(page)).toEqual({ resources: [], caches: [], databases: [] })
      expect(await storedConsent(page)).toEqual([])
    })
  }
})

test.describe('T760 · nada de lo que escribes, grabas o subes sale del navegador (SC-305, FR-320)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab: un centinela único en cada campo no aparece en ninguna URL, cabecera ni cuerpo de petición`, async ({ page, context }) => {
      const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
      const digits = String(1000 + Math.floor(Math.random() * 8999))
      const sentinel = {
        v1File: `centinela-v1-archivo-${token}`,
        v1Audio: `centinela-v1-audio-${token}`,
        v1Heard: `centinela-v1-oido-${token}`,
        v2: `centinela-v2-texto-${token}`,
        v4Text: `centinela-v4-texto-${token}`,
        v4Heard: `centinela-v4-voz-${token}`,
        a3Name: `centinela-a3-${token}`,
        a3Description: `Centinela A3 descripcion ${token}`,
        a3Steps: `Centinela A3 paso ${token}`,
        a5: `centinela-a5-${token}`,
        a4Text: `centinela-a4-${token}`,
      }
      const a4Number = { typed: lang === 'es' ? `4,${digits}` : `4.${digits}`, value: `4.${digits}` }
      const needles = [...Object.values(sentinel), token, a4Number.typed, a4Number.value]

      const traffic = recordTraffic(context, page)
      await blockHeavy(context)
      await fakeWorkers(page)
      await fakeSpeech(page)
      await open(page, lang)

      const v1 = await openDemo(page, 'V1')
      await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
      await setTranscript(page, sentinel.v1Heard)
      await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: `${sentinel.v1File}.wav`, mimeType: 'audio/wav', buffer: wav(1.5, sentinel.v1Audio) })
      await expect(v1.locator('[data-cw-v1-segment]')).toContainText([sentinel.v1Heard])
      await v1.locator('[data-cw-v1-record]').click()
      await expect(v1.locator('[data-cw-v1-record="recording"]')).toBeVisible()
      await page.waitForTimeout(1200)
      await v1.locator('[data-cw-v1-record]').click()
      await expect(v1.locator('[data-cw-v1-timing]')).toBeVisible()
      const txt = page.waitForEvent('download')
      await v1.locator('[data-cw-v1-export="txt"]').click()
      await txt

      const v2 = await openDemo(page, 'V2')
      await expect(v2.locator('[data-cw-speech-voice]')).toBeVisible()
      await v2.locator('[data-cw-v2-text]').fill(sentinel.v2)
      await v2.locator('[data-cw-speech-play]').click()
      await expect(v2.locator('[data-cw-speech-status="playing"]')).toBeVisible()
      await v2.locator('[data-cw-speech-stop]').click()

      const v4 = await openDemo(page, 'V4')
      await v4.locator('[data-cw-v4-text]').fill(sentinel.v4Text)
      await v4.locator('[data-cw-v4-submit]').click()
      await expect(v4.locator('[data-cw-v4-outcome="unknown"] [role="status"]')).toContainText(sentinel.v4Text)
      await v4.locator('[data-cw-v4-activate]').click()
      await answerConsent(page, 'accept', 'Whisper tiny (int8)')
      await expect(v4.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
      await setTranscript(page, sentinel.v4Heard)
      const hold = v4.locator('[data-cw-v4-hold]')
      await hold.focus()
      await page.keyboard.down('Space')
      await expect(v4.locator('[data-cw-v4-hold="recording"]')).toBeVisible()
      await page.waitForTimeout(1000)
      await page.keyboard.up('Space')
      await expect(v4.locator('[data-cw-v4-outcome="unknown"] [role="status"]')).toContainText(sentinel.v4Heard)

      const a3 = await openDemo(page, 'A3')
      await a3.locator('[data-cw-skill-field="name"]').fill(sentinel.a3Name)
      await a3.locator('[data-cw-skill-field="description"]').fill(sentinel.a3Description)
      await a3.locator('[data-cw-skill-field="steps"]').fill(sentinel.a3Steps)
      await expect(a3.locator('[data-cw-skill-markdown]')).toContainText(sentinel.a3Name)
      const skill = page.waitForEvent('download')
      await a3.locator('[data-cw-skill-download]').click()
      await skill

      const a5 = await openDemo(page, 'A5')
      await expect(a5.locator('[data-cw-glassbox]')).toHaveAttribute('data-cw-glassbox', 'ready', { timeout: 30_000 })
      await a5.locator('[data-cw-glass-query]').fill(`synergos ${sentinel.a5}`)
      await expect(a5.locator('[data-cw-glass-status]')).toContainText(sentinel.a5)
      await expect(a5.locator('[data-cw-glass-result]').first()).toBeVisible()

      const a4 = await openDemo(page, 'A4')
      await obraWithPython(page, a4)
      await a4.locator('[data-cw-obra-field="V-1:c"]').fill(a4Number.typed)
      await expect
        .poll(async () => (await workerState(page)).calls.some((call) => call.type === 'estimate' && (call.input ?? '').includes(a4Number.value)), {
          message: 'el número de Obra llega al worker de Python',
        })
        .toBe(true)
      await a4.locator('[data-cw-obra-field="P-1:a"]').fill(sentinel.a4Text)
      await expect(a4.locator('[data-cw-obra-field="P-1:a"]')).toHaveAttribute('aria-invalid', 'true')

      await page.waitForLoadState('networkidle')

      const fake = await workerState(page)
      const transcribed = fake.calls.filter((call) => call.type === 'transcribe')
      expect(transcribed.map((call) => call.model), 'el audio sí llegó al worker local (V1 subido, V1 grabado y V4)').toEqual(['base', 'base', 'tiny'])
      for (const call of transcribed) expect(call.samples).toBeGreaterThan(8_000)
      expect(fake.calls.some((call) => call.type === 'estimate' && (call.input ?? '').includes(a4Number.value)), 'el número de Obra sí llegó al worker de Python').toBe(true)
      expect((await speechState(page)).spoken.map((item) => item.text)).toContain(sentinel.v2)

      expect(await carrying(traffic.requests, needles), 'peticiones que llevan lo que escribió el visitante').toEqual([])
      expect(
        traffic.requests.filter((request) => !['GET', 'HEAD'].includes(request.method())).map((request) => `${request.method()} ${request.url()}`),
        'peticiones que envían un cuerpo',
      ).toEqual([])
      expect(traffic.sockets, 'WebSockets abiertos').toEqual([])
      expect(traffic.heavy).toEqual([])
      const local = await page.evaluate(() => ({
        href: location.href,
        cookie: document.cookie,
        local: JSON.stringify({ ...localStorage }),
        session: JSON.stringify({ ...sessionStorage }),
      }))
      expect(Object.entries(local).filter(([, value]) => value.includes(token)), 'lo escrito no queda en la URL, las cookies ni el almacenamiento').toEqual([])
    })
  }
})

test.describe('T760 · control del detector', () => {
  onlyIn('desktop-chromium')

  test('si un centinela sí sale, en la URL o en un cuerpo de texto, el detector lo encuentra; un Blob se ve por el método', async ({ page, context }) => {
    const traffic = recordTraffic(context, page)
    await page.goto('/robots.txt')
    await page.evaluate(async () => {
      await fetch(`/robots.txt?q=${encodeURIComponent('centinela de control en la url')}`)
      await fetch('/robots.txt', { method: 'POST', body: 'centinela-de-control-en-el-cuerpo' }).catch(() => null)
      await fetch('/robots.txt', { method: 'PUT', body: new Blob([new Uint8Array([1, 2, 3])]) }).catch(() => null)
    })
    expect(await carrying(traffic.requests, ['centinela de control en la url', 'centinela-de-control-en-el-cuerpo'])).toEqual([
      expect.stringMatching(/^centinela de control en la url → GET /),
      expect.stringMatching(/^centinela-de-control-en-el-cuerpo → POST /),
    ])
    expect(traffic.requests.filter((request) => !['GET', 'HEAD'].includes(request.method())).map((request) => request.method())).toEqual(['POST', 'PUT'])
  })
})

const NETWORK_API =/\bfetch\s*\(|sendBeacon|XMLHttpRequest|new\s+WebSocket|EventSource|RTCPeerConnection|navigator\.share\b|method:\s*['"](POST|PUT|PATCH)['"]|<form[^>]*\baction=/

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sources(full)
    return /\.(ts|tsx|py)$/.test(name) ? [full] : []
  })
}

test.describe('T760 · el código del laboratorio no tiene por dónde enviar datos (FR-320)', () => {
  onlyIn('desktop-chromium')

  test('components/ailab y lib/ailab no usan fetch, sendBeacon, XMLHttpRequest, WebSocket, EventSource ni formularios con action', () => {
    const files = [...sources(path.resolve('components/ailab')), ...sources(path.resolve('lib/ailab'))]
    expect(files.length).toBeGreaterThan(40)
    const hits = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) => (NETWORK_API.test(line) ? [`${path.relative(process.cwd(), file).replace(/\\/g, '/')}:${index + 1}: ${line.trim()}`] : [])),
    )
    expect(hits).toEqual([])
  })
})
