import { expect, test, type Page } from '@playwright/test'
import { aboutFigures, figureDigits, figureText } from '@/components/site/about/figures'
import { getSite } from '@/lib/content'

const site = getSite()
const { about } = site
const figures = aboutFigures(about)
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
      await expect(job.getByText(entry.highlights?.[0]?.es ?? entry.description.es)).toBeVisible()
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
      await expect(item.locator('[data-cw-figure-value]')).toHaveText(figureDigits(figure.value, 'es'))
      await expect(item.locator('dd')).toContainText(figureText(figure, 'es'))
    }
    await expect(page.locator('[data-cw-figure="years"] dt'), 'C3: 6 años, sin la nota "desde 2019"').not.toContainText('2019')
    for (const id of ['adrs', 'tests']) await expect(page.locator(`[data-cw-figure="${id}"] dt`), 'C4: con la fecha del conteo').toContainText('a nov 2026')
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
    expect(await page.locator('[data-cw-portrait]').evaluate((figure) => getComputedStyle(figure).backgroundImage)).toBe('none')

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('cw:theme-change', { detail: 'dark' })))
    await expect(visiblePortrait(page)).toHaveAttribute('data-cw-portrait-theme', 'auto')
  })

  test('con movimiento reducido las cifras se ven completas desde el inicio', async ({ page }) => {
    await skipIntro(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    for (const figure of figures) {
      await expect(page.locator(`[data-cw-figure="${figure.id}"] [data-cw-figure-value]`)).toHaveText(figureDigits(figure.value, 'es'))
    }
  })

  test('cada cifra cuenta una sola vez desde 0 hasta su valor al entrar en pantalla', async ({ page }) => {
    await skipIntro(page)
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 480 })
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
    await expect(value).toHaveText(figureDigits(target.value, 'es'))
    const seen = await page.evaluate(() => (window as unknown as { __cwSeen: string[] }).__cwSeen)
    expect(seen.length).toBeGreaterThan(2)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(300)
    await value.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await expect(value).toHaveText(figureDigits(target.value, 'es'))
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
