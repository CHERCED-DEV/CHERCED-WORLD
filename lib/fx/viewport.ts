import { useSyncExternalStore } from 'react'

export type ScrollDirection = 'up' | 'down'

export type ScrollState = { direction: ScrollDirection; anchor: number }

export const SCROLL_THRESHOLD = 12

export const SCROLL_TOP_ZONE = 64

export const KEYBOARD_MIN_INSET = 120

export function nextScrollState(
  state: ScrollState,
  y: number,
  threshold: number = SCROLL_THRESHOLD,
  topZone: number = SCROLL_TOP_ZONE,
): ScrollState {
  if (y <= topZone) return state.direction === 'up' && state.anchor === y ? state : { direction: 'up', anchor: y }
  const delta = y - state.anchor
  if (state.direction === 'down') {
    if (delta > 0) return { direction: 'down', anchor: y }
    return -delta >= threshold ? { direction: 'up', anchor: y } : state
  }
  if (delta < 0) return { direction: 'up', anchor: y }
  return delta >= threshold ? { direction: 'down', anchor: y } : state
}

export type VisualViewportLike = {
  height: number
  offsetTop: number
  addEventListener(type: 'resize' | 'scroll', listener: () => void): void
  removeEventListener(type: 'resize' | 'scroll', listener: () => void): void
}

export function keyboardInset(innerHeight: number, viewport: Pick<VisualViewportLike, 'height' | 'offsetTop'> | null | undefined): number {
  if (!viewport) return 0
  return Math.max(0, Math.round(innerHeight - viewport.height - viewport.offsetTop))
}

export function isKeyboardOpen(inset: number, minimum: number = KEYBOARD_MIN_INSET): boolean {
  return inset >= minimum
}

export type ViewportEnv = {
  scrollY: number
  innerHeight: number
  visualViewport?: VisualViewportLike | null
  addEventListener(type: 'scroll' | 'resize', listener: () => void, options?: AddEventListenerOptions): void
  removeEventListener(type: 'scroll' | 'resize', listener: () => void): void
  requestAnimationFrame(callback: () => void): number
  cancelAnimationFrame(id: number): void
}

type Store<T> = { subscribe(listener: () => void): () => void; get(): T }

export function createScrollDirectionStore(env: ViewportEnv, threshold: number = SCROLL_THRESHOLD): Store<ScrollDirection> {
  let state: ScrollState = { direction: 'up', anchor: env.scrollY }
  const listeners = new Set<() => void>()
  let frame = 0

  const read = () => {
    frame = 0
    const next = nextScrollState(state, env.scrollY, threshold)
    const changed = next.direction !== state.direction
    state = next
    if (changed) for (const listener of listeners) listener()
  }

  const onScroll = () => {
    if (!frame) frame = env.requestAnimationFrame(read)
  }

  return {
    subscribe(listener) {
      if (!listeners.size) {
        state = { direction: 'up', anchor: env.scrollY }
        env.addEventListener('scroll', onScroll, { passive: true })
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size) return
        env.removeEventListener('scroll', onScroll)
        if (frame) env.cancelAnimationFrame(frame)
        frame = 0
      }
    },
    get: () => state.direction,
  }
}

export function createKeyboardInsetStore(env: ViewportEnv): Store<number> {
  let inset = 0
  const listeners = new Set<() => void>()

  const read = () => {
    const next = keyboardInset(env.innerHeight, env.visualViewport)
    if (next === inset) return
    inset = next
    for (const listener of listeners) listener()
  }

  return {
    subscribe(listener) {
      const viewport = env.visualViewport
      if (!listeners.size) {
        inset = keyboardInset(env.innerHeight, viewport)
        viewport?.addEventListener('resize', read)
        viewport?.addEventListener('scroll', read)
        env.addEventListener('resize', read)
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (listeners.size) return
        viewport?.removeEventListener('resize', read)
        viewport?.removeEventListener('scroll', read)
        env.removeEventListener('resize', read)
      }
    },
    get: () => inset,
  }
}

let scrollStore: Store<ScrollDirection> | null = null
let keyboardStore: Store<number> | null = null

const noop = () => () => {}

function scrollDirectionStore(): Store<ScrollDirection> | null {
  if (typeof window === 'undefined') return null
  scrollStore ??= createScrollDirectionStore(window)
  return scrollStore
}

function keyboardInsetStore(): Store<number> | null {
  if (typeof window === 'undefined') return null
  keyboardStore ??= createKeyboardInsetStore(window)
  return keyboardStore
}

export function useScrollDirection(): ScrollDirection {
  const store = scrollDirectionStore()
  return useSyncExternalStore(store?.subscribe ?? noop, store?.get ?? (() => 'up'), () => 'up')
}

export function useKeyboardInset(): number {
  const store = keyboardInsetStore()
  return useSyncExternalStore(store?.subscribe ?? noop, store?.get ?? (() => 0), () => 0)
}

export function useKeyboardOpen(): boolean {
  return isKeyboardOpen(useKeyboardInset())
}

const mediaStores = new Map<string, Store<boolean>>()

function mediaStore(query: string): Store<boolean> | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  let store = mediaStores.get(query)
  if (!store) {
    const list = window.matchMedia(query)
    store = {
      subscribe(listener) {
        list.addEventListener('change', listener)
        return () => list.removeEventListener('change', listener)
      },
      get: () => list.matches,
    }
    mediaStores.set(query, store)
  }
  return store
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  const store = mediaStore(query)
  return useSyncExternalStore(store?.subscribe ?? noop, store?.get ?? (() => serverValue), () => serverValue)
}
