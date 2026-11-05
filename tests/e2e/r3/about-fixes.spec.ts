import { expect, test, type Page } from '@playwright/test'
import { brainData } from '@/components/site/about/brain'
import { getProjects, getSite } from '@/lib/content'
import { contrastRatio, over, parseColor, requiredRatio, withAlpha } from '@/lib/motion/contrast'
import { decodePng } from '../l2/png'

const { about } = getSite()
const data = brainData(about, getProjects(), 'es', 'Actualidad')

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

async function navBottom(page: Page): Promise<number> {
  return page.locator('[data-cw-scene-nav] ol').evaluate((node) => node.getBoundingClientRect().bottom)
}

test.describe('bug 1: el índice fijo no tapa los títulos', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('al saltar con el índice, el título de cada escena queda debajo del índice', async ({ page }) => {
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    const nav = page.locator('[data-cw-scene-nav]')
    for (const [name, heading] of [
      ['Carrera', '#about-career'],
      ['Lo que sé', '#about-knowledge'],
      ['Quién soy', '#about-title'],
    ] as const) {
      await nav.getByRole('link', { name: new RegExp(name) }).click()
      await expect.poll(async () => (await page.locator(heading).boundingBox())!.y).toBeGreaterThanOrEqual((await navBottom(page)) + 4)
    }
  })

  test('al llevar cada tarjeta de carrera a la vista, su título no queda debajo del índice', async ({ page }, testInfo) => {
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    const desktop = testInfo.project.name === 'desktop-chromium'
    const cards = desktop ? page.locator('[data-cw-deck-card]') : page.locator('[data-cw-job] h3')
    const count = await cards.count()
    expect(count).toBe(about.career.length)
    for (let index = 0; index < count; index++) {
      const card = cards.nth(index)
      if (desktop) await card.focus()
      else await card.evaluate((node) => node.closest('li')!.scrollIntoView({ block: 'start' }))
      await page.waitForTimeout(80)
      const top = (await card.boundingBox())!.y
      expect(top, `tarjeta ${index + 1}`).toBeGreaterThanOrEqual((await navBottom(page)) - 1)
    }
  })
})

test.describe('bug 2: sin animación de entrada no queda ningún hueco', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const mode of ['observador mudo', 'sin IntersectionObserver'] as const) {
    test(`con ${mode}, cada hito, cifra y carta se ve`, async ({ page }) => {
      await skipIntro(page)
      await page.addInitScript((kind) => {
        if (kind === 'sin IntersectionObserver') {
          Object.defineProperty(window, 'IntersectionObserver', { value: undefined, configurable: true })
          return
        }
        class Silent {
          observe() {}
          unobserve() {}
          disconnect() {}
          takeRecords() {
            return []
          }
        }
        Object.defineProperty(window, 'IntersectionObserver', { value: Silent, configurable: true })
      }, mode)
      await page.goto('/es/aboutMe')
      await page.waitForTimeout(500)
      const hidden = await page.evaluate(() => {
        const out: string[] = []
        const chain = (node: Element) => {
          let opacity = 1
          for (let current: Element | null = node; current; current = current.parentElement) opacity *= Number(getComputedStyle(current).opacity)
          return opacity
        }
        for (const node of document.querySelectorAll('[data-cw-job], [data-cw-figure], [data-cw-deck-card], [data-cw-lobe]')) {
          const rect = node.getBoundingClientRect()
          const shown = getComputedStyle(node).display !== 'none' && rect.width > 0
          if (shown && chain(node) < 0.99) out.push((node as HTMLElement).dataset.cwJob ?? (node as HTMLElement).dataset.cwFigure ?? node.textContent!.slice(0, 20))
        }
        return out
      })
      expect(hidden).toEqual([])
      for (const figure of ['years', 'projects', 'technologies', 'airlines']) {
        const value = page.locator(`[data-cw-figure="${figure}"] [data-cw-figure-value]`)
        if ((await value.count()) > 0) await expect(value).not.toHaveText('0')
      }
    })
  }

  test('al bajar y subir de golpe, ningún hito queda transparente', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    for (const y of [99999, 0, 1800, 400, 99999, 900]) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
      await page.waitForTimeout(60)
    }
    const transparent = await page.evaluate(() =>
      [...document.querySelectorAll('[data-cw-job], [data-cw-figure]')]
        .filter((node) => getComputedStyle(node).display !== 'none')
        .filter((node) => Number(getComputedStyle(node).opacity) < 0.99)
        .map((node) => node.textContent!.slice(0, 20)),
    )
    expect(transparent).toEqual([])
  })
})

