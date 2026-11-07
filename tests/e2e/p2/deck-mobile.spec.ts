import { expect, test, type Page } from '@playwright/test'
import { handTilt } from '@/components/site/about/deck'
import { getSite } from '@/lib/content'

const { career } = getSite().about
const SHEET = 'dialog[data-cw-sheet]'
const TOTAL = career.length

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function openHand(page: Page, width = 390) {
  await page.setViewportSize({ width, height: 844 })
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
    const calls: number[] = []
    ;(window as unknown as { __cwVibrate: number[] }).__cwVibrate = calls
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (pattern: number) => (calls.push(pattern), true) })
  })
  await page.goto('/es/aboutMe')
  const hand = page.locator('[data-cw-hand]')
  await hand.scrollIntoViewIfNeeded()
  await expect(hand).toBeVisible()
  await expect(async () => {
    await page.locator('[data-cw-hand-next]').click()
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`, { timeout: 500 })
  }).toPass()
  await page.locator('[data-cw-hand-prev]').click()
  await expect(counter(page)).toHaveText(`1 / ${TOTAL}`)
  return hand
}

const counter = (page: Page) => page.locator('[data-cw-hand-counter]')
const top = (page: Page) => page.locator('[data-cw-hand-top]')
const sheet = (page: Page) => page.locator(`${SHEET}[open]`)

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, steps = 8) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
}

test.describe('carrera como mazo en la mano (T830, FR-630, EM-03)', () => {
  onlyIn('mobile-chromium')

  for (const width of [375, 390, 412]) {
    test(`${width} px: mazo en lugar de la línea de tiempo, sin desbordes y con objetivos de 44 px`, async ({ page }) => {
      const hand = await openHand(page, width)
      await expect(page.locator('[data-cw-timeline]')).toBeHidden()
      await expect(page.locator('[data-cw-deck] [data-cw-deck-card]').first()).toBeHidden()
      await expect(hand.locator('[data-cw-hand-card]')).toHaveCount(TOTAL)
      await expect(hand.locator('[data-cw-hand-card][data-shown]')).toHaveCount(4)
      const topCard = hand.locator('[data-cw-hand-card][data-top]')
      await expect(topCard).toHaveAttribute('data-cw-hand-card', career[0]!.id)
      await expect(topCard).toContainText(career[0]!.role.es)
      await expect(topCard.locator('time').first()).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      const box = (await hand.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      for (const control of [top(page), page.locator('[data-cw-hand-prev]'), page.locator('[data-cw-hand-next]')]) {
        const rect = (await control.boundingBox())!
        expect(rect.width).toBeGreaterThanOrEqual(44)
        expect(rect.height).toBeGreaterThanOrEqual(44)
      }
    })
  }

  test('las cartas de atrás asoman giradas entre −3° y 3°, igual en cada carga', async ({ page }) => {
    const hand = await openHand(page)
    const read = () =>
      hand.locator('[data-cw-hand-card]').evaluateAll((cards) =>
        cards.map((card) => ({ id: (card as HTMLElement).dataset.cwHandCard!, tilt: getComputedStyle(card).getPropertyValue('--cw-hand-tilt').trim(), top: card.hasAttribute('data-top') })),
      )
    const first = await read()
    for (const [index, card] of first.entries()) {
      expect(card.tilt).toBe(card.top ? '0deg' : `${handTilt(index)}deg`)
      expect(Math.abs(Number.parseFloat(card.tilt))).toBeLessThanOrEqual(3)
    }
    await page.reload()
    await hand.scrollIntoViewIfNeeded()
    expect(await read()).toEqual(first)
  })

  test('Siguiente y Anterior pasan las cartas en círculo y el contador lo anuncia', async ({ page }) => {
    await openHand(page)
    await expect(counter(page)).toHaveAttribute('aria-live', 'polite')
    for (let n = 2; n <= TOTAL; n++) {
      await page.locator('[data-cw-hand-next]').click()
      await expect(counter(page)).toHaveText(`${n} / ${TOTAL}`)
      await expect(page.locator('[data-cw-hand-card][data-top]')).toHaveAttribute('data-cw-hand-card', career[n - 1]!.id)
    }
    await page.locator('[data-cw-hand-next]').click()
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`)
    await page.locator('[data-cw-hand-prev]').click()
    await expect(counter(page)).toHaveText(`${TOTAL} / ${TOTAL}`)
    await expect(top(page)).toHaveAccessibleName(`${career[TOTAL - 1]!.role.es} · ${career[TOTAL - 1]!.company}`)
  })

  test('deslizar la carta de arriba la manda al fondo; un gesto vertical deja el scroll', async ({ page }) => {
    await openHand(page)
    const box = (await top(page).boundingBox())!
    const y = box.y + box.height / 2
    await drag(page, { x: box.x + box.width * 0.75, y }, { x: box.x + 20, y: y + 8 })
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`)
    await drag(page, { x: box.x + 20, y }, { x: box.x + box.width * 0.75, y: y + 8 })
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`)
    await drag(page, { x: box.x + box.width / 2, y }, { x: box.x + box.width / 2 + 6, y: box.y - 40 })
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`)
    await expect(sheet(page)).toHaveCount(0)
  })

  test('tocar la carta la abre en una hoja con el detalle y vibra; Esc la cierra y devuelve el foco', async ({ page }) => {
    await openHand(page)
    await page.locator('[data-cw-hand-next]').click()
    await page.locator('[data-cw-hand-next]').click()
    await expect(counter(page)).toHaveText(`3 / ${TOTAL}`)
    await top(page).tap()
    const open = sheet(page)
    await expect(open).toBeVisible()
    const job = career[2]!
    await expect(page.getByRole('dialog', { name: job.role.es })).toBeVisible()
    await expect(open.locator(`[data-cw-hand-open="${job.id}"]`)).toContainText(job.highlights?.[0]?.es ?? job.description.es)
    await expect(open.locator('[data-cw-sheet-nav] p')).toHaveText(`3 / ${TOTAL}`)
    expect(await page.evaluate(() => (window as unknown as { __cwVibrate: number[] }).__cwVibrate)).toEqual([8])
    await page.keyboard.press('Escape')
    await expect(sheet(page)).toHaveCount(0)
    await expect(top(page)).toBeFocused()
  })

  test('dentro de la hoja, deslizar y los botones cambian de carta y el mazo de atrás la sigue', async ({ page }) => {
    await openHand(page)
    await top(page).tap()
    const open = sheet(page)
    await expect(open).toBeVisible()
    await expect.poll(() => open.evaluate((node) => node.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0)
    const body = (await open.locator('[data-cw-sheet-body]').boundingBox())!
    const y = body.y + Math.min(body.height / 2, 160)
    await drag(page, { x: 330, y }, { x: 80, y: y + 10 })
    await expect(open.locator('[data-cw-sheet-nav] p')).toHaveText(`2 / ${TOTAL}`)
    await expect(open.locator(`[data-cw-hand-open="${career[1]!.id}"]`)).toBeVisible()
    await open.locator('[data-cw-sheet-next]').tap()
    await expect(open.locator('[data-cw-sheet-nav] p')).toHaveText(`3 / ${TOTAL}`)
    await open.locator('[data-cw-sheet-prev]').tap()
    await open.locator('[data-cw-sheet-prev]').tap()
    await expect(open.locator('[data-cw-sheet-nav] p')).toHaveText(`1 / ${TOTAL}`)
    await open.locator('[data-cw-sheet-prev]').tap()
    await expect(open.locator(`[data-cw-hand-open="${career[TOTAL - 1]!.id}"]`)).toBeVisible()
    await open.locator('[data-cw-sheet-close]').tap()
    await expect(sheet(page)).toHaveCount(0)
    await expect(counter(page)).toHaveText(`${TOTAL} / ${TOTAL}`)
    await expect(top(page)).toBeFocused()
  })

  test('con teclado: Enter abre, flechas pasan cartas y el foco se queda en la carta de arriba', async ({ page }) => {
    await openHand(page)
    await top(page).focus()
    await page.keyboard.press('ArrowRight')
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`)
    await expect(top(page)).toBeFocused()
    await page.keyboard.press('ArrowLeft')
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`)
    await page.keyboard.press('Enter')
    await expect(sheet(page)).toBeVisible()
    await expect(sheet(page).getByRole('heading', { level: 2 })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(sheet(page)).toHaveCount(0)
    await expect(top(page)).toBeFocused()
  })

  test('las cartas no llevan blur propio: el presupuesto se queda con el header, el dock y la hoja', async ({ page }) => {
    await openHand(page, 375)
    await expect(page.locator('[data-cw-hand-card][data-cw-blur], [data-cw-hand-top][data-cw-blur], [data-cw-hand-nav] [data-cw-blur]')).toHaveCount(0)
    for (const card of await page.locator('[data-cw-hand-card][data-shown]').all()) await expect(card).toHaveCSS('backdrop-filter', 'none')
  })
})

test.describe('respaldos del mazo (FR-630, FR-650)', () => {
  onlyIn('mobile-chromium')

  test('con movimiento reducido queda la línea de tiempo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-hand]')).toBeHidden()
    const timeline = page.locator('[data-cw-timeline]')
    await timeline.scrollIntoViewIfNeeded()
    await expect(timeline).toBeVisible()
    await expect(timeline.locator(':scope > li')).toHaveCount(TOTAL)
  })

  test.describe('sin JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('la línea de tiempo completa, sin mazo ni hoja', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/es/aboutMe')
      await expect(page.locator('[data-cw-hand]')).toBeHidden()
      await expect(page.locator('[data-cw-timeline] > li')).toHaveCount(TOTAL)
      await expect(page.locator('[data-cw-timeline]')).toBeVisible()
    })
  })
})

test.describe('el escritorio no cambia', () => {
  onlyIn('desktop-chromium')

  for (const width of [992, 1280]) {
    test(`${width} px: la mesa de 8 cartas, sin mazo en la mano`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/es/aboutMe')
      await expect(page.locator('[data-cw-hand]')).toBeHidden()
      await expect(page.locator('[data-cw-deck-card]')).toHaveCount(TOTAL)
      await page.locator('[data-cw-deck]').scrollIntoViewIfNeeded()
      await expect(page.locator('[data-cw-deck-card]').first()).toBeVisible()
    })
  }
})
