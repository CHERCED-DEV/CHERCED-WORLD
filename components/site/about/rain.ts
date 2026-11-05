export const RAIN_FPS = 20

export const RAIN_FRAME_MS = 1000 / RAIN_FPS

export const RAIN_ACCENT = '#25ED9E'

export const RAIN_GLYPH = 16

export const RAIN_COMPACT_QUERY = '(max-width: 767.98px)'

export type RainParams = { fps: number; frameMs: number; step: number }

export const RAIN_DESKTOP: RainParams = { fps: RAIN_FPS, frameMs: RAIN_FRAME_MS, step: RAIN_GLYPH }

export const RAIN_COMPACT: RainParams = { fps: 12, frameMs: 1000 / 12, step: RAIN_GLYPH * 2 }

export function rainParams(compact: boolean): RainParams {
  return compact ? RAIN_COMPACT : RAIN_DESKTOP
}

export function rainColumns(width: number, params: RainParams): number {
  return Math.max(0, Math.ceil(width / params.step))
}

const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ'
const DIGITS = '0123456789'

export function rainAlphabet(words: readonly string[]): string[] {
  const glyphs = [...KATAKANA, ...DIGITS, '<', '>', '/', '{', '}']
  const letters = words.flatMap((word) => [...word.replace(/\s+/g, '')])
  return [...glyphs, ...letters]
}

export function shouldDraw(now: number, last: number, frameMs: number = RAIN_FRAME_MS): boolean {
  return now - last >= frameMs - 1
}

export type RainState = { running: boolean; visible: boolean; inView: boolean; reduced: boolean }

export function rainActive(state: RainState): boolean {
  return state.running && state.visible && state.inView && !state.reduced
}

export function startRain(canvas: HTMLCanvasElement, words: readonly string[]): () => void {
  const context = canvas.getContext('2d')
  if (!context) return () => {}
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const compact = window.matchMedia(RAIN_COMPACT_QUERY)
  const alphabet = rainAlphabet(words)
  const size = RAIN_GLYPH
  const state: RainState = { running: true, visible: document.visibilityState === 'visible', inView: false, reduced: motion.matches }
  let params = rainParams(compact.matches)
  let columns: number[] = []
  let frame = 0
  let last = 0
  let width = 0
  let height = 0

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    params = rainParams(compact.matches)
    width = canvas.clientWidth
    height = canvas.clientHeight
    canvas.width = Math.max(1, Math.round(width * ratio))
    canvas.height = Math.max(1, Math.round(height * ratio))
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    columns = Array.from({ length: rainColumns(width, params) }, () => Math.floor(Math.random() * -40))
  }

  const draw = (now: number) => {
    frame = 0
    if (!rainActive(state)) return
    frame = requestAnimationFrame(draw)
    if (!shouldDraw(now, last, params.frameMs)) return
    last = now
    context.globalCompositeOperation = 'destination-out'
    context.fillStyle = 'rgba(0, 0, 0, 0.12)'
    context.fillRect(0, 0, width, height)
    context.globalCompositeOperation = 'source-over'
    context.font = `${size}px ui-monospace, Consolas, monospace`
    for (let index = 0; index < columns.length; index++) {
      const row = columns[index]!
      const glyph = alphabet[Math.floor(Math.random() * alphabet.length)]!
      context.fillStyle = Math.random() > 0.975 ? '#FFFFFF' : RAIN_ACCENT
      context.fillText(glyph, index * params.step, row * size)
      columns[index] = row * size > height && Math.random() > 0.975 ? 0 : row + 1
    }
  }

  const sync = () => {
    state.reduced = motion.matches
    if (rainActive(state)) {
      if (!frame) frame = requestAnimationFrame(draw)
    } else {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      if (state.reduced) context.clearRect(0, 0, width, height)
    }
  }

  const observer = new IntersectionObserver((entries) => {
    state.inView = entries.some((entry) => entry.isIntersecting)
    sync()
  })
  const onVisibility = () => {
    state.visible = document.visibilityState === 'visible'
    sync()
  }
  const resizer = new ResizeObserver(() => resize())

  resize()
  observer.observe(canvas)
  resizer.observe(canvas)
  document.addEventListener('visibilitychange', onVisibility)
  motion.addEventListener('change', sync)

  return () => {
    state.running = false
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    observer.disconnect()
    resizer.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
    motion.removeEventListener('change', sync)
  }
}
