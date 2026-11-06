import { test, type Locator, type Page } from '@playwright/test'
import {
  COPY,
  INTEGRATED,
  LANGS,
  SOON,
  blockHeavy,
  card,
  consent,
  expect,
  fakeSpeech,
  fakeWorkers,
  onlyIn,
  open,
  openDemo,
  prepareDemo,
  setTranscript,
  stageOf,
  stepToEnd,
  storedConsent,
  wav,
  type CardId,
  type Lang,
} from './support'

test.use({
  permissions: ['microphone'],
  launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
})

test.describe.configure({ timeout: 120_000 })

const CARD_ORDER: CardId[] = ['V1', 'V2', 'V3', 'V4', 'R1', 'A2', 'A3', 'A5', 'A4', 'J1', 'J2']

type Focus = { body: boolean; ring: boolean; what: string }

async function focusNow(page: Page): Promise<Focus> {
  return page.evaluate(() => {
    const element = document.activeElement
    if (!element || element === document.body || element === document.documentElement) return { body: true, ring: false, what: 'body' }
    const data = [...element.attributes].find((attribute) => attribute.name.startsWith('data-cw-'))
    const what = `${element.tagName.toLowerCase()}${data ? `[${data.name}${data.value ? `="${data.value}"` : ''}]` : ''} «${(element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 40)}»`
    const drawn = (node: Element | null | undefined) => {
      if (!node) return false
      const style = getComputedStyle(node)
      const width = Number.parseFloat(style.outlineWidth) || 0
      const transparent = style.outlineColor === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(style.outlineColor)
      return style.outlineStyle !== 'none' && width >= 1 && !transparent
    }
    const near = [element, element.parentElement, element.parentElement?.parentElement, element.nextElementSibling, ...element.children]
    return { body: false, ring: element.matches(':focus-visible') && near.some(drawn), what }
  })
}

async function isFocused(target: Locator): Promise<boolean> {
  return target.evaluate((node) => node === document.activeElement)
}

async function tabTo(page: Page, target: Locator, rings: string[], { back = false, max = 160 }: { back?: boolean; max?: number } = {}): Promise<void> {
  for (let press = 0; press < max; press += 1) {
    if (await isFocused(target)) return
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab')
    const focus = await focusNow(page)
    if (focus.body) throw new Error('el foco se perdió en <body> mientras recorría la demo con Tab')
    if (!focus.ring) rings.push(focus.what)
  }
  throw new Error(`no llegué con ${back ? 'Shift+Tab' : 'Tab'} a ${target}`)
}

async function checkRing(page: Page, rings: string[]): Promise<void> {
  const focus = await focusNow(page)
  expect(focus.body, 'el foco no se pierde en <body>').toBe(false)
  if (!focus.ring) rings.push(focus.what)
}

type Flow = (args: { page: Page; stage: Locator; lang: Lang; rings: string[] }) => Promise<void>

