import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { paragraphs } from '@/components/site/format'
import { getAllTechnologies, getProjects, getSite } from '@/lib/content'

const site = getSite()
const projects = getProjects()
const firstProject = projects[0]!
const PAGES = ['/es', '/es/aboutMe', '/es/services', '/es/portfolio', `/es/portfolio/${firstProject.id}`] as const

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}

async function expectCurrentSlide(page: Page, id: string) {
  const track = page.locator('[data-cw-carousel]')
  await expect
    .poll(
      () =>
        track.evaluate((element, slideId) => {
          const slide = element.querySelector(`[data-cw-slide="${slideId}"]`)
          if (!slide) return Number.POSITIVE_INFINITY
          return Math.abs(slide.getBoundingClientRect().left - element.getBoundingClientRect().left)
        }, id),
      { message: `la diapositiva ${id} queda alineada en el carrusel` },
    )
    .toBeLessThan(2)
}

function partialTechnology(): { tech: string; ids: string[] } {
  for (const tech of getAllTechnologies()) {
    const ids = projects.filter((project) => project.technologies.includes(tech)).map((project) => project.id)
    if (ids.length > 0 && ids.length < projects.length) return { tech, ids }
  }
  throw new Error('Se necesita una tecnología que no usen todos los proyectos')
}

test.describe('contenido sin JavaScript', () => {
  onlyIn('no-js')

  test('home: banner "Mi nombre es Camilo", título y redes', async ({ page }) => {
    await page.goto('/es')
    await expect(page.locator('html')).not.toHaveAttribute('data-js', /.*/)
    const banner = page.locator('[data-cw-home-banner]')
    await expect(banner.getByText(`${site.home.greeting.es} ${site.home.name}`)).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(site.home.title.es)
    const links = banner.getByRole('navigation').getByRole('link')
    await expect(links).toHaveCount(3)
    await expect(links.nth(0)).toHaveAttribute('href', /^mailto:/)
  })

  test('home en inglés: "My name is Camilo / I\'M A DEVELOPER"', async ({ page }) => {
    await page.goto('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByText(`My name is ${site.home.name}`)).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(site.home.title.en)
  })

  test('sobre mí: descripción, carrera, mapa de skills completo, cursos e idiomas (US6c)', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sobre mí')
    await expect(page.getByText(site.about.description.es)).toBeVisible()
    await expect(page.getByRole('img', { name: site.about.image.alt.es })).toBeVisible()
    for (const title of ['Carrera', 'Lo que sé']) {
      await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible()
    }
    const knowledge = page.locator('[data-cw-about="knowledge"] [data-cw-brain-fallback]')
    for (const tech of site.about.skills.tech) {
      await expect(knowledge.getByText(tech.label?.es ?? tech.name, { exact: true }).first()).toBeVisible()
    }
    for (const language of site.about.languages) {
      await expect(knowledge.getByText(language.name.es.toUpperCase(), { exact: true })).toBeVisible()
    }
    await expect(knowledge.locator('[data-cw-source-item]')).toHaveCount(12)
    await expect(page.getByRole('link', { name: new RegExp(site.about.courses.platzi.label.es) })).toHaveAttribute(
      'href',
      site.about.courses.platzi.href,
    )
    const career = page.locator('[data-cw-about="career"]')
    if (site.about.career.some((entry) => entry.pending)) await expect(career).toHaveCount(0)
    else await expect(career).toBeVisible()
  })

  test('servicios: introducción, Explorar y tres tarjetas', async ({ page }) => {
    await page.goto('/es/services')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿Cómo te puedo ayudar?')
    await expect(page.getByRole('link', { name: 'Explorar' })).toHaveAttribute('href', '/es/portfolio')
    const cards = page.locator('[data-cw-service]')
    await expect(cards).toHaveCount(3)
    await expect(cards.getByRole('heading', { level: 3 })).toHaveText(site.services.items.map((item) => item.title.es))
  })

  test('portafolio: todos los proyectos visibles, sin filtro ni controles', async ({ page }) => {
    await page.goto('/es/portfolio')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portafolio')
    await expect(page.getByText(site.portfolio.intro[0]!.es)).toBeVisible()
    const slides = page.locator('[data-cw-slide]')
    await expect(slides).toHaveCount(projects.length)
    for (const project of projects) {
      const slide = page.locator(`[data-cw-slide="${project.id}"]`)
      await expect(slide.getByRole('heading', { level: 3 })).toHaveText(project.title)
      await expect(slide.getByRole('link')).toHaveAttribute('href', `/es/portfolio/${project.id}`)
    }
    await expect(page.locator('[data-cw-filter]').first()).toBeHidden()
    await expect(page.locator('[data-cw-next]')).toBeHidden()
    await expect(page.getByText(site.portfolio.footer.es)).toBeVisible()
  })

  test('caso de estudio: título, contexto y enlaces', async ({ page }) => {
    await page.goto(`/es/portfolio/${firstProject.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(firstProject.title)
    await expect(page.getByRole('heading', { level: 2, name: 'Contexto' })).toBeVisible()
    for (const paragraph of paragraphs(firstProject.context.es)) await expect(page.getByText(paragraph)).toBeVisible()
    if (firstProject.links.live) await expect(page.locator('[data-cw-case-link="live"]')).toHaveAttribute('href', firstProject.links.live)
  })

  test('un proyecto inexistente responde 404', async ({ page }) => {
    const response = await page.goto('/es/portfolio/no-existe')
    expect(response?.status()).toBe(404)
  })
})

test.describe('metadatos', () => {
  onlyIn('desktop-chromium')

  test('cada página declara título, canónica y alternativas por idioma', async ({ page }) => {
    const expected: Array<[string, RegExp]> = [
      ['/es', /^<-CHERCED-WORLD->$/],
      ['/en/aboutMe', /^About me \| <-CHERCED-WORLD->$/],
      ['/es/services', /^Servicios \| /],
      ['/en/portfolio', /^Portfolio \| /],
      [`/es/portfolio/${firstProject.id}`, new RegExp(`^${firstProject.title} \\| `)],
    ]
    for (const [path, title] of expected) {
      await page.goto(path)
      await expect(page).toHaveTitle(title)
      const bare = path.replace(/^\/(es|en)/, '') || '/'
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`))
      await expect(page.locator('link[rel="alternate"][hreflang="es"]')).toHaveAttribute('href', new RegExp(`/es${bare === '/' ? '' : bare}$`))
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', new RegExp(`/en${bare === '/' ? '' : bare}$`))
      await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute('content', /\/assets\//)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{20,}/)
    }
  })
})

