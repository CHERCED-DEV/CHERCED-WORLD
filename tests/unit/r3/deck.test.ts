import { describe, expect, it } from 'vitest'
import { DECK_MIN_WIDTH, deckSlot, flightFrom, flightTransform } from '@/components/site/about/deck'
import { getSite } from '@/lib/content'

describe('mesa de la carrera (US6b)', () => {
  const total = getSite().about.career.length

  it('cada tarjeta tiene posición y giro deterministas por índice', () => {
    const first = Array.from({ length: total }, (_, index) => deckSlot(index))
    const second = Array.from({ length: total }, (_, index) => deckSlot(index))
    expect(second).toEqual(first)
    expect(new Set(first.map((slot) => `${slot.x}:${slot.y}`)).size).toBe(total)
  })

  it('las posiciones quedan dentro de la mesa y el giro es leve', () => {
    for (let index = 0; index < 20; index++) {
      const slot = deckSlot(index)
      expect(slot.x).toBeGreaterThanOrEqual(0)
      expect(slot.x).toBeLessThanOrEqual(1)
      expect(slot.y).toBeGreaterThanOrEqual(0)
      expect(slot.y).toBeLessThanOrEqual(1)
      expect(Math.abs(slot.rotate)).toBeLessThanOrEqual(6)
      expect(slot.rotate).not.toBe(0)
    }
  })

  it('alterna el sentido del giro para que se vean tiradas, no alineadas', () => {
    const signs = Array.from({ length: 8 }, (_, index) => Math.sign(deckSlot(index).rotate))
    expect(signs.filter((sign) => sign > 0).length).toBe(4)
    expect(signs.filter((sign) => sign < 0).length).toBe(4)
  })

  it('la mesa solo existe desde 992 px', () => {
    expect(DECK_MIN_WIDTH).toBe(992)
  })
})

describe('vuelo FLIP de la tarjeta', () => {
  it('calcula el desplazamiento entre centros, la escala por tamaño sin girar y el giro de origen', () => {
    const geometry = flightFrom(
      { left: 100, top: 400, width: 300, height: 240, offsetWidth: 288, offsetHeight: 216, rotate: -5 },
      { left: 290, top: 150, width: 700, height: 500 },
    )
    expect(geometry).toEqual({ dx: -390, dy: 120, sx: 0.411, sy: 0.432, rotate: -5 })
    expect(flightTransform(geometry)).toBe('translate(-390px, 120px) rotate(-5deg) scale(0.411, 0.432)')
  })

  it('no divide por cero si el destino todavía no tiene tamaño', () => {
    const geometry = flightFrom({ left: 0, top: 0, width: 10, height: 10, offsetWidth: 10, offsetHeight: 10, rotate: 2 }, { left: 0, top: 0, width: 0, height: 0 })
    expect(geometry.sx).toBe(1)
    expect(geometry.sy).toBe(1)
  })
})
