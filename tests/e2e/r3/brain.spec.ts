import { expect, test, type Page } from '@playwright/test'
import { brainData } from '@/components/site/about/brain'
import { getProjects, getSite } from '@/lib/content'

const { about } = getSite()
const data = brainData(about, getProjects(), 'es', 'Actualidad')
const BEFORE_US6C_1440 = 5882

function onlyIn(...names: string[]) {
  test.beforeEach(({}, testInfo) => {
    test.skip(!names.includes(testInfo.project.name), `solo en ${names.join(', ')}`)
  })
}

async function openKnowledge(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto('/es/aboutMe')
  const brain = page.locator('[data-cw-brain]')
  await brain.scrollIntoViewIfNeeded()
  await expect(brain).toBeVisible()
  return brain
}

const lobe = (page: Page, id: string) => page.locator(`[data-cw-lobe="${id}"]`)

const compact = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768

async function closeSheet(page: Page) {
  if ((await page.locator('dialog[data-cw-sheet][open]').count()) === 0) return
  await page.keyboard.press('Escape')
  await expect(page.locator('dialog[data-cw-sheet][open]')).toHaveCount(0)
}

async function chooseLobe(page: Page, id: string) {
  await closeSheet(page)
  if (!compact(page)) {
    await lobe(page, id).click()
    return page.locator('[data-cw-terminal-body]')
  }
  await expect(async () => {
    await lobe(page, id).click()
    await expect(page.locator('dialog[data-cw-sheet][open]')).toBeVisible({ timeout: 1000 })
  }).toPass()
  return page.locator('[data-cw-terminal-body]')
}

test.describe('tres escenas con índice', () => {
  onlyIn('desktop-chromium')

  test('el índice marca la escena visible y salta a cada una', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe')
    const nav = page.getByRole('navigation', { name: 'Escenas de Sobre mí' })
    await expect(nav.getByRole('link')).toHaveText([/Quién soy/, /Carrera/, /Lo que sé/, /Hacia dónde voy/])
    await expect(nav.getByRole('link', { name: /Quién soy/ })).toHaveAttribute('aria-current', 'true')
    for (const [name, id] of [
      ['Hacia dónde voy', 'scene-heading'],
      ['Lo que sé', 'scene-knowledge'],
      ['Carrera', 'scene-career'],
      ['Quién soy', 'scene-who'],
    ] as const) {
      await nav.getByRole('link', { name: new RegExp(name) }).click()
      await expect(page).toHaveURL(new RegExp(`#${id}$`))
      await expect(nav.getByRole('link', { name: new RegExp(name) })).toHaveAttribute('aria-current', 'true')
      await expect
        .poll(() => page.locator(`#${id}`).evaluate((node) => Math.round(node.getBoundingClientRect().top)))
        .toBeLessThan(220)
      expect(await page.locator(`#${id}`).evaluate((node) => node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(-2)
    }
    await expect(nav).toBeInViewport()
  })

  test('a 1440 px las tres escenas originales miden al menos 40 % menos que antes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(() => sessionStorage.setItem('cw-intro-seen', '1'))
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/aboutMe', { waitUntil: 'networkidle' })
    const height = await page.evaluate(() => {
      const knowledge = document.querySelector('[data-cw-scene="knowledge"]')!.getBoundingClientRect().bottom
      const heading = document.querySelector('[data-cw-scene="heading"]')?.getBoundingClientRect().bottom ?? knowledge
      return document.documentElement.scrollHeight - (heading - knowledge)
    })
    test.info().annotations.push({ type: 'altura', description: `${height}px frente a ${BEFORE_US6C_1440}px (${Math.round((1 - height / BEFORE_US6C_1440) * 100)} % menos)` })
    expect(height).toBeLessThanOrEqual(BEFORE_US6C_1440 * 0.6)
  })
})

