import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

const visibleCards = (page: Page) =>
  page.locator('[data-cw-post-card]').evaluateAll((cards) =>
    cards.filter((card) => card.checkVisibility()).map((card) => card.getAttribute('data-cw-post-card') ?? ''),
  )

function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

async function cardTexts(page: Page): Promise<Record<string, string>> {
  return page.locator('[data-cw-post-card]').evaluateAll((cards) =>
    Object.fromEntries(
      cards.map((card) => [
        card.getAttribute('data-cw-post-card') ?? '',
        [card.querySelector('h2')?.textContent, card.querySelector('p:not([data-cw-featured-badge])')?.textContent, ...[...card.querySelectorAll('ul li')].map((li) => li.textContent)].join(' '),
      ]),
    ),
  )
}

test.describe('destacado y grupos por año (US1, FR-501, FR-502)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`/${lang}/blog: destacado arriba, sin repetirse, y luego "${lang === 'es' ? 'Ahora' : 'Now'}" y "${lang === 'es' ? 'Archivo' : 'Archive'}"`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}/blog`)
      const featured = page.locator('[data-cw-featured] [data-cw-post-card]')
      await expect(featured).toHaveCount(1)
      await expect(featured).toHaveAttribute('data-cw-post-variant', 'featured')
      await expect(featured.locator('[data-cw-featured-badge]')).toHaveText(lang === 'es' ? 'Destacado' : 'Featured')
      const featuredId = await featured.getAttribute('data-cw-post-card')

      const groups = page.locator('[data-cw-year-group]')
      await expect(groups.first().locator(':scope > h2')).toHaveText(new RegExp(`^${lang === 'es' ? 'Ahora' : 'Now'}\\s*\\d{4}$`))
      await expect(groups.first()).toHaveAttribute('data-cw-year-group', 'now')
      for (const group of (await groups.all()).slice(1)) {
        await expect(group).toHaveAttribute('data-cw-year-group', 'archive')
        await expect(group.locator(':scope > h2')).toHaveText(new RegExp(`^${lang === 'es' ? 'Archivo' : 'Archive'}\\s*\\d{4}$`))
      }
      const years = await groups.evaluateAll((all) => all.map((group) => Number(group.querySelector(':scope > h2')?.textContent?.match(/\d{4}/)?.[0])))
      expect(years).toEqual([...years].sort((a, b) => b - a))
      expect(years).toContain(2023)

      const grouped = await groups.locator('[data-cw-post-card]').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-cw-post-card')))
      expect(grouped).not.toContain(featuredId)
      expect(grouped.length + 1).toBe(await page.locator('[data-cw-post-card]').count())
    })
  }
})

test.describe('portada generada (FR-504, R-502)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test("cada tarjeta tiene portada; la generada es HTML sin imagen ni descarga", async ({ page }) => {
    await skipIntro(page)
    const images: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'image') images.push(request.url())
    })
    await page.goto('/es/blog', { waitUntil: 'networkidle' })
    for (const card of await page.locator('[data-cw-post-card]').all()) {
      await expect(card.locator('[data-cw-post-media]')).toHaveCount(1)
    }
    const generated = page.locator('[data-cw-post-media="generated"]')
    const count = await generated.count()
    test.info().annotations.push({ type: 'portadas generadas', description: String(count) })
    test.skip(count === 0, "ningún post trae cover: 'generated' todavía (lo decide el autor con el post 3); la cubren tests/unit/q1/cards.test.ts y las capturas de la lane")
    for (const media of await generated.all()) {
      await media.scrollIntoViewIfNeeded()
      await expect(media.locator('img')).toHaveCount(0)
      await expect(media.locator('[data-cw-generated-cover]')).toHaveAttribute('aria-hidden', 'true')
      const box = await media.boundingBox()
      expect(box && box.width / box.height).toBeCloseTo(16 / 9, 1)
    }
    await page.waitForLoadState('networkidle')
    expect(images.filter((url) => /opengraph-image/.test(url))).toEqual([])
  })
})

