import { describe, expect, it, vi } from 'vitest'
import { HAPTIC_REDUCED_QUERY, HAPTIC_TAP_MS, tap } from '@/lib/fx/haptics'

describe('háptica (FR-606, US5)', () => {
  it('vibra 8 ms una vez si existe la API y no hay movimiento reducido', () => {
    const vibrate = vi.fn(() => true)
    const matchMedia = vi.fn(() => ({ matches: false }))
    expect(tap({ navigator: { vibrate }, matchMedia })).toBe(true)
    expect(HAPTIC_TAP_MS).toBe(8)
    expect(vibrate).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith(8)
    expect(matchMedia).toHaveBeenCalledWith(HAPTIC_REDUCED_QUERY)
  })

  it('llama vibrate como método del navigator (sin "Illegal invocation")', () => {
    const nav = {
      calls: 0,
      vibrate(this: { calls: number }, _: number) {
        this.calls += 1
        return true
      },
    }
    expect(tap({ navigator: nav, matchMedia: () => ({ matches: false }) })).toBe(true)
    expect(nav.calls).toBe(1)
  })

  it('con movimiento reducido no vibra', () => {
    const vibrate = vi.fn(() => true)
    expect(tap({ navigator: { vibrate }, matchMedia: () => ({ matches: true }) })).toBe(false)
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('sin la API, sin navigator, sin window o si el navegador la bloquea, no falla', () => {
    expect(tap({ navigator: {}, matchMedia: () => ({ matches: false }) })).toBe(false)
    expect(tap({ matchMedia: () => ({ matches: false }) })).toBe(false)
    expect(tap(undefined)).toBe(false)
    expect(tap()).toBe(false)
    const throwing = () => {
      throw new Error('bloqueada')
    }
    expect(tap({ navigator: { vibrate: throwing }, matchMedia: () => ({ matches: false }) })).toBe(false)
    expect(tap({ navigator: { vibrate: () => false } })).toBe(false)
  })
})
