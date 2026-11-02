import { afterEach, describe, expect, it, vi } from 'vitest'
import { LIGHT_SELECTOR, POINTER_LIGHT_QUERY, startPointerLight, type PointerLightEnv } from '@/lib/fx/pointer-light'
import { observeReveal, REVEAL_ATTRIBUTE, type RevealEnv } from '@/lib/fx/reveal'
import { isPlainClick, scrollToTop } from '@/lib/fx/scroll-top'

type FakeHost = {
  light: boolean
  rect: { left: number; top: number }
  vars: Record<string, string>
  parentElement: FakeHost | null
  closest(selector: string): FakeHost | null
  getBoundingClientRect(): { left: number; top: number }
  style: { setProperty(name: string, value: string): void }
}

function host(light: boolean, rect: { left: number; top: number }, parent: FakeHost | null = null): FakeHost {
  const node: FakeHost = {
    light,
    rect,
    vars: {},
    parentElement: parent,
    closest(selector) {
      expect(selector).toBe(LIGHT_SELECTOR)
      for (let current: FakeHost | null = node; current; current = current.parentElement) if (current.light) return current
      return null
    },
    getBoundingClientRect: () => rect,
    style: { setProperty: (name, value) => void (node.vars[name] = value) },
  }
  return node
}

function lightEnv(matches: boolean) {
  let listener: ((event: PointerEvent) => void) | null = null
  let options: AddEventListenerOptions | null = null
  let added = 0
  let frames: Array<() => void> = []
  let onChange: (() => void) | null = null
  const query = {
    matches,
    addEventListener: (_: 'change', cb: () => void) => void (onChange = cb),
    removeEventListener: () => void (onChange = null),
  }
  const env: PointerLightEnv = {
    matchMedia: (q) => {
      expect(q).toBe(POINTER_LIGHT_QUERY)
      return query
    },
    requestAnimationFrame: (cb) => frames.push(cb),
    cancelAnimationFrame: () => void (frames = []),
    document: {
      addEventListener: (_type, cb, opts) => {
        added += 1
        listener = cb
        options = opts
      },
      removeEventListener: () => void (listener = null),
    },
  }
  return {
    env,
    query,
    move: (target: unknown, x: number, y: number, pointerType = 'mouse') =>
      listener?.({ target, clientX: x, clientY: y, pointerType } as unknown as PointerEvent),
    flush: () => {
      const pending = frames
      frames = []
      for (const cb of pending) cb()
    },
    frames: () => frames.length,
    listening: () => listener !== null,
    added: () => added,
    options: () => options,
    change: (value: boolean) => {
      query.matches = value
      onChange?.()
    },
  }
}

describe('pointer-light', () => {
  it('usa un único listener pasivo y escribe variables locales en el siguiente cuadro, sin tocar React', () => {
    const fake = lightEnv(true)
    const stop = startPointerLight(fake.env)
    const again = startPointerLight(fake.env)
    expect(fake.added()).toBe(1)
    expect(fake.options()).toEqual({ passive: true })

    const outer = host(true, { left: 100, top: 50 })
    const inner = host(true, { left: 140, top: 90 }, outer)
    const text = host(false, { left: 0, top: 0 }, inner)
    fake.move(text, 150, 100)
    fake.move(text, 160, 110)
    expect(fake.frames()).toBe(1)
    fake.flush()
    expect(inner.vars).toEqual({ '--cw-mx': '20px', '--cw-my': '20px' })
    expect(outer.vars).toEqual({ '--cw-mx': '60px', '--cw-my': '60px' })

    again()
    expect(fake.listening()).toBe(true)
    stop()
    expect(fake.listening()).toBe(false)
  })

  it('no escucha con movimiento reducido ni en táctil, y se apaga si cambia la preferencia', () => {
    const off = lightEnv(false)
    const stopOff = startPointerLight(off.env)
    expect(off.listening()).toBe(false)
    stopOff()

    const fake = lightEnv(true)
    const stop = startPointerLight(fake.env)
    const card = host(true, { left: 0, top: 0 })
    fake.move(card, 10, 10, 'touch')
    expect(fake.frames()).toBe(0)
    fake.change(false)
    expect(fake.listening()).toBe(false)
    fake.change(true)
    expect(fake.listening()).toBe(true)
    stop()
  })
})

