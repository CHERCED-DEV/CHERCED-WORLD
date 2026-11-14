export type FrameLoopEnv = {
  raf: (callback: (now: number) => void) => number
  caf: (id: number) => void
  hidden: () => boolean
  onVisibility: (listener: () => void) => () => void
  observe: (listener: (visible: boolean) => void) => () => void
}

export type FrameLoop = {
  setActive: (active: boolean) => void
  wake: () => void
  running: () => boolean
  dispose: () => void
}

export function createFrameLoop(frame: (now: number) => boolean, env: FrameLoopEnv): FrameLoop {
  let id = 0
  let disposed = false
  let active = false
  let awake = false
  let onScreen = true

  const allowed = () => !disposed && onScreen && !env.hidden()
  const wanted = () => allowed() && (active || awake)

  const tick = (now: number) => {
    id = 0
    if (!allowed()) return
    awake = frame(now)
    if (wanted()) id = env.raf(tick)
  }

  const refresh = () => {
    if (wanted()) {
      if (!id) id = env.raf(tick)
      return
    }
    if (id) env.caf(id)
    id = 0
  }

  const stopVisibility = env.onVisibility(refresh)
  const stopObserving = env.observe((visible) => {
    onScreen = visible
    refresh()
  })

  return {
    setActive(next) {
      active = next
      refresh()
    },
    wake() {
      awake = true
      refresh()
    },
    running: () => id !== 0,
    dispose() {
      if (disposed) return
      disposed = true
      refresh()
      stopVisibility()
      stopObserving()
    },
  }
}

export function browserLoopEnv(target: Element): FrameLoopEnv {
  return {
    raf: (callback) => window.requestAnimationFrame(callback),
    caf: (id) => window.cancelAnimationFrame(id),
    hidden: () => document.hidden,
    onVisibility: (listener) => {
      document.addEventListener('visibilitychange', listener)
      return () => document.removeEventListener('visibilitychange', listener)
    },
    observe: (listener) => {
      if (typeof IntersectionObserver === 'undefined') return () => undefined
      const observer = new IntersectionObserver((entries) => listener(entries.some((entry) => entry.isIntersecting)))
      observer.observe(target)
      return () => observer.disconnect()
    },
  }
}
