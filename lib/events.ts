export type Theme = 'dark' | 'light'

export type CwEventMap = {
  'cw:open-palette': undefined
  'cw:open-assistant': undefined
  'cw:theme-change': Theme
}

export type CwEventName = keyof CwEventMap

export const PREFERENCE_KEYS = {
  theme: 'cw-theme',
  introSeen: 'cw-intro-seen',
  capsuleFound: 'cw-capsule-found',
} as const

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

export function emit<K extends CwEventName>(
  name: K,
  ...detail: CwEventMap[K] extends undefined ? [] : [CwEventMap[K]]
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(name, { detail: detail[0] }))
}

export function on<K extends CwEventName>(name: K, handler: (detail: CwEventMap[K]) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (event: Event) => handler(((event as CustomEvent).detail ?? undefined) as CwEventMap[K])
  window.addEventListener(name, listener)
  return () => window.removeEventListener(name, listener)
}
