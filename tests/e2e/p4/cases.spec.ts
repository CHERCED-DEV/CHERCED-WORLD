import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { paragraphs } from '@/components/site/format'
import { filterProjects, filtersSummary } from '@/components/site/portfolio/carousel'
import { caseStudyRepos } from '@/components/site/portfolio/projects'
import type { Locale, ProjectEra } from '@/content/types'
import { getProject, getProjects, projectTitle } from '@/lib/content'
import { onlyIn, skipIntro } from '../r2/support'

const projects = getProjects()
const synergos = getProject('12')!
const NEW_CASES = ['13', '14', '15'].map((id) => getProject(id)!)
const ERA_TEXT: Record<ProjectEra, string> = { '2026': '2026', '2024-2026': '2024–2026', '2022-2023': '2022–2023' }
const SUMMARY = {
  es: { filteredAll: 'Mostrando los {count} proyectos', filteredOne: '1 proyecto con {tech}', filteredMany: '{count} proyectos con {tech}', filteredEra: '{count} proyectos de {era}' },
  en: { filteredAll: 'Showing all {count} projects', filteredOne: '1 project with {tech}', filteredMany: '{count} projects with {tech}', filteredEra: '{count} projects from {era}' },
} as const

function summary(lang: Locale, tech: string | null, era: ProjectEra | null): string {
  const count = filterProjects(projects, { tech, era }).length
  return filtersSummary(SUMMARY[lang], count, tech, era ? ERA_TEXT[era] : null)
}

type VtRecord = { names: string[]; ends: number[]; error: string | null; scroll: number | null }

async function recordViewTransitions(page: Page, options: { unsupported?: boolean } = {}) {
  await page.addInitScript((unsupported: boolean) => {
    const records: VtRecord[] = []
    ;(window as unknown as { __cwP4Vt: VtRecord[] }).__cwP4Vt = records
    if (unsupported) {
      Object.defineProperty(Document.prototype, 'startViewTransition', { value: undefined, configurable: true })
      return
    }
    const original = document.startViewTransition?.bind(document)
    if (!original) return
    document.startViewTransition = ((arg: Parameters<typeof original>[0]) => {
      const transition = original(arg)
      const record: VtRecord = { names: [], ends: [], error: null, scroll: null }
      records.push(record)
      transition.ready
        .then(() => {
          record.scroll = window.scrollY
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null
            const pseudo = effect?.pseudoElement ?? ''
            if (!pseudo.startsWith('::view-transition-group(')) continue
            record.names.push(pseudo.slice('::view-transition-group('.length, -1))
            record.ends.push(Number(effect?.getComputedTiming().endTime ?? 0))
          }
        })
        .catch((error: unknown) => {
          record.error = String(error)
        })
      return transition
    }) as typeof document.startViewTransition
  }, options.unsupported ?? false)
}

async function transitions(page: Page): Promise<VtRecord[]> {
  return page.evaluate(() => (window as unknown as { __cwP4Vt: VtRecord[] }).__cwP4Vt)
}

async function slideIds(page: Page): Promise<string[]> {
  return page.locator('[data-cw-slide]').evaluateAll((slides) => slides.map((slide) => (slide as HTMLElement).dataset.cwSlide ?? ''))
}

test.describe('portafolio: 15 casos, orden y época (FR-405)', () => {
  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: las tarjetas siguen el orden de §4 y cada una dice su época`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}/portfolio`)
      expect(await slideIds(page)).toEqual(projects.map((project) => project.id))
      for (const project of projects) {
        const era = page.locator(`[data-cw-slide="${project.id}"] [data-cw-era]`)
        await expect(era, project.id).toHaveAttribute('data-cw-era', project.era)
        await expect(era, project.id).toHaveText(`${lang === 'es' ? 'Época' : 'Period'}: ${ERA_TEXT[project.era]}`)
      }
    })
  }

  test('sin JS se ven las 15 tarjetas con su época y sin el filtro', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-js', 'solo sin JS')
    await page.goto('/es/portfolio')
    await expect(page.locator('[data-cw-slide]')).toHaveCount(projects.length)
    for (const project of projects) await expect(page.locator(`[data-cw-slide="${project.id}"] [data-cw-era]`)).toBeVisible()
    await expect(page.locator('[data-cw-era-filter]').first()).toBeHidden()
  })
})

