import { describe, expect, it, vi } from 'vitest'
import { acquireBackground, hasBackgroundOwner } from '@/lib/motion/instance'
import { claimIntensity, DEFAULT_INTENSITY, getIntensity, getServerIntensity, subscribeIntensity } from '@/lib/motion/intensity'

describe('store de intensidad', () => {
  it('es sutil por defecto, también en el servidor', () => {
    expect(DEFAULT_INTENSITY).toBe('subtle')
    expect(getIntensity()).toBe('subtle')
    expect(getServerIntensity()).toBe('subtle')
  })

  it('la página que declara full la publica y al salir vuelve a sutil', () => {
    const release = claimIntensity('full')
    expect(getIntensity()).toBe('full')
    release()
    expect(getIntensity()).toBe('subtle')
  })

  it('gana la última declaración montada, aunque se liberen fuera de orden', () => {
    const home = claimIntensity('full')
    const other = claimIntensity('subtle')
    expect(getIntensity()).toBe('subtle')
    other()
    expect(getIntensity()).toBe('full')
    const third = claimIntensity('subtle')
    home()
    expect(getIntensity()).toBe('subtle')
    third()
    expect(getIntensity()).toBe('subtle')
  })

  it('avisa solo cuando cambia el valor y deja de avisar al desuscribirse', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeIntensity(listener)
    const subtle = claimIntensity('subtle')
    expect(listener).not.toHaveBeenCalled()
    const full = claimIntensity('full')
    expect(listener).toHaveBeenCalledTimes(1)
    full()
    full()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    const again = claimIntensity('full')
    expect(listener).toHaveBeenCalledTimes(2)
    again()
    subtle()
  })
})

describe('instancia única del fondo', () => {
  it('solo un Background puede animar por pestaña', () => {
    const release = acquireBackground()
    expect(release).not.toBeNull()
    expect(hasBackgroundOwner()).toBe(true)
    expect(acquireBackground()).toBeNull()
    release?.()
    expect(hasBackgroundOwner()).toBe(false)
    const next = acquireBackground()
    expect(next).not.toBeNull()
    release?.()
    expect(hasBackgroundOwner()).toBe(true)
    next?.()
    expect(hasBackgroundOwner()).toBe(false)
  })
})
