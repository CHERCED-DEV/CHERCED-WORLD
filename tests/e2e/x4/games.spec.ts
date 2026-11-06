import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'

type Id = 'J1' | 'J2'

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function openLab(page: Page, lang: 'es' | 'en' = 'es'): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/ai-lab`)
  await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

async function openGame(page: Page, id: Id): Promise<{ card: Locator; game: Locator; court: Locator }> {
  const card = page.locator(`[data-cw-lab-card="${id}"]`)
  await card.locator('[data-cw-lab-open]').click()
  const game = card.locator('[data-cw-rally][data-ready]')
  await expect(game).toBeVisible({ timeout: 30_000 })
  return { card, game, court: card.locator('[data-cw-rally-court]') }
}

async function number(locator: Locator, attribute: string): Promise<number> {
  return Number(await locator.getAttribute(attribute))
}

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (value ? 'hidden' : 'visible') })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)
}

async function stored(page: Page, key: string): Promise<{ version: number; mode: string; curve: number[]; similarity: number | null } | null> {
  return page.evaluate(
    (name) =>
      new Promise((resolve) => {
        const request = indexedDB.open('cw-ailab')
        request.onsuccess = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('games')) {
            db.close()
            resolve(null)
            return
          }
          const get = db.transaction('games', 'readonly').objectStore('games').get(name)
          get.onsuccess = () => {
            db.close()
            resolve(get.result ?? null)
          }
          get.onerror = () => resolve(null)
        }
        request.onerror = () => resolve(null)
      }),
    key,
  )
}

test.describe('J1 Peloteo contra la IA: teclado, marcador y aprendizaje (US6)', () => {
  onlyIn('desktop-chromium')

  test('se juega con teclado, el marcador se anuncia y nada sale del navegador', async ({ page, baseURL }) => {
    const foreign: string[] = []
    page.on('request', (request) => {
      if (!request.url().startsWith(baseURL ?? 'http://localhost') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) foreign.push(request.url())
    })
    await openLab(page)
    const { card, court } = await openGame(page, 'J1')
    await expect(card.locator('[data-cw-lab-stage]')).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(court).toBeFocused()
    await expect(court).toHaveAttribute('role', 'application')
    await expect(court).toHaveAccessibleName(es['ailab.j1.game'])
    await expect(court).toHaveAccessibleDescription(es['ailab.j1.help'])
    await expect(card.locator('[data-cw-rally-overlay]')).toHaveText(es['ailab.j1.overlay.start'])
    await expect(court).toHaveAttribute('data-state', 'paused')

    await page.keyboard.press('Space')
    await expect(court).toHaveAttribute('data-state', 'running')
    await expect(court).not.toHaveAttribute('data-phase', 'serve')
    await expect(court).toHaveAttribute('data-motion', 'full')

    const start = await number(court, 'data-player')
    await page.keyboard.down('ArrowDown')
    await expect.poll(() => number(court, 'data-player')).toBeGreaterThan(start + 0.1)
    await page.keyboard.up('ArrowDown')
    const low = await number(court, 'data-player')
    await page.keyboard.down('w')
    await expect.poll(() => number(court, 'data-player')).toBeLessThan(low - 0.1)
    await expect.poll(() => number(court, 'data-trail'), { timeout: 10_000 }).toBeGreaterThan(0)

    const live = card.locator('[data-cw-rally-live]')
    await expect(live).toHaveAttribute('aria-live', 'polite')
    await expect(live).toHaveText(/^Punto para (ti|la IA)\. Tú \d+, IA \d+\.$/, { timeout: 30_000 })
    const [, you, rival] = /Tú (\d+), IA (\d+)/.exec((await live.textContent()) ?? '') ?? []
    await expect(card.locator('[data-cw-rally-score] .cw-visually-hidden')).toHaveText(`Marcador: tú ${you}, la IA ${rival}`)
    await page.keyboard.up('w')
    await expect(card.locator('[data-cw-rally-brain] svg[data-lit]')).not.toHaveAttribute('data-lit', '0')
    await expect(card.locator('[data-cw-rally-decision]')).toHaveText(/^Decide (subir|quedarse|bajar) · \d+ %$/)
    expect(foreign).toEqual([])
  })

  test('mira a la IA entrenar sola: aprende en un worker, lo recuerda en este navegador y se puede olvidar', async ({ page }) => {
    test.setTimeout(180_000)
    await openLab(page)
    const { card, game, court } = await openGame(page, 'J1')
    await expect(card.locator('[data-cw-rally-status]')).toHaveText(es['ailab.j1.fresh'])
    const watch = card.locator('[data-cw-rally-watch]')
    await watch.click()
    await expect(watch).toHaveAttribute('aria-pressed', 'true')
    await expect(court).toHaveAttribute('data-state', 'running')
    await expect(card.locator('[data-cw-rally-status]')).toHaveText(es['ailab.j1.watching'])
    await expect.poll(() => number(game, 'data-trained'), { timeout: 90_000 }).toBeGreaterThan(0)
    await expect(card.locator('[data-cw-rally-summary]')).toHaveText(/devolvi/)
    await expect.poll(async () => (await stored(page, 'J1:rival'))?.mode, { timeout: 10_000 }).toBe('rival')
    const saved = await stored(page, 'J1:rival')
    expect(saved?.version).toBe(1)
    expect(saved?.curve.length).toBeGreaterThan(0)

    await page.reload()
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    const again = await openGame(page, 'J1')
    await expect(again.card.locator('[data-cw-rally-status]')).toHaveText(/^El rival recuerda \d+ rallies que jugó en este navegador\.$/)
    expect(await number(again.game, 'data-trained')).toBeGreaterThan(0)

    await again.card.locator('[data-cw-rally-reset]').click()
    await expect(again.card.locator('[data-cw-rally-status]')).toHaveText(es['ailab.j1.reset.done'])
    await expect(again.game).toHaveAttribute('data-trained', '0')
    await expect.poll(() => stored(page, 'J1:rival')).toBeNull()
  })

  test('sin violaciones serias de accesibilidad con el juego abierto', async ({ page }) => {
    for (const colorScheme of ['dark', 'light'] as const) {
      await page.emulateMedia({ colorScheme })
      await openLab(page)
      const { card } = await openGame(page, 'J1')
      await card.locator('[data-cw-rally-toggle]').click()
      const results = await new AxeBuilder({ page }).include('[data-cw-lab-card="J1"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(
        results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious').map((violation) => violation.id),
        colorScheme,
      ).toEqual([])
    }
  })
})

test.describe('pausa con tecla, botón y pestaña oculta (FR-341, FR-330)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('el bucle se detiene del todo en pausa y la pestaña oculta pausa el juego', async ({ page }) => {
    await openLab(page)
    const { card, court } = await openGame(page, 'J1')
    const toggle = card.locator('[data-cw-rally-toggle]')
    await expect(toggle).toHaveText(es['ailab.j1.play'])
    await toggle.click()
    await expect(court).toHaveAttribute('data-state', 'running')
    await expect(court).toBeFocused()
    await expect(toggle).toHaveText(es['ailab.j1.pause'])
    await expect.poll(() => number(court, 'data-frames')).toBeGreaterThan(5)

    await toggle.click()
    await expect(court).toHaveAttribute('data-state', 'paused')
    await expect(toggle).toHaveText(es['ailab.j1.resume'])
    await expect(card.locator('[data-cw-rally-status]')).toHaveText(es['ailab.j1.paused'])
    const frozen = await number(court, 'data-frames')
    await page.waitForTimeout(600)
    expect(await number(court, 'data-frames')).toBe(frozen)

    await toggle.click()
    await expect(court).toHaveAttribute('data-state', 'running')
    await expect(card.locator('[data-cw-rally-status]')).toHaveText('')
    await expect(court).not.toHaveAttribute('data-phase', 'serve', { timeout: 10_000 })
    await court.focus()
    await expect
      .poll(
        async () => {
          if ((await court.getAttribute('data-phase')) !== 'serve') await page.keyboard.press('Space')
          return court.getAttribute('data-state')
        },
        { timeout: 10_000 },
      )
      .toBe('paused')
    await page.keyboard.press('Space')
    await expect(court).toHaveAttribute('data-state', 'running')

    await setHidden(page, true)
    await expect(court).toHaveAttribute('data-state', 'paused')
    await expect(card.locator('[data-cw-rally-status]')).toHaveText(es['ailab.worker.paused'])
    const hiddenFrames = await number(court, 'data-frames')
    await page.waitForTimeout(600)
    expect(await number(court, 'data-frames')).toBe(hiddenFrames)
    await setHidden(page, false)
    await expect(court).toHaveAttribute('data-state', 'paused')
    await toggle.click()
    await expect(court).toHaveAttribute('data-state', 'running')
  })
})

test.describe('toque en el móvil (FR-341, 006)', () => {
  onlyIn('mobile-chromium')

  test('la mesa queda vertical, tocar saca y arrastrar el dedo mueve la paleta; los controles miden 44 px', async ({ page }) => {
    await openLab(page)
    const { card, game, court } = await openGame(page, 'J1')
    await expect(game).toHaveAttribute('data-orientation', 'portrait')
    await court.evaluate((node) => node.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const box = (await court.boundingBox())!
    expect(box.height).toBeGreaterThan(box.width)
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await expect(court).toHaveAttribute('data-state', 'running')
    await page.touchscreen.tap(box.x + 4, box.y + box.height * 0.6)
    await expect.poll(() => number(court, 'data-player')).toBeLessThan(0.1)
    await page.touchscreen.tap(box.x + box.width - 4, box.y + box.height * 0.6)
    await expect.poll(() => number(court, 'data-player')).toBeGreaterThan(0.5)
    expect(await court.evaluate((node) => getComputedStyle(node).touchAction)).toBe('none')
    for (const control of await card.locator('[data-cw-rally] button').all()) {
      const size = await control.boundingBox()
      expect(size?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(widths.scroll).toBeLessThanOrEqual(widths.client)
  })
})

test.describe('movimiento reducido (FR-342)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('la bola se mueve sin estela, sin temblor ni chispas, y se sigue jugando', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openLab(page)
    const { card, court } = await openGame(page, 'J1')
    await card.locator('[data-cw-rally-toggle]').click()
    await expect(court).toHaveAttribute('data-motion', 'reduced')
    await expect(card.locator('[data-cw-rally-brain] svg[data-lit]')).toHaveAttribute('data-still', '')
    await page.keyboard.down('ArrowDown')
    const samples: Array<{ trail: string | null; shake: string | null; phase: string | null }> = []
    for (let n = 0; n < 16; n += 1) {
      samples.push({ trail: await court.getAttribute('data-trail'), shake: await court.getAttribute('data-shake'), phase: await court.getAttribute('data-phase') })
      await page.waitForTimeout(250)
    }
    await page.keyboard.up('ArrowDown')
    expect(samples.some((sample) => sample.phase === 'play')).toBe(true)
    expect(samples.every((sample) => sample.trail === '0' && sample.shake === 'off')).toBe(true)
    expect(await number(court, 'data-player')).toBeGreaterThan(0.4)
  })
})

test.describe('J2 Juega contra tu clon (US7)', () => {
  onlyIn('desktop-chromium')

  test('graba tres rallies, entrena al clon en un worker, muestra el parecido y el clon imita tu tendencia', async ({ page, baseURL }) => {
    test.setTimeout(180_000)
    const foreign: string[] = []
    page.on('request', (request) => {
      if (!request.url().startsWith(baseURL ?? 'http://localhost') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) foreign.push(request.url())
    })
    await openLab(page)
    const { card, game, court } = await openGame(page, 'J2')
    await expect(game).toHaveAttribute('data-stage', 'record')
    await expect(card.locator('[data-cw-rally-status]')).toHaveText(es['ailab.j2.fresh'])
    await expect(card.locator('[data-cw-rally-watch]')).toHaveCount(0)
    await expect(card.locator('[data-cw-rally-score]')).toContainText(es['ailab.j2.sparring'])
    await court.focus()
    await page.keyboard.press('Space')
    await page.keyboard.down('ArrowUp')
    await expect(card.locator('[data-cw-rally-status]')).toHaveText(/^Grabando tu estilo: rally \d de 3\. Juega como siempre\.$/, { timeout: 20_000 })
    await expect(game).toHaveAttribute('data-stage', 'clone', { timeout: 120_000 })
    await expect(card.locator('[data-cw-rally-live]')).toHaveText(/^Tu clon está listo: se parece a ti en un \d+ %\. Ahora juegas contra él\.$/)
    const likeness = card.locator('[data-cw-rally-similarity]')
    await expect(likeness).toBeVisible()
    expect(await number(likeness, 'data-cw-rally-similarity')).toBeGreaterThanOrEqual(60)
    await expect(card.locator('[data-cw-rally-score]')).toContainText(es['ailab.j2.rival'])
    await expect.poll(() => number(card.locator('[data-cw-rally-curve]'), 'data-points')).toBe(25)

    const positions: number[] = []
    for (let n = 0; n < 24; n += 1) {
      if ((await court.getAttribute('data-phase')) === 'play') positions.push(await number(court, 'data-rival'))
      await page.waitForTimeout(250)
    }
    await page.keyboard.up('ArrowUp')
    expect(positions.length).toBeGreaterThan(4)
    expect(positions.reduce((sum, value) => sum + value, 0) / positions.length).toBeLessThan(0.25)
    await expect.poll(async () => (await stored(page, 'J2:clone'))?.similarity ?? null).not.toBeNull()
    await expect(card.locator('[data-cw-rally-watch]')).toBeVisible()
    await card.locator('[data-cw-rally-rerecord]').click()
    await expect(game).toHaveAttribute('data-stage', 'record')
    expect(foreign).toEqual([])
  })
})

test.describe('sin JavaScript (US1 escenario 5)', () => {
  onlyIn('no-js')

  test('las tarjetas de los juegos explican el juego, sus controles y su código', async ({ page }) => {
    await page.goto('/es/ai-lab')
    for (const id of ['J1', 'J2'] as const) {
      const card = page.locator(`[data-cw-lab-card="${id}"]`)
      const key = id.toLowerCase() as 'j1' | 'j2'
      await expect(card.locator('[data-cw-lab-noscript]')).toHaveText(es['ailab.noscript'])
      await expect(card.locator('[data-cw-lab-privacy]')).toContainText('No descarga nada')
      await expect(card.locator('[data-cw-lab-privacy]')).toContainText(es[`ailab.${key}.privacy`])
      await expect(card.locator('[data-cw-lab-downloads]')).toHaveText(es['ailab.downloads.none'])
      await expect(card.locator('[data-cw-rally]')).toHaveCount(0)
      await card.locator('[data-cw-lab-part="how"] summary').click()
      await expect(card.locator('[data-cw-lab-flow] li')).toHaveCount(3)
      await card.locator('[data-cw-lab-part="code"] summary').click()
    }
    const j1 = page.locator('[data-cw-lab-card="J1"]')
    await expect(j1.locator('[data-cw-lab-flow] li').first()).toContainText('flechas o W/S')
    await expect(j1.locator('[data-cw-adr]').filter({ hasText: 'Sin descargas' })).toHaveCount(1)
    await expect(j1.locator('[data-cw-lab-code] code')).toContainText('advantage * (p - (j === action ? 1 : 0))')
    await expect(j1.locator('[data-cw-lab-repo]')).toHaveAttribute('href', /lib\/ailab\/games\/rival\.ts$/)
    await expect(page.locator('[data-cw-lab-card="J2"] [data-cw-lab-repo]')).toHaveAttribute('href', /lib\/ailab\/games\/clone\.ts$/)
  })

  test('en inglés también', async ({ page }) => {
    await page.goto('/en/ai-lab')
    const j1 = page.locator('[data-cw-lab-card="J1"]')
    await expect(j1.locator('[data-cw-lab-privacy]')).toContainText(en['ailab.j1.privacy'])
    await j1.locator('[data-cw-lab-part="how"] summary').click()
    await expect(j1.locator('[data-cw-lab-flow] li').first()).toContainText('arrow keys or W/S')
  })
})
