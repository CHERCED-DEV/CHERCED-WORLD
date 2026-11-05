import { expect, test, type Locator, type Page } from '@playwright/test'
import { getSite } from '@/lib/content'
import { ALL_WIDTHS, dragDown, introSeen, onlyMobile, OPEN_SHEET, openReady, scrollThrough, settled, widthOf } from './support/mobile'
import { movingUnderReducedMotion, runningMotions } from './support/motion-audit'

const site = getSite()
const LOBES = site.about.skills.lobes ?? []
const CAREER = site.about.career

type SheetCase = { name: string; path: string; trigger: (page: Page) => Locator; ready?: (page: Page) => Promise<void> }

async function handReady(page: Page): Promise<void> {
  const hand = page.locator('[data-cw-hand]')
  await hand.scrollIntoViewIfNeeded()
  await expect(hand).toBeVisible()
  await expect(page.locator('[data-cw-hand-counter]')).toHaveText(`1 / ${CAREER.length}`)
}

const SHEETS: readonly SheetCase[] = [
  { name: 'lóbulo del mapa', path: '/es/aboutMe', trigger: (page) => page.locator('[data-cw-lobe]').first() },
  { name: 'carta del mazo', path: '/es/aboutMe', trigger: (page) => page.locator('[data-cw-hand-top]'), ready: handReady },
  { name: 'sitio embebido del caso 1', path: '/es/portfolio/1', trigger: (page) => page.locator('[data-cw-embed-sheet-open]') },
  { name: 'paleta', path: '/es', trigger: (page) => page.locator('[data-cw-palette-trigger]') },
  { name: 'asistente', path: '/es', trigger: (page) => page.locator('[data-cw-dock-assistant]') },
]

function sheet(page: Page): Locator {
  return page.locator(OPEN_SHEET)
}

function closeButton(open: Locator): Locator {
  return open.locator('[data-cw-sheet-close], [data-cw-embed-sheet-close]').or(open.getByRole('button', { name: /^(cerrar|close)\b/i })).first()
}

async function expectOpen(page: Page): Promise<Locator> {
  const open = sheet(page)
  await expect(open).toBeVisible()
  await expect.poll(() => open.evaluate((element) => element.matches(':modal') || element.getAttribute('aria-modal') === 'true'), { message: 'la hoja es modal' }).toBe(true)
  await expect.poll(() => open.evaluate((element) => element.contains(document.activeElement)), { message: 'el foco entra en la hoja' }).toBe(true)
  return open
}

async function expectClosedWithFocus(page: Page, trigger: Locator, how: string): Promise<void> {
  await expect(sheet(page), `${how} cierra la hoja`).toHaveCount(0)
  await expect(trigger, `${how}: el foco vuelve a quien la abrió`).toBeFocused()
}

async function prepare(page: Page, item: SheetCase): Promise<Locator> {
  await openReady(page, item.path)
  await item.ready?.(page)
  const trigger = item.trigger(page)
  await trigger.scrollIntoViewIfNeeded()
  await expect(trigger).toBeVisible()
  return trigger
}

test.use({ trace: 'retain-on-failure' })

test.describe('hojas: toque, teclado, Esc y arrastre, con el foco de vuelta (FR-603, SC-606)', () => {
  onlyMobile()

  for (const item of SHEETS) {
    test(`${item.name}: un toque la abre y "Cerrar" la cierra`, { tag: ALL_WIDTHS }, async ({ page }) => {
      const trigger = await prepare(page, item)
      await trigger.tap()
      const open = await expectOpen(page)
      await settled(open)
      await closeButton(open).tap()
      await expectClosedWithFocus(page, trigger, '"Cerrar"')
    })

    test(`${item.name}: con el teclado, Enter la abre y Esc la cierra`, { tag: ALL_WIDTHS }, async ({ page }) => {
      const trigger = await prepare(page, item)
      await trigger.focus()
      await page.keyboard.press('Enter')
      await expectOpen(page)
      await page.keyboard.press('Escape')
      await expectClosedWithFocus(page, trigger, 'Esc')
    })

    test(`${item.name}: arrastrar la agarradera hacia abajo la cierra`, { tag: ALL_WIDTHS }, async ({ page }) => {
      const trigger = await prepare(page, item)
      await trigger.tap()
      const open = await expectOpen(page)
      await settled(open)
      await dragDown(page, open.locator('[data-cw-sheet-drag]').first())
      await expect(sheet(page), 'el arrastre cierra la hoja').toHaveCount(0)
    })
  }
})

