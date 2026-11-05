import { expect, test, type Locator, type Page } from '@playwright/test'
import { getSite } from '@/lib/content'
import { LANGS, skipIntro, type Lang } from './support/pages'

const site = getSite()
const CAREER_ENTRIES = site.about.career.length
const SKILL_NAMES = site.about.skills.tech.map((tech) => tech.label?.es ?? tech.name)
const LOBES = 6
const lobeNames = (lang: Lang): string[] => (site.about.skills.lobes ?? []).map((lobe) => lobe.name[lang])
const HEIGHT_001_AT_1440: Record<Lang, number> = { es: 7598, en: 7390 }
const MAX_HEIGHT_RATIO = 0.6

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function open(page: Page, lang: Lang, ready = true): Promise<void> {
  await skipIntro(page)
  await page.goto(`/${lang}/aboutMe`)
  if (ready) await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
}

async function sceneIndex(page: Page): Promise<Locator> {
  const candidates = page.locator('main nav')
  const count = await candidates.count()
  for (let index = 0; index < count; index++) {
    const nav = candidates.nth(index)
    const links = nav.locator('a[href]')
    const hrefs = await links.evaluateAll((items) => items.map((item) => item.getAttribute('href') ?? ''))
    if (hrefs.length === 3 && hrefs.every((href) => href.startsWith('#'))) return nav
  }
  throw new Error('no hay un índice de escenas: un nav en main con tres enlaces a anclas')
}

async function scenes(page: Page): Promise<Locator[]> {
  const hrefs = await (await sceneIndex(page)).locator('a[href]').evaluateAll((items) => items.map((item) => item.getAttribute('href') ?? ''))
  return hrefs.map((href) => page.locator(`[id="${decodeURIComponent(href.slice(1))}"]`))
}

async function lobes(page: Page, lang: Lang): Promise<Locator[]> {
  const [, , knowledge] = await scenes(page)
  return lobeNames(lang).map((name) => knowledge!.getByRole('button', { name, exact: true }))
}

