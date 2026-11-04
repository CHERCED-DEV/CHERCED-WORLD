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

export type AutoLoadContext = { wide: boolean; saveData: boolean; framed: boolean; engaged: boolean }

export function canAutoLoad({ wide, saveData, framed, engaged }: AutoLoadContext): boolean {
  return wide && engaged && !saveData && !framed
}

export const ENGAGE_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'End', 'Home', ' ', 'Spacebar'])
