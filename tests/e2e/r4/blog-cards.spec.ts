import { expect, test } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

const READ_MORE = { es: 'Leer más', en: 'Read more' } as const

test.describe('tarjetas del índice (D-07)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`en ${lang} cada tarjeta tiene un solo enlace, con el título como nombre, y un "${READ_MORE[lang]}" visible`, async ({ page }) => {
      await page.goto(`/${lang}/blog`)
      const cards = page.locator('[data-cw-post-card]')
      await expect(cards).toHaveCount(5)
      expect(await cards.evaluateAll((all) => all.map((card) => card.getAttribute('data-cw-post-card')))).toEqual([
        'post5',
        'post4',
        'post3',
        'post2',
        'post1',
      ])
      for (const card of await cards.all()) {
        const links = card.getByRole('link')
        await expect(links).toHaveCount(1)
        const title = (await card.getByRole('heading', { level: 2 }).innerText()).trim()
        await expect(links).toHaveAccessibleName(title, { ignoreCase: true })
        await expect(links).toHaveAttribute('href', new RegExp(`^/${lang}/blog/post[0-9]$`))
        const more = card.locator('[data-cw-read-more]')
        await expect(more).toBeVisible()
        await expect(more).toHaveText(READ_MORE[lang], { ignoreCase: true })
        await expect(more).toHaveAttribute('aria-hidden', 'true')
        await expect(card.locator('[data-cw-reading-time]')).toHaveText(lang === 'es' ? /^\d+ min de lectura$/ : /^\d+ min read$/)
      }
    })
  }
})

test.describe('toda la tarjeta abre el post', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const target of ['[data-cw-read-more]', '[data-cw-post-media]', 'p:not([data-cw-lang-notice])'] as const) {
    test(`un clic en ${target} navega al post`, async ({ page }) => {
      await page.goto('/es/blog')
      const card = page.locator('[data-cw-post-card="post4"]')
      const element = card.locator(target).first()
      await element.scrollIntoViewIfNeeded()
      const box = await element.boundingBox()
      if (!box) throw new Error(`${target} no tiene caja`)
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      await expect(page).toHaveURL(/\/es\/blog\/post4$/, { timeout: 15_000 })
      await expect(page.getByRole('heading', { level: 1 })).toContainText('De un portafolio de 2023')
    })
  }

  test('el área clicable cubre la tarjeta completa', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/es/blog')
    for (const card of await page.locator('[data-cw-post-card]').all()) {
      const covered = await card.evaluate((element) => {
        element.scrollIntoView({ block: 'center', behavior: 'instant' })
        const link = element.querySelector('a')
        const box = element.getBoundingClientRect()
        const points = [
          [box.left + 24, box.top + 24],
          [box.left + 24, box.bottom - 24],
          [box.left + box.width / 2, box.top + box.height / 2],
          [box.left + box.width / 2, box.bottom - 24],
        ]
        const hits = points
          .map(([x, y]) => document.elementFromPoint(x ?? 0, y ?? 0))
          .filter((hit): hit is Element => hit !== null && element.contains(hit))
        return hits.length >= 3 && hits.every((hit) => hit === link || link?.contains(hit))
      })
      expect(covered, await card.getAttribute('data-cw-post-card') ?? '').toBe(true)
    }
  })
})

test.describe('foco y hover de la tarjeta', () => {
  onlyIn('desktop-chromium')

  test('con el teclado el foco llega al enlace y la tarjeta entera muestra el anillo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/blog')
    const link = page.locator('[data-cw-post-card="post5"] a')
    await link.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(link).toBeFocused()
    const card = page.locator('[data-cw-post-card="post5"]')
    await expect(card).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/es\/blog\/post5$/)
  })

  test('al pasar el puntero el llamado se ilumina y la flecha avanza', async ({ page }) => {
    await page.goto('/es/blog')
    const card = page.locator('[data-cw-post-card="post3"]')
    const more = card.locator('[data-cw-read-more]')
    const before = await more.evaluate((element) => getComputedStyle(element).borderLeftColor)
    await card.hover()
    await expect.poll(() => more.evaluate((element) => getComputedStyle(element).borderLeftColor)).not.toBe(before)
    await expect
      .poll(() => more.locator('svg').evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41))
      .toBeGreaterThan(0)
  })
})
