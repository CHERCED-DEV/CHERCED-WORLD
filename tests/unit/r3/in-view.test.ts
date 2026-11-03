import { describe, expect, it } from 'vitest'
import { countAt, easeOutCubic, IN_VIEW_ROOT_MARGIN, watchInView, type InViewEnv, type InViewState } from '@/components/site/about/inView'

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void

function fakeEnv({ reduced = false, withObserver = true, innerHeight = 800 } = {}) {
  const observers: Array<{ callback: Callback; options: { rootMargin: string; threshold: number }; disconnected: boolean }> = []
  class FakeObserver {
    record: (typeof observers)[number]
    constructor(callback: Callback, options: { rootMargin: string; threshold: number }) {
      this.record = { callback, options, disconnected: false }
      observers.push(this.record)
    }
    observe() {}
    disconnect() {
      this.record.disconnected = true
    }
  }
  const env: InViewEnv = {
    innerHeight,
    matchMedia: (query) => ({ matches: reduced && query.includes('reduce') }),
    ...(withObserver ? { IntersectionObserver: FakeObserver } : {}),
  }
  return { env, observers }
}

const at = (top: number) => ({ getBoundingClientRect: () => ({ top }) })

describe('watchInView: revelado al entrar en pantalla', () => {
  it('lo que ya está en pantalla al cargar se muestra completo, sin animar', () => {
    const { env, observers } = fakeEnv()
    const states: InViewState[] = []
    watchInView(at(300), (state) => states.push(state), env)
    expect(states).toEqual(['shown'])
    expect(observers).toHaveLength(0)
  })

  it('con movimiento reducido o sin IntersectionObserver se muestra completo', () => {
    for (const options of [{ reduced: true }, { withObserver: false }]) {
      const { env } = fakeEnv(options)
      const states: InViewState[] = []
      watchInView(at(5000), (state) => states.push(state), env)
      expect(states).toEqual(['shown'])
    }
  })

  it('lo que está debajo queda pendiente y entra una sola vez', () => {
    const { env, observers } = fakeEnv()
    const states: InViewState[] = []
    watchInView(at(2400), (state) => states.push(state), env)
    expect(states).toEqual(['pending'])
    expect(observers[0]!.options).toEqual({ rootMargin: IN_VIEW_ROOT_MARGIN, threshold: 0 })
    observers[0]!.callback([{ isIntersecting: false }])
    expect(states).toEqual(['pending'])
    observers[0]!.callback([{ isIntersecting: true }])
    observers[0]!.callback([{ isIntersecting: true }])
    expect(states).toEqual(['pending', 'in'])
    expect(observers[0]!.disconnected).toBe(true)
  })

  it('al desmontar deja de observar', () => {
    const { env, observers } = fakeEnv()
    const states: InViewState[] = []
    const stop = watchInView(at(2400), (state) => states.push(state), env)
    stop()
    observers[0]!.callback([{ isIntersecting: true }])
    expect(states).toEqual(['pending'])
    expect(observers[0]!.disconnected).toBe(true)
  })
})

describe('conteo de cifras', () => {
  it('arranca en 0, termina exacto en el valor y nunca se pasa', () => {
    expect(countAt(18, 0)).toBe(0)
    expect(countAt(18, 1)).toBe(18)
    expect(countAt(18, 4)).toBe(18)
    expect(countAt(18, -1)).toBe(0)
    let previous = 0
    for (let step = 0; step <= 20; step++) {
      const value = countAt(12, step / 20)
      expect(value).toBeGreaterThanOrEqual(previous)
      expect(value).toBeLessThanOrEqual(12)
      previous = value
    }
  })

  it('usa una curva que desacelera', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })
})
