import { expect, test, type Page } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

const POSTS = ['post1', 'post2', 'post3', 'post4', 'post5'] as const
const WIDE = new Set(['post4', 'post5'])

async function skipIntro(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
}

async function charactersPerLine(page: Page): Promise<number> {
  return page.evaluate(() => {
    const lines: number[] = []
    for (const paragraph of document.querySelectorAll('[data-cw-post-body] > p')) {
      const rows = new Map<number, number>()
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? ''
        for (let index = 0; index < text.length; index++) {
          const range = document.createRange()
          range.setStart(node, index)
          range.setEnd(node, index + 1)
          const rect = range.getClientRects()[0]
          if (!rect) continue
          const row = Math.round(rect.top / 4)
          rows.set(row, (rows.get(row) ?? 0) + 1)
        }
      }
      const counts = [...rows.values()]
      counts.pop()
      lines.push(...counts)
    }
    lines.sort((a, b) => a - b)
    return lines[Math.floor(lines.length / 2)] ?? 0
  })
}

test.describe('portada y tipografía', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`los 5 posts en ${lang} tienen portada con su imagen, sin desbordes`, async ({ page }) => {
      test.setTimeout(90_000)
      for (const id of POSTS) {
        await page.goto(`/${lang}/blog/${id}`)
        const cover = page.locator('[data-cw-post-cover]')
        const image = cover.getByRole('img')
        await expect(image, id).toBeVisible()
        await expect(image).toHaveAttribute('alt', /.+/)
        await expect(cover.locator('[data-cw-post-media]')).toHaveAttribute('data-cw-post-media', WIDE.has(id) ? 'wide' : 'compact')
        const [natural, rendered] = await image.evaluate((img: HTMLImageElement) => {
          const box = img.getBoundingClientRect()
          return [Number(img.getAttribute('width')) / Number(img.getAttribute('height')), box.width / box.height]
        })
        expect(Math.abs(natural - rendered), `${id}: la portada no se recorta ni se deforma`).toBeLessThan(0.02)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, id).toBeLessThanOrEqual(1)
      }
    })
  }
})

test.describe('medida de línea', () => {
  onlyIn('desktop-chromium')

  test('el cuerpo se lee en unos 68 caracteres por línea en escritorio', async ({ page }) => {
    test.setTimeout(90_000)
    await skipIntro(page)
    for (const path of ['/es/blog/post5', '/en/blog/post4', '/es/blog/post1']) {
      await page.goto(path)
      const median = await charactersPerLine(page)
      expect(median, path).toBeGreaterThanOrEqual(60)
      expect(median, path).toBeLessThanOrEqual(75)
    }
  })
})

test.describe('índice flotante', () => {
  onlyIn('desktop-chromium')

  test('en escritorio queda al lado del cuerpo, sigue a la vista y marca la sección actual', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog/post5')
    const toc = page.locator('[data-cw-toc]')
    const body = page.locator('[data-cw-post-body]')
    const [tocBox, bodyBox] = await Promise.all([toc.boundingBox(), body.boundingBox()])
    expect(tocBox && bodyBox && tocBox.x >= bodyBox.x + bodyBox.width, 'el índice va a la derecha del cuerpo').toBe(true)
    await expect(toc).toHaveCSS('position', 'sticky')

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }))
    await expect(toc).toBeInViewport()
    await expect(toc.locator('[aria-current="location"]')).toHaveCount(1)

    const link = toc.getByRole('link', { name: 'Síntoma 4: los "sockets" que eran polling' })
    await link.click()
    await expect(page).toHaveURL(/#sintoma-4-los-sockets-que-eran-polling$/)
    await expect(page.locator('h2#sintoma-4-los-sockets-que-eran-polling')).toBeInViewport()
    await expect(link).toHaveAttribute('aria-current', 'location')
  })

  test('los posts cortos no tienen índice', async ({ page }) => {
    await page.goto('/es/blog/post1')
    await expect(page.locator('[data-cw-toc]')).toHaveCount(0)
    await expect(page.locator('[data-cw-post-layout]')).toHaveAttribute('data-cw-post-layout', 'single')
  })
})