const FLOWS: Record<CardId, Flow> = {
  V1: async ({ page, stage, lang, rings }) => {
    await expect(stage.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    const other = lang === 'es' ? 'en' : 'es'
    await tabTo(page, stage.locator(`[data-cw-v1-language="${lang}"]`), rings)
    await page.keyboard.press(lang === 'es' ? 'ArrowRight' : 'ArrowLeft')
    await expect(stage.locator(`[data-cw-v1-language="${other}"]`)).toBeChecked()
    await checkRing(page, rings)
    await setTranscript(page, lang === 'es' ? 'Dictado con el teclado.' : 'Dictated with the keyboard.')
    const upload = stage.locator('[data-cw-v1-upload]')
    await tabTo(page, upload, rings)
    const chooser = page.waitForEvent('filechooser')
    await page.keyboard.press('Space')
    await (await chooser).setFiles({ name: 'teclado.wav', mimeType: 'audio/wav', buffer: wav(2) })
    await expect(stage.locator('[data-cw-v1-segment]')).toHaveCount(1)
    await expect(upload).toBeFocused()
    await tabTo(page, stage.locator('[data-cw-v1-export="srt"]'), rings)
    const download = page.waitForEvent('download')
    await page.keyboard.press('Enter')
    expect((await download).suggestedFilename()).toMatch(/\.srt$/)
  },
  V2: async ({ page, stage, lang, rings }) => {
    await expect(stage.locator('[data-cw-speech-voice]')).toBeVisible()
    await tabTo(page, stage.locator('[data-cw-v2-text]'), rings)
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type(lang === 'es' ? 'Hola desde el teclado.' : 'Hello from the keyboard.')
    await page.keyboard.press('Control+Enter')
    await expect(stage.locator('[data-cw-speech-status="playing"]')).toBeVisible()
    await tabTo(page, stage.locator('[data-cw-speech-pause]'), rings)
    await page.keyboard.press('Enter')
    await expect(stage.locator('[data-cw-speech-status="paused"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(stage.locator('[data-cw-speech-status="cancelled"]')).toBeVisible()
    await checkRing(page, rings)
  },
  V3: async ({ page, stage, rings }) => {
    await expect(stage.locator('[data-cw-speech-voice]')).toBeVisible()
    await tabTo(page, stage.locator('[data-cw-speech-play]'), rings)
    await page.keyboard.press('Enter')
    await expect(stage.locator('[data-cw-speech-status="playing"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(stage.locator('[data-cw-speech-status="cancelled"]')).toBeVisible()
    await tabTo(page, stage.locator('[data-cw-v3-plan] summary'), rings)
    await page.keyboard.press('Enter')
    await expect(stage.locator('[data-cw-v3-skipped]')).toBeVisible()
  },
  V4: async ({ page, stage, lang, rings }) => {
    const input = stage.locator('[data-cw-v4-text]')
    await tabTo(page, input, rings)
    await page.keyboard.type(lang === 'es' ? 'cambia a tema oscuro' : 'switch to dark mode')
    await page.keyboard.press('Enter')
    await expect(stage.locator('[data-cw-v4-outcome="run"], [data-cw-v4-outcome="already"]')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(input).toBeFocused()
    await tabTo(page, stage.locator('[data-cw-v4-commands] summary'), rings)
    await page.keyboard.press('Enter')
    await expect(stage.locator('[data-cw-v4-commands]')).toHaveAttribute('open', '')
    await page.keyboard.press('Tab')
    await expect(stage.locator('[data-cw-v4-command]').first()).toBeFocused()
    await checkRing(page, rings)
  },
  A2: async ({ page, stage, rings }) => {
    const items = stage.locator('[role="tree"] [role="treeitem"]')
    await tabTo(page, stage.locator('[role="tree"] [role="treeitem"][tabindex="0"]'), rings)
    await page.keyboard.press('Home')
    await expect(items.first()).toBeFocused()
    await page.keyboard.press('End')
    await expect(items.last()).toBeFocused()
    await checkRing(page, rings)
    await page.keyboard.press('Enter')
    const path = (await items.last().getAttribute('data-cw-plugin-path')) ?? ''
    await expect(stage.locator('[data-cw-plugin-file]')).toHaveAttribute('data-cw-plugin-file', path.replace(/^[^/]+\//, ''))
  },
  A3: async ({ page, stage, rings }) => {
    await tabTo(page, stage.locator('[data-cw-skill-example]'), rings)
    await page.keyboard.press('Enter')
    await expect(stage.locator('[data-cw-skill-valid]')).toHaveAttribute('data-cw-skill-valid', 'true')
    await tabTo(page, stage.locator('[data-cw-skill-download]'), rings, { back: true })
    const download = page.waitForEvent('download')
    await page.keyboard.press('Enter')
    expect((await download).suggestedFilename()).toBe('SKILL.md')
    await expect(stage.locator('[data-cw-skill-status="ok"]')).toBeVisible()
  },
  A5: async ({ page, stage, rings }) => {
    await expect(stage.locator('[data-cw-glassbox]')).toHaveAttribute('data-cw-glassbox', 'ready', { timeout: 30_000 })
    await tabTo(page, stage.locator('[data-cw-glass-query]'), rings)
    await page.keyboard.type('sagas')
    const first = stage.locator('[data-cw-glass-result]').first()
    await expect(first).toBeVisible()
    await tabTo(page, first.locator('[data-cw-glass-why] summary'), rings)
    await page.keyboard.press('Enter')
    await expect(first.locator('[data-cw-glass-total]')).toBeVisible()
  },
  R1: async ({ page, stage, rings }) => {
    await tabTo(page, stage.locator('[data-cw-saga-fail="payment"]'), rings)
    await page.keyboard.press('ArrowUp')
    await expect(stage.locator('[data-cw-saga-fail="car"]')).toBeChecked()
    await checkRing(page, rings)
    const next = stage.locator('[data-cw-saga-next]')
    await tabTo(page, next, rings)
    for (let press = 0; press < 20 && (await stage.locator('[data-cw-saga-outcome]').count()) === 0; press += 1) await page.keyboard.press('Enter')
    await expect(stage.locator('[data-cw-saga-outcome="compensated"]')).toBeVisible()
    await expect(next).toBeFocused()
  },
  A4: async ({ page, stage, rings }) => {
    await tabTo(page, stage.locator('[data-cw-showcase-tab="despacho"]'), rings)
    await page.keyboard.press('ArrowRight')
    await expect(stage.locator('[data-cw-showcase-tab="obra"]')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(stage.locator('[data-cw-showcase-panel="obra"]')).toBeFocused()
    await checkRing(page, rings)
    await page.keyboard.press('Tab')
    const field = stage.locator('[data-cw-obra-field]').first()
    await expect(field).toBeFocused()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('5')
    await expect(field).toHaveValue('5')
    const run = stage.locator('[data-cw-obra-run]')
    await tabTo(page, run, rings)
    await page.keyboard.press('Enter')
    await expect(consent(page).locator('[data-cw-lab-consent-cancel]')).toBeFocused()
    await checkRing(page, rings)
    await page.keyboard.press('Escape')
    await expect(stage.locator('[data-cw-obra-status="declined"]')).toBeVisible()
    if (!(await isFocused(run))) await run.focus()
  },
  J1: async ({ stage, lang }) => {
    await expect(stage.locator('[data-cw-lab-soon]')).toHaveText(COPY[lang]['ailab.try.soon'])
    await expect(stage.locator('[data-cw-lab-soon]')).toContainText(lang === 'es' ? 'pronto' : 'soon')
  },
  J2: async ({ stage, lang }) => {
    await expect(stage.locator('[data-cw-lab-soon]')).toHaveText(COPY[lang]['ailab.try.soon'])
    await expect(stage.locator('[data-cw-lab-soon]')).toContainText(lang === 'es' ? 'pronto' : 'soon')
  },
}

test.describe('T764 · cada experimento se abre, se usa y se cierra solo con el teclado (FR-340)', () => {
  onlyIn('desktop-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab: Tab llega a los once «Probar» en el orden de la página, siempre con el foco visible`, async ({ page }) => {
      await open(page, lang)
      const rings: string[] = []
      const reached: string[] = []
      for (let press = 0; press < 600 && reached.length < CARD_ORDER.length; press += 1) {
        await page.keyboard.press('Tab')
        const stop = await page.evaluate(() => {
          const element = document.activeElement
          return {
            inMain: Boolean(element?.closest('#main')),
            card: element?.matches('[data-cw-lab-open]') ? (element.closest('[data-cw-lab-card]')?.getAttribute('data-cw-lab-card') ?? null) : null,
          }
        })
        const focus = await focusNow(page)
        expect(focus.body, 'el foco no se pierde en <body>').toBe(false)
        if (stop.inMain && !focus.ring) rings.push(focus.what)
        if (stop.card) reached.push(stop.card)
      }
      expect(reached).toEqual(CARD_ORDER)
      expect(rings, 'paradas de Tab sin anillo de foco visible').toEqual([])
    })

    for (const id of CARD_ORDER) {
      test(`${id} en /${lang}/ai-lab: Enter en «Probar», usarla con el teclado, «Cerrar la demo» y el foco vuelve a «Probar»`, async ({ page, context }) => {
        await blockHeavy(context)
        await fakeWorkers(page)
        await fakeSpeech(page)
        await open(page, lang)
        const rings: string[] = []
        const item = card(page, id)
        const openButton = item.locator('[data-cw-lab-open]')
        await item.locator('[data-cw-lab-part="how"] summary').focus()
        await tabTo(page, openButton, rings, { back: true })
        await expect(openButton).toHaveAccessibleName(`${COPY[lang]['ailab.try.label'].replace('{title}', (await item.locator('h3').textContent()) ?? '')}`)
        await page.keyboard.press('Enter')
        const stage = stageOf(page, id)
        if (id === 'V1') {
          await expect(consent(page).locator('[data-cw-lab-consent-cancel]')).toBeFocused()
          await checkRing(page, rings)
          await page.keyboard.press('Tab')
          await expect(consent(page).locator('[data-cw-lab-consent-accept]')).toBeFocused()
          await page.keyboard.press('Enter')
          await expect(consent(page)).toHaveCount(0)
        }
        await expect(stage).toBeFocused()
        await expect(stage.locator('[data-cw-lab-loading]')).toHaveCount(0, { timeout: 30_000 })
        await checkRing(page, rings)
        await FLOWS[id]({ page, stage, lang, rings })
        await tabTo(page, item.locator('[data-cw-lab-close]'), rings)
        await page.keyboard.press('Enter')
        await expect(stage).toHaveCount(0)
        await expect(openButton).toBeFocused()
        await checkRing(page, rings)
        expect(rings, 'controles enfocados con el teclado sin anillo visible').toEqual([])
      })
    }
  }
})

async function activeIn(page: Page): Promise<string> {
  return page.evaluate(() => {
    const element = document.activeElement
    if (!element || element === document.body) return 'body'
    const data = [...element.attributes].find((attribute) => attribute.name.startsWith('data-cw-'))
    return `${element.tagName.toLowerCase()}${data ? `[${data.name}${data.value ? `="${data.value}"` : ''}]` : ''}`
  })
}

test.describe('T764 · el foco no se pierde al pedir, negar o retirar un permiso con el teclado (FR-340, WCAG 2.4.3)', () => {
  onlyIn('desktop-chromium')

  test('A4 Obra: «Ahora no» devuelve el foco a «Calcular con Python»; al aceptar, el foco sigue en la vitrina', async ({ page, context }) => {
    await blockHeavy(context)
    await fakeWorkers(page)
    await open(page, 'es')
    const a4 = await openDemo(page, 'A4')
    await a4.locator('[data-cw-showcase-tab="obra"]').click()
    const run = a4.locator('[data-cw-obra-run]')
    await run.focus()
    await page.keyboard.press('Enter')
    await expect(consent(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(a4.locator('[data-cw-obra-status="declined"]')).toBeVisible()
    expect(await activeIn(page)).toBe('button[data-cw-obra-run]')
    await page.keyboard.press('Enter')
    for (const resource of ['Pyodide 0.29.0', 'numpy']) {
      await expect(consent(page).locator('[data-cw-lab-consent-text]')).toContainText(resource)
      await page.keyboard.press('Tab')
      await expect(consent(page).locator('[data-cw-lab-consent-accept]')).toBeFocused()
      await page.keyboard.press('Enter')
    }
    await expect(a4.locator('[data-cw-obra-status="ready"]')).toBeVisible()
    await expect.poll(() => activeIn(page)).not.toBe('body')
    expect(await a4.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  })

  test('V1: cambiar de modelo y decir «Ahora no» deja el foco en «Cargar»; al aceptar, el foco sigue en el transcriptor', async ({ page, context }) => {
    await blockHeavy(context)
    await fakeWorkers(page)
    await open(page, 'es')
    const v1 = await openDemo(page, 'V1')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await v1.locator('[data-cw-v1-model="base"]').focus()
    await page.keyboard.press('ArrowDown')
    const model = (await v1.locator('[data-cw-v1-model]:checked').getAttribute('data-cw-v1-model')) ?? ''
    expect(model).not.toBe('base')
    const load = v1.locator(`[data-cw-v1-load="${model}"]`)
    await load.focus()
    await page.keyboard.press('Enter')
    await expect(consent(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(consent(page)).toHaveCount(0)
    expect(await activeIn(page)).toBe(`button[data-cw-v1-load="${model}"]`)
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await expect.poll(() => activeIn(page)).not.toBe('body')
    expect(await v1.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  })

  test('V4: aceptar «Activar la voz» con el teclado deja el foco en la demo, no en <body>', async ({ page, context }) => {
    await blockHeavy(context)
    await fakeWorkers(page)
    await open(page, 'es')
    const v4 = await openDemo(page, 'V4')
    await v4.locator('[data-cw-v4-activate]').focus()
    await page.keyboard.press('Enter')
    await expect(consent(page)).toBeVisible()
    await page.keyboard.press('Escape')
    expect(await activeIn(page)).toBe('button[data-cw-v4-activate]')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(v4.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
    await expect.poll(() => activeIn(page)).not.toBe('body')
    expect(await v4.evaluate((node) => node.contains(document.activeElement))).toBe(true)
  })

  test('«Retirar el permiso» con el teclado deja el foco en «Probar» de esa tarjeta', async ({ page, context }) => {
    await blockHeavy(context)
    await fakeWorkers(page)
    await open(page, 'es')
    const v1 = card(page, 'V1')
    await openDemo(page, 'V1')
    const revoke = v1.locator('[data-cw-lab-revoke]')
    await revoke.focus()
    await page.keyboard.press('Enter')
    await expect(v1.locator('[data-cw-lab-stage]')).toHaveCount(0)
    await expect(v1.locator('[data-cw-lab-granted]')).toHaveCount(0)
    expect(await activeIn(page)).toBe('button[data-cw-lab-open]')
  })
})

test.describe('T764 · lo de voz tiene alternativa escrita, sin micrófono y sin voces (FR-340)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab sin micrófono ni síntesis de voz: V1 transcribe un archivo, V4 corre comandos escritos sin descargar nada, y V2 y V3 lo dicen y dejan el texto a la vista`, async ({ page, context }) => {
      const copy = COPY[lang]
      await blockHeavy(context)
      await fakeWorkers(page)
      await fakeSpeech(page, null)
      await page.addInitScript(() => {
        navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('sin micrófono', 'NotFoundError'))
      })
      await open(page, lang)

      const v4 = await openDemo(page, 'V4')
      await expect(consent(page)).toHaveCount(0)
      await v4.locator('[data-cw-v4-text]').fill(lang === 'es' ? 'modo oscuro' : 'dark mode')
      await v4.locator('[data-cw-v4-text]').press('Enter')
      await expect(v4.locator('[data-cw-v4-outcome="run"] [role="status"], [data-cw-v4-outcome="already"] [role="status"]')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await v4.locator('[data-cw-v4-commands] summary').click()
      await expect(v4.locator('[data-cw-v4-command]')).toHaveCount(15)
      expect(await storedConsent(page)).toEqual([])

      const v1 = await openDemo(page, 'V1')
      await expect(v1.locator('[data-cw-voice-engine="ready"]')).toBeVisible()
      await v1.locator('[data-cw-v1-record]').click()
      await expect(v1.locator('[data-cw-v1-mic-issue="no-mic"]')).toHaveText(copy['ailab.v1.mic.noMic'])
      await setTranscript(page, lang === 'es' ? 'El texto llega igual sin micrófono.' : 'The text arrives without a microphone.')
      await v1.locator('[data-cw-v1-upload]').setInputFiles({ name: 'archivo.wav', mimeType: 'audio/wav', buffer: wav(2) })
      await expect(v1.locator('[data-cw-v1-segment]')).toContainText([lang === 'es' ? 'El texto llega igual sin micrófono.' : 'The text arrives without a microphone.'])

      const v2 = await openDemo(page, 'V2')
      await expect(v2.locator('[data-cw-speech-unsupported]')).toHaveText(copy['ailab.v2.unsupported'])
      await expect(v2.locator('[data-cw-lab-failed]')).toHaveCount(0)

      const v3 = await openDemo(page, 'V3')
      await expect(v3.locator('[data-cw-speech-unsupported]')).toHaveText(copy['ailab.v3.unsupported'])
      const post = v3.locator('[data-cw-v3-post]')
      await expect(post).toBeVisible()
      for (const key of ['ailab.v3.sample.title', 'ailab.v3.sample.intro', 'ailab.v3.sample.h1', 'ailab.v3.sample.p1', 'ailab.v3.sample.h2', 'ailab.v3.sample.p2'] as const) {
        await expect(post.getByText(copy[key], { exact: true })).toBeVisible()
      }
    })
  }
})

type Motion = string[]

async function motionIn(scope: Locator): Promise<Motion> {
  return scope.evaluate((root) => {
    const found: string[] = []
    const longest = (value: string) => Math.max(0, ...value.split(',').map((part) => Number.parseFloat(part) || 0))
    const describe = (node: Element) => {
      const data = [...node.attributes].find((attribute) => attribute.name.startsWith('data-cw-'))
      return `${node.tagName.toLowerCase()}${data ? `[${data.name}${data.value ? `="${data.value}"` : ''}]` : ''}.${String(node.className).split(' ')[0] ?? ''}`
    }
    for (const node of [root, ...root.querySelectorAll('*')]) {
      for (const pseudo of [null, '::before', '::after']) {
        const style = getComputedStyle(node, pseudo)
        if (style.display === 'none' || (pseudo && (style.content === 'none' || style.content === 'normal'))) continue
        if (style.transitionProperty !== 'none' && longest(style.transitionDuration) > 0.001) found.push(`transición en ${describe(node)}${pseudo ?? ''}: ${style.transitionProperty} ${style.transitionDuration}`)
        if (style.animationName !== 'none' && longest(style.animationDuration) > 0.001) found.push(`animación en ${describe(node)}${pseudo ?? ''}: ${style.animationName} ${style.animationDuration}`)
      }
    }
    for (const animation of document.getAnimations()) {
      const effect = animation.effect as KeyframeEffect | null
      const target = effect?.target
      if (!target || !root.contains(target) || animation.playState !== 'running') continue
      const duration = Number(effect?.getComputedTiming().duration)
      if (Number.isFinite(duration) && duration > 1) found.push(`animación en curso en ${describe(target)}: ${(animation as CSSAnimation).animationName ?? 'web animation'} ${duration} ms`)
    }
    return [...new Set(found)]
  })
}

test.describe('T764 · con movimiento reducido no hay animaciones en los experimentos (FR-342)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('control: sin movimiento reducido, el detector sí ve el pulso del paso en curso de R1', async ({ page, context }) => {
    await blockHeavy(context)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, 'es')
    const r1 = await openDemo(page, 'R1')
    for (let index = 0; index < 2; index += 1) await r1.locator('[data-cw-saga-next]').click()
    await expect(r1.locator('[data-cw-saga-step="flight"]')).toHaveAttribute('data-status', 'running')
    expect((await motionIn(r1)).some((entry) => entry.includes('saga-pulse'))).toBe(true)
  })

  for (const lang of LANGS) {
    test(`/${lang}/ai-lab con reducedMotion: 'reduce': ninguna tarjeta ni demo abierta tiene transiciones o animaciones corriendo`, async ({ page, context }) => {
      await blockHeavy(context)
      await fakeWorkers(page)
      await fakeSpeech(page)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await open(page, lang)
      const found: Record<string, Motion> = {}
      found['página'] = await motionIn(page.locator('#main'))

      for (const id of INTEGRATED) {
        const { views } = await prepareDemo(page, id, lang)
        for (const view of views) {
          await view.show()
          found[view.name] = await motionIn(card(page, id))
        }
      }

      const r1 = stageOf(page, 'R1')
      await r1.locator('[data-cw-saga-reset]').click()
      for (let index = 0; index < 2; index += 1) await r1.locator('[data-cw-saga-next]').click()
      await expect(r1.locator('[data-cw-saga-step="flight"]')).toHaveAttribute('data-status', 'running')
      found['R1 con un paso en curso'] = await motionIn(card(page, 'R1'))
      await stepToEnd(r1)

      const v1 = stageOf(page, 'V1')
      await v1.locator('[data-cw-v1-record]').click()
      await expect(v1.locator('[data-cw-v1-record="recording"]')).toBeVisible()
      found['V1 grabando'] = await motionIn(card(page, 'V1'))
      await v1.locator('[data-cw-v1-record]').click()
      await expect(v1.locator('[data-cw-v1-record="idle"]')).toBeVisible()

      for (const id of SOON) {
        await openDemo(page, id)
        found[id] = await motionIn(card(page, id))
      }
      found['página con todo abierto'] = await motionIn(page.locator('#main'))
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')
      expect(found).toEqual(Object.fromEntries(Object.keys(found).map((key) => [key, []])))
    })
  }
})

test.describe('T761 (dato, sin umbral) · INP de abrir cada demo con la CPU sin limitar', () => {
  onlyIn('desktop-chromium')

  test('duración de la interacción al pulsar «Probar», medida con Event Timing', async ({ page, context }, testInfo) => {
    await blockHeavy(context)
    await fakeWorkers(page)
    await fakeSpeech(page)
    await open(page, 'es')
    await page.evaluate(() => {
      const entries: Array<{ id: number; duration: number }> = []
      Object.assign(window, { __x5inp: entries })
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEventTiming & { interactionId?: number }>) {
          if (entry.interactionId) entries.push({ id: entry.interactionId, duration: entry.duration })
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit)
    })
    const measured: Record<string, string> = {}
    for (const id of CARD_ORDER) {
      const before = await page.evaluate(() => (window as unknown as { __x5inp: unknown[] }).__x5inp.length)
      await openDemo(page, id)
      await page.waitForTimeout(400)
      const worst = await page.evaluate((from) => {
        const entries = (window as unknown as { __x5inp: Array<{ duration: number }> }).__x5inp.slice(from)
        return entries.length > 0 ? Math.max(...entries.map((entry) => entry.duration)) : null
      }, before)
      measured[id] = worst === null ? '< 16 ms' : `${Math.round(worst)} ms`
    }
    testInfo.annotations.push({ type: 'INP al abrir (CPU sin limitar, sin umbral)', description: JSON.stringify(measured) })
    process.stdout.write(`[x5] INP al abrir cada demo: ${JSON.stringify(measured)}\n`)
    await testInfo.attach('inp.json', { body: JSON.stringify(measured, null, 2), contentType: 'application/json' })
    expect(Object.keys(measured)).toEqual(CARD_ORDER)
  })
})
