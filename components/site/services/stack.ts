export const STACK_QUERY = '(max-width: 767.98px)'

export const STACK_MOTION_QUERY = '(prefers-reduced-motion: no-preference)'

export const STACK_MAX_PROPERTY = '--cw-stack-max'

export const STACK_GAP = 12

export function stackActive(tops: readonly number[], stickTops: readonly number[]): number {
  let active = -1
  for (const [index, top] of tops.entries()) {
    if (top <= (stickTops[index] ?? Number.NEGATIVE_INFINITY) + 1) active = index
  }
  return active
}

export function stackDepth(index: number, active: number): number {
  return active >= 0 && index < active ? active - index : 0
}

export function stackMax(viewportHeight: number, reserve: number, height: number, gap = STACK_GAP): number {
  return Math.round(viewportHeight - reserve - gap - height)
}

type Item = {
  getBoundingClientRect(): { top: number }
  offsetHeight: number
  style: { setProperty(name: string, value: string): void; removeProperty(name: string): void }
}

type Host = { children: ArrayLike<Item> }

type Query = { matches: boolean; addEventListener(type: 'change', listener: () => void): void; removeEventListener(type: 'change', listener: () => void): void }

export type StackEnv = {
  innerHeight: number
  matchMedia(query: string): Query
  addEventListener(type: 'scroll' | 'resize', listener: () => void, options?: { passive: boolean }): void
  removeEventListener(type: 'scroll' | 'resize', listener: () => void): void
  stickTop(item: Item): number
  reserve(): number
  ResizeObserver?: new (callback: () => void) => { observe(target: Item): void; disconnect(): void }
}

function browserEnv(): StackEnv {
  return {
    get innerHeight() {
      return window.innerHeight
    },
    matchMedia: (query) => window.matchMedia(query),
    addEventListener: (type, listener, options) => window.addEventListener(type, listener, options),
    removeEventListener: (type, listener) => window.removeEventListener(type, listener),
    stickTop: (item) => Number.parseFloat(window.getComputedStyle(item as unknown as Element).top) || 0,
    reserve: () => Number.parseFloat(window.getComputedStyle(document.body).paddingBottom) || 0,
    ResizeObserver:
      typeof ResizeObserver === 'undefined'
        ? undefined
        : (ResizeObserver as unknown as StackEnv['ResizeObserver']),
  }
}

export function watchStack(host: Host, onActive: (active: number) => void, env: StackEnv = browserEnv()): () => void {
  const mobile = env.matchMedia(STACK_QUERY)
  const motion = env.matchMedia(STACK_MOTION_QUERY)
  const items = () => Array.from(host.children)
  let stickTops: number[] = []
  let current = -1
  let observer: { disconnect(): void } | null = null
  let running = false

  const publish = (active: number) => {
    if (active === current) return
    current = active
    onActive(active)
  }

  const clear = () => {
    for (const item of items()) item.style.removeProperty(STACK_MAX_PROPERTY)
  }

  const measure = () => {
    const reserve = env.reserve()
    const list = items()
    for (const item of list) item.style.setProperty(STACK_MAX_PROPERTY, `${stackMax(env.innerHeight, reserve, item.offsetHeight)}px`)
    stickTops = list.map((item) => env.stickTop(item))
  }

  const update = () => publish(stackActive(items().map((item) => item.getBoundingClientRect().top), stickTops))

  const onResize = () => {
    measure()
    update()
  }

  const start = () => {
    if (running) return
    running = true
    onResize()
    env.addEventListener('scroll', update, { passive: true })
    env.addEventListener('resize', onResize, { passive: true })
    if (env.ResizeObserver) {
      const resize = new env.ResizeObserver(onResize)
      for (const item of items()) resize.observe(item)
      observer = resize
    }
  }

  const stop = () => {
    if (!running) return
    running = false
    env.removeEventListener('scroll', update)
    env.removeEventListener('resize', onResize)
    observer?.disconnect()
    observer = null
    clear()
    publish(-1)
  }

  const sync = () => (mobile.matches && motion.matches ? start() : stop())

  mobile.addEventListener('change', sync)
  motion.addEventListener('change', sync)
  sync()

  return () => {
    mobile.removeEventListener('change', sync)
    motion.removeEventListener('change', sync)
    stop()
  }
}
