import { expect, test, type Locator, type Page } from '@playwright/test'
import { projects } from '@/content/projects'
import { runTerminal, terminalCommands, TERMINAL_MAX_INPUT } from '@/content/terminal'

const LANGS = ['es', 'en'] as const
type Lang = (typeof LANGS)[number]
const LABELS = {
  es: { input: 'Escribe un comando', output: 'Salida del terminal', hint: 'Escribe help y pulsa Enter. Tab completa el comando.', unknown: 'comando no encontrado: sudo. Prueba con help' },
  en: { input: 'Type a command', output: 'Terminal output', hint: 'Type help and press Enter. Tab completes the command.', unknown: 'command not found: sudo. Try help' },
} as const

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function openTerminal(page: Page, lang: Lang): Promise<{ input: Locator; log: Locator }> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(`/${lang}/aboutMe`)
  const input = page.getByRole('textbox', { name: LABELS[lang].input })
  await input.scrollIntoViewIfNeeded()
  await expect(input).toBeVisible()
  return { input, log: page.getByRole('log', { name: LABELS[lang].output }) }
}

async function run(input: Locator, command: string) {
  await input.fill(command)
  await input.press('Enter')
}

test.describe('terminal en el que se escribe (T436, FR-461)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of LANGS) {
    test(`${lang}: cada comando de §15 responde con su salida y su eco`, async ({ page }) => {
      const { input, log } = await openTerminal(page, lang)
      await expect(log).toHaveAttribute('aria-live', 'polite')
      await expect(input).toHaveAccessibleDescription(LABELS[lang].hint)
      await expect(input).toHaveAttribute('maxlength', String(TERMINAL_MAX_INPUT))
      for (const command of terminalCommands.filter((item) => item.name !== 'clear')) {
        await run(input, command.name)
        const result = runTerminal(command.name, lang)
        if (result.kind !== 'output') throw new Error(command.name)
        const entry = log.locator('[data-cw-term-entry]').last()
        await expect(entry.locator('p').first()).toHaveText(`$ ${command.name}`)
        await expect(entry.locator('[data-cw-term-line]')).toHaveText(result.lines.map((line) => line.text))
        await expect(input).toHaveValue('')
        await expect(input).toBeFocused()
      }
    })
  }

  test('cat lemas.md marca solo "Veni, vidi, vici" en latín', async ({ page }) => {
    const { input, log } = await openTerminal(page, 'en')
    await run(input, 'cat lemas.md')
    const lines = log.locator('[data-cw-term-entry]').last().locator('[data-cw-term-line]')
    await expect(lines).toHaveText(['1. Sow kindness, reap excellence.', '2. Veni, vidi, vici.'])
    await expect(lines.nth(0)).not.toHaveAttribute('lang', /.*/)
    await expect(lines.nth(1)).toHaveAttribute('lang', 'la')
  })

  test('ls projects/ enlaza cada caso en el orden del portafolio y el enlace navega', async ({ page }) => {
    const { input, log } = await openTerminal(page, 'es')
    await run(input, 'LS   Projects/')
    const links = log.locator('[data-cw-term-entry]').last().getByRole('link')
    const ordered = [...projects].sort((a, b) => a.order - b.order)
    await expect(links).toHaveCount(ordered.length)
    expect(await links.evaluateAll((items) => items.map((item) => item.getAttribute('href')))).toEqual(ordered.map((project) => `/es/portfolio/${project.id}`))
    await expect(links.first()).toHaveText('synergos/')
    await links.first().click()
    await expect(page).toHaveURL(/\/es\/portfolio\/12$/)
  })

  test('cat <lóbulo>.lobe activa el lóbulo en el mapa; clear limpia la salida', async ({ page }) => {
    const { input, log } = await openTerminal(page, 'es')
    await run(input, 'cat Architecture.lobe')
    await expect(page.locator('[data-cw-lobe="architecture"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cw-terminal-body]')).toHaveAttribute('data-cw-terminal-body', 'architecture')
    await expect(input).toBeFocused()
    await run(input, 'whoami')
    await expect(log.locator('[data-cw-term-entry]')).toHaveCount(2)
    await run(input, 'clear')
    await expect(log.locator('[data-cw-term-entry]')).toHaveCount(0)
    await expect(log).toHaveText('')
    await expect(log).not.toHaveAttribute('tabindex', /.*/)
  })

  for (const lang of LANGS) {
    test(`${lang}: un comando desconocido sugiere help y la salida es texto, no HTML`, async ({ page }) => {
      const { input, log } = await openTerminal(page, lang)
      await run(input, 'sudo')
      await expect(log.locator('[data-cw-term-line]').last()).toHaveText(LABELS[lang].unknown)
      await run(input, '<img src=x onerror="document.title=1">')
      await expect(log.locator('img')).toHaveCount(0)
      await expect(log.locator('[data-cw-term-line]').last()).toContainText('<img src=x onerror="document.title=1">')
      await expect(page).not.toHaveTitle('1')
    })
  }

  test('la entrada se corta a 80 caracteres y Esc la limpia', async ({ page }) => {
    const { input } = await openTerminal(page, 'es')
    await input.fill('x'.repeat(200))
    expect((await input.inputValue()).length).toBeLessThanOrEqual(TERMINAL_MAX_INPUT)
    await input.press('Escape')
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
  })
})

