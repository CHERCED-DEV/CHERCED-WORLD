export const REVEAL_ATTRIBUTE = 'data-cw-reveal'

export const REVEAL_ROOT_MARGIN = '0px 0px -10% 0px'

export type RevealState = '' | 'pending' | 'in' | 'shown'

type RevealTarget = { setAttribute(name: string, value: string): void }

type Entry = { target: RevealTarget; isIntersecting: boolean; boundingClientRect: { top: number } }

type Observer = { observe(target: RevealTarget): void; unobserve(target: RevealTarget): void }

export type RevealEnv = {
  innerHeight: number
  matchMedia(query: string): { matches: boolean }
  IntersectionObserver?: new (
    callback: (entries: Entry[]) => void,
    options: { rootMargin: string; threshold: number },
  ) => Observer
}

type Registry = { env: RevealEnv; observer: Observer; seen: WeakSet<RevealTarget> }

let registry: Registry | null = null

function createRegistry(env: RevealEnv, Ctor: NonNullable<RevealEnv['IntersectionObserver']>): Registry {
  const seen = new WeakSet<RevealTarget>()
  const observer = new Ctor(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target
        if (!seen.has(element)) {
          seen.add(element)
          if (entry.boundingClientRect.top < env.innerHeight) {
            element.setAttribute(REVEAL_ATTRIBUTE, 'shown')
            observer.unobserve(element)
          } else {
            element.setAttribute(REVEAL_ATTRIBUTE, 'pending')
          }
          continue
        }
        if (entry.isIntersecting) {
          element.setAttribute(REVEAL_ATTRIBUTE, 'in')
          observer.unobserve(element)
        }
      }
    },
    { rootMargin: REVEAL_ROOT_MARGIN, threshold: 0 },
  )
  return { env, observer, seen }
}

export const SWEEP_ATTRIBUTE = 'data-cw-sweep'

export const SWEEP_TIMELINE_SUPPORT = 'animation-timeline: view()'

export const SWEEP_THRESHOLD = 0.35

export type SweepEnv = {
  matchMedia(query: string): { matches: boolean }
  CSS?: { supports(condition: string): boolean }
  IntersectionObserver?: new (
    callback: (entries: Array<{ target: RevealTarget; isIntersecting: boolean }>) => void,
    options: { threshold: number },
  ) => Observer
}

export function observeSweep(element: RevealTarget | null, env: SweepEnv = window): () => void {
  if (!element) return () => {}
  if (env.CSS?.supports(SWEEP_TIMELINE_SUPPORT)) return () => {}
  if (env.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const Ctor = env.IntersectionObserver
  if (!Ctor) return () => {}
  const observer = new Ctor(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute(SWEEP_ATTRIBUTE, 'in')
        observer.unobserve(entry.target)
      }
    },
    { threshold: SWEEP_THRESHOLD },
  )
  observer.observe(element)
  return () => observer.unobserve(element)
}

export function observeReveal(element: RevealTarget | null, env: RevealEnv = window): () => void {
  if (!element) return () => {}
  const Ctor = env.IntersectionObserver
  if (!Ctor || env.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.setAttribute(REVEAL_ATTRIBUTE, 'shown')
    return () => {}
  }
  if (!registry || registry.env !== env) registry = createRegistry(env, Ctor)
  const { observer } = registry
  observer.observe(element)
  return () => observer.unobserve(element)
}
