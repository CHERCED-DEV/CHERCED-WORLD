export const HAPTIC_TAP_MS = 8

export const HAPTIC_REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

export type HapticsEnv = {
  navigator?: { vibrate?: (pattern: number) => boolean }
  matchMedia?: (query: string) => { matches: boolean }
}

function defaultEnv(): HapticsEnv | undefined {
  return typeof window === 'undefined' ? undefined : window
}

export function tap(env: HapticsEnv | undefined = defaultEnv()): boolean {
  if (!env) return false
  const nav = env.navigator
  if (!nav || typeof nav.vibrate !== 'function') return false
  try {
    if (env.matchMedia?.(HAPTIC_REDUCED_QUERY).matches) return false
    return nav.vibrate(HAPTIC_TAP_MS) === true
  } catch {
    return false
  }
}
