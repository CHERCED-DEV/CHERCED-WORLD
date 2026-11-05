import { describe, expect, it } from 'vitest'
import {
  STACK_MAX_PROPERTY,
  STACK_STEP_PROPERTY,
  stackActive,
  stackDepth,
  stackLayout,
  watchStack,
  type StackEnv,
} from '@/components/site/services/stack'

describe('pila sticky de Servicios: cálculos (FR-634)', () => {
  it('la activa es la última que ya llegó a su tope; antes de llegar no hay activa', () => {
    const stick = [76, 92, 108]
    expect(stackActive([300, 900, 1500], stick)).toBe(-1)
    expect(stackActive([76, 400, 1000], stick)).toBe(0)
    expect(stackActive([76, 92.5, 700], stick)).toBe(1)
    expect(stackActive([-60, -60, -60], stick)).toBe(2)
  })

  it('solo las de atrás tienen profundidad, contada desde la activa', () => {
    expect([0, 1, 2, 3].map((index) => stackDepth(index, 2))).toEqual([2, 1, 0, 0])
    expect([0, 1].map((index) => stackDepth(index, -1))).toEqual([0, 0])
  })

  it('el escalón se achica para que la última quepa sobre el dock, y nunca pasa de 16 px', () => {
    expect(stackLayout({ viewportHeight: 844, reserve: 80, height: 500, firstTop: 76, count: 6 })).toEqual({ max: 252, step: 16 })
    expect(stackLayout({ viewportHeight: 844, reserve: 80, height: 644, firstTop: 76, count: 6 })).toEqual({ max: 108, step: 6 })
    expect(stackLayout({ viewportHeight: 700, reserve: 80, height: 700, firstTop: 76, count: 6 })).toEqual({ max: -92, step: 0 })
  })
})

type Listener = () => void

function fakeEnv({ mobile = true, motion = true } = {}) {
  const queries = new Map<string, { matches: boolean; listeners: Set<Listener> }>()
  const windowListeners = new Map<string, Set<Listener>>()
  const observed: unknown[] = []
  let disconnected = 0
  const items = [0, 1, 2].map((index) => ({ top: 1000 + index * 700, offsetHeight: 600, index }))
  const props = new Map<string, string>()
  const host = {
    children: items.map((item) => ({ getBoundingClientRect: () => ({ top: item.top }), offsetHeight: item.offsetHeight })),
    style: {
      setProperty: (name: string, value: string) => void props.set(name, value),
      removeProperty: (name: string) => void props.delete(name),
    },
  }
  const env: StackEnv = {
    innerHeight: 844,
    matchMedia(query) {
      const entry = queries.get(query) ?? { matches: query.includes('max-width') ? mobile : motion, listeners: new Set<Listener>() }
      queries.set(query, entry)
      return {
        get matches() {
          return entry.matches
        },
        addEventListener: (_type, listener) => void entry.listeners.add(listener),
        removeEventListener: (_type, listener) => void entry.listeners.delete(listener),
      }
    },
    addEventListener(type, listener) {
      const set = windowListeners.get(type) ?? new Set<Listener>()
      set.add(listener)
      windowListeners.set(type, set)
    },
    removeEventListener: (type, listener) => void windowListeners.get(type)?.delete(listener),
    stickTop: (item) => 76 + host.children.indexOf(item as (typeof host.children)[number]) * 16,
    reserve: () => 80,
    ResizeObserver: class {
      observe(target: unknown) {
        observed.push(target)
      }
      disconnect() {
        disconnected += 1
      }
    },
  }
  const fire = (type: string) => windowListeners.get(type)?.forEach((listener) => listener())
  const setQuery = (needle: string, matches: boolean) => {
    for (const [query, entry] of queries) {
      if (!query.includes(needle)) continue
      entry.matches = matches
      entry.listeners.forEach((listener) => listener())
    }
  }
  return { env, host, items, props, fire, setQuery, observed, listeners: windowListeners, disconnected: () => disconnected }
}

describe('watchStack', () => {
  it('en móvil mide, publica la activa al hacer scroll y suelta todo al desmontar', () => {
    const fake = fakeEnv()
    const published: number[] = []
    const stop = watchStack(fake.host, (active) => published.push(active), fake.env)
    expect(fake.props.get(STACK_MAX_PROPERTY)).toBe('152px')
    expect(fake.props.get(STACK_STEP_PROPERTY)).toBe('16px')
    expect(fake.observed).toHaveLength(3)
    expect(published).toEqual([])
    fake.items[0]!.top = 76
    fake.fire('scroll')
    fake.items[1]!.top = 92
    fake.fire('scroll')
    fake.fire('scroll')
    expect(published).toEqual([0, 1])
    stop()
    expect(published).toEqual([0, 1, -1])
    expect(fake.props.size).toBe(0)
    expect(fake.disconnected()).toBe(1)
    expect(fake.listeners.get('scroll')?.size).toBe(0)
  })

  it('con movimiento reducido o en escritorio no hace nada, y se apaga si cambia la preferencia', () => {
    for (const options of [{ motion: false }, { mobile: false }]) {
      const fake = fakeEnv(options)
      const published: number[] = []
      watchStack(fake.host, (active) => published.push(active), fake.env)
      expect(fake.props.size).toBe(0)
      expect(fake.listeners.get('scroll')?.size ?? 0).toBe(0)
      expect(published).toEqual([])
    }
    const fake = fakeEnv()
    const published: number[] = []
    watchStack(fake.host, (active) => published.push(active), fake.env)
    fake.items[0]!.top = 76
    fake.fire('scroll')
    fake.setQuery('reduced-motion', false)
    expect(published).toEqual([0, -1])
    expect(fake.props.size).toBe(0)
    expect(fake.listeners.get('scroll')?.size).toBe(0)
  })
})