type FakeEntry = { target: { attrs: Record<string, string>; setAttribute(name: string, value: string): void }; isIntersecting: boolean; boundingClientRect: { top: number } }

function revealEnv(reduce = false) {
  let callback: ((entries: FakeEntry[]) => void) | null = null
  const observed = new Set<unknown>()
  let options: unknown = null
  class FakeObserver {
    constructor(cb: (entries: FakeEntry[]) => void, opts: unknown) {
      callback = cb
      options = opts
    }
    observe(target: unknown) {
      observed.add(target)
    }
    unobserve(target: unknown) {
      observed.delete(target)
    }
  }
  const env = {
    innerHeight: 800,
    matchMedia: () => ({ matches: reduce }),
    IntersectionObserver: FakeObserver,
  } as unknown as RevealEnv
  return { env, fire: (entries: FakeEntry[]) => callback?.(entries), observed, options: () => options }
}

function element() {
  const node = { attrs: {} as Record<string, string>, setAttribute: (name: string, value: string) => void (node.attrs[name] = value) }
  return node
}

describe('reveal', () => {
  it('lo que ya se ve se queda visible; lo de abajo espera y se revela una sola vez', () => {
    const fake = revealEnv()
    const top = element()
    const below = element()
    observeReveal(top, fake.env)
    const stop = observeReveal(below, fake.env)
    expect(fake.options()).toEqual({ rootMargin: '0px 0px -10% 0px', threshold: 0 })
    fake.fire([
      { target: top, isIntersecting: true, boundingClientRect: { top: 120 } },
      { target: below, isIntersecting: false, boundingClientRect: { top: 1600 } },
    ])
    expect(top.attrs[REVEAL_ATTRIBUTE]).toBe('shown')
    expect(below.attrs[REVEAL_ATTRIBUTE]).toBe('pending')
    expect(fake.observed.has(top)).toBe(false)

    fake.fire([{ target: below, isIntersecting: true, boundingClientRect: { top: 500 } }])
    expect(below.attrs[REVEAL_ATTRIBUTE]).toBe('in')
    expect(fake.observed.has(below)).toBe(false)
    stop()
  })

  it('con movimiento reducido o sin IntersectionObserver muestra todo de inmediato', () => {
    const reduced = revealEnv(true)
    const a = element()
    observeReveal(a, reduced.env)
    expect(a.attrs[REVEAL_ATTRIBUTE]).toBe('shown')
    expect(reduced.observed.size).toBe(0)

    const b = element()
    observeReveal(b, { innerHeight: 800, matchMedia: () => ({ matches: false }) })
    expect(b.attrs[REVEAL_ATTRIBUTE]).toBe('shown')
  })
})

describe('scroll-top (D-01)', () => {
  afterEach(() => vi.restoreAllMocks())

  function env(reduce: boolean) {
    const scrollTo = vi.fn()
    const focus = vi.fn()
    return {
      scrollTo,
      focus,
      value: {
        matchMedia: () => ({ matches: reduce }),
        scrollTo,
        document: { getElementById: (id: string) => (id === 'main' ? { focus } : null) },
      },
    }
  }

  it('sube a 0 con suavidad y mueve el foco a main sin saltos', () => {
    const fake = env(false)
    scrollToTop(fake.value)
    expect(fake.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' })
    expect(fake.focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('con movimiento reducido sube sin animación', () => {
    const fake = env(true)
    scrollToTop(fake.value)
    expect(fake.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
  })

  it('respeta los clics con modificadores para abrir en otra pestaña', () => {
    const base = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false }
    expect(isPlainClick(base)).toBe(true)
    expect(isPlainClick({ ...base, ctrlKey: true })).toBe(false)
    expect(isPlainClick({ ...base, button: 1 })).toBe(false)
    expect(isPlainClick({ ...base, defaultPrevented: true })).toBe(false)
  })
})