async function pressedNames(group: Locator[]): Promise<string[]> {
  const names: string[] = []
  for (const lobe of group) {
    if ((await lobe.getAttribute('aria-pressed')) === 'true') names.push(((await lobe.textContent()) ?? '').trim())
  }
  return names
}
test.describe('Sobre mí en tres escenas (US6c, FR-213)', () => {
  onlyIn('desktop-chromium')

  for (const lang of LANGS) {
    test(`/${lang}/aboutMe a 1440 px: tres escenas, índice que marca la visible y 40 % menos de altura`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await open(page, lang)
      const index = await sceneIndex(page)
      const links = index.locator('a[href]')
      const targets = await scenes(page)
      for (let position = 0; position < targets.length; position++) {
        await links.nth(position).click()
        const covered = await index.evaluate((nav) => nav.getBoundingClientRect().bottom)
        await expect.poll(() => targets[position]!.evaluate((scene) => Math.round(scene.getBoundingClientRect().top)), { message: `escena ${position + 1} bajo el índice` }).toBeGreaterThanOrEqual(Math.floor(covered) - 1)
        await expect(links.nth(position), `el índice marca la escena ${position + 1}`).toHaveAttribute('aria-current', /^(?!false$).+/)
        await expect(targets[position]!.getByRole('heading').first()).toBeVisible()
      }
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      expect(height, `altura a 1440 px (la 001 medía ${HEIGHT_001_AT_1440[lang]})`).toBeLessThanOrEqual(Math.round(HEIGHT_001_AT_1440[lang] * MAX_HEIGHT_RATIO))
    })
  }

  test('el mapa cerebral se activa con clic, Enter, Espacio y flechas, y lo anuncia', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, 'es')
    const names = lobeNames('es')
    expect(names, 'el contenido declara seis lóbulos (E-03, T229)').toHaveLength(LOBES)
    const group = await lobes(page, 'es')
    for (const lobe of group) await expect(lobe).toHaveAttribute('aria-pressed', /^(true|false)$/)
    const [, , knowledge] = await scenes(page)
    const live = knowledge!.locator('[aria-live="polite"]').first()
    await expect(live).toBeAttached()

    for (let position = 0; position < LOBES; position++) {
      await group[position]!.click()
      await expect.poll(() => pressedNames(group)).toEqual([names[position]])
      await expect(live).toContainText(names[position]!, { ignoreCase: true })
    }
    await group[0]!.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => pressedNames(group)).toEqual([names[0]])
    await group[1]!.focus()
    await page.keyboard.press('Space')
    await expect.poll(() => pressedNames(group)).toEqual([names[1]])
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => pressedNames(group), { message: 'ArrowRight activa el lóbulo siguiente' }).toEqual([names[2]])
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => pressedNames(group), { message: 'ArrowLeft activa el anterior' }).toEqual([names[1]])
  })

  test('con movimiento reducido, activar un lóbulo solo cambia el estado: la escena queda quieta', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, 'es')
    const [, , knowledge] = await scenes(page)
    await knowledge!.scrollIntoViewIfNeeded()
    const shot = () => knowledge!.screenshot({ animations: 'allow', caret: 'hide' })
    let previous = await shot()
    let stable = false
    for (let attempt = 0; attempt < 20 && !stable; attempt++) {
      await page.waitForTimeout(300)
      const current = await shot()
      stable = current.equals(previous)
      previous = current
    }
    expect(stable, 'la escena se asienta antes de activar un lóbulo').toBe(true)
    const group = await lobes(page, 'es')
    await group[2]!.click()
    await expect(group[2]!).toHaveAttribute('aria-pressed', 'true')
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    const first = await shot()
    await page.waitForTimeout(700)
    const second = await shot()
    expect(first.equals(second), 'sin lluvia, pulso, giro ni descifrado').toBe(true)
  })
})
test.describe('la carrera como cartas sobre la mesa (US6b)', () => {
  onlyIn('desktop-chromium')

  test('desde 992 px cada empleo es una carta que se abre como diálogo modal y devuelve el foco', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await open(page, 'es')
    const [, career] = await scenes(page)
    const cards = career!.getByRole('button')
    await expect(cards).toHaveCount(CAREER_ENTRIES)
    const dialog = page.getByRole('dialog')
    const triggers: Array<[string, (card: Locator) => Promise<void>]> = [
      ['clic', (card) => card.click()],
      ['Enter', async (card) => {
        await card.focus()
        await page.keyboard.press('Enter')
      }],
      ['Espacio', async (card) => {
        await card.focus()
        await page.keyboard.press('Space')
      }],
    ]
    for (const [position, [how, activate]] of triggers.entries()) {
      const card = cards.nth(position)
      await activate(card)
      await expect(dialog, `${how} abre la carta ${position + 1}`).toBeVisible()
      await expect.poll(() => dialog.evaluate((element) => element.matches('dialog[open]:modal') || element.getAttribute('aria-modal') === 'true')).toBe(true)
      await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
      if (position === 2) await dialog.getByRole('button', { name: /cerrar|close/i }).click()
      else await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(card, 'al cerrar, el foco vuelve a la carta').toBeFocused()
    }
  })
})

test.describe('Sobre mí en pantallas chicas (US6b y US6c)', () => {
  onlyIn('mobile-chromium')
  test('la carrera es una línea de tiempo y el mapa compacto muestra los 6 lóbulos sin desplazamiento horizontal (006, EM-02)', async ({ page }) => {
    await open(page, 'es')
    const [, career] = await scenes(page)
    await expect(career!.locator('ol > li')).toHaveCount(CAREER_ENTRIES)
    await expect(career!.locator('ol > li time').first()).toBeVisible()
    const group = await lobes(page, 'es')
    const viewport = page.viewportSize()!
    for (const lobe of group) {
      await lobe.scrollIntoViewIfNeeded()
      await expect(lobe).toBeVisible()
      const box = (await lobe.boundingBox())!
      expect(box.width, 'cada lóbulo se toca cómodo').toBeGreaterThanOrEqual(44)
      expect(box.height, 'cada lóbulo se toca cómodo').toBeGreaterThanOrEqual(44)
      expect(box.x, 'el lóbulo cabe en el ancho de la pantalla').toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, 'el lóbulo cabe en el ancho de la pantalla').toBeLessThanOrEqual(viewport.width + 1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
  })
})

test.describe('Sobre mí sin JavaScript (US6b y US6c)', () => {
  onlyIn('no-js')
  test('"Lo que sé" muestra todas las skills como listas y la carrera como línea de tiempo', async ({ page }) => {
    await open(page, 'es', false)
    const [, career, knowledge] = await scenes(page)
    for (const name of SKILL_NAMES) await expect(knowledge!.getByText(name, { exact: true }).filter({ visible: true }).first(), name).toBeVisible()
    await expect(knowledge!.locator('ul, ol').filter({ visible: true }).first()).toBeVisible()
    await expect(career!.locator('ol > li')).toHaveCount(CAREER_ENTRIES)
  })
})
