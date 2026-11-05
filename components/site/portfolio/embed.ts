export const EMBED_TIMEOUT_MS = 10_000

export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups'

export type EmbedStatus = 'idle' | 'loading' | 'ready' | 'slow'

export type EmbedEvent = 'request' | 'load' | 'timeout' | 'reload' | 'reset'

export function nextEmbedStatus(status: EmbedStatus, event: EmbedEvent): EmbedStatus {
  switch (event) {
    case 'request':
      return status === 'idle' || status === 'slow' ? 'loading' : status
    case 'load':
      return status === 'loading' ? 'ready' : status
    case 'timeout':
      return status === 'loading' ? 'slow' : status
    case 'reload':
      return status === 'idle' ? status : 'loading'
    case 'reset':
      return 'idle'
  }
}

export function embedFrameMounted(status: EmbedStatus): boolean {
  return status === 'loading' || status === 'ready'
}

export type EmbedAddress = { origin: string; host: string; path: string }

export function embedAddress(url: string): EmbedAddress {
  const parsed = new URL(url)
  const path = `${parsed.pathname}${parsed.search}`
  return { origin: parsed.origin, host: parsed.host, path: path === '/' ? '' : path }
}

export type AutoLoadContext = { wide: boolean; saveData: boolean; framed: boolean }

export function canAutoLoad({ wide, saveData, framed }: AutoLoadContext): boolean {
  return wide && !saveData && !framed
}

export const SCROLL_SETTLE_MS = 160
export const GESTURE_WINDOW_MS = 1500
export const AUTO_LOAD_RATIO = 0.35
export const FOCUS_GUARD_MS = 400

export function visibleRatio(top: number, bottom: number, viewport: number): number {
  const height = bottom - top
  if (height <= 0 || viewport <= 0) return 0
  const visible = Math.max(0, Math.min(bottom, viewport) - Math.max(top, 0))
  return visible / Math.min(height, viewport)
}

export type SettledScroll = { sinceGesture: number; ratio: number }

export function shouldLoadAfterScroll({ sinceGesture, ratio }: SettledScroll): boolean {
  return sinceGesture >= 0 && sinceGesture <= GESTURE_WINDOW_MS && ratio >= AUTO_LOAD_RATIO
}

export type FocusIntent = { pointerInside: boolean; sinceTab: number }

export function isStolenFocus({ pointerInside, sinceTab }: FocusIntent): boolean {
  return !pointerInside && !(sinceTab >= 0 && sinceTab < 600)
}

export const ENGAGE_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'End', 'Home', ' ', 'Spacebar'])
