import { describe, expect, it } from 'vitest'
import { STACK_MAX_PROPERTY, stackActive, stackDepth, stackMax, watchStack, type StackEnv } from '@/components/site/services/stack'

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

  it('el tope máximo deja la tarjeta completa sobre el dock; una tarjeta más alta que la pantalla sube su tope', () => {
    expect(stackMax(844, 80, 623)).toBe(129)
    expect(stackMax(812, 80, 708)).toBe(12)
    expect(stackMax(640, 80, 782)).toBe(-234)
  })
})

type Listener = () => void

function fakeEnv({ mobile = true, motion = true } = {}) {
  const queries = new Map<string, { matches: boolean; listeners: Set<Listener> }>()
  const windowListeners = new Map<string, Set<Listener>>()
  const observed: unknown[] = []
  let disconnected = 0
  const items = [0, 1, 2].map((index) => ({ top: 1000 + index * 700, offsetHeight: 500 + index * 50, index, props: new Map<string, string>() }))
  const host = {
    children: items.map((item) => ({
      getBoundingClientRect: () => ({ top: item.top }),
      offsetHeight: item.offsetHeight,
      style: {
        setProperty: (name: string, value: string) => void item.props.set(name, value),
        removeProperty: (name: string) => void item.props.delete(name),
      },
    })),
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
  return { env, host, items, props: () => items.map((item) => item.props.get(STACK_MAX_PROPERTY) ?? null), fire, setQuery, observed, listeners: windowListeners, disconnected: () => disconnected }
}

describe('watchStack', () => {
  it('en móvil mide, publica la activa al hacer scroll y suelta todo al desmontar', () => {
    const fake = fakeEnv()
    const published: number[] = []
    const stop = watchStack(fake.host, (active) => published.push(active), fake.env)
    expect(fake.props()).toEqual(['252px', '202px', '152px'])
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
    expect(fake.props()).toEqual([null, null, null])
    expect(fake.disconnected()).toBe(1)
    expect(fake.listeners.get('scroll')?.size).toBe(0)
  })

  it('con movimiento reducido o en escritorio no hace nada, y se apaga si cambia la preferencia', () => {
    for (const options of [{ motion: false }, { mobile: false }]) {
      const fake = fakeEnv(options)
      const published: number[] = []
      watchStack(fake.host, (active) => published.push(active), fake.env)
      expect(fake.props()).toEqual([null, null, null])
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
    expect(fake.props()).toEqual([null, null, null])
    expect(fake.listeners.get('scroll')?.size).toBe(0)
  })
})