test.describe('filtro de época combinado con tecnología (US4 escenario 4)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('filtra, combina, anuncia la cantidad y con cero ofrece "Quitar filtros"', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const status = page.locator('[data-cw-carousel-status]')
    const recent = page.locator('[data-cw-era-filter="2024-2026"]')
    const recentIds = projects.filter((project) => project.era === '2024-2026').map((project) => project.id)

    await recent.click()
    await expect(recent).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-cw-era-filter="2022-2023"]')).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => slideIds(page)).toEqual(recentIds)
    await expect(status).toHaveText(summary('es', null, '2024-2026'))

    await page.locator('[data-cw-filter="ANGULAR"]').click()
    await expect.poll(() => slideIds(page)).toEqual(filterProjects(projects, { tech: 'ANGULAR', era: '2024-2026' }).map((project) => project.id))
    await expect(status).toHaveText(summary('es', 'ANGULAR', '2024-2026'))

    await page.locator('[data-cw-filter="NEXT AUTH"]').click()
    await expect(page.locator('[data-cw-slide]')).toHaveCount(0)
    const empty = page.locator('[data-cw-projects-empty]')
    await expect(empty).toBeVisible()
    await expect(empty).toContainText('0 proyectos con NEXT AUTH · 2024–2026')
    await expect(status).toHaveText(summary('es', 'NEXT AUTH', '2024-2026'))

    await empty.getByRole('button', { name: 'Quitar filtros' }).click()
    await expect(page.locator('[data-cw-slide]')).toHaveCount(projects.length)
    await expect(empty).toHaveCount(0)
    await expect(recent).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[data-cw-filter=""]')).toHaveAttribute('aria-pressed', 'true')
    await expect(status).toHaveText(summary('es', null, null))
    await expect(page.locator('[data-cw-carousel]')).toBeFocused()
  })

  test('volver a pulsar la época la suelta, y en inglés anuncia el periodo', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/en/portfolio')
    const older = page.locator('[data-cw-era-filter="2022-2023"]')
    await older.click()
    await expect(page.locator('[data-cw-carousel-status]')).toHaveText(summary('en', null, '2022-2023'))
    await expect(page.locator('[data-cw-slide]')).toHaveCount(projects.filter((project) => project.era === '2022-2023').length)
    await older.click()
    await expect(older).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('[data-cw-slide]')).toHaveCount(projects.length)
    await expect(page.locator('[data-cw-carousel-status]')).toHaveText(summary('en', null, null))
  })
})

