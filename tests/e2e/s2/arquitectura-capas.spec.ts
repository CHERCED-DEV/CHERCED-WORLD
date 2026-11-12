import { expect, test, type Page } from '@playwright/test'

const ROUTE = '/es/synergos/arquitectura'
const CHAPTERS = ['recorrido', 'contratos', 'islas', 'patrones', 'fabrica'] as const

function onlyIn(...names: string[]) {
  test.skip(!names.includes(test.info().project.name), `solo en ${names.join(', ')}`)
}

async function open(page: Page, path = ROUTE) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
  await page.goto(path)
}

async function place(page: Page, selector: string, ratio: number) {
  for (let pass = 0; pass < 3; pass++) {
    await page.locator(selector).first().evaluate((node, value) => {
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - window.innerHeight * value, behavior: 'instant' })
    }, ratio)
    await page.waitForTimeout(200)
  }
}

function layer(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((node) => {
    const style = getComputedStyle(node)
    const identity = style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)'
    return { opacity: Number(Number(style.opacity).toFixed(2)), identity, animation: style.animationName }
  })
}

function layered(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-cw-synergos-architecture] *')]
      .filter((node) => getComputedStyle(node).animationName.includes('architecture-layer'))
      .map((node) => {
        const box = node.getBoundingClientRect()
        return { top: box.top, bottom: box.bottom, opacity: Number(getComputedStyle(node).opacity) }
      }),
  )
}

function fills(page: Page) {
  return page.locator('[data-cw-chapter-link]').evaluateAll((links) =>
    links.map((link) => {
      const transform = getComputedStyle(link, '::after').transform
      if (transform === 'none') return 1
      return Number(Number(transform.match(/matrix\(([^)]+)\)/)![1]!.split(',')[0]).toFixed(2))
    }),
  )
}