test.describe('índice en móvil', () => {
  onlyIn('mobile-chromium')

  test('va antes del cuerpo y no flota', async ({ page }) => {
    await page.goto('/en/blog/post4')
    const toc = page.locator('[data-cw-toc]')
    const [tocBox, bodyBox] = await Promise.all([toc.boundingBox(), page.locator('[data-cw-post-body]').boundingBox()])
    expect(tocBox && bodyBox && tocBox.y + tocBox.height <= bodyBox.y).toBe(true)
    await expect(toc).not.toHaveCSS('position', 'sticky')
  })
})

test.describe('barra de progreso de lectura', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('avanza con el cuerpo del post y llega al 100 % al terminarlo', async ({ page }, testInfo) => {
    await skipIntro(page)
    await page.goto('/es/blog/post5')
    const bar = page.locator('[data-cw-reading-progress]')
    await expect(bar).toHaveAttribute('aria-hidden', 'true')
    await expect(bar).toHaveAttribute('data-cw-reading-progress', '0.00')
    if (testInfo.project.name === 'mobile-chromium') {
      const [barBox, headerBottom] = await Promise.all([
        bar.evaluate((element) => element.getBoundingClientRect().toJSON() as DOMRect),
        page.locator('#header').evaluate((element) => element.getBoundingClientRect().bottom),
      ])
      expect(Math.abs(barBox.bottom - headerBottom), 'en móvil va en el borde inferior del header (T857), no sobre el texto').toBeLessThanOrEqual(1)
    } else {
      expect(await bar.evaluate((element) => element.getBoundingClientRect().top), 'va en el borde superior, no sobre el texto').toBe(0)
    }

    const scrollToBody = (fraction: number) =>
      page.evaluate((value) => {
        const body = document.querySelector('[data-cw-post-body]')
        if (!body) return
        const box = body.getBoundingClientRect()
        const top = window.scrollY + box.top + (box.height - window.innerHeight) * value
        window.scrollTo({ top, behavior: 'instant' })
      }, fraction)

    await scrollToBody(0.5)
    await expect.poll(async () => Number(await bar.getAttribute('data-cw-reading-progress'))).toBeGreaterThan(0.3)
    expect(Number(await bar.getAttribute('data-cw-reading-progress'))).toBeLessThan(0.7)

    await scrollToBody(1.05)
    await expect(bar).toHaveAttribute('data-cw-reading-progress', '1.00')
    const scale = await bar.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a)
    expect(scale).toBeCloseTo(1, 2)
  })
})

test.describe('al navegar entre posts', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('la barra y el índice se reinician y siguen al post nuevo', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog/post4')
    const bar = page.locator('[data-cw-reading-progress]')
    await page.evaluate(() => {
      const body = document.querySelector('[data-cw-post-body]')
      if (body) window.scrollTo({ top: window.scrollY + body.getBoundingClientRect().bottom, behavior: 'instant' })
    })
    await expect(bar).toHaveAttribute('data-cw-reading-progress', '1.00')

    const next = page.locator('[data-cw-post-nav-link="next"]')
    await next.scrollIntoViewIfNeeded()
    await next.click()
    await expect(page).toHaveURL(/\/es\/blog\/post5$/)
    await expect(page.locator('[data-cw-post="post5"]')).toBeVisible()
    await expect(page.locator('[data-cw-post]')).toHaveCount(1)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(page.locator('[data-cw-reading-progress]')).toHaveCount(1)
    await expect(page.locator('[data-cw-reading-progress]')).toHaveAttribute('data-cw-reading-progress', '0.00')
    await expect(page.locator('[data-cw-toc] [aria-current]')).toHaveCount(0)

    await page.evaluate(() => {
      const heading = document.getElementById('sintoma-3-seguridad-de-utileria')
      if (heading) window.scrollTo({ top: window.scrollY + heading.getBoundingClientRect().top - 120, behavior: 'instant' })
    })
    await expect.poll(async () => Number(await page.locator('[data-cw-reading-progress]').getAttribute('data-cw-reading-progress'))).toBeGreaterThan(0)
    if (await page.locator('[data-cw-toc]').isVisible()) {
      await expect(page.locator('[data-cw-toc-link="sintoma-3-seguridad-de-utileria"]')).toHaveAttribute('aria-current', 'location')
    }
  })
})