test.describe('mapa cerebral con teclado y mouse', () => {
  onlyIn('desktop-chromium')

  test('seis lóbulos con aria-pressed; el primero arranca activo con su panel', async ({ page }) => {
    await openKnowledge(page)
    const buttons = page.locator('[data-cw-lobe]')
    await expect(buttons).toHaveCount(6)
    await expect(buttons).toHaveText(data.lobes.map((item) => item.name))
    await expect(lobe(page, 'frontend')).toHaveAttribute('aria-pressed', 'true')
    const body = page.locator('[data-cw-terminal-body]')
    await expect(page.locator('[data-cw-terminal-status]')).toHaveAttribute('aria-live', 'polite')
    await expect(body).not.toHaveAttribute('aria-live', /.*/)
    await expect(body).toContainText('cat frontend.lobe')
    await expect(body.locator('[data-cw-brain-skill]')).toHaveCount(data.lobes[0]!.skills.length)
  })

  test('clic, Enter, Espacio y flechas cambian el lóbulo, sus sinapsis y sus fuentes', async ({ page }) => {
    await openKnowledge(page)
    const body = page.locator('[data-cw-terminal-body]')

    await lobe(page, 'backend-cloud').click()
    await expect(lobe(page, 'backend-cloud')).toHaveAttribute('aria-pressed', 'true')
    await expect(lobe(page, 'frontend')).toHaveAttribute('aria-pressed', 'false')
    await expect(body).toContainText('cat backend-cloud.lobe')
    await expect(body.getByRole('heading', { level: 3 })).toContainText('Backend y nube')
    await expect(body.getByRole('link', { name: 'Synergos' })).toHaveAttribute('href', '/es/portfolio/12')
    await expect(page.locator('[data-cw-synapses="backend-cloud"]')).toHaveAttribute('data-on', '')
    await expect(page.locator('[data-cw-synapses="frontend"]')).not.toHaveAttribute('data-on', /.*/)
    for (const source of data.sources) {
      const lit = data.lobes.find((item) => item.id === 'backend-cloud')!.sources.includes(source.id)
      const chip = page.locator(`[data-cw-source="${source.id}"]`)
      if (lit) await expect(chip).toHaveAttribute('data-lit', '')
      else await expect(chip).not.toHaveAttribute('data-lit', /.*/)
    }

    await page.keyboard.press('ArrowRight')
    await expect(lobe(page, 'applied-ai')).toBeFocused()
    await expect(lobe(page, 'applied-ai')).toHaveAttribute('aria-pressed', 'true')
    await expect(body).toContainText('cat applied-ai.lobe')

    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(lobe(page, 'architecture')).toBeFocused()
    await expect(lobe(page, 'architecture')).toHaveAttribute('aria-pressed', 'true')

    await page.keyboard.press('End')
    await expect(lobe(page, 'business')).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(lobe(page, 'frontend')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(lobe(page, 'architecture')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(lobe(page, 'architecture')).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
    await expect(lobe(page, 'backend-cloud')).toHaveAttribute('aria-pressed', 'true')
  })

  test('una fuente muestra su detalle y enciende los lóbulos que alimenta', async ({ page }) => {
    await openKnowledge(page)
    const unad = page.locator('[data-cw-source="unad"]')
    await unad.click()
    await expect(unad).toHaveAttribute('aria-pressed', 'true')
    const body = page.locator('[data-cw-terminal-body]')
    await expect(body).toContainText('cat unad.src')
    await expect(body).toContainText(about.education.find((entry) => entry.id === 'unad')!.degree.es)
    for (const item of data.lobes) {
      if (item.sources.includes('unad')) await expect(lobe(page, item.id)).toHaveAttribute('data-lit', '')
      else await expect(lobe(page, item.id)).not.toHaveAttribute('data-lit', /.*/)
      await expect(lobe(page, item.id)).toHaveAttribute('aria-pressed', 'false')
    }
  })

  test('la lluvia vive en un canvas acotado a la escena', async ({ page }) => {
    await openKnowledge(page)
    const canvas = page.locator('[data-cw-rain]')
    await expect(canvas).toHaveCount(1)
    const [stage, rain] = await Promise.all([
      page.locator('[data-cw-brain]').boundingBox(),
      canvas.boundingBox(),
    ])
    expect(rain!.width).toBeLessThanOrEqual(stage!.width + 1)
    expect(rain!.height).toBeLessThanOrEqual(stage!.height + 1)
    await expect
      .poll(() => canvas.evaluate((node: HTMLCanvasElement) => {
        const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data
        for (let i = 3; i < pixels.length; i += 4 * 97) if (pixels[i]! > 0) return true
        return false
      }), { timeout: 10_000 })
      .toBe(true)
  })
})

test.describe('corrección de skills (T229)', () => {
  onlyIn('desktop-chromium', 'mobile-chromium')

  test('los seis lóbulos abren su archivo, con practices.lobe y business.lobe en lugar de Oficio', async ({ page }) => {
    await openKnowledge(page)
    await expect(page.locator('[data-cw-lobe]')).toHaveText(data.lobes.map((item) => item.name))
    await expect(page.getByRole('button', { name: /Oficio|Craft/ })).toHaveCount(0)
    const body = page.locator('[data-cw-terminal-body]')
    for (const [id, file] of [
      ['practices', 'practices.lobe'],
      ['business', 'business.lobe'],
      ['architecture', 'architecture.lobe'],
    ] as const) {
      await chooseLobe(page, id)
      await expect(body).toContainText(`cat ${file}`)
      await expect(body.locator('[data-cw-brain-skill]')).toHaveCount(data.lobes.find((item) => item.id === id)!.skills.length)
    }
  })

  test('las skills de 2023 vuelven y llevan su chip de años junto al porcentaje', async ({ page }) => {
    await openKnowledge(page)
    const body = page.locator('[data-cw-terminal-body]')
    await chooseLobe(page, 'frontend')
    for (const [id, used] of [
      ['react', '2022–2023 · 2026'],
      ['nextjs', '2022–2023 · 2026'],
      ['figma', '2019–hoy'],
      ['angular', '2022–hoy'],
    ] as const) {
      const row = body.locator(`[data-cw-brain-skill="${id}"]`)
      await expect(row).toBeVisible()
      await expect(row.locator('[data-cw-used]')).toHaveText(used)
    }
    await chooseLobe(page, 'backend-cloud')
    for (const id of ['nodejs', 'mongodb']) await expect(body.locator(`[data-cw-brain-skill="${id}"] [data-cw-used]`)).toHaveText('2022–2023')
    await expect(body.locator('[data-cw-brain-skill="dotnet"] [data-cw-used]')).toHaveCount(0)
  })

  test('ningún lóbulo muestra una línea de proyectos vacía', async ({ page }) => {
    await openKnowledge(page)
    const body = page.locator('[data-cw-terminal-body]')
    for (const item of data.lobes) {
      await chooseLobe(page, item.id)
      const line = body.locator('[data-cw-meta="projects"]')
      if ((await line.count()) === 0) continue
      await expect(line.getByRole('link')).toHaveCount(item.projects.length)
      expect(item.projects.length, item.id).toBeGreaterThan(0)
    }
  })
})

test.describe('movimiento reducido', () => {
  onlyIn('desktop-chromium')

  test('sin lluvia, sin pulso, sin giro y sin descifrado: solo cambia el estado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openKnowledge(page)
    await expect(page.locator('[data-cw-rain]')).toBeHidden()
    await lobe(page, 'practices').click()
    await expect(page.locator('[data-cw-terminal-body] [data-cw-decode]')).toHaveText('Prácticas de ingeniería')
    const running = await page
      .locator('[data-cw-brain]')
      .evaluate(
        (node) =>
          node
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === 'running' && (animation instanceof CSSAnimation || !(animation instanceof CSSTransition)))
            .map((animation) => (animation instanceof CSSAnimation ? animation.animationName : 'script')).length,
      )
    expect(running).toBe(0)
    const blank = await page.locator('[data-cw-rain]').evaluate((node: HTMLCanvasElement) => {
      const pixels = node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data
      return pixels.every((value, index) => index % 4 !== 3 || value === 0)
    })
    expect(blank).toBe(true)
  })
})