test.describe('arquitectura de Synergos: capas guiadas por scroll y celular (009, 2026-11-12)', () => {
  test('cada bloque entra como una capa al bajar y queda en opacidad 1 en reposo', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page)
    const diagram = '[data-cw-architecture-diagram="islas"]'
    expect((await layer(page, diagram)).animation).toContain('architecture-layer')
    await place(page, diagram, 1.05)
    await expect.poll(async () => (await layer(page, diagram)).opacity).toBeLessThan(0.05)
    await place(page, diagram, 0.85)
    await expect
      .poll(async () => {
        const state = await layer(page, diagram)
        return state.opacity > 0 && state.opacity < 1 && !state.identity
      })
      .toBe(true)
    await place(page, diagram, 0.3)
    await expect.poll(() => layer(page, diagram)).toMatchObject({ opacity: 1, identity: true })
  })

  test('en cada parada del riel, lo que se lee está en opacidad 1', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page)
    for (const id of CHAPTERS) {
      await page.evaluate((chapter) => document.getElementById(chapter)!.scrollIntoView({ behavior: 'instant', block: 'start' }), id)
      await page.waitForTimeout(300)
      await expect
        .poll(async () => {
          const height = await page.evaluate(() => window.innerHeight)
          return (await layered(page)).filter((item) => item.bottom > 0 && item.top < height * 0.5 && item.opacity < 1)
        }, { message: id })
        .toEqual([])
    }
  })

  test('con movimiento reducido nada se anima y todo queda legible', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    expect(await layered(page)).toEqual([])
    expect(await fills(page)).toEqual([1, 1, 1, 1, 1])
    const contents = await page.locator('[data-cw-chapter-link]').evaluateAll((links) => links.map((link) => getComputedStyle(link, '::after').content))
    expect(new Set(contents)).toEqual(new Set(['none']))
    await place(page, '[data-cw-architecture-diagram="islas"]', 0.95)
    expect(await layer(page, '[data-cw-architecture-diagram="islas"]')).toMatchObject({ opacity: 1, identity: true })
  })

  test('sin JavaScript las capas no existen y cada bloque se lee', async ({ page }) => {
    onlyIn('no-js')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto(ROUTE)
    expect(await layered(page)).toEqual([])
    await place(page, '[data-cw-architecture-diagram="islas"]', 0.95)
    expect(await layer(page, '[data-cw-architecture-diagram="islas"]')).toMatchObject({ opacity: 1, identity: true })
  })

  test('la línea de cada píldora del riel se llena con el avance de su capítulo', async ({ page }) => {
    onlyIn('desktop-chromium', 'mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page)
    await expect.poll(() => fills(page)).toEqual([0, 0, 0, 0, 0])
    await page.locator('#islas').evaluate((node) => {
      const box = node.getBoundingClientRect()
      window.scrollTo({ top: box.top + window.scrollY + box.height / 2 - window.innerHeight / 2, behavior: 'instant' })
    })
    await expect
      .poll(async () => {
        const [recorrido, contratos, islas, patrones, fabrica] = await fills(page)
        return recorrido === 1 && contratos === 1 && islas! > 0 && islas! < 1 && patrones === 0 && fabrica === 0
      })
      .toBe(true)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect.poll(() => fills(page)).toEqual([1, 1, 1, 1, 1])
  })

  test('el riel no muestra barra de scroll, cada píldora va en una línea y la activa queda a la vista', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    const nav = page.locator('[data-cw-chapter-nav]')
    const frame = await nav.evaluate((node: HTMLElement) => {
      const style = getComputedStyle(node)
      return {
        scrollbar: style.scrollbarWidth,
        bar: node.offsetHeight - node.clientHeight - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth),
        scrolls: node.scrollWidth > node.clientWidth,
      }
    })
    expect(frame).toEqual({ scrollbar: 'none', bar: 0, scrolls: true })
    const lines = await nav.locator('a').evaluateAll((links) =>
      links.map((link) => {
        const style = getComputedStyle(link)
        return { space: style.whiteSpace, height: Math.round(link.getBoundingClientRect().height) }
      }),
    )
    expect(lines).toEqual(CHAPTERS.map(() => ({ space: 'nowrap', height: 48 })))
    for (const id of CHAPTERS) {
      await page.evaluate((chapter) => document.getElementById(chapter)!.scrollIntoView({ behavior: 'instant', block: 'start' }), id)
      const link = nav.locator(`[data-cw-chapter-link="${id}"]`)
      await expect(link, id).toHaveAttribute('aria-current', 'location')
      await expect
        .poll(
          () =>
            link.evaluate((node) => {
              const box = node.getBoundingClientRect()
              const rail = node.parentElement!.getBoundingClientRect()
              return box.left >= rail.left - 1 && box.right <= rail.right + 1
            }),
          { message: `${id} a la vista en el riel` },
        )
        .toBe(true)
    }
  })

  test('en el celular, cada paso del flujo alinea ícono y texto en una sola columna', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    for (const kind of ['recorrido', 'contratos', 'islas']) {
      const diagram = page.locator(`[data-cw-architecture-diagram="${kind}"]`)
      await expect(diagram.locator('[data-cw-architecture-svg="wide"]')).toBeHidden()
      await expect(diagram.locator('details')).toBeHidden()
      const steps = diagram.locator('[data-cw-architecture-step]')
      await expect(steps).toHaveCount(5)
      const geometry = await steps.evaluateAll((items) =>
        items.map((item) => {
          const [glyph, text] = [...item.children].map((child) => child.getBoundingClientRect())
          const card = item.getBoundingClientRect()
          return {
            textLeft: Math.round(text!.left),
            glyphBeforeText: glyph!.right <= text!.left,
            glyphCentered: Math.abs(glyph!.top + glyph!.height / 2 - (text!.top + text!.height / 2)) <= 2,
            align: getComputedStyle(item.children[1]!).textAlign,
            height: card.height,
          }
        }),
      )
      expect(new Set(geometry.map((step) => step.textLeft)).size, `${kind}: el texto empieza en la misma columna`).toBe(1)
      for (const step of geometry) {
        expect(step).toMatchObject({ glyphBeforeText: true, glyphCentered: true, align: 'left' })
        expect(step.height, `${kind}: tarjeta sin aire de sobra`).toBeLessThanOrEqual(120)
      }
    }
  })

  test('en escritorio, el recorrido sigue en una fila y el texto alterno sigue en "Leer el diagrama"', async ({ page }) => {
    onlyIn('desktop-chromium')
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page)
    const diagram = page.locator('[data-cw-architecture-diagram="recorrido"]')
    await expect(diagram.locator('[data-cw-architecture-svg="wide"]')).toBeVisible()
    await expect(diagram.locator('[data-cw-architecture-steps]')).toBeHidden()
    await expect(diagram.locator('details summary')).toBeVisible()
  })

  test('las cifras del hero van en una fila pareja a 375, 390 y 412 px', async ({ page }) => {
    onlyIn('mobile-chromium')
    await open(page)
    for (const width of [375, 390, 412]) {
      await page.setViewportSize({ width, height: 844 })
      const facts = await page.locator('[data-cw-architecture-facts] > div').evaluateAll((items) =>
        items.map((item) => {
          const box = item.getBoundingClientRect()
          return { top: Math.round(box.top), width: Math.round(box.width) }
        }),
      )
      expect(facts, String(width)).toHaveLength(3)
      expect(new Set(facts.map((fact) => fact.top)).size, `${width}: una sola fila`).toBe(1)
      expect(Math.max(...facts.map((fact) => fact.width)) - Math.min(...facts.map((fact) => fact.width)), `${width}: columnas iguales`).toBeLessThanOrEqual(1)
    }
  })

  test('el último paso de cada flujo queda libre del dock al llevarlo al borde de abajo', async ({ page }) => {
    onlyIn('mobile-chromium')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page)
    await expect(page.locator('html')).toHaveAttribute('data-cw-dock', 'shown')
    for (const kind of ['recorrido', 'contratos', 'islas']) {
      const last = page.locator(`[data-cw-architecture-diagram="${kind}"] [data-cw-architecture-step]`).last()
      await last.evaluate((node) => node.scrollIntoView({ behavior: 'instant', block: 'end' }))
      await page.waitForTimeout(200)
      const free = await last.evaluate((node) => {
        const box = node.getBoundingClientRect()
        return [box.left + 8, box.left + box.width / 2, box.right - 8].every((x) => node.contains(document.elementFromPoint(x, box.bottom - 6)))
      })
      expect(free, kind).toBe(true)
    }
  })
})
