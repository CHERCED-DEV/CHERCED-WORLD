import { expect, test, type Page } from '@playwright/test'

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

type Spoken = { text: string; lang: string }

async function fakeSpeech(page: Page, voices: boolean): Promise<void> {
  await page.addInitScript((withVoices) => {
    sessionStorage.setItem('cw-intro-seen', '1')
    if (!withVoices) {
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: undefined, configurable: true, writable: true })
      return
    }
    type Utterance = { text: string; lang: string; onstart: ((event: object) => void) | null; onend: ((event: object) => void) | null; onerror: ((event: { error: string }) => void) | null }
    const state = { spoken: [] as Array<{ text: string; lang: string }>, cancels: 0 }
    let current: Utterance | null = null
    const voiceList = [
      { name: 'Paulina', lang: 'es-CO', voiceURI: 'paulina', localService: true, default: false },
      { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', localService: true, default: true },
    ]
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
      getVoices: () => voiceList,
      speak(utterance: Utterance) {
        state.spoken.push({ text: utterance.text, lang: utterance.lang })
        current = utterance
        utterance.onstart?.({})
      },
      cancel() {
        state.cancels += 1
        const utterance = current
        current = null
        utterance?.onerror?.({ error: 'interrupted' })
      },
      pause() {},
      resume() {},
      addEventListener() {},
      removeEventListener() {},
    }
    Object.assign(window, {
      __listen: {
        state,
        next: () => {
          const utterance = current
          current = null
          utterance?.onend?.({})
        },
      },
    })
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true })
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: FakeUtterance, configurable: true, writable: true })
  }, voices)
}

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __listen: { state: { spoken: Spoken[] } } }).__listen.state.spoken)
const next = (page: Page) => page.evaluate(() => (window as unknown as { __listen: { next: () => void } }).__listen.next())

test.describe('005 T628: "Escuchar este post"', () => {
  test('lee el título y el cuerpo con la voz del idioma, marca lo que lee y Esc lo detiene', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await fakeSpeech(page, true)
    await page.goto('/es/blog/post1')
    const play = page.locator('[data-cw-listen-play]')
    await expect(play).toHaveText(/Escuchar este post/)
    const title = ((await page.locator('#cw-post-title').textContent()) ?? '').replace(/\s+/g, ' ').trim()
    await play.click()
    await expect.poll(async () => (await spoken(page))[0]?.text).toBe(title)
    expect((await spoken(page))[0]?.lang).toMatch(/^es/)
    await expect(page.locator('[data-cw-listen-status]')).toContainText('Leyendo:')
    await next(page)
    await expect(page.locator('#cw-post-body [data-cw-listen-reading]')).toHaveCount(1)
    await expect(page.locator('[data-cw-listen-toggle]')).toHaveText(/Pausar/)
    await page.locator('[data-cw-listen-toggle]').focus()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-cw-listen-play]')).toBeVisible()
    await expect(page.locator('[data-cw-listen-reading]')).toHaveCount(0)
  })

  test('sin voz en el navegador no aparece', async ({ page }) => {
    onlyIn('desktop-chromium')
    await fakeSpeech(page, false)
    await page.goto('/es/blog/post1')
    await expect(page.locator('#cw-post-title')).toBeVisible()
    await expect(page.locator('[data-cw-listen]')).toHaveCount(0)
  })

  test('la paleta ofrece "Escuchar este post" solo en un post', async ({ page }) => {
    onlyIn('desktop-chromium')
    await fakeSpeech(page, true)
    await page.goto('/es/blog/post1')
    await expect(page.locator('[data-cw-listen-play]')).toBeVisible()
    await page.keyboard.press('Control+k')
    await page.keyboard.type('escuchar')
    const option = page.locator('[data-cw-palette-option="extension:listen"]')
    await expect(option).toContainText('Escuchar este post')
    await option.click()
    await expect.poll(async () => (await spoken(page)).length).toBeGreaterThan(0)
    await page.goto('/es/blog')
    await page.keyboard.press('Control+k')
    await page.keyboard.type('escuchar')
    await expect(page.locator('[data-cw-palette-option="extension:listen"]')).toHaveCount(0)
  })
})
