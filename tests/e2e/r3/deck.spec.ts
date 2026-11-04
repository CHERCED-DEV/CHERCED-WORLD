import { expect, test, type Locator, type Page } from '@playwright/test'
import { contrastRatio, over, parseColor, requiredRatio, withAlpha } from '@/lib/motion/contrast'
import { getSite } from '@/lib/content'
import { decodePng } from '../l2/png'

const { career } = getSite().about

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'la mesa es de escritorio; móvil y sin JS se prueban aparte')
})

async function openAbout(page: Page, motion: 'reduce' | 'no-preference' = 'no-preference') {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.emulateMedia({ reducedMotion: motion })
  await page.goto('/es/aboutMe')
  const deck = page.locator('[data-cw-deck]')
  await deck.scrollIntoViewIfNeeded()
  await expect(deck).toBeVisible()
  return deck
}

async function settled(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document
              .querySelector('[data-cw-deck]')!
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === 'running').length,
        ),
      { timeout: 10_000 },
    )
    .toBe(0)
}

function card(page: Page, id: string): Locator {
  return page.locator(`[data-cw-deck-card="${id}"]`)
}

const dialog = (page: Page) => page.locator('dialog:has([data-cw-deck-open])')

test('en escritorio la carrera es una mesa de 8 tarjetas giradas y la línea de tiempo se oculta', async ({ page }) => {
  await openAbout(page)
  await expect(page.locator('[data-cw-timeline]')).toBeHidden()
  const cards = page.locator('[data-cw-deck-card]')
  await expect(cards).toHaveCount(career.length)
  const rotations: string[] = []
  for (const entry of career) {
    const button = card(page, entry.id)
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    await expect(button).toContainText(entry.role.es)
    await expect(button).toContainText(entry.company)
    rotations.push(await button.evaluate((node) => getComputedStyle(node).rotate))
  }
  expect(new Set(rotations).size).toBeGreaterThan(4)
  await page.reload()
  for (const [index, entry] of career.entries()) {
    expect(await card(page, entry.id).evaluate((node) => getComputedStyle(node).rotate)).toBe(rotations[index])
  }
})

test('al pasar el puntero, la tarjeta se levanta', async ({ page }) => {
  await openAbout(page)
  const target = card(page, career[2]!.id)
  const before = await target.boundingBox()
  await target.hover()
  await expect.poll(async () => (await target.boundingBox())!.y).toBeLessThan(before!.y - 6)
})

test('clic abre la tarjeta en un diálogo modal y "Cerrar" la devuelve con el foco', async ({ page }) => {
  await openAbout(page)
  const entry = career[1]!
  const source = card(page, entry.id)
  await source.click()
  const modal = dialog(page)
  await expect(modal).toBeVisible()
  await expect(modal).toHaveAttribute('open', '')
  await expect(modal.getByRole('heading', { level: 3 })).toHaveText(entry.role.es)
  await expect(modal.getByText(entry.description.es)).toBeVisible()
  await expect(source).toHaveAttribute('data-flying', '')
  await settled(page)
  const box = await modal.boundingBox()
  const viewport = page.viewportSize()!
  expect(Math.abs(box!.x + box!.width / 2 - viewport.width / 2)).toBeLessThan(4)

  await modal.getByRole('button', { name: 'Cerrar' }).click()
  await expect(modal).toBeHidden()
  await expect(source).toBeFocused()
  await expect(source).not.toHaveAttribute('data-flying', /.*/)
  await expect(source).toBeVisible()
})

