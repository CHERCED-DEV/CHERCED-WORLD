import { PREFERENCE_KEYS, type Theme } from '@/lib/events'

export const SHORTCUTS_KEY = 'cw-shortcuts'

export type ShortcutsPreference = 'on' | 'off'

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

export function readSingleKeyShortcuts(): boolean {
  try {
    return window.localStorage.getItem(SHORTCUTS_KEY) !== 'off'
  } catch {
    return true
  }
}

export function rememberSingleKeyShortcuts(enabled: boolean): void {
  try {
    window.localStorage.setItem(SHORTCUTS_KEY, enabled ? 'on' : 'off')
  } catch {}
}
