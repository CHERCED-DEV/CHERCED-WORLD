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

function share(holder: Shared, start: () => () => void): () => void {
  holder.users += 1
  holder.stop ??= start()
  let released = false
  return () => {
    if (released) return
    released = true
    holder.users -= 1
    if (holder.users > 0) return
    holder.stop?.()
    holder.stop = null
  }
}

export function startPointerLight(env: PointerLightEnv = window): () => void {
  return share(shared(), () => attach(env))
}

export const TOUCH_LIGHT_QUERY = '(pointer: coarse) and (prefers-reduced-motion: no-preference)'

export const TOUCHING_ATTRIBUTE = 'data-cw-touching'

type TouchHost = {
  parentElement: TouchHost | null
  closest(selector: string): TouchHost | null
  getBoundingClientRect(): { left: number; top: number }
  style: { setProperty(name: string, value: string): void }
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
}

type TouchType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel'

export type TouchLightEnv = {
  matchMedia(query: string): MediaQuery
  requestAnimationFrame(callback: () => void): number
  cancelAnimationFrame(id: number): void
  document: {
    addEventListener(type: TouchType, listener: (event: PointerEvent) => void, options: AddEventListenerOptions): void
    removeEventListener(type: TouchType, listener: (event: PointerEvent) => void): void
  }
}

const TOUCH_KEY = Symbol.for('cherced-world.touch-light')

function touchShared(): Shared {
  const holder = globalThis as typeof globalThis & { [TOUCH_KEY]?: Shared }
  holder[TOUCH_KEY] ??= { users: 0, stop: null }
  return holder[TOUCH_KEY]
}

function isTouchHost(value: unknown): value is TouchHost {
  return isHost(value) && typeof (value as unknown as TouchHost).setAttribute === 'function'
}

function chain(target: unknown): TouchHost[] {
  const hosts: TouchHost[] = []
  if (!isTouchHost(target)) return hosts
  for (let host = target.closest(LIGHT_SELECTOR); host; host = host.parentElement?.closest(LIGHT_SELECTOR) ?? null) hosts.push(host)
  return hosts
}

function attachTouch(env: TouchLightEnv): () => void {
  const query = env.matchMedia(TOUCH_LIGHT_QUERY)
  let frame = 0
  let x = 0
  let y = 0
  let pointer: number | null = null
  let hosts: TouchHost[] = []
  let listening = false

  const paint = () => {
    frame = 0
    for (const host of hosts) {
      const rect = host.getBoundingClientRect()
      host.style.setProperty('--cw-mx', `${Math.round(x - rect.left)}px`)
      host.style.setProperty('--cw-my', `${Math.round(y - rect.top)}px`)
    }
  }

  const release = () => {
    for (const host of hosts) host.removeAttribute(TOUCHING_ATTRIBUTE)
    hosts = []
    pointer = null
    if (frame) env.cancelAnimationFrame(frame)
    frame = 0
  }

  const onDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return
    release()
    hosts = chain(event.target)
    if (!hosts.length) return
    pointer = event.pointerId
    x = event.clientX
    y = event.clientY
    paint()
    for (const host of hosts) host.setAttribute(TOUCHING_ATTRIBUTE, '')
  }

  const onMove = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return
    x = event.clientX
    y = event.clientY
    if (!frame) frame = env.requestAnimationFrame(paint)
  }

  const onEnd = (event: PointerEvent) => {
    if (event.pointerId === pointer) release()
  }

  const listeners: Array<[TouchType, (event: PointerEvent) => void]> = [
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onEnd],
    ['pointercancel', onEnd],
  ]

  const sync = () => {
    if (query.matches && !listening) {
      for (const [type, listener] of listeners) env.document.addEventListener(type, listener, { passive: true })
      listening = true
    } else if (!query.matches && listening) {
      for (const [type, listener] of listeners) env.document.removeEventListener(type, listener)
      listening = false
      release()
    }
  }

  sync()
  query.addEventListener('change', sync)

  return () => {
    query.removeEventListener('change', sync)
    if (listening) for (const [type, listener] of listeners) env.document.removeEventListener(type, listener)
    listening = false
    release()
  }
}

export function startTouchLight(env: TouchLightEnv = window): () => void {
  return share(touchShared(), () => attachTouch(env))
}
