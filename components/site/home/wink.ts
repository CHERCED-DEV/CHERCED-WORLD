export const WINK_SEEN_KEY = 'cw-wink-seen'

export const WINK_ATTRIBUTE = 'data-cw-wink'

export type WinkState = 'play' | 'done'

export const WINK_TIMING = { strikeAt: 420, strikeMs: 360, writeAt: 820, writeMs: 900 } as const

export type WinkTiming = { strikeAt: number; strikeMs: number; writeAt: number; writeMs: number }

export const WINK_MAX_MS = 2000

export function winkEnd(timing: WinkTiming = WINK_TIMING): number {
  return Math.max(timing.strikeAt + timing.strikeMs, timing.writeAt + timing.writeMs)
}

export type WinkWord = { text: string; delay: number; duration: number }

export function winkWords(title: string, timing: WinkTiming = WINK_TIMING): WinkWord[] {
  const words = title.trim().split(/\s+/).filter((word) => word.length > 0)
  const chars = words.join(' ').length
  if (chars === 0) return []
  const perChar = timing.writeMs / chars
  let offset = 0
  return words.map((text) => {
    const start = timing.writeAt + offset * perChar
    offset += text.length + 1
    return { text, delay: Math.round(start), duration: Math.round(text.length * perChar) }
  })
}

export type WinkRoot = Pick<Element, 'getAttribute' | 'setAttribute'>

export type WinkStorage = Pick<Storage, 'getItem' | 'setItem'>

export type WinkEnv = { root: WinkRoot; storage: () => WinkStorage; reducedMotion: () => boolean }

function isWinkState(value: string | null): value is WinkState {
  return value === 'play' || value === 'done'
}

export function decideWink({ root, storage, reducedMotion }: WinkEnv): WinkState | null {
  const current = root.getAttribute(WINK_ATTRIBUTE)
  if (isWinkState(current)) return current
  try {
    if (reducedMotion()) return null
    const session = storage()
    if (session.getItem(WINK_SEEN_KEY) === '1') {
      root.setAttribute(WINK_ATTRIBUTE, 'done')
      return 'done'
    }
    session.setItem(WINK_SEEN_KEY, '1')
  } catch {
    root.setAttribute(WINK_ATTRIBUTE, 'done')
    return 'done'
  }
  root.setAttribute(WINK_ATTRIBUTE, 'play')
  return 'play'
}

export function finishWink(root: WinkRoot): void {
  if (root.getAttribute(WINK_ATTRIBUTE) === 'play') root.setAttribute(WINK_ATTRIBUTE, 'done')
}

const attribute = JSON.stringify(WINK_ATTRIBUTE)
const key = JSON.stringify(WINK_SEEN_KEY)

export const winkScript = `(function(){var d=document.documentElement,a=${attribute},v=d.getAttribute(a);if(v==='play'||v==='done')return;try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(sessionStorage.getItem(${key})==='1'){d.setAttribute(a,'done');return}sessionStorage.setItem(${key},'1')}catch(e){d.setAttribute(a,'done');return}d.setAttribute(a,'play')})();`
