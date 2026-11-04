import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { caseHighlights } from '@/components/site/portfolio/projects'
import { getAllTechnologies, getProjects } from '@/lib/content'
import { hostOf, onlyIn, skipIntro, stubExternalSites } from './support'

const projects = getProjects()
const withLive = projects.filter((project) => project.links.live)
const withoutLive = projects.filter((project) => !project.links.live)
const first = withLive[0]!

type CardMetrics = {
  id: string
  card: { top: number; bottom: number; left: number; right: number; height: number }
  image: { top: number; bottom: number; left: number; right: number; width: number; height: number }
  stage: { width: number; height: number }
  pad: number
  natural: number
  title: { top: number; bottom: number }
  link: { top: number; bottom: number }
}

async function cardMetrics(page: Page): Promise<CardMetrics[]> {
  return page.locator('[data-cw-slide]').evaluateAll((slides) =>
    slides.map((slide) => {
      const box = (element: Element | null) => {
        const r = element!.getBoundingClientRect()
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
      }
      const image = slide.querySelector('img') as HTMLImageElement
      const stage = image.parentElement!
      return {
        id: (slide as HTMLElement).dataset.cwSlide ?? '',
        card: box(slide.querySelector('article')),
        image: box(image),
        stage: box(stage),
        pad: Number.parseFloat(getComputedStyle(stage).paddingTop),
        natural: Number(image.getAttribute('width')) / Number(image.getAttribute('height')),
        title: box(slide.querySelector('h3')),
        link: box(slide.querySelector('a')),
      }
    }),
  )
}

async function waitForImages(page: Page) {
  await expect
    .poll(() => page.locator('[data-cw-slide] img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete)))
    .toBe(true)
}

test.describe('carrusel sin tarjetas vacías (D-02, FR-207)', () => {
  onlyIn('desktop-chromium')

  const WIDTHS = Array.from({ length: (2560 - 320) / 40 + 1 }, (_, i) => 320 + i * 40)

  test('cada tarjeta muestra su captura completa, en proporción y sin hueco, de 320 a 2560 px', async ({ page }) => {
    test.setTimeout(240_000)
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const problems: string[] = []
    for (const width of WIDTHS) {
      const height = width < 768 ? 844 : width >= 1920 ? 1200 : 900
      await page.setViewportSize({ width, height })
      await page.waitForTimeout(60)
      const header = await page.locator('#header').evaluate((element) => element.getBoundingClientRect().height)
      for (const m of await cardMetrics(page)) {
        const tag = `${width}px #${m.id}`
        const ratio = m.image.width / m.image.height
        if (Math.abs(ratio - m.natural) > 0.02) problems.push(`${tag}: proporción ${ratio.toFixed(3)} ≠ ${m.natural.toFixed(3)}`)
        if (Math.abs(m.stage.width - m.image.width - 2 * m.pad) > 1.5 || Math.abs(m.stage.height - m.image.height - 2 * m.pad) > 1.5) {
          problems.push(`${tag}: el escenario deja hueco (${Math.round(m.stage.width)}x${Math.round(m.stage.height)} para ${Math.round(m.image.width)}x${Math.round(m.image.height)})`)
        }
        if (m.image.left < m.card.left - 0.5 || m.image.right > m.card.right + 0.5 || m.image.top < m.card.top - 0.5 || m.image.bottom > m.card.bottom + 0.5) {
          problems.push(`${tag}: la captura se sale de la tarjeta`)
        }
        if (m.card.height > height - header) problems.push(`${tag}: la tarjeta mide ${Math.round(m.card.height)} px y no cabe en ${height - header} px`)
        if (m.image.height < 120) problems.push(`${tag}: captura de ${Math.round(m.image.height)} px de alto, demasiado chica`)
      }
    }
    expect(problems, problems.slice(0, 20).join('\n')).toEqual([])
  })

  test('en escritorio, la captura y el texto ocupan la tarjeta sin bandas vacías', async ({ page }) => {
    await skipIntro(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/es/portfolio')
    await waitForImages(page)
    for (const m of await cardMetrics(page)) {
      const media = m.stage.height
      const text = m.link.bottom - m.title.top
      const content = Math.max(media, text)
      expect(m.card.height - content, `#${m.id}: relleno vertical`).toBeLessThan(140)
    }
  })
})

test.describe('filtro por tecnología en riel', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('ordena por uso, muestra conteos reales y deja "Todos" fijo', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const chips = page.locator('[data-cw-filter]:not([data-cw-filter=""])')
    await expect(chips).toHaveCount(getAllTechnologies().length)
    const counts = await chips.evaluateAll((buttons) =>
      buttons.map((button) => [button.getAttribute('data-cw-filter') ?? '', Number(button.querySelector('span')?.textContent ?? 0)] as const),
    )
    for (const [tech, count] of counts) {
      expect(count, tech).toBe(projects.filter((project) => project.technologies.includes(tech)).length)
    }
    for (let i = 1; i < counts.length; i++) expect(counts[i - 1]![1]).toBeGreaterThanOrEqual(counts[i]![1])
    const all = page.locator('[data-cw-filter=""]')
    await expect(all).toHaveAccessibleName('Todos')
    await expect(all).toHaveAttribute('aria-pressed', 'true')
  })

  test('las flechas del riel lo desplazan y aparecen solo cuando hay hacia dónde', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'las flechas son para puntero fino')
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const rail = page.locator('[data-cw-filter-scroll="next"]').locator('xpath=..').locator('ul')
    const prev = page.locator('[data-cw-filter-scroll="prev"]')
    const next = page.locator('[data-cw-filter-scroll="next"]')
    await expect(prev).toBeHidden()
    await expect(next).toBeVisible()
    await next.click()
    await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(100)
    await expect(prev).toBeVisible()
    await rail.evaluate((element) => element.scrollTo({ left: element.scrollWidth }))
    await expect(next).toBeHidden()
    await prev.click()
    await expect
      .poll(() => rail.evaluate((element) => element.scrollWidth - element.clientWidth - element.scrollLeft))
      .toBeGreaterThan(100)
  })

  test('al filtrar, la tecnología elegida va primero y resaltada en cada tarjeta', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const tech = 'NEXT AUTH'
    await page.locator(`[data-cw-filter="${tech}"]`).click()
    const slides = page.locator('[data-cw-slide]')
    await expect(slides).toHaveCount(projects.filter((project) => project.technologies.includes(tech)).length)
    for (const slide of await slides.all()) {
      const firstChip = slide.locator('ul li').first()
      await expect(firstChip).toHaveText(tech)
      await expect(firstChip).toHaveAttribute('data-active', '')
    }
  })

  test('resume con "+N" y deja todas las tecnologías para lectores de pantalla', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const busy = projects.find((project) => project.technologies.length > 5)!
    const slide = page.locator(`[data-cw-slide="${busy.id}"]`)
    await expect(slide.locator('li[aria-hidden="true"]')).toHaveText(`+${busy.technologies.length - 4}`)
    await expect(slide.locator('li:not([aria-hidden])')).toHaveText(busy.technologies)
  })
})