test.describe('filtro por tecnología', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('deja solo los proyectos con la tecnología elegida y vuelve a todos', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const slides = page.locator('[data-cw-slide]')
    const status = page.locator('[data-cw-carousel-status]')
    await expect(slides).toHaveCount(projects.length)

    const { tech, ids } = partialTechnology()
    const chip = page.locator(`[data-cw-filter="${tech}"]`)
    await chip.click()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(slides).toHaveCount(ids.length)
    for (const id of ids) await expect(page.locator(`[data-cw-slide="${id}"]`)).toHaveCount(1)
    await expect(status).toHaveText(ids.length === 1 ? `1 proyecto con ${tech}` : `${ids.length} proyectos con ${tech}`)

    await page.locator('[data-cw-filter="REACT"]').click()
    const react = projects.filter((project) => project.technologies.includes('REACT'))
    await expect(slides).toHaveCount(react.length)
    for (const slide of await slides.all()) await expect(slide.locator('li', { hasText: /^REACT$/ })).toHaveCount(1)

    await page.locator('[data-cw-filter=""]').click()
    await expect(slides).toHaveCount(projects.length)
    await expect(status).toHaveText(`Mostrando los ${projects.length} proyectos`)
  })
})

test.describe('tecnologías en móvil', () => {
  onlyIn('mobile-chromium')

  test('los lóbulos son chips y cada uno muestra sus tecnologías en el panel (US6c)', async ({ page }) => {
    const lobes = site.about.skills.lobes ?? []
    test.skip(lobes.length === 0, 'hacen falta lóbulos')
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const chips = page.locator('[data-cw-lobe]')
    await expect(chips).toHaveCount(lobes.length)
    const panel = page.locator('[data-cw-terminal-body]')
    for (const lobe of lobes) {
      await page.locator(`[data-cw-lobe="${lobe.id}"]`).click()
      await expect(page.locator(`[data-cw-lobe="${lobe.id}"]`)).toHaveAttribute('aria-pressed', 'true')
      await expect(panel.locator('[data-cw-brain-skill]')).toHaveCount(lobe.skills.length)
    }
  })
})