test.describe('bug 3: texto alineado a la izquierda', () => {
  onlyIn('mobile-chromium', 'no-js')

  test('la introducción y los hitos no van justificados', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const aligns = await page.evaluate(() =>
      [...document.querySelectorAll('#about-title ~ * p, [data-cw-job] p, [data-cw-deck-open] p')].map((node) => getComputedStyle(node).textAlign),
    )
    expect(aligns.length).toBeGreaterThan(5)
    expect(aligns.filter((align) => align === 'justify')).toEqual([])
  })
})

test.describe('bug 4: el título del lóbulo se lee una vez y completo', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('el nombre accesible es exacto aun mientras se descifra, y el estado se anuncia una vez', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    await page.locator('[data-cw-brain]').scrollIntoViewIfNeeded()
    const terminal = page.locator('[data-cw-terminal]')
    for (const lobe of data.lobes) {
      await page.locator(`[data-cw-lobe="${lobe.id}"]`).click()
      const heading = terminal.getByRole('heading', { level: 3 })
      await expect(heading).toHaveAccessibleName(lobe.name)
      await expect(terminal.locator('[data-cw-decode]')).toHaveAttribute('aria-hidden', 'true')
      const snapshot = await terminal.ariaSnapshot()
      expect(snapshot.split(`heading "${lobe.name}"`).length - 1, snapshot).toBe(1)
      expect(snapshot.split(`paragraph: "${lobe.name}: `).length - 1, snapshot).toBe(1)
      expect(snapshot).not.toMatch(/[アイウエオカキクケコサシスセソ{}<>]/)
      await expect(page.locator('[data-cw-terminal-status]')).toHaveAttribute('aria-live', 'polite')
      await expect(page.locator('[data-cw-terminal-status]')).toHaveText(new RegExp(`^${lobe.name}: `))
    }
  })
})

test.describe('bug 5: íconos de skills a su tamaño real', () => {
  onlyIn('desktop-chromium')

  test('ningún ícono pide más de 96 px al optimizador', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const sources = await page.locator('[data-cw-brain-skill] img, [data-cw-brain-fallback] img').evaluateAll((images) =>
      images.flatMap((img) => [(img as HTMLImageElement).getAttribute('src') ?? '', (img as HTMLImageElement).getAttribute('srcset') ?? '']),
    )
    const widths = sources.flatMap((value) => [...value.matchAll(/[?&]w=(\d+)/g)].map((match) => Number(match[1])))
    expect(widths.length).toBeGreaterThan(0)
    expect(Math.max(...widths)).toBeLessThanOrEqual(96)
  })
})