async function frame(page: Page): Promise<Locator> {
  return page.locator('[data-cw-embed]')
}

test.describe('ProjectEmbed en escritorio (D-03, FR-206)', () => {
  onlyIn('desktop-chromium')

  test('no carga el sitio en el render inicial ni con scroll programático', async ({ page, context }) => {
    const log = await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`, { waitUntil: 'networkidle' })
    const embed = await frame(page)
    await expect(embed).toHaveAttribute('data-state', 'idle')
    await embed.evaluate((element) => element.scrollIntoView())
    await page.waitForTimeout(800)
    await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(0)
    expect(log.urls.filter((url) => hostOf(url) === hostOf(first.links.live!))).toEqual([])
  })

  test('al pedirlo, carga dentro del dominio con sandbox, lazy y título accesible', async ({ page, context }) => {
    await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    await page.locator('[data-cw-embed-load]').click()
    const iframe = page.locator('[data-cw-embed-frame]')
    await expect(iframe).toHaveCount(1)
    await expect(iframe).toHaveAttribute('src', first.links.live!)
    await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups')
    await expect(iframe).toHaveAttribute('loading', 'lazy')
    await expect(iframe).toHaveAttribute('title', new RegExp(first.title))
    await expect(await frame(page)).toHaveAttribute('data-state', 'ready')
    await expect(page.frameLocator('[data-cw-embed-frame]').locator('#stub')).toHaveText('Sitio de prueba')
    await expect(page).toHaveURL(new RegExp(`/es/portfolio/${first.id}$`))
  })

  test('"Verlo en vivo aquí" baja al marco y lo carga', async ({ page, context }) => {
    await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    await page.locator('[data-cw-case-see-live]').click()
    await expect(page).toHaveURL(/#en-vivo$/)
    await expect(await frame(page)).toHaveAttribute('data-state', 'ready')
    await expect(page.locator('[data-cw-embed] figure')).toBeInViewport()
  })

  test('carga sola cuando el visitante se desplaza hasta el marco', async ({ page, context }) => {
    await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    await page.mouse.move(640, 400)
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 250)
      await page.waitForTimeout(60)
      if ((await page.locator('[data-cw-embed-frame]').count()) > 0) break
    }
    await expect(await frame(page)).toHaveAttribute('data-state', /loading|ready/)
  })

  test('recargar vuelve a pedir el sitio, la vista móvil angosta el marco y el enlace abre afuera', async ({ page, context }) => {
    const log = await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    await page.locator('[data-cw-embed-load]').click()
    const embed = await frame(page)
    await expect(embed).toHaveAttribute('data-state', 'ready')
    const before = log.urls.length
    await page.locator('[data-cw-embed] [data-cw-embed-reload]').first().click()
    await expect(embed).toHaveAttribute('data-state', 'ready')
    expect(log.urls.length).toBeGreaterThan(before)

    const figure = page.locator('[data-cw-embed] figure')
    const wide = (await figure.boundingBox())!.width
    await page.locator('[data-cw-embed-device="mobile"]').click()
    await expect(page.locator('[data-cw-embed-device="mobile"]')).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(async () => (await figure.boundingBox())!.width).toBeLessThanOrEqual(420)
    await page.locator('[data-cw-embed-device="desktop"]').click()
    await expect.poll(async () => (await figure.boundingBox())!.width).toBeCloseTo(wide, 0)

    const open = page.locator('figure [data-cw-embed-open]')
    await expect(open).toHaveAttribute('target', '_blank')
    await expect(open).toHaveAttribute('rel', 'noopener noreferrer')
    const [popup] = await Promise.all([page.waitForEvent('popup'), open.click()])
    await expect(popup).toHaveURL(first.links.live!)
    await popup.close()
  })

  test('pantalla completa usa el mismo marco y se sale con el mismo botón', async ({ page, context }) => {
    await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    const toggle = page.locator('[data-cw-embed-fullscreen]')
    await toggle.click()
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.tagName ?? null)).toBe('FIGURE')
    await expect(toggle).toHaveAccessibleName('Salir de pantalla completa')
    await toggle.click()
    await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull()
  })

  test('a los 10 s sin respuesta muestra la captura, el aviso y el enlace externo', async ({ page, context }) => {
    await stubExternalSites(context, 'hang')
    await page.clock.install()
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    await page.locator('[data-cw-embed-load]').click()
    const embed = await frame(page)
    await expect(embed).toHaveAttribute('data-state', 'loading')
    await page.clock.fastForward(9_000)
    await expect(embed).toHaveAttribute('data-state', 'loading')
    await page.clock.fastForward(1_500)
    await expect(embed).toHaveAttribute('data-state', 'slow')
    const slow = page.locator('[data-cw-embed] figure [data-cw-embed-slow]')
    await expect(slow.getByRole('img', { name: first.image.alt.es })).toBeVisible()
    await expect(slow.locator('[data-cw-embed-external]')).toHaveAttribute('href', first.links.live!)
    await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(0)
    await slow.locator('[data-cw-embed-retry]').click()
    await expect(embed).toHaveAttribute('data-state', 'loading')
    await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(1)
  })
})

test.describe('ProjectEmbed en móvil', () => {
  onlyIn('mobile-chromium')

  test('ofrece la captura y abre el embebido a pantalla completa', async ({ page, context }) => {
    await stubExternalSites(context)
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    await expect(page.locator('[data-cw-embed-load]')).toBeHidden()
    await expect(page.locator('[data-cw-embed-device="mobile"]')).toBeHidden()
    await page.locator('[data-cw-embed-sheet-open]').click()
    const sheet = page.locator('[data-cw-embed] dialog')
    await expect(sheet).toBeVisible()
    const box = (await sheet.boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1)
    expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1)
    await expect(sheet.locator('[data-cw-embed-frame]')).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups')
    await expect(page.frameLocator('dialog [data-cw-embed-frame]').locator('#stub')).toHaveText('Sitio de prueba')
    await sheet.locator('[data-cw-embed-sheet-close]').click()
    await expect(sheet).toBeHidden()
    await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(0)
    await expect(page.locator('[data-cw-embed-sheet-open]')).toBeFocused()
  })
})

test.describe('proyectos sin sitio en vivo', () => {
  onlyIn('desktop-chromium')

  for (const project of withoutLive) {
    test(`#${project.id} no muestra el embebido`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/es/portfolio/${project.id}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title)
      await expect(page.locator('[data-cw-embed]')).toHaveCount(0)
      await expect(page.locator('[data-cw-case-see-live]')).toHaveCount(0)
    })
  }
})

