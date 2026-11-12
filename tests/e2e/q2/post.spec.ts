import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

function onlyIn(...projects: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!projects.includes(testInfo.project.name), `solo en ${projects.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
}

async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

const POSTS = ['post1', 'post2', 'post3', 'post4', 'post5', 'post6'] as const

test.describe('callouts (T620, FR-510)', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('el catálogo los anuncia por su tipo, antes del texto, en el idioma de la página', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    for (const [type, name] of [
      ['decision', 'Decisión'],
      ['tradeoff', 'Trade-off'],
      ['learned', 'Lo que aprendí'],
    ] as const) {
      const callout = page.getByRole('complementary', { name, exact: true })
      await expect(callout).toBeVisible()
      await expect(callout).toHaveAttribute('data-cw-callout', type)
      const label = await callout.evaluate((element) => element.firstElementChild?.textContent?.trim())
      expect(label, 'la etiqueta va primero').toBe(name)
    }
    await page.goto('/en/blog/catalog')
    await expect(page.getByRole('complementary', { name: 'What I learned', exact: true })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Decision', exact: true })).toHaveAttribute('data-cw-callout', 'decision')
  })
})

test.describe('diagrama SVG (T621, FR-511)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('a 320 px se desplaza en su marco, sin scroll horizontal de la página, y se lee con teclado', async ({ page }) => {
    await skipIntro(page)
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/es/blog/catalog')
    const frame = page.locator('[data-cw-diagram]')
    const image = frame.getByRole('img')
    await image.scrollIntoViewIfNeeded()
    await expect(image).toHaveAttribute('alt', /^Diagrama de cómo llega un post al lector/)
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 15_000 }).toBe(true)
    await expect(image).toHaveAttribute('src', /\.svg$/)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, 'la página no se desplaza a lo ancho').toBeLessThanOrEqual(1)
    const [scrollWidth, clientWidth] = await frame.evaluate((element) => [element.scrollWidth, element.clientWidth])
    expect(scrollWidth, 'el diagrama no se encoge hasta ser ilegible').toBeGreaterThan(clientWidth)
    await frame.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => frame.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  })

  test('en escritorio cabe en la columna', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'solo en escritorio')
    await page.goto('/es/blog/catalog')
    const frame = page.locator('[data-cw-diagram]')
    await frame.scrollIntoViewIfNeeded()
    await expect.poll(() => frame.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  })
})

test.describe('series (T622, FR-512)', () => {
  onlyIn('no-js')

  test('ninguna serie está publicada todavía, así que ningún post muestra su navegación', async ({ page }) => {
    for (const lang of ['es', 'en'] as const) {
      for (const id of POSTS) {
        await page.goto(`/${lang}/blog/${id}`)
        await expect(page.locator('[data-cw-series]'), `${lang}/${id}`).toHaveCount(0)
      }
    }
  })
})

test.describe('posts relacionados (T623, FR-513)', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('el post 5 sugiere el 3 por "humor" y no repite el anterior; el post 4 sugiere el 6, que no es su vecino', async ({ page }) => {
    await page.goto('/es/blog/post5')
    const related = page.locator('[data-cw-related]')
    await expect(related.getByRole('heading', { name: 'Posts relacionados' })).toBeVisible()
    const links = related.locator('[data-cw-related-link]')
    await expect(links).toHaveCount(1)
    await expect(links.first()).toHaveAttribute('href', '/es/blog/post3')
    await expect(links.first()).toContainText('Cuando una plataforma de pagos falla')
    await expect(links.first().locator('time')).toHaveAttribute('datetime', '2023-04-06')
    await expect(page.locator('[data-cw-post-nav-link="previous"]')).toHaveAttribute('href', '/es/blog/post4')
    await expect(related.locator('a[href="/es/blog/post4"]')).toHaveCount(0)

    await page.goto('/en/blog/post4')
    await expect(page.locator('[data-cw-related-link]')).toHaveCount(1)
    await expect(page.locator('[data-cw-related-link]').first()).toHaveAttribute('href', '/en/blog/post6')
    await expect(page.locator('[data-cw-related] [data-cw-related-case="2"]')).toHaveAttribute('href', '/en/portfolio/2')
  })
})

test.describe('caja de autor (T624, FR-514)', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('cierra cada post con el nombre, la línea y el botón a Contacto', async ({ page }) => {
    for (const [lang, cta] of [
      ['es', 'Escríbeme'],
      ['en', 'Write to me'],
    ] as const) {
      await page.goto(`/${lang}/blog/post4`)
      const box = page.locator('[data-cw-author-box]')
      await expect(box.getByRole('heading', { name: 'Camilo Hernández' })).toBeVisible()
      await expect(box).toContainText('Software Solutions Engineer · AI-First')
      await expect(box.getByRole('link', { name: cta })).toHaveAttribute('href', `/${lang}/contactMe`)
    }
  })

  test('el retrato sigue al tema elegido', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'el cambio de tema necesita JS')
    await skipIntro(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/es/blog/post4')
    const box = page.locator('[data-cw-author-box]')
    await box.scrollIntoViewIfNeeded()
    await expect(box.locator('[data-cw-portrait-theme="dark"]')).toBeVisible()
    await expect(box.locator('[data-cw-portrait-theme="light"]')).toBeHidden()
    await page.locator('[data-cw-theme-toggle]').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(box.locator('[data-cw-portrait-theme="light"]')).toBeVisible()
    await expect(box.locator('[data-cw-portrait-theme="dark"]')).toBeHidden()
    await expect.poll(() => box.locator('[data-cw-portrait-theme="light"]').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true)
  })
})

test.describe('nota de traducción (T625, FR-515)', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('dice el idioma original en las traducciones, y no en el original ni en el fallback', async ({ page }) => {
    await page.goto('/es/blog/post1')
    await expect(page.locator('[data-cw-translated-from="en"]')).toHaveText('Escrito originalmente en inglés.')
    await page.goto('/en/blog/post4')
    await expect(page.locator('[data-cw-translated-from="es"]')).toHaveText('Originally written in Spanish.')
    await page.goto('/en/blog/post1')
    await expect(page.locator('[data-cw-translated-from]')).toHaveCount(0)
    await page.goto('/en/blog/catalog')
    await expect(page.locator('[data-cw-translated-from]')).toHaveCount(0)
    await expect(page.locator('[data-cw-lang-notice]')).toBeVisible()
  })
})

test.describe('fecha de actualización (T626, FR-516)', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('va junto a la de publicación, con <time>, solo donde la meta la trae', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    const updated = page.locator('[data-cw-updated]')
    await expect(updated).toHaveText('Actualizado el 5 de noviembre de 2026')
    await expect(updated.locator('time')).toHaveAttribute('datetime', '2026-11-05')
    const times = await page.locator('[data-cw-post] header time').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime')))
    expect(times).toEqual(['2026-11-01', '2026-11-05'])
    await page.goto('/en/blog/catalog')
    await expect(page.locator('[data-cw-updated]')).toHaveText('Updated November 5, 2026')
    await page.goto('/es/blog/post4')
    await expect(page.locator('[data-cw-updated]')).toHaveCount(0)
  })
})

test.describe('JSON-LD BlogPosting y feed (T627, FR-521, FR-523)', () => {
  onlyIn('no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`cada post en ${lang} publica un BlogPosting válido cuyo autor es el Person del sitio`, async ({ page }) => {
      for (const id of POSTS) {
        await page.goto(`/${lang}/blog/${id}`)
        const scripts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''))
        const data = scripts.map((text) => JSON.parse(text) as Record<string, unknown>)
        const person = data.find((item) => item['@type'] === 'Person')
        const posting = data.find((item) => item['@type'] === 'BlogPosting')
        expect(posting, `${lang}/${id}`).toBeTruthy()
        expect(await page.locator('script[data-cw-blog-posting]').count()).toBe(1)
        if (!posting || !person) throw new Error(`${lang}/${id} sin JSON-LD`)
        expect(posting['@context']).toBe('https://schema.org')
        expect(posting.headline).toBe((await page.getByRole('heading', { level: 1 }).textContent())?.trim())
        expect(posting.datePublished).toBe(await page.locator('[data-cw-post] header time').first().getAttribute('datetime'))
        expect(posting.dateModified).toBeUndefined()
        expect(posting.inLanguage).toBe(lang)
        expect(posting.author).toEqual({ '@id': person['@id'] })
        expect(String(posting.url)).toMatch(new RegExp(`^https?://[^/]+/${lang}/blog/${id}$`))
        expect(String(posting.image)).toMatch(new RegExp(`/${lang}/blog/${id}/opengraph-image/og$`))
        expect(Array.isArray(posting.keywords) && posting.keywords.length).toBeGreaterThan(0)
        expect(posting.isPartOf).toMatchObject({ '@type': 'Blog' })
        await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', new RegExp(`/${lang}/feed\\.xml$`))
      }
    })
  }

  test('el catálogo no es un post y no publica BlogPosting', async ({ page }) => {
    await page.goto('/es/blog/catalog')
    await expect(page.locator('script[data-cw-blog-posting]')).toHaveCount(0)
  })
})

