import { expect, test, type Page } from '@playwright/test'

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

async function open(page: Page, path: string) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path)
}

async function scrollTo(page: Page, selector: string, ratio: number) {
  for (let pass = 0; pass < 3; pass++) {
    await page.locator(selector).evaluate((node, value) => {
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - window.innerHeight * value, behavior: 'instant' })
    }, ratio)
    await page.waitForTimeout(250)
  }
}

function scale(page: Page, selector: string, axis: 'x' | 'y'): Promise<number[]> {
  return page.locator(selector).evaluateAll(
    (nodes, axis) =>
      nodes.map((node) => {
        const transform = getComputedStyle(node, '::after').transform
        if (transform === 'none') return 1
        const values = transform.match(/matrix\(([^)]+)\)/)![1]!.split(',').map(Number)
        return Number((axis === 'x' ? values[0]! : values[3]!).toFixed(2))
      }),
    axis,
  )
}

const pills = '[data-cw-scene-link]'

test.describe('013: animaciones guiadas por scroll', () => {
  test('C1: las escenas leídas quedan llenas, la actual va a medias y las de abajo en cero', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/aboutMe')
    for (let pass = 0; pass < 3; pass++) {
      await page.locator('#scene-knowledge').evaluate((node) => {
        const box = node.getBoundingClientRect()
        window.scrollTo({ top: box.top + window.scrollY + box.height / 2 - window.innerHeight / 2, behavior: 'instant' })
      })
      await page.waitForTimeout(250)
    }
    await expect
      .poll(async () => {
        const [who, career, knowledge, heading] = await scale(page, pills, 'x')
        return who === 1 && career === 1 && knowledge! > 0 && knowledge! < 1 && heading === 0
      })
      .toBe(true)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect.poll(() => scale(page, pills, 'x')).toEqual([1, 1, 1, 1])
  })

  test('C1 en celular: los hilos entre puntos se llenan y el último punto no tiene hilo', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/aboutMe')
    expect(await page.locator('[data-cw-scene-dot]').last().evaluate((node) => getComputedStyle(node, '::after').display)).toBe('none')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect.poll(async () => (await scale(page, '[data-cw-scene-dot]', 'y')).slice(0, 3)).toEqual([1, 1, 1])
  })

  test('C1 con movimiento reducido: sin líneas en el índice', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/aboutMe')
    const contents = await page.locator(pills).evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node, '::after').content))
    expect(contents).toEqual(['none', 'none', 'none', 'none'])
  })

  test('C4: la ruta de "Hacia dónde voy" se traza al llegar y queda completa', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/es/aboutMe')
    const branches = '[data-cw-heading-map] ol > li'
    const spine = () =>
      page.locator('[data-cw-heading-map] ol').evaluate((node) => {
        const transform = getComputedStyle(node, '::before').transform
        return transform === 'none' ? 1 : Number(transform.match(/matrix\(([^)]+)\)/)![1]!.split(',').map(Number)[3]!.toFixed(2))
      })
    await scrollTo(page, '[data-cw-heading-map]', 0.98)
    await expect.poll(spine).toBeLessThan(0.3)
    expect((await scale(page, branches, 'x')).at(-1)).toBe(0)
    await scrollTo(page, '[data-cw-heading-map]', 0.3)
    await expect.poll(spine).toBe(1)
    await expect.poll(() => scale(page, branches, 'x')).toEqual([1, 1, 1, 1])
  })

  test('C4 con movimiento reducido: el trazo está completo desde el principio', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/aboutMe')
    await scrollTo(page, '[data-cw-heading-map]', 0.98)
    expect(await scale(page, '[data-cw-heading-map] ol > li', 'x')).toEqual([1, 1, 1, 1])
  })

  test('la barra de lectura de Synergos se ve y avanza con movimiento reducido, sin brillo', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, '/es/synergos')
    const bar = page.locator('[data-cw-scroll-progress]')
    expect(await bar.evaluate((node) => getComputedStyle(node).display)).toBe('block')
    const value = () =>
      bar.evaluate((node) => {
        const transform = getComputedStyle(node).transform
        return transform === 'none' ? 1 : Number(transform.match(/matrix\(([^)]+)\)/)![1]!.split(',')[0])
      })
    expect(await value()).toBeLessThan(0.1)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect.poll(value).toBeGreaterThan(0.9)
    expect(await bar.evaluate((node) => getComputedStyle(node).boxShadow)).toBe('none')
  })
})
