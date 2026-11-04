import { expect, test, type Page } from '@playwright/test'
import { aboutFigures } from '@/components/site/about/figures'
import { getProjects, getSite } from '@/lib/content'

const site = getSite()
const { about } = site
const figures = aboutFigures(about, getProjects().length, new Date())
const LIGHT_SRC = /retrato-claro/
const DARK_SRC = /retrato-oscuro/

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

function visiblePortrait(page: Page) {
  return page.locator('[data-cw-portrait] img:visible')
}

test.describe('sobre mí sin JavaScript', () => {
  onlyIn('no-js')

  for (const scheme of ['dark', 'light'] as const) {
    test(`retrato del tema ${scheme} con su alt, uno solo visible`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/es/aboutMe')
      await expect(page.locator('[data-cw-portrait] img')).toHaveCount(3)
      await expect(visiblePortrait(page)).toHaveCount(1)
      const portrait = page.getByRole('img', { name: about.image.alt.es })
      await expect(portrait).toBeVisible()
      await expect(portrait).toHaveAttribute('data-cw-portrait-theme', 'auto')
      await expect
        .poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 20_000 })
        .toBe(true)
      expect(await portrait.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(scheme === 'dark' ? DARK_SRC : LIGHT_SRC)
    })
  }

  test('la carrera es una lista ordenada de 8 empleos con fechas <time>', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const timeline = page.locator('[data-cw-about="career"] ol[data-cw-timeline]')
    await expect(timeline).toBeVisible()
    const jobs = timeline.locator(':scope > li')
    await expect(jobs).toHaveCount(8)
    for (const [index, entry] of about.career.entries()) {
      const job = jobs.nth(index)
      await expect(job).toHaveAttribute('data-cw-job', entry.id)
      await expect(job.getByRole('heading', { level: 3 })).toHaveText(entry.role.es)
      await expect(job.getByText(entry.description.es)).toBeVisible()
      await expect(job.locator('time').first()).toHaveAttribute('datetime', entry.start)
      if (entry.end) await expect(job.locator('time').nth(1)).toHaveAttribute('datetime', entry.end)
      else {
        await expect(job.locator('time')).toHaveCount(1)
        await expect(job).toContainText('Actualidad')
        await expect(job).toHaveAttribute('data-current', '')
      }
    }
  })

  test('las cifras muestran su valor final', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const items = page.locator('[data-cw-about="figures"] [data-cw-figure]')
    await expect(items).toHaveCount(figures.length)
    for (const figure of figures) {
      const item = page.locator(`[data-cw-figure="${figure.id}"]`)
      await expect(item.locator('[data-cw-figure-value]')).toHaveText(String(figure.value))
      await expect(item.locator('dd')).toContainText(`${figure.value}${figure.plus ? '+' : ''}`)
    }
    await expect(page.locator('[data-cw-figure="years"] dt')).toContainText('desde 2019')
  })

  test('las 18 tecnologías llevan ícono real y barra llena, sin placas de iniciales', async ({ page }) => {
    await page.goto('/es/aboutMe')
    const items = page.locator('[data-cw-about="technologies"] li')
    await expect(items).toHaveCount(about.skills.tech.length)
    await expect(page.locator('[data-cw-monogram]')).toHaveCount(0)
    for (const tech of about.skills.tech) {
      const item = page.locator(`[data-cw-tech="${tech.id}"]`)
      await expect(item).toBeVisible()
      const icon = item.locator('img[data-cw-tech-icon]')
      await expect(icon).toHaveAttribute('src', new RegExp(tech.icon!.split('/').pop()!.replace('.', '\\.')))
      const ratio = await item.evaluate((li) => {
        const track = li.querySelector('[data-cw-glass="subtle"]')!
        const fill = li.querySelector('[data-cw-glass="subtle"] > span')!.getBoundingClientRect()
        return fill.width / track.clientWidth
      })
      expect(ratio, tech.id).toBeCloseTo(tech.progress / 100, 2)
    }
  })
})