test('Enter y Espacio abren; Esc y el clic fuera cierran, y el foco vuelve a la tarjeta', async ({ page }) => {
  await openAbout(page)
  const modal = dialog(page)
  const first = card(page, career[0]!.id)
  await first.focus()
  await page.keyboard.press('Enter')
  await expect(modal).toBeVisible()
  await expect(modal.getByRole('heading', { level: 3 })).toHaveText(career[0]!.role.es)
  await expect(modal.getByRole('button', { name: 'Cerrar' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(modal).toBeHidden()
  await expect(first).toBeFocused()

  const other = card(page, career[5]!.id)
  await other.focus()
  await page.keyboard.press('Space')
  await expect(modal).toBeVisible()
  await expect(modal.getByRole('heading', { level: 3 })).toHaveText(career[5]!.role.es)
  await settled(page)
  await page.mouse.click(8, 300)
  await expect(modal).toBeHidden()
  await expect(other).toBeFocused()
})

test('el foco queda atrapado en el diálogo mientras está abierto', async ({ page }) => {
  await openAbout(page)
  await card(page, career[3]!.id).click()
  const modal = dialog(page)
  await settled(page)
  for (let step = 0; step < 4; step++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open]')) || document.activeElement === document.body)).toBe(true)
  }
  await expect(modal).toBeVisible()
})

test('la tarjeta vuela desde la mesa: el diálogo arranca con la forma de la tarjeta', async ({ page }) => {
  await openAbout(page)
  await card(page, career[4]!.id).click()
  const keyframes = await dialog(page).evaluate((node) =>
    node.getAnimations().map((animation) => (animation.effect as KeyframeEffect).getKeyframes().map((frame) => String(frame.transform ?? ''))),
  )
  expect(keyframes.flat().some((transform) => /translate\(.*rotate\(4deg\).*scale\(/.test(transform))).toBe(true)
  await settled(page)
})

test('con movimiento reducido no hay vuelo, solo un fundido corto', async ({ page }) => {
  await openAbout(page, 'reduce')
  await card(page, career[6]!.id).click()
  const modal = dialog(page)
  await expect(modal).toBeVisible()
  const animations = await modal.evaluate((node) =>
    node.getAnimations().map((animation) => ({
      duration: Number((animation.effect as KeyframeEffect).getTiming().duration),
      transform: (animation.effect as KeyframeEffect).getKeyframes().some((frame) => frame.transform !== undefined),
    })),
  )
  expect(animations.every((animation) => !animation.transform && animation.duration <= 200)).toBe(true)
  await page.keyboard.press('Escape')
  await expect(modal).toBeHidden()
})

test('la mesa no desborda en ningún ancho de 992 a 2560 px', async ({ page }) => {
  test.setTimeout(120_000)
  await openAbout(page, 'reduce')
  const widths = [...new Set([...Array.from({ length: 40 }, (_, index) => 992 + index * 40), 1366, 2560])]
  const findings: string[] = []
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    const issues = await page.evaluate(() => {
      const out: string[] = []
      if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`scroll ${document.documentElement.scrollWidth}`)
      const table = document.querySelector('[data-cw-deck] ul')!.getBoundingClientRect()
      if (table.width === 0) out.push('mesa oculta')
      for (const node of document.querySelectorAll('[data-cw-deck-card]')) {
        const rect = node.getBoundingClientRect()
        if (rect.left < 0 || rect.right > window.innerWidth) out.push(`${(node as HTMLElement).dataset.cwDeckCard} ${Math.round(rect.left)}-${Math.round(rect.right)}`)
        if (rect.top < table.top - 20 || rect.bottom > table.bottom + 20) out.push(`${(node as HTMLElement).dataset.cwDeckCard} fuera de la mesa`)
      }
      return out
    })
    findings.push(...issues.map((issue) => `${width}px ${issue}`))
  }
  expect(findings).toEqual([])
})

for (const scheme of ['dark', 'light'] as const) {
  test(`contraste AA del texto de la tarjeta abierta en tema ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await openAbout(page)
    await card(page, career[0]!.id).click()
    const modal = dialog(page)
    await expect(modal).toBeVisible()
    await settled(page)
    const samples = await modal.evaluate((node) => {
      const found: Array<{ color: string; size: number; weight: number; rects: Array<{ x: number; y: number; w: number; h: number }> }> = []
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
      for (let text = walker.nextNode(); text; text = walker.nextNode()) {
        const element = text.parentElement
        if (!element || !text.textContent?.trim() || element.closest('.cw-visually-hidden')) continue
        const range = document.createRange()
        range.selectNodeContents(text)
        const style = getComputedStyle(element)
        found.push({
          color: style.color,
          size: Number.parseFloat(style.fontSize),
          weight: Number.parseInt(style.fontWeight, 10),
          rects: [...range.getClientRects()].map((rect) => ({ x: Math.ceil(rect.left), y: Math.ceil(rect.top), w: Math.floor(rect.width), h: Math.floor(rect.height) })),
        })
      }
      return found
    })
    expect(samples.length).toBeGreaterThan(3)
    await page.addStyleTag({ content: 'dialog *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}' })
    await page.waitForTimeout(150)
    const pixels = decodePng(await page.screenshot({ scale: 'css' }))
    const failures: string[] = []
    for (const sample of samples) {
      const text = withAlpha(parseColor(sample.color)!, 1)
      let worst = Number.POSITIVE_INFINITY
      for (const rect of sample.rects) {
        for (let y = rect.y + 1; y < rect.y + rect.h - 1; y++) {
          for (let x = rect.x + 1; x < rect.x + rect.w - 1; x++) {
            const i = (y * pixels.width + x) * 4
            const background = { r: pixels.data[i]!, g: pixels.data[i + 1]!, b: pixels.data[i + 2]!, a: 1 }
            worst = Math.min(worst, contrastRatio(over(text, background), background))
          }
        }
      }
      if (worst < requiredRatio(sample.size, sample.weight)) failures.push(`${sample.color} ${worst.toFixed(2)}`)
    }
    expect(failures).toEqual([])
  })
}