test.describe('bug 7: un bloque sin contenido no se muestra', () => {
  onlyIn('desktop-chromium', 'no-js')

  test('ninguna línea de "proyectos" sale vacía; IA aplicada muestra "Aprendiendo ahora"', async ({ page }, testInfo) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    for (const lobe of data.lobes) {
      const scope =
        testInfo.project.name === 'no-js'
          ? page.locator(`[data-cw-lobe-list="${lobe.id}"]`)
          : (await page.locator(`[data-cw-lobe="${lobe.id}"]`).click(), page.locator(`[data-cw-terminal-body="${lobe.id}"]`))
      await expect(scope).toBeVisible()
      const line = scope.locator('[data-cw-meta="projects"]')
      if (lobe.projects.length === 0) await expect(line).toHaveCount(0)
      else await expect(line.getByRole('link')).toHaveCount(lobe.projects.length)
      await expect(scope).not.toContainText(/ninguno/)
      await expect(scope.locator('[data-cw-meta="sources"]')).toBeVisible()
    }

    const ai =
      testInfo.project.name === 'no-js'
        ? page.locator('[data-cw-lobe-list="applied-ai"]')
        : (await page.locator('[data-cw-lobe="applied-ai"]').click(), page.locator('[data-cw-terminal-body="applied-ai"]'))
    await expect(ai.locator('[data-cw-learning]')).toHaveText(about.skills.learningNow!.es)
    for (const name of ['AZURE AI FOUNDRY', 'SEMANTIC KERNEL', 'RAG / EMBEDDINGS']) await expect(ai.getByText(name, { exact: true })).toHaveCount(0)
  })

  test('"Mis habilidades, en palabras" solo existe si tiene texto, y al abrirse lo muestra', async ({ page }, testInfo) => {
    await page.goto('/es/aboutMe')
    const words = page.locator('[data-cw-words]')
    const hasText = about.skills.description.es.trim().length > 0 || about.skills.bullets.some((bullet) => bullet.es.trim().length > 0)
    if (!hasText) {
      await expect(words).toHaveCount(0)
      return
    }
    await expect(words).toHaveCount(1)
    if (testInfo.project.name !== 'no-js') await words.locator('summary').click()
    else await words.evaluate((node) => ((node as HTMLDetailsElement).open = true)).catch(() => undefined)
    if (testInfo.project.name !== 'no-js') {
      const text = (await words.locator(':scope > :not(summary)').allInnerTexts()).join(' ').trim()
      expect(text.length).toBeGreaterThan(40)
    }
  })
})

test.describe('bug 6: grises con 4,5:1 o más en ambos temas', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  for (const scheme of ['dark', 'light'] as const) {
    test(`etiquetas de cifras, fuentes y proyectos de la terminal en tema ${scheme}`, async ({ page }) => {
      await skipIntro(page)
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/es/aboutMe')
      const failures: string[] = []
      for (const scope of ['[data-cw-about="figures"]', '[data-cw-terminal]']) {
        await page.locator(scope).scrollIntoViewIfNeeded()
        await page.waitForTimeout(500)
        const samples = await page.locator(scope).evaluate((root) => {
          const found: Array<{ text: string; color: string; size: number; weight: number; rects: Array<{ x: number; y: number; w: number; h: number }> }> = []
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const element = node.parentElement
            const text = node.textContent?.trim() ?? ''
            if (!element || !text || element.closest('.cw-visually-hidden')) continue
            const style = getComputedStyle(element)
            const grey = style.color !== getComputedStyle(document.body).color
            if (!grey) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            const rects = [...range.getClientRects()]
              .filter((rect) => rect.top > 0 && rect.bottom < window.innerHeight && rect.width > 2)
              .filter((rect) => {
                const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
                return hit !== null && (hit === element || element.contains(hit) || hit.contains(element))
              })
              .map((rect) => ({ x: Math.ceil(rect.left), y: Math.ceil(rect.top), w: Math.floor(rect.width), h: Math.floor(rect.height) }))
            if (rects.length > 0) found.push({ text: text.slice(0, 30), color: style.color, size: Number.parseFloat(style.fontSize), weight: Number.parseInt(style.fontWeight, 10), rects })
          }
          return found
        })
        await page.addStyleTag({ content: '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}' })
        await page.waitForTimeout(120)
        const pixels = decodePng(await page.screenshot({ scale: 'css' }))
        for (const sample of samples) {
          const color = withAlpha(parseColor(sample.color)!, 1)
          let worst = Number.POSITIVE_INFINITY
          for (const rect of sample.rects) {
            for (let y = rect.y + 1; y < rect.y + rect.h - 1; y++) {
              for (let x = rect.x + 1; x < rect.x + rect.w - 1; x++) {
                const i = (y * pixels.width + x) * 4
                const background = { r: pixels.data[i]!, g: pixels.data[i + 1]!, b: pixels.data[i + 2]!, a: 1 }
                worst = Math.min(worst, contrastRatio(over(color, background), background))
              }
            }
          }
          if (worst < Math.max(4.5, requiredRatio(sample.size, sample.weight))) failures.push(`${sample.text}: ${worst.toFixed(2)}`)
        }
        await page.reload()
        await page.waitForTimeout(300)
      }
      expect(failures).toEqual([])
    })
  }
})