test.describe('etiquetas con JavaScript (US2, FR-505)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('una etiqueta filtra con URL propia, anuncia la cantidad, deja el foco en ella y "Limpiar" vuelve', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog')
    const nav = page.getByRole('navigation', { name: 'Filtrar por etiqueta' })
    await expect(nav.getByRole('link', { name: 'Todas' })).toHaveAttribute('aria-current', 'page')
    const humor = nav.getByRole('link', { name: 'humor', exact: true })
    await humor.scrollIntoViewIfNeeded()
    await humor.click()

    await expect(page).toHaveURL(/\/es\/blog\/tag\/humor$/, { timeout: 30_000 })
    await expect(page).toHaveTitle('2 posts con «humor» · Camilo Hernández')
    await expect(page.locator('[data-cw-tag-results]')).toHaveText('2 posts con «humor»')
    await expect(page.locator('[data-cw-tag-results]')).toHaveAttribute('aria-live', 'polite')
    await expect(nav.getByRole('link', { name: 'humor', exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(nav.getByRole('link', { name: 'humor', exact: true })).toBeFocused()
    expect(await visibleCards(page)).toEqual(['post5', 'post3'])
    for (const card of await page.locator('[data-cw-post-card]').all()) await expect(card.getByRole('list', { name: 'Etiquetas' })).toContainText('humor')

    await page.locator('[data-cw-tag-summary]').getByRole('link', { name: 'Limpiar' }).click()
    await expect(page).toHaveURL(/\/es\/blog$/, { timeout: 30_000 })
    expect(await visibleCards(page)).toHaveLength(5)
    await expect(nav.getByRole('link', { name: 'Todas' })).toBeFocused()
  })

  test('cada etiqueta de la fila lleva a su página y lista solo posts con esa etiqueta', async ({ page }) => {
    test.setTimeout(120_000)
    await skipIntro(page)
    await page.goto('/en/blog')
    const hrefs = await page.locator('[data-cw-tag-nav] a').evaluateAll((links) => links.map((link) => [link.textContent?.trim() ?? '', link.getAttribute('href') ?? '']))
    expect(hrefs[0]).toEqual(['All', '/en/blog'])
    for (const [label, href] of hrefs.slice(1)) {
      expect(href).toMatch(/^\/en\/blog\/tag\/[a-z0-9-]+$/)
      const response = await page.request.get(href)
      expect(response.status(), href).toBe(200)
      const html = await response.text()
      expect(html, href).toMatch(/data-cw-tag-results="[1-9]\d*"/)
      expect(html, href).toContain(`“${label}”`)
    }
  })
})