test.describe('carrusel', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('se recorre con el teclado y anuncia el proyecto actual', async ({ page }) => {
    test.skip(projects.length < 2, 'hace falta más de un proyecto')
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const track = page.locator('[data-cw-carousel]')
    const status = page.locator('[data-cw-carousel-status]')
    await expect(track).toHaveAttribute('aria-roledescription', 'carousel')
    await expect(status).toHaveAttribute('aria-live', 'polite')

    const chips = page.locator('[data-cw-filter]')
    await chips.last().focus()
    await page.keyboard.press('Tab')
    await expect(track).toBeFocused()

    const total = projects.length
    await page.keyboard.press('ArrowRight')
    await expect(status).toHaveText(`Proyecto 2 de ${total}: ${projects[1]!.title}`)
    await expectCurrentSlide(page, projects[1]!.id)

    await page.keyboard.press('ArrowLeft')
    await expect(status).toHaveText(`Proyecto 1 de ${total}: ${projects[0]!.title}`)

    await page.keyboard.press('ArrowLeft')
    await expect(status).toHaveText(`Proyecto ${total} de ${total}: ${projects[total - 1]!.title}`)
    await expectCurrentSlide(page, projects[total - 1]!.id)

    await page.keyboard.press('Home')
    await expect(status).toHaveText(`Proyecto 1 de ${total}: ${projects[0]!.title}`)
    await expectCurrentSlide(page, projects[0]!.id)
  })

  test('los botones avanzan y retroceden', async ({ page }) => {
    test.skip(projects.length < 2, 'hace falta más de un proyecto')
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const status = page.locator('[data-cw-carousel-status]')
    await page.getByRole('button', { name: 'Proyecto siguiente' }).click()
    await expect(status).toHaveText(new RegExp(`^Proyecto 2 de ${projects.length}`))
    await expectCurrentSlide(page, projects[1]!.id)
    await page.getByRole('button', { name: 'Proyecto anterior' }).click()
    await expect(status).toHaveText(new RegExp(`^Proyecto 1 de ${projects.length}`))
  })

  test('se desliza con el dedo', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'gesto táctil')
    test.skip(projects.length < 2, 'hace falta más de un proyecto')
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const track = page.locator('[data-cw-carousel]')
    const image = page.locator(`[data-cw-slide="${projects[0]!.id}"] img`)
    await image.scrollIntoViewIfNeeded()
    const trackBox = await track.boundingBox()
    const imageBox = await image.boundingBox()
    if (!trackBox || !imageBox) throw new Error('El carrusel no tiene caja')
    const cdp = await page.context().newCDPSession(page)
    const y = Math.round(imageBox.y + imageBox.height / 2)
    const from = Math.round(trackBox.x + trackBox.width * 0.85)
    const to = Math.round(trackBox.x + trackBox.width * 0.15)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] })
    for (let step = 1; step <= 12; step++) {
      const x = Math.round(from + ((to - from) * step) / 12)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
      await page.waitForTimeout(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(page.locator('[data-cw-carousel-status]')).toHaveText(new RegExp(`^Proyecto 2 de ${projects.length}`))
    await expectCurrentSlide(page, projects[1]!.id)
  })
})

