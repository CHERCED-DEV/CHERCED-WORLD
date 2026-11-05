import { expect, test, type Page } from '@playwright/test'
import { ALL_WIDTHS, onlyMobile, OPEN_SHEET, openReady, settled, smallNewTargets } from './support/mobile'

type State = { name: string; path: string; open?: (page: Page) => Promise<void> }

async function openSheet(page: Page, trigger: string): Promise<void> {
  const control = page.locator(trigger).first()
  await control.scrollIntoViewIfNeeded()
  await control.tap()
  const sheet = page.locator(OPEN_SHEET)
  await expect(sheet).toBeVisible()
  await settled(sheet)
}

const STATES: readonly State[] = [
  { name: 'home con el dock', path: '/es' },
  {
    name: 'menú abierto',
    path: '/es',
    open: async (page) => {
      await page.locator('[data-cw-menu-button]').tap()
      await expect(page.locator('[data-cw-float-menu]')).toBeVisible()
      await page.waitForTimeout(500)
    },
  },
  { name: 'paleta en hoja', path: '/es', open: (page) => openSheet(page, '[data-cw-palette-trigger]') },
  { name: 'asistente en hoja', path: '/es', open: (page) => openSheet(page, '[data-cw-dock-assistant]') },
  { name: 'Sobre mí: mapa, mazo y puntos de escena', path: '/es/aboutMe' },
  { name: 'hoja del lóbulo', path: '/es/aboutMe', open: (page) => openSheet(page, '[data-cw-lobe]') },
  { name: 'hoja de la carta', path: '/es/aboutMe', open: (page) => openSheet(page, '[data-cw-hand-top]') },
  { name: 'Servicios: pila de tarjetas', path: '/es/services' },
  { name: 'portafolio: carrusel, puntos y filtros', path: '/es/portfolio' },
  { name: 'caso 1: galería y embebido', path: '/es/portfolio/1' },
  { name: 'hoja del embebido', path: '/es/portfolio/1', open: (page) => openSheet(page, '[data-cw-embed-sheet-open]') },
  { name: 'Contacto: campos flotantes', path: '/es/contactMe' },
]

test.describe('objetivos táctiles de 44 × 44 px o más en todo lo nuevo (FR-652, SC-605)', () => {
  onlyMobile()

  for (const state of STATES) {
    test(state.name, { tag: ALL_WIDTHS }, async ({ page }) => {
      await openReady(page, state.path)
      await state.open?.(page)
      const small = await smallNewTargets(page)
      expect(small.map((target) => `"${target.label}" ${target.width}x${target.height}`)).toEqual([])
    })
  }
})