test.describe('etiquetas sin JavaScript (FR-505, SC-502)', () => {
  onlyIn('no-js')

  test('la página de etiqueta llega filtrada del servidor y la búsqueda cede su lugar', async ({ page }) => {
    await page.goto('/es/blog/tag/humor')
    await expect(page.getByRole('heading', { name: '2 posts con «humor»' })).toBeVisible()
    expect(await visibleCards(page)).toEqual(['post5', 'post3'])
    await expect(page.locator('[data-cw-blog-search]')).toBeHidden()
    const nav = page.getByRole('navigation', { name: 'Filtrar por etiqueta' })
    await expect(nav.getByRole('link', { name: 'humor', exact: true })).toHaveAttribute('aria-current', 'page')
    await nav.getByRole('link', { name: 'cuento' }).click()
    await expect(page).toHaveURL(/\/es\/blog\/tag\/cuento$/)
    expect(await visibleCards(page)).toEqual(['post3'])
    await expect(page.getByRole('heading', { name: '1 post con «cuento»' })).toBeVisible()
    await nav.getByRole('link', { name: 'Todas' }).click()
    await expect(page).toHaveURL(/\/es\/blog$/)
    expect(await visibleCards(page)).toHaveLength(5)
    await expect(page.locator('[data-cw-blog-search]')).toBeHidden()
  })

  test('el índice y la etiqueta anuncian el RSS del idioma, con enlace visible', async ({ page }) => {
    for (const [path, feed] of [
      ['/es/blog', '/es/feed.xml'],
      ['/en/blog/tag/humor', '/en/feed.xml'],
    ] as const) {
      await page.goto(path)
      await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', new RegExp(`${feed.replace('.', '\\.')}$`))
      await expect(page.locator('[data-cw-blog-rss]')).toHaveAttribute('href', feed)
      await expect(page.locator('[data-cw-blog-rss]')).toHaveText(path.startsWith('/es') ? 'Suscríbete por RSS' : 'Subscribe via RSS')
    }
  })

  test('una etiqueta del otro idioma lleva a la suya en el idioma de la página, y una que no existe da el 404 con identidad', async ({ page }) => {
    const redirected = await page.goto('/en/blog/tag/carrera')
    expect(redirected?.status()).toBe(200)
    await expect(page).toHaveURL(/\/en\/blog\/tag\/career$/)
    await expect(page.getByRole('heading', { name: '1 post tagged “career”' })).toBeVisible()
    await expect(page.locator('head link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', /\/es\/blog\/tag\/carrera$/)

    await page.goto('/es/blog/tag/carrera')
    await expect(page.locator('head meta[name="robots"]')).toHaveCount(0)
    await expect(page.locator('head link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', /\/es\/blog\/tag\/carrera$/)
    await expect(page.locator('head link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en\/blog\/tag\/career$/)

    const missing = await page.goto('/es/blog/tag/no-existe-esta-etiqueta')
    expect(missing?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página se fue mar adentro')
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('[data-cw-blog-index]')).toHaveCount(0)
  })
})

test.describe('búsqueda del blog (US2, FR-506, SC-501)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const term of ['saga', 'tests']) {
    test(`"${term}" muestra los posts que lo mencionan o, si no hay, ofrece limpiar`, async ({ page }) => {
      await skipIntro(page)
      await page.goto('/es/blog')
      const texts = await cardTexts(page)
      const expected = Object.entries(texts)
        .filter(([, text]) => fold(text).includes(term))
        .map(([id]) => id)
      const input = page.getByRole('searchbox', { name: 'Buscar en el blog' })
      await input.fill(term)
      const status = page.locator('[data-cw-blog-search-status]')
      await expect(status).not.toHaveText('', { timeout: 15_000 })
      const shown = await visibleCards(page)
      for (const id of expected) expect(shown, `${id} menciona "${term}"`).toContain(id)
      if (shown.length > 0) {
        await expect(status).toHaveText(shown.length === 1 ? '1 resultado' : `${shown.length} resultados`)
        return
      }
      await expect(status).toHaveText(`Sin resultados para «${term}».`)
      const empty = page.locator('[data-cw-search-empty]')
      await expect(empty).toContainText(`Sin resultados para «${term}».`)
      await empty.getByRole('button', { name: 'Limpiar' }).click()
      await expect(input).toHaveValue('')
      await expect(input).toBeFocused()
      expect(await visibleCards(page)).toHaveLength(5)
      await expect(page.locator('[data-cw-year-group]').first()).toBeVisible()
    })
  }

  test('un término de un solo post deja solo ese post, sin grupos vacíos, y Esc limpia', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog')
    const input = page.getByRole('searchbox', { name: 'Buscar en el blog' })
    await input.fill('termodinámica')
    await expect(page.locator('[data-cw-blog-search-status]')).toHaveText('1 resultado', { timeout: 15_000 })
    expect(await visibleCards(page)).toEqual(['post1'])
    await expect(page.locator('[data-cw-year-group="now"]')).toBeHidden()
    await expect(page.locator('[data-cw-featured] [data-cw-post-card]')).toBeHidden()
    await input.press('Escape')
    await expect(input).toHaveValue('')
    expect(await visibleCards(page)).toHaveLength(5)
  })
})

test.describe('móvil (006 T857)', () => {
  onlyIn('mobile-chromium')

  test('las tarjetas flotan, no suman desenfoque y la fila de etiquetas se desplaza sin mover la página', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog/tag/desarrollo-guiado-por-especificaciones')
    for (const card of await page.locator('[data-cw-post-card]').all()) {
      await expect(card).toHaveAttribute('data-cw-float', '1')
      await expect(card).not.toHaveAttribute('data-cw-blur')
    }
    const list = page.locator('[data-cw-tag-nav] ul')
    expect(await list.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    const active = list.locator('[aria-current="page"]')
    await expect
      .poll(() =>
        active.evaluate((chip) => {
          const box = chip.getBoundingClientRect()
          const scroller = chip.closest('ul')?.getBoundingClientRect()
          return Boolean(scroller && box.left >= scroller.left - 1 && box.right <= scroller.right + 1)
        }),
      )
      .toBe(true)
    const heights = await list.locator('a').evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height))
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('accesibilidad de la página de etiqueta (axe)', () => {
  onlyIn('desktop-chromium')

  for (const scheme of ['dark', 'light'] as const) {
    test(`/es/blog/tag/humor sin violaciones críticas ni serias en tema ${scheme}`, async ({ page }) => {
      await skipIntro(page)
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      await page.goto('/es/blog/tag/humor')
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      const blocking = results.violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
      expect(blocking).toEqual([])
    })
  }
})