test.describe('enlaces', () => {
  onlyIn('desktop-chromium')

  test('Live y GitHub abren el sitio externo en una pestaña nueva', async ({ page, context }) => {
    await skipIntro(page)
    await context.route(/^https:\/\/(?!localhost)/, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>externo</title>' }),
    )
    await page.goto(`/es/portfolio/${firstProject.id}`)
    for (const id of ['live', 'github'] as const) {
      const href = firstProject.links[id]
      const link = page.locator(`[data-cw-case-link="${id}"]`)
      if (!href) {
        await expect(link).toHaveCount(0)
        continue
      }
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(link).toHaveAccessibleName(/se abre en una pestaña nueva/)
      const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()])
      await expect(popup).toHaveURL(href)
      await popup.close()
      await expect(page).toHaveURL(new RegExp(`/es/portfolio/${firstProject.id}$`))
    }
  })

  test('las redes y Platzi son externas; el correo no abre pestaña', async ({ page }) => {
    await page.goto('/es')
    const banner = page.locator('[data-cw-home-banner]')
    for (const link of await banner.getByRole('link').all()) {
      const href = (await link.getAttribute('href')) ?? ''
      if (href.startsWith('mailto:')) await expect(link).not.toHaveAttribute('target', /.*/)
      else {
        await expect(link).toHaveAttribute('target', '_blank')
        await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      }
    }
    await page.goto('/es/aboutMe')
    const platzi = page.locator('[data-cw-about="knowledge"] [data-cw-brain] a[href^="https://"]')
    await expect(platzi).toHaveAttribute('target', '_blank')
    await expect(platzi).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('los enlaces internos navegan sin recargar la página', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/services')
    await page.evaluate(() => {
      ;(window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument = true
    })
    await page.getByRole('link', { name: 'Explorar' }).click()
    await page.waitForURL('**/es/portfolio')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portafolio')
    expect(await page.evaluate(() => (window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument)).toBe(true)

    await page.locator(`[data-cw-slide="${firstProject.id}"]`).getByRole('link').click()
    await page.waitForURL(`**/es/portfolio/${firstProject.id}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(firstProject.title)
    expect(await page.evaluate(() => (window as unknown as { __cwSameDocument?: boolean }).__cwSameDocument)).toBe(true)
  })
})

test.describe('proyecto inexistente', () => {
  onlyIn('desktop-chromium')

  for (const path of ['/es/portfolio/999', '/en/portfolio/abc']) {
    test(`${path} responde 404 con la vista de identidad`, async ({ page }) => {
      await skipIntro(page)
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
      const view = page.locator('[data-cw-not-found]')
      await expect(view).toBeVisible()
      await expect(view.getByRole('link')).toHaveAttribute('href', path.startsWith('/en') ? '/en' : '/es')
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    })
  }
})

test.describe('accesibilidad', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const scheme of ['dark', 'light'] as const) {
    for (const path of PAGES) {
      test(`${path} sin violaciones críticas ni serias en tema ${scheme}`, async ({ page }) => {
        await skipIntro(page)
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const results = await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }
})

type Vitals = { lcp: number; cls: number }

async function measureVitals(page: Page, path: string): Promise<Vitals> {
  await page.addInitScript(() => {
    const store = { lcp: 0, cls: 0 }
    ;(window as unknown as { __cwVitals: typeof store }).__cwVitals = store
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) store.lcp = entry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) store.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto(path, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  return page.evaluate(() => (window as unknown as { __cwVitals: Vitals }).__cwVitals)
}

test.describe('presupuestos de rendimiento', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const path of PAGES) {
    test(`${path}: LCP ≤ 2,5 s y CLS ≤ 0,1`, async ({ page }, testInfo) => {
      await skipIntro(page)
      if (testInfo.project.name === 'mobile-chromium') {
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
        await cdp.send('Network.enable')
        await cdp.send('Network.emulateNetworkConditions', {
          offline: false,
          latency: 150,
          downloadThroughput: (1.6 * 1024 * 1024) / 8,
          uploadThroughput: (750 * 1024) / 8,
        })
      }
      const vitals = await measureVitals(page, path)
      testInfo.annotations.push({ type: 'vitals', description: `${path} LCP=${Math.round(vitals.lcp)}ms CLS=${vitals.cls.toFixed(3)}` })
      expect(vitals.lcp, 'LCP').toBeGreaterThan(0)
      expect(vitals.lcp, 'LCP').toBeLessThanOrEqual(2500)
      expect(vitals.cls, 'CLS').toBeLessThanOrEqual(0.1)
    })
  }
})
