import { describe, expect, it, vi } from 'vitest'
import { INTRO_MAX_MS, INTRO_SKIP_EVENTS, introScript } from '@/lib/motion/intro'

type Listener = (event: unknown) => void

function run(initial: string | null, options: { storageThrows?: boolean } = {}) {
  const attributes = new Map<string, string>()
  if (initial !== null) attributes.set('data-intro', initial)
  const listeners = new Map<string, { handler: Listener; options: unknown }>()
  const removed: string[] = []
  const session = new Map<string, string>()
  const timers: Array<{ id: number; fn: () => void; ms: number }> = []
  const cleared: number[] = []

  const documentElement = {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  }
  const window = {
    addEventListener: (name: string, handler: Listener, opts: unknown) => listeners.set(name, { handler, options: opts }),
    removeEventListener: (name: string, handler: Listener) => {
      if (listeners.get(name)?.handler === handler) {
        listeners.delete(name)
        removed.push(name)
      }
    },
  }
  const sessionStorage = {
    setItem: (key: string, value: string) => {
      if (options.storageThrows) throw new Error('blocked')
      session.set(key, value)
    },
  }
  const setTimeout = (fn: () => void, ms: number) => {
    const id = timers.length + 1
    timers.push({ id, fn, ms })
    return id
  }
  const clearTimeout = (id: number) => cleared.push(id)

  new Function('document', 'window', 'sessionStorage', 'setTimeout', 'clearTimeout', introScript)(
    { documentElement },
    window,
    sessionStorage,
    setTimeout,
    clearTimeout,
  )

  return { attributes, listeners, removed, session, timers, cleared }
}

describe('script de la intro', () => {
  it('no hace nada si la intro ya se vio o no hay JS que la marque', () => {
    for (const initial of ['seen', null]) {
      const { listeners, timers, session } = run(initial)
      expect(listeners.size).toBe(0)
      expect(timers).toHaveLength(0)
      expect(session.size).toBe(0)
    }
  })

  it('marca cw-intro-seen al mostrarse y la cierra sola a los 1,5 s', () => {
    const { attributes, session, timers, listeners } = run('pending')
    expect(session.get('cw-intro-seen')).toBe('1')
    expect(timers).toHaveLength(1)
    expect(timers[0].ms).toBe(INTRO_MAX_MS)
    expect(INTRO_MAX_MS).toBeLessThanOrEqual(1500)
    expect(attributes.get('data-intro')).toBe('pending')

    timers[0].fn()
    expect(attributes.get('data-intro')).toBe('seen')
    expect(listeners.size).toBe(0)
  })

  it('se salta con clic, tecla o toque, en captura y sin tragarse el evento', () => {
    expect(INTRO_SKIP_EVENTS).toEqual(expect.arrayContaining(['pointerdown', 'keydown', 'touchstart']))
    for (const name of ['pointerdown', 'keydown', 'touchstart']) {
      const { attributes, listeners, removed, timers, cleared } = run('pending')
      expect([...listeners.keys()].sort()).toEqual([...INTRO_SKIP_EVENTS].sort())
      for (const { options } of listeners.values()) expect(options).toEqual({ capture: true, passive: true })

      const event = { preventDefault: vi.fn(), stopPropagation: vi.fn(), stopImmediatePropagation: vi.fn() }
      listeners.get(name)!.handler(event)

      expect(attributes.get('data-intro')).toBe('seen')
      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(event.stopPropagation).not.toHaveBeenCalled()
      expect(event.stopImmediatePropagation).not.toHaveBeenCalled()
      expect(removed.sort()).toEqual([...INTRO_SKIP_EVENTS].sort())
      expect(cleared).toEqual([timers[0].id])
    }
  })

  it('funciona aunque el almacenamiento esté bloqueado', () => {
    const { attributes, timers } = run('pending', { storageThrows: true })
    timers[0].fn()
    expect(attributes.get('data-intro')).toBe('seen')
  })
})