test.describe('anterior y siguiente', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  test('el post 4 lleva al 3 (anterior) y al 5 (siguiente)', async ({ page }) => {
    await page.goto('/es/blog/post4')
    const nav = page.locator('[data-cw-post-nav]')
    await expect(nav.getByRole('heading', { name: 'Sigue leyendo' })).toBeVisible()
    const previous = nav.locator('[data-cw-post-nav-link="previous"]')
    const next = nav.locator('[data-cw-post-nav-link="next"]')
    await expect(previous).toHaveAttribute('href', '/es/blog/post3')
    await expect(previous).toHaveAttribute('rel', 'prev')
    await expect(previous).toHaveAccessibleName(/^Post anterior\s+Cuando una plataforma de pagos falla/)
    await expect(next).toHaveAttribute('href', '/es/blog/post5')
    await expect(next).toHaveAccessibleName(/^Post siguiente\s+Querido Camilo de 2023/)
    await next.click()
    await expect(page).toHaveURL(/\/es\/blog\/post5$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Querido Camilo de 2023')
  })

  test('en los extremos solo aparece el lado que existe y siempre hay vuelta al índice', async ({ page }) => {
    await page.goto('/en/blog/post5')
    await expect(page.locator('[data-cw-post-nav-link="next"]')).toHaveCount(0)
    await expect(page.locator('[data-cw-post-nav-link="previous"]')).toHaveAttribute('href', '/en/blog/post4')
    await page.goto('/en/blog/post1')
    await expect(page.locator('[data-cw-post-nav-link="previous"]')).toHaveCount(0)
    await expect(page.locator('[data-cw-post-nav-link="next"]')).toHaveAttribute('href', '/en/blog/post2')
    const index = page.locator('[data-cw-post-nav-link="index"]')
    await expect(index).toHaveText('See all posts')
    await index.click()
    await expect(page).toHaveURL(/\/en\/blog$/)
  })

  test('el catálogo no tiene navegación entre posts', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    await expect(page.locator('[data-cw-post-nav]')).toHaveCount(0)
  })
})

test.describe('post 5: cita y código', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const lang of ['es', 'en'] as const) {
    test(`en ${lang} la cita inicial va en cristal y cada bloque de código se copia exacto`, async ({ page, context, baseURL }, testInfo) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL })
      await page.goto(`/${lang}/blog/post5`)
      const body = page.locator('[data-cw-post-body]')
      const quote = body.locator('> blockquote').first()
      await expect(quote).toBeVisible()
      expect(await body.evaluate((element) => element.firstElementChild?.tagName)).toBe('BLOCKQUOTE')
      const mobile = testInfo.project.name === 'mobile-chromium'
      const expectGlass = async (element: typeof quote) => {
        const style = await element.evaluate((node) => {
          const computed = getComputedStyle(node)
          return { blur: computed.backdropFilter, background: computed.backgroundColor }
        })
        if (mobile) {
          expect(style.blur, 'presupuesto de blur móvil (FR-602): cristal sólido').not.toContain('blur')
          expect(style.background, 'el cristal sólido tiene fondo').not.toBe('rgba(0, 0, 0, 0)')
        } else {
          expect(style.blur).toContain('blur')
        }
      }
      await expectGlass(quote)

      const blocks = body.locator('[data-cw-code]')
      await expect(blocks).toHaveCount(2)
      for (const block of await blocks.all()) {
        await expect(block).toHaveAttribute('data-cw-code', 'typescript')
        await expectGlass(block)
        const expected = (await block.locator('pre').innerText()).replace(/\n$/, '')
        const button = block.locator('[data-cw-copy]')
        await button.click()
        await expect(button).toHaveAttribute('data-cw-copy', 'done')
        const copied = await page.evaluate(() => navigator.clipboard.readText())
        expect(copied.replace(/\r\n/g, '\n')).toBe(expected)
        const [scrollable, width] = await block.locator('pre').evaluate((pre) => [pre.scrollWidth > pre.clientWidth, pre.getBoundingClientRect().right])
        expect(width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
        if (scrollable) await expect(block.locator('pre')).toHaveAttribute('tabindex', '0')
      }
    })
  }
})