test.describe('Tab y foco (FR-461: Tab completa sin trampa)', () => {
  onlyIn('desktop-chromium')

  test('con una coincidencia única, Tab completa y el foco se queda', async ({ page }) => {
    const { input } = await openTerminal(page, 'es')
    await input.click()
    await page.keyboard.type('who')
    await page.keyboard.press('Tab')
    await expect(input).toHaveValue('whoami')
    await expect(input).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('log').locator('[data-cw-term-line]').last()).toContainText('arquitecto')
    await page.keyboard.type('cat f')
    await page.keyboard.press('Tab')
    await expect(input).toHaveValue('cat frontend.lobe')
  })

  for (const [label, text] of [
    ['vacía', ''],
    ['ambigua', 'ls'],
    ['sin coincidencia', 'zzz'],
    ['ya completa', 'whoami'],
  ] as const) {
    test(`con la entrada ${label}, Tab saca el foco del terminal`, async ({ page }) => {
      const { input } = await openTerminal(page, 'es')
      await input.click()
      if (text) await page.keyboard.type(text)
      await page.keyboard.press('Tab')
      await expect(input).not.toBeFocused()
      await expect(input).toHaveValue(text)
      await page.keyboard.press('Shift+Tab')
      await expect(input).toBeFocused()
    })
  }

  test('Shift+Tab nunca completa', async ({ page }) => {
    const { input } = await openTerminal(page, 'es')
    await input.click()
    await page.keyboard.type('he')
    await page.keyboard.press('Shift+Tab')
    await expect(input).not.toBeFocused()
    await expect(input).toHaveValue('he')
  })
})

test.describe('terminal en móvil', () => {
  onlyIn('mobile-chromium')

  test('las salidas largas no desbordan a 390 px y el campo no hace zoom', async ({ page }) => {
    const { input, log } = await openTerminal(page, 'es')
    expect(await input.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16)
    for (const command of ['ls synergos/', 'help', 'ls projects/']) await run(input, command)
    await expect(log.locator('[data-cw-term-entry]')).toHaveCount(3)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    const panel = (await page.locator('[data-cw-terminal]').boundingBox())!
    expect(panel.x + panel.width).toBeLessThanOrEqual(390)
  })
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('el terminal no aparece: el contenido del mapa sigue en las listas', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await expect(page.getByRole('textbox', { name: LABELS.es.input })).toBeHidden()
    await expect(page.locator('[data-cw-brain-fallback]')).toBeVisible()
  })
})
