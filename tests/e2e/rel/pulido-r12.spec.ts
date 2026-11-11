import { expect, test, type Page } from '@playwright/test'

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

async function open(page: Page, path: string) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path)
}

test.describe('R1.2: pulido de la auditoría de las páginas nuevas (012)', () => {
  test('U1: el trazo de la línea de ensamblaje avanza con el scroll', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/synergos')
    const svg = page.locator('[data-cw-line-svg]:visible').first()
    const trace = svg.locator('[data-cw-lane] path[pathLength="1"]').first()
    const at = async (ratio: number) => {
      await svg.evaluate((node, value) => {
        const box = node.getBoundingClientRect()
        window.scrollTo({ top: box.top + window.scrollY - window.innerHeight * value, behavior: 'instant' })
      }, ratio)
      await page.waitForTimeout(150)
      return trace.evaluate((node) => Number.parseFloat(getComputedStyle(node).strokeDashoffset))
    }
    const early = await at(0.95)
    const late = await at(0.2)
    test.info().annotations.push({ type: 'stroke-dashoffset', description: `${early} → ${late}` })
    expect(late).toBeLessThan(early - 0.2)
  })

  test('U3: en celular, "Para reclutadores" abre con el CV a la vista', async ({ page }) => {
    onlyIn('mobile-chromium')
    await open(page, '/es')
    await page.locator('[data-cw-recruiters-open]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const actions = dialog.locator('[data-cw-recruiters-actions]')
    await expect(actions).toBeInViewport({ ratio: 0.5 })
    await expect(actions.getByRole('link').first()).toBeInViewport()
    const order = await dialog.evaluate((node) => {
      const intro = node.querySelector('[data-cw-recruiters-roles]')!
      const block = node.querySelector('[data-cw-recruiters-actions]')!
      return Boolean(block.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(order, 'las acciones van antes de los roles').toBe(true)
  })

  test('U4: en escritorio, el cargo actual avisa que hay más texto y deja de avisar al final', async ({ page }) => {
    onlyIn('desktop-chromium')
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/aboutMe')
    await page.locator('[data-cw-deck-card]').first().scrollIntoViewIfNeeded()
    await page.locator('[data-cw-deck-card]').first().click()
    const body = page.locator('[data-cw-deck-open] > div').first()
    await expect(body).toBeVisible()
    const overflows = await body.evaluate((node) => node.scrollHeight > node.clientHeight + 4)
    if (overflows) {
      await expect(body).toHaveAttribute('data-cw-more', '')
      await body.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: 'instant' }))
      await expect(body).not.toHaveAttribute('data-cw-more', /.*/)
    } else {
      await expect(body).not.toHaveAttribute('data-cw-more', /.*/)
    }
  })

  test('U5: en celular, la mesa de peloteo queda entera a la vista al abrir y al jugar', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/ai-lab')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    const card = page.locator('[data-cw-lab-card="J1"]')
    await card.locator('[data-cw-lab-open]').click()
    await expect(card.locator('[data-cw-rally][data-ready]')).toBeVisible({ timeout: 30_000 })
    const court = card.locator('[data-cw-rally-court]')
    const inside = () =>
      court.evaluate((node) => {
        const box = node.getBoundingClientRect()
        return box.top >= -1 && box.bottom <= window.innerHeight + 1
      })
    await expect.poll(inside, { message: 'al abrir' }).toBe(true)
    await card.locator('[data-cw-rally-toggle]').click()
    await expect.poll(inside, { message: 'al jugar' }).toBe(true)
  })

  test('U6: en celular, los textos de los demos del AI Lab miden 12 px o más, también los del SVG', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/ai-lab')
    await expect(page.locator('[data-cw-assistant-button]')).toHaveAttribute('data-cw-ready', '', { timeout: 30_000 })
    for (const [id, ready] of [
      ['J1', '[data-cw-rally][data-ready]'],
      ['V3', '[data-cw-v3-figure]'],
    ] as const) {
      const card = page.locator(`[data-cw-lab-card="${id}"]`)
      await card.locator('[data-cw-lab-open]').click()
      await expect(card.locator(ready)).toBeVisible({ timeout: 30_000 })
      const tiny = await card.evaluate((root) => {
        const found: string[] = []
        for (const element of root.querySelectorAll('*')) {
          if (![...element.childNodes].some((child) => child.nodeType === 3 && child.textContent!.trim())) continue
          const box = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          if (box.width < 1 || box.height < 1 || style.visibility === 'hidden') continue
          let size = Number.parseFloat(style.fontSize)
          if (element instanceof SVGTextElement && element.ownerSVGElement) {
            const view = element.ownerSVGElement.viewBox.baseVal
            if (view && view.width) size = (size * element.ownerSVGElement.getBoundingClientRect().width) / view.width
          }
          if (size < 11.9) found.push(`${element.textContent!.trim().slice(0, 24)} ${size.toFixed(1)}px`)
        }
        return found
      })
      expect(tiny, id).toEqual([])
    }
    await expect(page.locator('[data-cw-rally-legend]')).toBeVisible()
  })

  test('U8: la capa 01 llega elegida y la ayuda habla también del toque', async ({ page }) => {
    onlyIn('mobile-chromium')
    await open(page, '/es/synergos')
    const first = page.locator('[data-cw-diagram-layer]').first()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cw-diagram-hint]').first()).toHaveText(/^Toca/)
  })
})
