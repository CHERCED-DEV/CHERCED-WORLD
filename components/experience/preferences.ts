import { PREFERENCE_KEYS, type Theme } from '@/lib/events'

export function readCapsuleFound(): boolean {
  try {
    return window.localStorage.getItem(PREFERENCE_KEYS.capsuleFound) === '1'
  } catch {
    return false
  }
}

export function rememberCapsuleFound(): void {
  try {
    window.localStorage.setItem(PREFERENCE_KEYS.capsuleFound, '1')
  } catch {}
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}
