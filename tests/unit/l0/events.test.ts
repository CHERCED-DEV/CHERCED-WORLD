import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emit, isTheme, on } from '@/lib/events'

describe('eventos entre lanes', () => {
  beforeEach(() => {
    vi.stubGlobal('window', new EventTarget())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('emite y escucha eventos con su detalle', () => {
    const theme = vi.fn()
    const palette = vi.fn()
    const offTheme = on('cw:theme-change', theme)
    on('cw:open-palette', palette)
    emit('cw:theme-change', 'light')
    emit('cw:open-palette')
    expect(theme).toHaveBeenCalledWith('light')
    expect(palette).toHaveBeenCalledWith(undefined)
    offTheme()
    emit('cw:theme-change', 'dark')
    expect(theme).toHaveBeenCalledTimes(1)
  })

  it('valida temas', () => {
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('blue')).toBe(false)
  })
})

describe('sin window', () => {
  it('no falla en el servidor', () => {
    expect(() => emit('cw:open-assistant')).not.toThrow()
    expect(on('cw:open-assistant', () => {})).toBeTypeOf('function')
  })
})
