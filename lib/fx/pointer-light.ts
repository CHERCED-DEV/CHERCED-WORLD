export const LIGHT_ATTRIBUTE = 'data-cw-light'

export const LIGHT_SELECTOR = `[${LIGHT_ATTRIBUTE}]`

export const POINTER_LIGHT_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

type LightHost = {
  closest(selector: string): LightHost | null
  parentElement: LightHost | null
  getBoundingClientRect(): { left: number; top: number }
  style: { setProperty(name: string, value: string): void }
}

type MediaQuery = {
  matches: boolean
  addEventListener(type: 'change', listener: () => void): void
  removeEventListener(type: 'change', listener: () => void): void
}

export type PointerLightEnv = {
  matchMedia(query: string): MediaQuery
  requestAnimationFrame(callback: () => void): number
  cancelAnimationFrame(id: number): void
  document: {
    addEventListener(type: 'pointermove', listener: (event: PointerEvent) => void, options: AddEventListenerOptions): void
    removeEventListener(type: 'pointermove', listener: (event: PointerEvent) => void): void
  }
}

const STATE_KEY = Symbol.for('cherced-world.pointer-light')

type Shared = { users: number; stop: (() => void) | null }

function shared(): Shared {
  const holder = globalThis as typeof globalThis & { [STATE_KEY]?: Shared }
  holder[STATE_KEY] ??= { users: 0, stop: null }
  return holder[STATE_KEY]
}

function isHost(value: unknown): value is LightHost {
  return typeof value === 'object' && value !== null && typeof (value as LightHost).closest === 'function'
}

function attach(env: PointerLightEnv): () => void {
  const query = env.matchMedia(POINTER_LIGHT_QUERY)
  let frame = 0
  let x = 0
  let y = 0
  let target: unknown = null
  let listening = false

  const paint = () => {
    frame = 0
    if (!isHost(target)) return
    for (let host = target.closest(LIGHT_SELECTOR); host; host = host.parentElement?.closest(LIGHT_SELECTOR) ?? null) {
      const rect = host.getBoundingClientRect()
      host.style.setProperty('--cw-mx', `${Math.round(x - rect.left)}px`)
      host.style.setProperty('--cw-my', `${Math.round(y - rect.top)}px`)
    }
  }

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return
    x = event.clientX
    y = event.clientY
    target = event.target
    if (!frame) frame = env.requestAnimationFrame(paint)
  }

  const sync = () => {
    if (query.matches && !listening) {
      env.document.addEventListener('pointermove', onMove, { passive: true })
      listening = true
    } else if (!query.matches && listening) {
      env.document.removeEventListener('pointermove', onMove)
      listening = false
      if (frame) env.cancelAnimationFrame(frame)
      frame = 0
    }
  }

  sync()
  query.addEventListener('change', sync)

  return () => {
    query.removeEventListener('change', sync)
    if (listening) env.document.removeEventListener('pointermove', onMove)
    if (frame) env.cancelAnimationFrame(frame)
    listening = false
    frame = 0
  }
}

export function startPointerLight(env: PointerLightEnv = window): () => void {
  const state = shared()
  state.users += 1
  state.stop ??= attach(env)
  let released = false
  return () => {
    if (released) return
    released = true
    state.users -= 1
    if (state.users > 0) return
    state.stop?.()
    state.stop = null
  }
}