test.describe('sin JavaScript', () => {
  onlyIn('no-js')

  test('cada lóbulo es una lista completa con sus barras, servida por el servidor', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await expect(page.locator('[data-cw-brain]')).toBeHidden()
    for (const item of data.lobes) {
      const list = page.locator(`[data-cw-lobe-list="${item.id}"]`)
      await expect(list).toBeVisible()
      await expect(list.getByRole('heading', { level: 3 })).toHaveText(item.name)
      await expect(list.locator('[data-cw-brain-skill]')).toHaveCount(item.skills.length)
      for (const skill of item.skills) await expect(list.getByText(skill.name, { exact: true })).toBeVisible()
    }
    for (const source of data.sources) await expect(page.locator(`[data-cw-source-item="${source.id}"]`)).toBeVisible()
    await expect(page.locator('[data-cw-brain-fallback] [data-cw-platzi]')).toHaveAttribute('href', about.courses.platzi.href)
  })

  test('el índice de escenas son enlaces de ancla que funcionan sin JS', async ({ page }) => {
    await page.goto('/es/aboutMe')
    await page.getByRole('link', { name: /Lo que sé/ }).click()
    await expect(page).toHaveURL(/#scene-knowledge$/)
  })
})

test.describe('móvil a 375 px', () => {
  onlyIn('mobile-chromium')

  test('el mapa compacto (006, EM-02): lóbulos en círculo dentro del mapa y el panel en una hoja', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await openKnowledge(page)
    const lobes = page.locator('[data-cw-lobe]')
    await expect(lobes).toHaveCount(data.lobes.length)
    const map = (await page.locator('[data-cw-brain-map]').boundingBox())!
    expect(Math.abs(map.width - map.height)).toBeLessThanOrEqual(1)
    for (const item of await lobes.all()) {
      const box = (await item.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(map.x)
      expect(box.x + box.width).toBeLessThanOrEqual(map.x + map.width + 0.5)
    }
    await expect(page.locator('[data-cw-brain] svg[data-cw-brain-compact]')).toBeVisible()
    await expect(page.locator('[data-cw-terminal]')).toBeHidden()
    const body = await chooseLobe(page, data.lobes[3]!.id)
    await expect(lobes.nth(3)).toHaveAttribute('aria-pressed', 'true')
    await expect(body).toHaveAttribute('data-cw-terminal-body', data.lobes[3]!.id)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  })

  for (const width of [320, 360, 414, 767]) {
    test(`sin scroll horizontal a ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openKnowledge(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      const map = await page.locator('[data-cw-brain-map]').boundingBox()
      expect(map!.x).toBeGreaterThanOrEqual(0)
      expect(map!.x + map!.width).toBeLessThanOrEqual(width)
      const panel = await (await chooseLobe(page, 'frontend')).boundingBox()
      expect(panel!.x).toBeGreaterThanOrEqual(0)
      expect(panel!.x + panel!.width).toBeLessThanOrEqual(width)
    })
  }
})

test.describe('mapa sin desbordes en escritorio', () => {
  onlyIn('desktop-chromium')

  test('de 768 a 2560 px el mapa, los lóbulos y el panel quedan dentro', async ({ page }) => {
    test.setTimeout(120_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openKnowledge(page)
    const findings: string[] = []
    for (const width of [768, 856, 992, 1024, 1099, 1100, 1280, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 })
      const issues = await page.evaluate(() => {
        const out: string[] = []
        if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push('scroll')
        const map = document.querySelector('[data-cw-brain-map]')!.getBoundingClientRect()
        for (const node of document.querySelectorAll('[data-cw-lobe]')) {
          const rect = node.getBoundingClientRect()
          if (rect.left < map.left - 1 || rect.right > map.right + 1 || rect.top < map.top - 1 || rect.bottom > map.bottom + 1) {
            out.push(`${(node as HTMLElement).dataset.cwLobe} fuera del mapa`)
          }
        }
        const panel = document.querySelector('[data-cw-terminal]')!.getBoundingClientRect()
        if (panel.right > window.innerWidth) out.push('panel')
        return out
      })
      findings.push(...issues.map((issue) => `${width}px ${issue}`))
    }
    expect(findings).toEqual([])
  })
})