test.describe('el mapa y el mazo se recorren solo con botones (FR-652)', () => {
  onlyMobile()

  test('mapa: Enter abre el primer lóbulo y "Siguiente" y "Anterior" recorren los seis con el mapa al día', { tag: ALL_WIDTHS }, async ({ page }) => {
    await openReady(page, '/es/aboutMe')
    const lobes = page.locator('[data-cw-lobe]')
    await expect(lobes).toHaveCount(LOBES.length)
    await lobes.first().scrollIntoViewIfNeeded()
    await lobes.first().focus()
    await page.keyboard.press('Enter')
    const open = await expectOpen(page)
    const body = open.locator('[data-cw-terminal-body]')
    const visited: string[] = []
    for (let step = 0; step < LOBES.length; step++) {
      const id = await body.getAttribute('data-cw-terminal-body')
      visited.push(id ?? '')
      await expect(page.locator(`[data-cw-lobe="${id}"]`), `el mapa de atrás marca ${id}`).toHaveAttribute('aria-pressed', 'true')
      await open.locator('[data-cw-sheet-next]').click()
      await expect(body).not.toHaveAttribute('data-cw-terminal-body', id ?? '')
    }
    expect([...visited].sort(), 'los seis lóbulos, una vez cada uno').toEqual(LOBES.map((lobe) => lobe.id).sort())
    await expect(body).toHaveAttribute('data-cw-terminal-body', visited[0]!)
    await open.locator('[data-cw-sheet-prev]').click()
    await expect(body).toHaveAttribute('data-cw-terminal-body', visited.at(-1)!)
    await closeButton(open).click()
    await expect(sheet(page)).toHaveCount(0)
  })

  test('mazo: "Siguiente" y "Anterior" pasan las ocho cartas, y Enter abre la de arriba', { tag: ALL_WIDTHS }, async ({ page }) => {
    await openReady(page, '/es/aboutMe')
    await handReady(page)
    const counter = page.locator('[data-cw-hand-counter]')
    const top = page.locator('[data-cw-hand-top]')
    const seen = new Set<string>()
    for (let step = 1; step <= CAREER.length; step++) {
      await expect(counter).toHaveText(`${step} / ${CAREER.length}`)
      seen.add((await page.locator('[data-cw-hand-card][data-top]').getAttribute('data-cw-hand-card')) ?? '')
      await page.locator('[data-cw-hand-next]').click()
    }
    expect(seen.size, 'las ocho cartas').toBe(CAREER.length)
    await expect(counter).toHaveText(`1 / ${CAREER.length}`)
    await page.locator('[data-cw-hand-prev]').click()
    await expect(counter).toHaveText(`${CAREER.length} / ${CAREER.length}`)
    const last = CAREER.at(-1)!
    await top.focus()
    await page.keyboard.press('Enter')
    const open = await expectOpen(page)
    await expect(open).toContainText(last.role.es)
    await page.keyboard.press('Escape')
    await expectClosedWithFocus(page, top, 'Esc')
  })
})

test.describe('sin JavaScript, todo se lee sin hojas ni dock (FR-624, FR-630, FR-652)', () => {
  onlyMobile()

  for (const path of ['/es', '/es/aboutMe', '/es/services', '/es/portfolio', '/es/portfolio/1', '/es/contactMe']) {
    test(`${path}`, { tag: ALL_WIDTHS }, async ({ browser, baseURL }, testInfo) => {
      const width = widthOf(testInfo)
      const { viewport, deviceScaleFactor, isMobile, hasTouch, userAgent } = testInfo.project.use
      const context = await browser.newContext({ baseURL, viewport, deviceScaleFactor, isMobile, hasTouch, userAgent, javaScriptEnabled: false })
      const page = await context.newPage()
      try {
        const response = await page.goto(path)
        expect(response?.status()).toBe(200)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.hasAttribute('data-cw-dock')), 'sin JS no hay dock').toBe(false)
        await expect(page.locator(OPEN_SHEET)).toHaveCount(0)
        expect(await page.evaluate(() => document.documentElement.scrollWidth), 'sin scroll horizontal').toBeLessThanOrEqual(width)
        if (path === '/es/aboutMe') {
          await expect(page.locator('[data-cw-hand]'), 'el mazo necesita JS').toBeHidden()
          await expect(page.locator('[data-cw-timeline] li').filter({ visible: true })).toHaveCount(CAREER.length)
          for (const tech of site.about.skills.tech.slice(0, 5)) {
            await expect(page.getByText(tech.label?.es ?? tech.name, { exact: true }).filter({ visible: true }).first(), tech.name).toBeVisible()
          }
        }
      } finally {
        await context.close()
      }
    })
  }
})

test.describe('con movimiento reducido no queda nada en marcha (FR-650, SC-607)', () => {
  onlyMobile()

  for (const path of ['/es', '/es/aboutMe', '/es/services', '/es/portfolio', '/es/portfolio/12', '/es/contactMe', '/en/now']) {
    test(`${path}: 0 animaciones activas de arriba abajo`, { tag: ALL_WIDTHS }, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await introSeen(page)
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      const moving = new Set<string>()
      await scrollThrough(page, async (y) => {
        for (const motion of movingUnderReducedMotion(await runningMotions(page))) moving.add(`y=${y}: ${motion}`)
      }, 600, 400)
      expect([...moving], 'nada se mueve ni queda en bucle; los fundidos de opacidad y color están permitidos').toEqual([])
    })
  }
})
