import { describe, expect, it } from 'vitest'
import { COMPACT_QUERY, keyboardScroll } from '@/components/contact/keyboard'

const view = { visibleTop: 60, visibleBottom: 500, margin: 12 }

describe('keyboardScroll: el teclado no tapa el campo ni el botón de enviar', () => {
  it('el corte es el de < md', () => {
    expect(COMPACT_QUERY).toBe('(max-width: 767.98px)')
  })

  it('si el campo y el botón ya se ven, no mueve nada', () => {
    expect(keyboardScroll({ ...view, field: { top: 100, bottom: 156 }, action: { top: 300, bottom: 356 } })).toBe(0)
  })

  it('sube lo justo para que el botón quede sobre el teclado con su margen', () => {
    expect(keyboardScroll({ ...view, field: { top: 300, bottom: 440 }, action: { top: 600, bottom: 656 } })).toBe(656 - 488)
  })

  it('si campo y botón no caben juntos, prioriza el campo completo', () => {
    expect(keyboardScroll({ ...view, field: { top: 700, bottom: 756 }, action: { top: 1300, bottom: 1356 } })).toBe(756 - 488)
  })

  it('un campo escondido bajo el header baja hasta verse', () => {
    expect(keyboardScroll({ ...view, field: { top: 20, bottom: 76 }, action: null })).toBe(20 - 72)
  })

  it('un campo más alto que el hueco se alinea arriba', () => {
    expect(keyboardScroll({ ...view, field: { top: 200, bottom: 900 }, action: { top: 950, bottom: 1006 } })).toBe(200 - 72)
  })

  it('sin hueco visible no hace nada', () => {
    expect(keyboardScroll({ visibleTop: 400, visibleBottom: 410, field: { top: 0, bottom: 56 }, action: null })).toBe(0)
  })
})
