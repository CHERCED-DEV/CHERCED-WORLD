import { describe, expect, it } from 'vitest'
import {
  LIGHT_SELECTOR,
  TOUCH_LIGHT_QUERY,
  TOUCHING_ATTRIBUTE,
  startTouchLight,
  type TouchLightEnv,
} from '@/lib/fx/pointer-light'

type FakeHost = {
  light: boolean
  rect: { left: number; top: number }
  vars: Record<string, string>
  attrs: Record<string, string>
  parentElement: FakeHost | null
  closest(selector: string): FakeHost | null
  getBoundingClientRect(): { left: number; top: number }
  style: { setProperty(name: string, value: string): void }
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
}

function host(light: boolean, rect: { left: number; top: number }, parent: FakeHost | null = null): FakeHost {
  const node: FakeHost = {
    light,
    rect,
    vars: {},
    attrs: {},
    parentElement: parent,
    closest(selector) {
      expect(selector).toBe(LIGHT_SELECTOR)
      for (let current: FakeHost | null = node; current; current = current.parentElement) if (current.light) return current
      return null
    },
    getBoundingClientRect: () => rect,
    style: { setProperty: (name, value) => void (node.vars[name] = value) },
    setAttribute: (name, value) => void (node.attrs[name] = value),
    removeAttribute: (name) => void delete node.attrs[name],
  }
  return node
}

type Handler = (event: PointerEvent) => void

function touchEnv(matches: boolean) {
  const listeners = new Map<string, Handler>()
  const options: AddEventListenerOptions[] = []
  let frames: Array<() => void> = []
  let onChange: (() => void) | null = null
  const query = {
    matches,
    addEventListener: (_: 'change', cb: () => void) => void (onChange = cb),
    removeEventListener: () => void (onChange = null),
  }
  const env: TouchLightEnv = {
    matchMedia: (q) => {
      expect(q).toBe(TOUCH_LIGHT_QUERY)
      return query
    },
    requestAnimationFrame: (cb) => frames.push(cb),
    cancelAnimationFrame: () => void (frames = []),
    document: {
      addEventListener: (type, cb, opts) => {
        listeners.set(type, cb)
        options.push(opts)
      },
      removeEventListener: (type) => void listeners.delete(type),
    },
  }
  const fire = (type: string, target: unknown, x: number, y: number, extra: Partial<PointerEvent> = {}) =>
    listeners.get(type)?.({ target, clientX: x, clientY: y, pointerType: 'touch', pointerId: 7, isPrimary: true, ...extra } as unknown as PointerEvent)
  return {
    env,
    fire,
    listening: () => listeners.size,
    options,
    flush: () => {
      const pending = frames
      frames = []
      for (const cb of pending) cb()
    },
    change: (value: boolean) => {
      query.matches = value
      onChange?.()
    },
  }
}

describe('luz táctil (FR-601, EM-01)', () => {
  it('el dedo enciende el reflejo en el host y sus ancestros, lo mueve en el siguiente cuadro y lo suelta al levantar', () => {
    const fake = touchEnv(true)
    const stop = startTouchLight(fake.env)
    expect(fake.listening()).toBe(4)
    expect(fake.options.every((option) => option.passive === true)).toBe(true)

    const outer = host(true, { left: 0, top: 100 })
    const card = host(true, { left: 20, top: 140 }, outer)
    const text = host(false, { left: 0, top: 0 }, card)

    fake.fire('pointerdown', text, 50, 160)
    expect(card.attrs).toEqual({ [TOUCHING_ATTRIBUTE]: '' })
    expect(outer.attrs).toEqual({ [TOUCHING_ATTRIBUTE]: '' })
    expect(card.vars).toEqual({ '--cw-mx': '30px', '--cw-my': '20px' })

    fake.fire('pointermove', text, 80, 190)
    expect(card.vars['--cw-mx']).toBe('30px')
    fake.flush()
    expect(card.vars).toEqual({ '--cw-mx': '60px', '--cw-my': '50px' })
    expect(outer.vars).toEqual({ '--cw-mx': '80px', '--cw-my': '90px' })

    fake.fire('pointerup', text, 80, 190)
    expect(card.attrs).toEqual({})
    expect(outer.attrs).toEqual({})
    stop()
    expect(fake.listening()).toBe(0)
  })

  it('pointercancel (el navegador toma el scroll) también apaga el reflejo', () => {
    const fake = touchEnv(true)
    const stop = startTouchLight(fake.env)
    const card = host(true, { left: 0, top: 0 })
    fake.fire('pointerdown', card, 10, 10)
    expect(card.attrs[TOUCHING_ATTRIBUTE]).toBe('')
    fake.fire('pointercancel', card, 10, 40)
    expect(card.attrs[TOUCHING_ATTRIBUTE]).toBeUndefined()
    stop()
  })

  it('ignora el mouse, los toques secundarios y lo que no tiene luz', () => {
    const fake = touchEnv(true)
    const stop = startTouchLight(fake.env)
    const card = host(true, { left: 0, top: 0 })
    const plain = host(false, { left: 0, top: 0 })
    fake.fire('pointerdown', card, 5, 5, { pointerType: 'mouse' })
    fake.fire('pointerdown', card, 5, 5, { isPrimary: false })
    fake.fire('pointerdown', plain, 5, 5)
    expect(card.attrs).toEqual({})
    expect(card.vars).toEqual({})
    stop()
  })

  it('con movimiento reducido o puntero fino no escucha, y sigue a la preferencia si cambia', () => {
    const fake = touchEnv(false)
    const stop = startTouchLight(fake.env)
    expect(fake.listening()).toBe(0)
    fake.change(true)
    expect(fake.listening()).toBe(4)
    const card = host(true, { left: 0, top: 0 })
    fake.fire('pointerdown', card, 1, 1)
    fake.change(false)
    expect(fake.listening()).toBe(0)
    expect(card.attrs).toEqual({})
    stop()
  })

  it('comparte un solo juego de listeners entre varios usuarios', () => {
    const fake = touchEnv(true)
    const a = startTouchLight(fake.env)
    const b = startTouchLight(fake.env)
    expect(fake.listening()).toBe(4)
    a()
    expect(fake.listening()).toBe(4)
    b()
    expect(fake.listening()).toBe(0)
  })
})
