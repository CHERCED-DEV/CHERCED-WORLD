export type InViewState = 'shown' | 'pending' | 'in'

export const IN_VIEW_ATTRIBUTE = 'data-cw-inview'

export const IN_VIEW_ROOT_MARGIN = '0px 0px -12% 0px'

type Target = { getBoundingClientRect(): { top: number } }

type Observer = { observe(target: Target): void; disconnect(): void }

export type InViewEnv = {
  innerHeight: number
  matchMedia(query: string): { matches: boolean }
  IntersectionObserver?: new (
    callback: (entries: Array<{ isIntersecting: boolean }>) => void,
    options: { rootMargin: string; threshold: number },
  ) => Observer
}

export function watchInView(element: Target, onChange: (state: InViewState) => void, env: InViewEnv = window): () => void {
  const Ctor = env.IntersectionObserver
  if (!Ctor || env.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    onChange('shown')
    return () => {}
  }
  if (element.getBoundingClientRect().top < env.innerHeight) {
    onChange('shown')
    return () => {}
  }
  let phase: 'waiting' | 'pending' | 'done' = 'waiting'
  const observer = new Ctor(
    (entries) => {
      if (phase === 'done') return
      if (entries.some((entry) => entry.isIntersecting)) {
        onChange(phase === 'pending' ? 'in' : 'shown')
        phase = 'done'
        observer.disconnect()
        return
      }
      if (phase === 'waiting') {
        phase = 'pending'
        onChange('pending')
      }
    },
    { rootMargin: IN_VIEW_ROOT_MARGIN, threshold: 0 },
  )
  observer.observe(element)
  return () => {
    phase = 'done'
    observer.disconnect()
  }
}

export function easeOutCubic(progress: number): number {
  const p = Math.min(1, Math.max(0, progress))
  return 1 - (1 - p) ** 3
}

export function countAt(value: number, progress: number): number {
  return Math.round(value * easeOutCubic(progress))
}