test.describe('retrato y tema con JavaScript', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('cambiar el tema cambia el retrato al instante y solo descarga el visible', async ({ page }) => {
    await skipIntro(page)
    await page.emulateMedia({ colorScheme: 'dark' })
    const requested: string[] = []
    page.on('request', (request) => {
      if (/retrato-(oscuro|claro)/.test(request.url())) requested.push(request.url())
    })
    await page.goto('/es/aboutMe')
    const portrait = visiblePortrait(page)
    await expect(portrait).toHaveCount(1)
    await expect(portrait).toHaveAttribute('data-cw-portrait-theme', 'auto')
    await expect(portrait).toHaveAttribute('loading', 'eager')
    await expect
      .poll(() => portrait.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 20_000 })
      .toBe(true)
    expect(await portrait.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(DARK_SRC)
    expect(requested.some((url) => LIGHT_SRC.test(url))).toBe(false)

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cw:theme-change', { detail: 'light' })))
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(visiblePortrait(page)).toHaveCount(1)
    await expect(visiblePortrait(page)).toHaveAttribute('data-cw-portrait-theme', 'light')
    await expect(visiblePortrait(page)).toHaveAttribute('src', LIGHT_SRC)
    await expect
      .poll(() => visiblePortrait(page).evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 20_000 })
      .toBe(true)

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cw:theme-change', { detail: 'dark' })))
    await expect(visiblePortrait(page)).toHaveAttribute('data-cw-portrait-theme', 'auto')
    const vitrine = await page.locator('[data-cw-portrait]').evaluate((figure) => getComputedStyle(figure).backgroundImage)
    expect(vitrine).toMatch(/gradient/)
  })

  test('las tarjetas de skills se revelan y las barras se llenan al entrar en pantalla', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const list = page.locator('[data-cw-about="technologies"] ul')
    await expect(list).toHaveAttribute('data-cw-inview', 'pending')
    const first = page.locator(`[data-cw-tech="${about.skills.tech[0]!.id}"]`)
    expect(await first.evaluate((li) => getComputedStyle(li).opacity)).toBe('0')
    await list.scrollIntoViewIfNeeded()
    await expect(list).toHaveAttribute('data-cw-inview', 'in')
    await expect
      .poll(() =>
        first.evaluate((li) => {
          const track = li.querySelector('[data-cw-glass="subtle"]')!
          const fill = li.querySelector('[data-cw-glass="subtle"] > span')!.getBoundingClientRect()
          return Math.round((fill.width / track.clientWidth) * 100)
        }),
        { timeout: 15_000 },
      )
      .toBe(about.skills.tech[0]!.progress)
    await expect.poll(() => first.evaluate((li) => getComputedStyle(li).opacity)).toBe('1')
  })

  test('con movimiento reducido las skills y las cifras se ven completas desde el inicio', async ({ page }) => {
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-about="technologies"] ul')).toHaveAttribute('data-cw-inview', 'shown')
    for (const figure of figures) {
      await expect(page.locator(`[data-cw-figure="${figure.id}"] [data-cw-figure-value]`)).toHaveText(String(figure.value))
    }
  })

  test('cada cifra cuenta una sola vez desde 0 hasta su valor al entrar en pantalla', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const target = figures.find((figure) => figure.value >= 10) ?? figures[0]!
    const value = page.locator(`[data-cw-figure="${target.id}"] [data-cw-figure-value]`)
    await expect(value).toHaveText('0')
    await page.evaluate(() => {
      const seen: string[] = []
      const node = document.querySelector('[data-cw-figure] [data-cw-figure-value]')!.closest('dl')!
      new MutationObserver(() => {
        for (const element of node.querySelectorAll('[data-cw-figure-value]')) seen.push(element.textContent ?? '')
      }).observe(node, { subtree: true, characterData: true, childList: true })
      ;(window as unknown as { __cwSeen: string[] }).__cwSeen = seen
    })
    await value.scrollIntoViewIfNeeded()
    await expect(value).toHaveText(String(target.value))
    const seen = await page.evaluate(() => (window as unknown as { __cwSeen: string[] }).__cwSeen)
    expect(seen.length).toBeGreaterThan(2)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(300)
    await value.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await expect(value).toHaveText(String(target.value))
  })

  test('la línea de tiempo marca los empleos actuales con el nodo verde', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/es/aboutMe')
    const current = about.career.filter((entry) => entry.end === null)
    await expect(page.locator('[data-cw-job][data-current]')).toHaveCount(current.length)
    const color = await page
      .locator(`[data-cw-job="${current[0]!.id}"] > span[aria-hidden]`)
      .evaluate((node) => getComputedStyle(node).backgroundColor)
    expect(color).toBe('rgb(37, 237, 158)')
  })
})

test.describe('grilla de skills (D-06)', () => {
  onlyIn('desktop-chromium')

  test('ninguna tarjeta se corta ni desborda de 320 a 2560 px', async ({ page }) => {
    test.setTimeout(180_000)
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    const widths = [...new Set([...Array.from({ length: 57 }, (_, i) => 320 + i * 40), 856, 375, 390, 1366])].sort((a, b) => a - b)
    const findings: string[] = []
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 })
      const result = await page.evaluate(() => {
        const issues: string[] = []
        if (document.documentElement.scrollWidth > window.innerWidth + 1) issues.push(`scroll ${document.documentElement.scrollWidth}`)
        for (const list of document.querySelectorAll('[data-cw-about="technologies"] ul, [data-cw-about="figures"] dl')) {
          const box = list.getBoundingClientRect()
          if (box.right > window.innerWidth + 0.5) issues.push(`lista ${Math.round(box.right)}`)
          for (const item of list.children) {
            const rect = item.getBoundingClientRect()
            if (rect.width === 0) continue
            if (rect.right > box.right + 0.5 || rect.left < box.left - 0.5) issues.push(`${item.textContent?.slice(0, 12)} fuera`)
            for (const child of item.querySelectorAll('*')) {
              const inner = child.getBoundingClientRect()
              if (inner.width > 0 && (inner.right > rect.right + 0.5 || inner.left < rect.left - 0.5)) {
                issues.push(`${item.textContent?.slice(0, 12)}: ${child.tagName.toLowerCase()} se sale`)
                break
              }
            }
          }
        }
        return issues
      })
      findings.push(...result.map((issue) => `${width}px ${issue}`))
    }
    expect(findings).toEqual([])
  })

  test('856 px muestra cuatro columnas completas y 1440 px seis', async ({ page }) => {
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    const columns = () =>
      page.locator('[data-cw-about="technologies"] ul').evaluate((list) => getComputedStyle(list).gridTemplateColumns.split(' ').length)
    await page.setViewportSize({ width: 856, height: 900 })
    expect(await columns()).toBe(4)
    const csharp = page.locator('[data-cw-tech="csharp"]')
    const box = await csharp.boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(856)
    await page.setViewportSize({ width: 1440, height: 900 })
    expect(await columns()).toBe(6)
  })
})