test.describe('Synergos: tarjetas ADR (FR-442, US4 escenarios 1 y 2)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium', 'no-js')

  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: "Decisiones clave" se ve como 4 tarjetas Decisión · Por qué · Trade-off`, async ({ page }) => {
      await skipIntro(page)
      await page.goto(`/${lang}/portfolio/12`)
      const section = page.locator('[data-cw-case-section="decisions"]')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText(lang === 'es' ? 'Decisiones clave' : 'Key decisions')
      const cards = section.locator('[data-cw-adr]')
      await expect(cards).toHaveCount(4)
      for (const [index, card] of synergos.adrCards!.entries()) {
        const item = cards.nth(index)
        await expect(item.locator('dt')).toHaveText(lang === 'es' ? ['Decisión', 'Por qué', 'Trade-off'] : ['Decision', 'Why', 'Trade-off'])
        await expect(item.locator('dd')).toHaveText([card.decision[lang], card.why[lang], card.tradeoff[lang]])
      }
      await expect(page.getByText(synergos.decisions![lang].slice(0, 50))).toHaveCount(0)
    })
  }

  test('un caso sin tarjetas mantiene la prosa', async ({ page }) => {
    const project = projects.find((item) => item.decisions && !item.adrCards)!
    await skipIntro(page)
    await page.goto(`/es/portfolio/${project.id}`)
    await expect(page.locator('[data-cw-adr-cards]')).toHaveCount(0)
    await expect(page.getByText(paragraphs(project.decisions!.es)[0]!)).toBeVisible()
  })
})

test.describe('Synergos: diagrama vivo (FR-445, US4 escenario 6)', () => {
  const layers = synergos.diagram!

  test('se ilumina en orden al entrar en pantalla y responde al teclado y al puntero', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'teclado y puntero fino')
    await skipIntro(page)
    await page.goto('/es/portfolio/12')
    const diagram = page.locator('[data-cw-diagram]')
    await expect(diagram).not.toHaveAttribute('data-lit', /.*/)
    await diagram.scrollIntoViewIfNeeded()
    await expect(diagram).toHaveAttribute('data-lit', '')

    const buttons = page.locator('[data-cw-diagram-layer]')
    await expect(buttons).toHaveCount(layers.length)
    const delays = await buttons.evaluateAll((items) => items.map((item) => Number.parseFloat(getComputedStyle(item).transitionDelay)))
    for (let i = 1; i < delays.length; i++) expect(delays[i]!, `capa ${i}`).toBeGreaterThan(delays[i - 1]!)
    await expect(page.locator('[data-cw-diagram-hint]')).toHaveText('Toca, señala o enfoca una capa para ver su rol.')

    const shown = async (id: string, text: string) => {
      await expect(page.locator(`[data-cw-diagram-line="${id}"]`)).toBeVisible()
      const item = page.locator(`[data-cw-diagram-line-item="${id}"]`)
      await expect(item).toBeVisible()
      await expect(item).toContainText(text)
      for (const other of layers.filter((layer) => layer.id !== id)) {
        await expect(page.locator(`[data-cw-diagram-line-item="${other.id}"]`)).toBeHidden()
      }
    }
    const before = (await diagram.boundingBox())!.height
    await expect(page.locator(`[data-cw-diagram-layer="${layers[0]!.id}"]`), 'U8: la capa 01 llega elegida y el panel nunca está vacío').toHaveAttribute('aria-pressed', 'true')
    await shown(layers[0]!.id, layers[0]!.role.es)
    await page.locator('[data-cw-case-repo="Synergos.Fabrica"]').focus()
    await page.keyboard.press('Tab')
    const first = page.locator(`[data-cw-diagram-layer="${layers[0]!.id}"]`)
    await expect(first).toBeFocused()
    await expect(first).toHaveAttribute('aria-pressed', 'true')
    await expect(first).toHaveAccessibleDescription(layers[0]!.role.es)
    await shown(layers[0]!.id, layers[0]!.role.es)

    await page.keyboard.press('Tab')
    const second = page.locator(`[data-cw-diagram-layer="${layers[1]!.id}"]`)
    await expect(second).toBeFocused()
    await expect(second).toHaveAttribute('aria-pressed', 'true')
    await expect(first).toHaveAttribute('aria-pressed', 'false')
    await shown(layers[1]!.id, layers[1]!.role.es)

    await page.locator(`[data-cw-diagram-layer="${layers[2]!.id}"]`).hover()
    await shown(layers[2]!.id, layers[2]!.role.es)
    await expect(page.locator(`[data-cw-diagram-layer="${layers[2]!.id}"]`)).toHaveAttribute('aria-pressed', 'true')
    expect(Math.abs((await diagram.boundingBox())!.height - before), 'la línea de rol no mueve el layout').toBeLessThanOrEqual(1)

    for (const layer of layers) await expect(page.locator(`[data-cw-diagram-role="${layer.id}"]`)).toHaveText(layer.role.es)
  })

  test('en móvil, tocar una capa muestra su rol', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'pantalla táctil')
    await skipIntro(page)
    await page.goto('/en/portfolio/12')
    const layer = page.locator(`[data-cw-diagram-layer="${layers[1]!.id}"]`)
    await layer.scrollIntoViewIfNeeded()
    await layer.tap()
    await expect(layer).toHaveAttribute('aria-pressed', 'true')
    const item = page.locator(`[data-cw-diagram-line-item="${layers[1]!.id}"]`)
    await expect(item).toBeVisible()
    await expect(item).toContainText(layers[1]!.role.en)
  })

  test('con movimiento reducido se ve encendido y las tres líneas como texto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una vez basta')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await skipIntro(page)
    await page.goto('/es/portfolio/12')
    for (const layer of layers) await expect(page.locator(`[data-cw-diagram-role="${layer.id}"]`)).toBeVisible()
    await expect(page.locator('[data-cw-diagram-line]')).toBeHidden()
    await expect(page.locator('[data-cw-diagram-hint]')).toBeHidden()
    const colors = await page
      .locator('[data-cw-diagram-layer]')
      .evaluateAll((items) => items.map((item) => getComputedStyle(item).borderTopColor))
    expect(new Set(colors).size).toBe(1)
    expect(colors[0]).toBe('rgb(37, 237, 158)')
  })

  test('sin JS se ve completo y estático', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'no-js', 'solo sin JS')
    await page.goto('/en/portfolio/12')
    await expect(page.locator('[data-cw-diagram]').getByRole('heading', { level: 2 })).toHaveText('How the layers fit')
    for (const layer of layers) {
      await expect(page.locator(`[data-cw-diagram-layer="${layer.id}"]`)).toHaveText(new RegExp(layer.label.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      await expect(page.locator(`[data-cw-diagram-role="${layer.id}"]`)).toBeVisible()
    }
    await expect(page.locator('[data-cw-diagram-line]')).toBeHidden()
    await expect(page.locator('[data-cw-diagram-hint]')).toBeHidden()
  })

  test('ningún otro caso dibuja el diagrama', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una vez basta')
    await skipIntro(page)
    for (const project of NEW_CASES) {
      await page.goto(`/es/portfolio/${project.id}`)
      await expect(page.locator('[data-cw-diagram]'), project.id).toHaveCount(0)
    }
  })
})

test.describe('repos y casos nuevos (FR-443, FR-447)', () => {
  test('Synergos enlaza sus tres repos en pestaña nueva con aviso', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'una vez basta')
    await context.route(/^https:\/\/github\.com\//, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>repo</title>' }))
    await skipIntro(page)
    await page.goto('/es/portfolio/12')
    const repos = caseStudyRepos(synergos)
    const links = page.locator('[data-cw-case-repo]')
    await expect(links).toHaveCount(repos.length)
    for (const repo of repos) {
      const link = page.locator(`[data-cw-case-repo="${repo.label}"]`)
      await expect(link).toHaveAttribute('href', repo.href)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(link).toHaveAccessibleName(new RegExp(`${repo.label.replace('.', '\\.')}.*se abre en una pestaña nueva`))
    }
    const [popup] = await Promise.all([page.waitForEvent('popup'), links.first().click()])
    await expect(popup).toHaveURL(repos[0]!.href)
    await popup.close()
    await expect(page).toHaveURL(/\/es\/portfolio\/12$/)
  })

  for (const lang of ['es', 'en'] as const) {
    test(`${lang}: Director & lines, Legal workspace y Event bridge, completos; solo Director & lines enlaza su arnés`, async ({ page }) => {
      test.setTimeout(60_000)
      await skipIntro(page)
      for (const project of NEW_CASES) {
        await page.goto(`/${lang}/portfolio/${project.id}`)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(projectTitle(project, lang))
        await expect(page.locator('[data-cw-case-era]')).toContainText(ERA_TEXT[project.era])
        await expect(page.getByText(project.summary[lang], { exact: true }).first()).toBeVisible()
        for (const paragraph of paragraphs(project.context[lang])) await expect(page.getByText(paragraph)).toBeVisible()
        await expect(page.getByRole('img', { name: project.image.alt[lang] }).first()).toBeVisible()
        await expect(page.locator('[data-cw-case-link], [data-cw-embed]')).toHaveCount(0)
        await expect(page.locator('[data-cw-case-repo]')).toHaveCount(project.id === '13' ? 1 : 0)
      }
    })
  }
})

test.describe('transición compartida carrusel → caso (FR-465, US7 escenario 7)', () => {
  onlyIn('desktop-chromium')

  test('la captura de la tarjeta viaja al caso y el carrusel no se duplica', async ({ page }) => {
    await recordViewTransitions(page)
    await skipIntro(page)
    await page.goto('/es/portfolio')
    await page.locator('[data-cw-slide="12"]').getByRole('link').click()
    await page.waitForURL('**/es/portfolio/12')
    await expect.poll(async () => (await transitions(page)).flatMap((record) => record.names)).toContain('project-media-12')
    const record = (await transitions(page)).find((item) => item.names.includes('project-media-12'))!
    expect(record.error).toBeNull()
    expect(record.names.filter((name) => name === 'project-media-12')).toHaveLength(1)
    expect(record.scroll, 'el caso se captura arriba, donde queda la imagen').toBe(0)
    expect(Math.max(...record.ends)).toBeLessThanOrEqual(400)

    for (let round = 0; round < 2; round++) {
      await page.goBack()
      await page.waitForURL('**/es/portfolio')
      await expect(page.locator('[data-cw-slide]')).toHaveCount(projects.length)
      expect(await slideIds(page)).toEqual(projects.map((project) => project.id))
      await page.goForward()
      await page.waitForURL('**/es/portfolio/12')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(projectTitle(synergos, 'es'))
    }
  })

  test('solo la diapositiva actual comparte su captura', async ({ page }) => {
    await recordViewTransitions(page)
    await skipIntro(page)
    await page.goto('/es/portfolio')
    const second = projects[1]!
    await page.locator('[data-cw-next]').click()
    await expect(page.locator(`[data-cw-slide="${second.id}"]`)).toHaveAttribute('data-current', 'true')
    await expect
      .poll(() =>
        page.locator('[data-cw-carousel]').evaluate((track, id) => {
          const slide = track.querySelector<HTMLElement>(`[data-cw-slide="${id}"]`)!
          return Math.abs(track.scrollLeft - slide.offsetLeft)
        }, second.id),
      )
      .toBeLessThanOrEqual(1)
    await page.waitForTimeout(200)
    await expect(page.locator(`[data-cw-slide="${second.id}"]`)).toHaveAttribute('data-current', 'true')
    await page.locator(`[data-cw-slide="${second.id}"]`).getByRole('link').click()
    await page.waitForURL(`**/es/portfolio/${second.id}`)
    await expect.poll(async () => (await transitions(page)).flatMap((record) => record.names)).toContain(`project-media-${second.id}`)
    const records = await transitions(page)
    expect(records.flatMap((record) => record.names).filter((name) => name.startsWith('project-media-'))).toEqual([`project-media-${second.id}`])
    expect(records.find((record) => record.names.length > 0)?.scroll).toBe(0)
  })

  test('con movimiento reducido la navegación no anima', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await recordViewTransitions(page)
    await skipIntro(page)
    await page.goto('/es/portfolio')
    await page.locator('[data-cw-slide="12"]').getByRole('link').click()
    await page.waitForURL('**/es/portfolio/12')
    await page.waitForTimeout(400)
    for (const record of await transitions(page)) expect(Math.max(0, ...record.ends)).toBe(0)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(projectTitle(synergos, 'es'))
  })

  test('sin View Transitions en el navegador la navegación es la normal', async ({ page }) => {
    await recordViewTransitions(page, { unsupported: true })
    await skipIntro(page)
    await page.goto('/es/portfolio')
    await page.locator('[data-cw-slide="12"]').getByRole('link').click()
    await page.waitForURL('**/es/portfolio/12')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(projectTitle(synergos, 'es'))
    expect(await transitions(page)).toEqual([])
  })
})

test.describe('imágenes OG del portafolio y de los casos (FR-471)', () => {
  onlyIn('desktop-chromium')

  function meta(html: string, property: string): string | null {
    const match = html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))
    return match ? match[1]!.replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"') : null
  }

  test('cada caso y el portafolio publican su og:image propia en ES y EN', async ({ request }) => {
    test.setTimeout(90_000)
    for (const lang of ['es', 'en'] as const) {
      const list = await (await request.get(`/${lang}/portfolio`)).text()
      expect(meta(list, 'og:image')).toMatch(new RegExp(`/${lang}/portfolio/opengraph-image/og`))
      for (const project of projects) {
        const html = await (await request.get(`/${lang}/portfolio/${project.id}`)).text()
        expect(meta(html, 'og:image'), `${lang} ${project.id}`).toMatch(new RegExp(`/${lang}/portfolio/${project.id}/opengraph-image/og`))
        expect(meta(html, 'og:image:alt'), `${lang} ${project.id}`).toBe(`${projectTitle(project, lang)}: ${project.summary[lang]}`)
      }
    }
  })

  for (const path of ['/es/portfolio/opengraph-image/og', '/en/portfolio/15/opengraph-image/og']) {
    test(`${path} es un PNG de 1200 × 630`, async ({ request }) => {
      const response = await request.get(path)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')
      const body = await response.body()
      expect(body.subarray(1, 4).toString('ascii')).toBe('PNG')
      expect([body.readUInt32BE(16), body.readUInt32BE(20)]).toEqual([1200, 630])
    })
  }

  test('un caso inexistente no tiene imagen', async ({ request }) => {
    expect((await request.get('/es/portfolio/999/opengraph-image/og')).status()).toBe(404)
  })
})

test.describe('accesibilidad de lo nuevo', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  async function scan(page: Page, label: string) {
    await page.locator('#main').evaluate((root) =>
      Promise.all(
        root
          .getAnimations({ subtree: true })
          .filter((animation) => animation.timeline instanceof DocumentTimeline && animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      ),
    )
    const results = await new AxeBuilder({ page }).include('#main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    const blocking = results.violations
      .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
      .map((violation) => `${label} ${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
    expect(blocking).toEqual([])
  }

  for (const scheme of ['dark', 'light'] as const) {
    test(`tema ${scheme}: filtro de época, estado vacío, tarjetas ADR y diagrama`, async ({ page }) => {
      test.setTimeout(120_000)
      await page.emulateMedia({ colorScheme: scheme })
      await skipIntro(page)
      await page.goto('/es/portfolio')
      await page.locator('[data-cw-era-filter="2024-2026"]').click()
      await scan(page, 'época')
      await page.locator('[data-cw-filter="NEXT AUTH"]').click()
      await expect(page.locator('[data-cw-projects-empty]')).toBeVisible()
      await scan(page, 'vacío')

      await page.goto('/es/portfolio/12')
      const diagram = page.locator('[data-cw-diagram]')
      await diagram.scrollIntoViewIfNeeded()
      await expect(diagram).toHaveAttribute('data-lit', '')
      await page.locator('[data-cw-diagram-layer="umbraco"]').click()
      await page.waitForTimeout(900)
      await scan(page, 'synergos')

      for (const project of NEW_CASES) {
        await page.goto(`/en/portfolio/${project.id}`)
        await scan(page, project.id)
      }
    })
  }
})