test.describe('galería, resultados, stack y navegación', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('la captura se amplía en un lightbox que se cierra con Esc y con el botón', async ({ page }) => {
    await skipIntro(page)
    await page.goto(`/es/portfolio/${first.id}`)
    const zoom = page.locator('[data-cw-gallery-zoom]')
    await zoom.click()
    const lightbox = page.locator('[data-cw-gallery] dialog')
    await expect(lightbox).toBeVisible()
    await expect(lightbox.getByRole('img', { name: first.image.alt.es })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(lightbox).toBeHidden()
    await expect(zoom).toBeFocused()
    await zoom.click()
    await lightbox.locator('[data-cw-gallery-close]').click()
    await expect(lightbox).toBeHidden()
  })

  test('el stack lista cada tecnología del proyecto en su capa', async ({ page }) => {
    await skipIntro(page)
    const project = projects.find((item) => item.id === '12')!
    await page.goto(`/es/portfolio/${project.id}`)
    const pieces = page.locator('[data-cw-stack-piece]')
    await expect(pieces).toHaveCount(project.technologies.length)
    for (const tech of project.technologies) await expect(page.locator(`[data-cw-stack-piece="${tech}"]`)).toBeVisible()
  })

  test('resultados destacados, solo con texto del caso', async ({ page }) => {
    await skipIntro(page)
    for (const project of projects) {
      const highlights = caseHighlights(project, 'es')
      await page.goto(`/es/portfolio/${project.id}`)
      const list = page.locator('[data-cw-case-highlights] li')
      await expect(list, project.id).toHaveCount(highlights.length)
      if (highlights.length > 0) await expect(list).toContainText(highlights)
    }
  })

  test('anterior, siguiente y todos los proyectos navegan sin recargar', async ({ page }) => {
    await skipIntro(page)
    await page.goto(`/es/portfolio/${projects[0]!.id}`)
    await page.evaluate(() => ((window as unknown as { __cwSame?: boolean }).__cwSame = true))
    await page.locator('[data-cw-case-next]').click()
    await page.waitForURL(`**/es/portfolio/${projects[1]!.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(projects[1]!.title)
    await page.locator('[data-cw-case-prev]').click()
    await page.waitForURL(`**/es/portfolio/${projects[0]!.id}`)
    await page.locator('[data-cw-case-prev]').click()
    await page.waitForURL(`**/es/portfolio/${projects.at(-1)!.id}`)
    await page.locator('[data-cw-case-all]').click()
    await page.waitForURL('**/es/portfolio')
    expect(await page.evaluate(() => (window as unknown as { __cwSame?: boolean }).__cwSame)).toBe(true)
  })
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('el caso de estudio deja la captura, el enlace externo y la navegación', async ({ page }) => {
    await page.goto(`/es/portfolio/${first.id}`)
    await expect(page.locator('[data-cw-embed-frame]')).toHaveCount(0)
    await expect(page.locator('[data-cw-embed-load]')).toBeHidden()
    await expect(page.locator('[data-cw-gallery-zoom]')).toBeHidden()
    const poster = page.locator('[data-cw-embed] figure')
    await expect(poster.getByRole('link', { name: /pestaña nueva/ }).first()).toHaveAttribute('href', first.links.live!)
    await expect(page.getByRole('img', { name: first.image.alt.es }).first()).toBeVisible()
    await expect(page.locator('[data-cw-case-next]')).toHaveAttribute('href', `/es/portfolio/${projects[1]!.id}`)
    for (const tech of first.technologies) await expect(page.locator(`[data-cw-stack-piece="${tech}"]`)).toBeVisible()
  })

  test('el portafolio muestra todas las tarjetas completas, sin riel ni flechas', async ({ page }) => {
    await page.goto('/es/portfolio')
    await expect(page.locator('[data-cw-slide]')).toHaveCount(projects.length)
    await expect(page.locator('[data-cw-filter-scroll]').first()).toBeHidden()
    for (const m of await cardMetrics(page)) {
      expect(Math.abs(m.image.width / m.image.height - m.natural), m.id).toBeLessThan(0.02)
    }
  })
})

test.describe('accesibilidad de los casos de estudio', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  const CASES = ['/es/portfolio/1', '/es/portfolio/2', '/en/portfolio/10', '/en/portfolio/12']

  for (const scheme of ['dark', 'light'] as const) {
    for (const path of CASES) {
      test(`${path} en tema ${scheme}, con el sitio y el lightbox abiertos`, async ({ page, context }, testInfo) => {
        await stubExternalSites(context)
        await skipIntro(page)
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.goto(path)
        const scan = async (label: string) => {
          const results = await new AxeBuilder({ page })
            .include('#main')
            .exclude('[data-cw-embed-frame]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
          const blocking = results.violations
            .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
            .map((violation) => `${label} ${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
          expect(blocking).toEqual([])
        }
        await scan('inicial')
        if ((await page.locator('[data-cw-embed]').count()) > 0) {
          if (testInfo.project.name === 'desktop-chromium') {
            await page.locator('[data-cw-embed-load]').click()
            await expect(page.locator('[data-cw-embed]')).toHaveAttribute('data-state', 'ready')
            await scan('embebido')
          } else {
            await page.locator('[data-cw-embed-sheet-open]').click()
            await scan('hoja')
            await page.locator('[data-cw-embed-sheet-close]').click()
          }
        }
        await page.locator('[data-cw-gallery-zoom]').click()
        await scan('lightbox')
      })
    }
  }
})