test.describe('etiquetas del post (contrato de URL de etiqueta)', () => {
  onlyIn('no-js')

  test('cada etiqueta enlaza a su página con un slug estable', async ({ page }) => {
    await page.goto('/es/blog/post2')
    await expect(page.locator('[data-cw-post-tag="inteligencia artificial"]')).toHaveAttribute('href', '/es/blog/tag/inteligencia-artificial')
    await page.goto('/en/blog/post5')
    await expect(page.locator('[data-cw-post-tag="architecture"]')).toHaveAttribute('href', '/en/blog/tag/architecture')
  })
})

test.describe('índice en una hoja en móvil (T857)', () => {
  onlyIn('mobile-chromium')

  test('la pestaña aparece al pasar el índice con el título en curso, abre la hoja y lleva a la sección', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog/post5')
    const button = page.locator('[data-cw-toc-button]')
    await expect(button).toBeHidden()
    await page.evaluate(() => {
      const body = document.querySelector('[data-cw-post-body]')
      if (body) window.scrollTo({ top: window.scrollY + body.getBoundingClientRect().top + 600, behavior: 'instant' })
    })
    await expect(button).toBeVisible()
    await expect(button).toHaveAccessibleName(/^En este post: \d{2} \S/)
    await expect(button.locator('[data-cw-toc-chapter-number]')).toHaveText(/^\d{2}$/)
    const box = (await button.boundingBox())!
    expect(box.width >= 44 && box.height >= 44, 'objetivo táctil de 44 px').toBe(true)
    const headerBottom = await page.locator('#header').evaluate((element) => element.getBoundingClientRect().bottom)
    await expect.poll(async () => Math.round((await button.boundingBox())!.x), 'pegada al borde izquierdo').toBe(0)
    expect(box.y - headerBottom, 'justo bajo el header').toBeGreaterThanOrEqual(6)
    expect(box.y - headerBottom, 'justo bajo el header').toBeLessThanOrEqual(9)
    expect(await button.evaluate((element) => getComputedStyle(element).borderTopLeftRadius)).toBe('0px')

    await button.click()
    const sheet = page.getByRole('dialog', { name: 'En este post' })
    await expect(sheet).toBeVisible()
    await expect(sheet.locator('[data-cw-toc-sheet-link]')).toHaveCount(await page.locator('[data-cw-toc] [data-cw-toc-link]').count())
    await sheet.getByRole('link', { name: 'Síntoma 4: los "sockets" que eran polling' }).click()
    await expect(sheet).toBeHidden()
    await expect(page).toHaveURL(/#sintoma-4-los-sockets-que-eran-polling$/)
    const heading = page.locator('h2#sintoma-4-los-sockets-que-eran-polling')
    await expect(heading).toBeInViewport()
    await expect(heading).toBeFocused()
    await expect(button.locator('[data-cw-toc-chapter]')).toHaveText('Síntoma 4: los "sockets" que eran polling')
    const [top, tab] = await Promise.all([
      heading.evaluate((element) => element.getBoundingClientRect().top),
      button.evaluate((element) => element.getBoundingClientRect().bottom),
    ])
    expect(top, 'el encabezado no queda tapado por el header ni por la pestaña').toBeGreaterThanOrEqual(tab - 1)
  })

  test('Esc cierra la hoja y el foco vuelve al botón', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/en/blog/post4')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }))
    const button = page.locator('[data-cw-toc-button]')
    await expect(button).toBeVisible()
    await button.click()
    const sheet = page.getByRole('dialog', { name: 'In this post' })
    await expect(sheet).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(button).toBeFocused()
  })

  test('la línea de lectura va en la pestaña y reemplaza la barra de arriba', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog/post5')
    await page.evaluate(() => {
      const body = document.querySelector('[data-cw-post-body]')
      if (body) window.scrollTo({ top: window.scrollY + body.getBoundingClientRect().top + 800, behavior: 'instant' })
    })
    await expect(page.locator('[data-cw-reading-progress]')).toBeHidden()
    const line = page.locator('[data-cw-toc-button] [data-cw-reading-line]')
    await expect(line).toBeVisible()
    await expect.poll(async () => Number(await page.locator('[data-cw-reading-progress]').getAttribute('data-cw-reading-progress'))).toBeGreaterThan(0)
    const progress = Number(await page.locator('[data-cw-reading-progress]').getAttribute('data-cw-reading-progress'))
    const scale = await line.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).a)
    expect(Math.abs(scale - progress), 'la línea marca el mismo avance que la barra').toBeLessThanOrEqual(0.02)
  })

  test('un post sin índice conserva la barra de arriba', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog')
    const withoutToc = await page.evaluate(async () => {
      const links = [...document.querySelectorAll<HTMLAnchorElement>('a[href*="/blog/post"]')].map((link) => link.getAttribute('href')!)
      return [...new Set(links)]
    })
    for (const href of withoutToc) {
      await page.goto(href)
      if ((await page.locator('[data-cw-toc-button]').count()) > 0) continue
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 3, behavior: 'instant' }))
      await expect(page.locator('[data-cw-reading-progress]')).toBeVisible()
      return
    }
    test.skip(true, 'todos los posts tienen índice')
  })
})

test.describe('índice en escritorio', () => {
  onlyIn('desktop-chromium')

  test('el botón de la hoja no aparece: el índice ya flota al lado', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/blog/post5')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }))
    await expect(page.locator('[data-cw-toc]')).toBeInViewport()
    await expect(page.locator('[data-cw-toc-button]')).toBeHidden()
  })
})

test.describe('accesibilidad de las piezas nuevas (axe)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const scheme of ['dark', 'light'] as const) {
    for (const path of ['/es/blog/catalog', '/es/blog/post5', '/en/blog/post6']) {
      test(`${path} sin violaciones críticas ni serias en tema ${scheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await skipIntro(page)
        await page.goto(path)
        expect(await blockingViolations(page)).toEqual([])
      })
    }
  }

  test('la hoja abierta sin violaciones', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'la hoja es de móvil')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipIntro(page)
    await page.goto('/es/blog/post5')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }))
    await page.locator('[data-cw-toc-button]').click()
    await expect(page.getByRole('dialog', { name: 'En este post' })).toBeVisible()
    expect(await blockingViolations(page)).toEqual([])
  })
})
