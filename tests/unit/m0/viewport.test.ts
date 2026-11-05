import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_MIN_INSET,
  SCROLL_THRESHOLD,
  SCROLL_TOP_ZONE,
  createKeyboardInsetStore,
  createScrollDirectionStore,
  isKeyboardOpen,
  keyboardInset,
  nextScrollState,
  type ScrollState,
  type ViewportEnv,
} from '@/lib/fx/viewport'
import { dockState } from '@/components/shell/Dock'

describe('dirección del scroll', () => {
  it('cerca del inicio siempre es "subir" (el dock se ve)', () => {
    const down: ScrollState = { direction: 'down', anchor: 400 }
    expect(nextScrollState(down, SCROLL_TOP_ZONE).direction).toBe('up')
  })

  it('cambia solo después del umbral, con histéresis en los dos sentidos', () => {
    let state: ScrollState = { direction: 'up', anchor: 200 }
    state = nextScrollState(state, 200 + SCROLL_THRESHOLD - 1)
    expect(state.direction).toBe('up')
    state = nextScrollState(state, 200 + SCROLL_THRESHOLD)
    expect(state).toEqual({ direction: 'down', anchor: 200 + SCROLL_THRESHOLD })
    state = nextScrollState(state, 600)
    expect(state).toEqual({ direction: 'down', anchor: 600 })
    state = nextScrollState(state, 600 - SCROLL_THRESHOLD + 1)
    expect(state.direction).toBe('down')
    state = nextScrollState(state, 600 - SCROLL_THRESHOLD)
    expect(state.direction).toBe('up')
    state = nextScrollState(state, 300)
    expect(state).toEqual({ direction: 'up', anchor: 300 })
  })

  it('el store escucha un solo scroll pasivo, agrupa en un cuadro y avisa solo si cambia la dirección', () => {
    let scroll: (() => void) | null = null
    let frames: Array<() => void> = []
    let removed = 0
    const env = {
      scrollY: 0,
      innerHeight: 800,
      addEventListener: (_: string, cb: () => void, options?: AddEventListenerOptions) => {
        expect(options).toEqual({ passive: true })
        scroll = cb
      },
      removeEventListener: () => void (removed += 1),
      requestAnimationFrame: (cb: () => void) => frames.push(cb),
      cancelAnimationFrame: () => void (frames = []),
    } satisfies ViewportEnv
    const store = createScrollDirectionStore(env)
    let calls = 0
    const stop = store.subscribe(() => (calls += 1))
    const flush = () => {
      const pending = frames
      frames = []
      for (const cb of pending) cb()
    }
    env.scrollY = 300
    scroll!()
    scroll!()
    expect(frames).toHaveLength(1)
    flush()
    expect(store.get()).toBe('down')
    env.scrollY = 500
    scroll!()
    flush()
    expect(calls).toBe(1)
    env.scrollY = 400
    scroll!()
    flush()
    expect(store.get()).toBe('up')
    expect(calls).toBe(2)
    stop()
    expect(removed).toBe(1)
  })
})

describe('teclado del sistema (visualViewport)', () => {
  it('mide lo que el teclado le quita al viewport', () => {
    expect(keyboardInset(844, { height: 844, offsetTop: 0 })).toBe(0)
    expect(keyboardInset(844, { height: 500, offsetTop: 0 })).toBe(344)
    expect(keyboardInset(844, { height: 500, offsetTop: 100 })).toBe(244)
    expect(keyboardInset(844, { height: 900, offsetTop: 0 })).toBe(0)
    expect(keyboardInset(844, null)).toBe(0)
  })

  it('solo cuenta como teclado abierto desde el mínimo (las barras del navegador no)', () => {
    expect(isKeyboardOpen(KEYBOARD_MIN_INSET - 1)).toBe(false)
    expect(isKeyboardOpen(KEYBOARD_MIN_INSET)).toBe(true)
  })

  it('el store sigue los cambios de visualViewport', () => {
    const listeners = new Map<string, () => void>()
    const viewport = {
      height: 844,
      offsetTop: 0,
      addEventListener: (type: 'resize' | 'scroll', cb: () => void) => void listeners.set(`vv-${type}`, cb),
      removeEventListener: (type: 'resize' | 'scroll') => void listeners.delete(`vv-${type}`),
    }
    const env: ViewportEnv = {
      scrollY: 0,
      innerHeight: 844,
      visualViewport: viewport,
      addEventListener: (type, cb) => void listeners.set(type, cb),
      removeEventListener: (type) => void listeners.delete(type),
      requestAnimationFrame: () => 0,
      cancelAnimationFrame: () => {},
    }
    const store = createKeyboardInsetStore(env)
    let calls = 0
    const stop = store.subscribe(() => (calls += 1))
    expect(store.get()).toBe(0)
    viewport.height = 480
    listeners.get('vv-resize')!()
    expect(store.get()).toBe(364)
    expect(calls).toBe(1)
    listeners.get('vv-scroll')!()
    expect(calls).toBe(1)
    stop()
    expect(listeners.size).toBe(0)
  })
})

describe('estado del dock (FR-607)', () => {
  it('se esconde al bajar, vuelve al subir y se oculta con el teclado', () => {
    expect(dockState('up', false, false)).toBe('shown')
    expect(dockState('down', false, false)).toBe('hidden')
    expect(dockState('up', true, false)).toBe('hidden')
  })

  it('con movimiento reducido no se mueve con el scroll, pero sí se aparta del teclado', () => {
    expect(dockState('down', false, true)).toBe('shown')
    expect(dockState('up', true, true)).toBe('hidden')
  })
})
