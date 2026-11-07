import type { Quality } from '@/lib/ailab/games/adapt'
import { BALL_RADIUS, COURT, PADDLE, PADDLE_U, type RallyState, type Side } from '@/lib/ailab/games/physics'

export type Orientation = 'landscape' | 'portrait'

export const MAX_RATIO = 1.5

const GREEN = '#25ed9e'

const QUALITY: Record<Quality, { particles: number; trail: number; sparks: number }> = {
  high: { particles: 16, trail: 12, sparks: 18 },
  medium: { particles: 10, trail: 6, sparks: 8 },
  low: { particles: 5, trail: 0, sparks: 0 },
}

type Spark = { x: number; y: number; vx: number; vy: number; life: number }

type Point = { x: number; y: number }

export type Renderer = {
  resize(width: number, height: number, ratio: number, orientation: Orientation): void
  setQuality(quality: Quality): void
  setReducedMotion(reduced: boolean): void
  hit(side: Side, state: RallyState): void
  draw(state: RallyState, now: number): void
  toCourt(clientX: number, clientY: number): number | null
  readonly trailLength: number
  readonly shaking: boolean
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width))
  canvas.height = Math.max(1, Math.ceil(height))
  return canvas
}

function glowSprite(radius: number, inner: string, outer: string): HTMLCanvasElement {
  const size = Math.max(2, Math.ceil(radius * 2))
  const canvas = makeCanvas(size, size)
  const context = canvas.getContext('2d')
  if (!context) return canvas
  const center = size / 2
  const gradient = context.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, inner)
  gradient.addColorStop(0.35, outer)
  gradient.addColorStop(1, 'rgba(37, 237, 158, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  return canvas
}

export function createRenderer(canvas: HTMLCanvasElement, options: { reducedMotion: boolean; quality: Quality; random?: () => number }): Renderer {
  const context = canvas.getContext('2d')
  const random = options.random ?? Math.random
  let reduced = options.reducedMotion
  let quality: Quality = options.quality
  let orientation: Orientation = 'landscape'
  let width = 1
  let height = 1
  let ratio = 1
  let scale = 1
  let court: HTMLCanvasElement | null = null
  let paddles: Record<Side, HTMLCanvasElement> | null = null
  let core: HTMLCanvasElement | null = null
  let mote: HTMLCanvasElement | null = null
  let trail: Point[] = []
  let sparks: Spark[] = []
  let shake = 0
  let lastNow: number | null = null
  const orbit = Array.from({ length: QUALITY.high.particles }, (_, index) => ({
    angle: (index / QUALITY.high.particles) * Math.PI * 2 + random() * 0.4,
    radius: 1.15 + random() * 1.35,
    speed: (random() < 0.5 ? -1 : 1) * (1.6 + random() * 2.4),
    size: 0.55 + random() * 0.6,
  }))

  const toScreen = (u: number, v: number): Point =>
    orientation === 'landscape' ? { x: (u / COURT.length) * width, y: (v / COURT.width) * height } : { x: (v / COURT.width) * width, y: (1 - u / COURT.length) * height }

  function paintCourt() {
    court = makeCanvas(width * ratio, height * ratio)
    const c = court.getContext('2d')
    if (!c) return
    c.scale(ratio, ratio)
    const bg = c.createLinearGradient(0, 0, width, height)
    bg.addColorStop(0, '#020504')
    bg.addColorStop(1, '#050b08')
    c.fillStyle = bg
    c.fillRect(0, 0, width, height)
    c.strokeStyle = 'rgba(37, 237, 158, 0.07)'
    c.lineWidth = 1
    const cell = scale * 0.05
    for (let x = cell; x < width; x += cell) {
      c.beginPath()
      c.moveTo(Math.round(x) + 0.5, 0)
      c.lineTo(Math.round(x) + 0.5, height)
      c.stroke()
    }
    for (let y = cell; y < height; y += cell) {
      c.beginPath()
      c.moveTo(0, Math.round(y) + 0.5)
      c.lineTo(width, Math.round(y) + 0.5)
      c.stroke()
    }
    const glyph = Math.max(7, Math.round(scale * 0.022))
    c.font = `${glyph}px ui-monospace, Consolas, monospace`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    const across = orientation === 'landscape' ? height : width
    for (let along = glyph * 0.8, n = 0; along < across; along += glyph * 1.25, n += 1) {
      c.fillStyle = n % 3 === 0 ? 'rgba(37, 237, 158, 0.55)' : 'rgba(37, 237, 158, 0.22)'
      const char = (n * 7) % 5 < 2 ? '1' : '0'
      const point = orientation === 'landscape' ? { x: width / 2, y: along } : { x: along, y: height / 2 }
      c.fillText(char, point.x, point.y)
    }
    c.lineWidth = 2
    for (const v of [0, COURT.width]) {
      const a = toScreen(0, v)
      const b = toScreen(COURT.length, v)
      c.strokeStyle = 'rgba(255, 255, 255, 0.28)'
      c.beginPath()
      c.moveTo(a.x, a.y)
      c.lineTo(b.x, b.y)
      c.stroke()
    }
    c.lineWidth = 1
    c.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    for (const u of [0.02, COURT.length - 0.02]) {
      const a = toScreen(u, 0)
      const b = toScreen(u, COURT.width)
      c.beginPath()
      c.moveTo(a.x, a.y)
      c.lineTo(b.x, b.y)
      c.stroke()
    }
    const vignette = c.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.2, width / 2, height / 2, Math.max(width, height) * 0.75)
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
    c.fillStyle = vignette
    c.fillRect(0, 0, width, height)
  }

  function paintPaddle(side: Side): HTMLCanvasElement {
    const length = PADDLE.half * 2 * scale
    const thick = Math.max(6, PADDLE.thickness * scale)
    const pad = Math.ceil(thick * 1.6)
    const landscape = orientation === 'landscape'
    const w = landscape ? thick : length
    const h = landscape ? length : thick
    const sprite = makeCanvas((w + pad * 2) * ratio, (h + pad * 2) * ratio)
    const c = sprite.getContext('2d')
    if (!c) return sprite
    c.scale(ratio, ratio)
    const tint = side === 'rival' ? '37, 237, 158' : '255, 255, 255'
    const radius = Math.min(w, h) / 2
    c.shadowColor = `rgba(${tint}, 0.55)`
    c.shadowBlur = pad * 0.9
    const gradient = landscape ? c.createLinearGradient(pad, 0, pad + w, 0) : c.createLinearGradient(0, pad, 0, pad + h)
    gradient.addColorStop(0, `rgba(${tint}, 0.62)`)
    gradient.addColorStop(0.5, `rgba(${tint}, 0.2)`)
    gradient.addColorStop(1, `rgba(${tint}, 0.42)`)
    c.fillStyle = gradient
    c.beginPath()
    c.roundRect(pad, pad, w, h, radius)
    c.fill()
    c.shadowBlur = 0
    c.lineWidth = 1.2
    c.strokeStyle = `rgba(${tint}, 0.95)`
    c.stroke()
    c.strokeStyle = 'rgba(255, 255, 255, 0.75)'
    c.lineWidth = 1
    c.beginPath()
    if (landscape) {
      c.moveTo(pad + w * 0.35, pad + radius)
      c.lineTo(pad + w * 0.35, pad + h - radius)
    } else {
      c.moveTo(pad + radius, pad + h * 0.35)
      c.lineTo(pad + w - radius, pad + h * 0.35)
    }
    c.stroke()
    return sprite
  }

  function rebuild() {
    paintCourt()
    paddles = { player: paintPaddle('player'), rival: paintPaddle('rival') }
    const ballPx = BALL_RADIUS * scale
    core = glowSprite(Math.max(6, ballPx * 3.2) * ratio, 'rgba(255, 255, 255, 1)', 'rgba(37, 237, 158, 0.85)')
    mote = glowSprite(Math.max(2.5, ballPx * 0.9) * ratio, 'rgba(220, 255, 240, 1)', 'rgba(37, 237, 158, 0.7)')
    trail = []
  }

  function drawSprite(sprite: HTMLCanvasElement, x: number, y: number, size: number, alpha: number) {
    if (!context) return
    context.globalAlpha = alpha
    context.drawImage(sprite, x - size / 2, y - size / 2, size, size)
  }

  return {
    resize(nextWidth, nextHeight, nextRatio, nextOrientation) {
      width = Math.max(1, nextWidth)
      height = Math.max(1, nextHeight)
      ratio = Math.min(Math.max(1, nextRatio), MAX_RATIO)
      orientation = nextOrientation
      scale = orientation === 'landscape' ? width / COURT.length : height / COURT.length
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      rebuild()
    },
    setQuality(next) {
      quality = next
      if (QUALITY[quality].trail === 0) trail = []
      if (QUALITY[quality].sparks === 0) sparks = []
    },
    setReducedMotion(next) {
      reduced = next
      if (reduced) {
        trail = []
        sparks = []
        shake = 0
      }
    },
    hit(side, state) {
      if (reduced) return
      const at = toScreen(PADDLE_U[side], state.ball.v)
      shake = Math.max(shake, 1)
      const count = QUALITY[quality].sparks
      const away = side === 'player' ? 1 : -1
      for (let n = 0; n < count; n += 1) {
        const angle = (random() - 0.5) * Math.PI * 0.9
        const speed = (0.25 + random() * 0.55) * scale
        const along = Math.cos(angle) * speed * away
        const across = Math.sin(angle) * speed
        sparks.push(orientation === 'landscape' ? { x: at.x, y: at.y, vx: along, vy: across, life: 1 } : { x: at.x, y: at.y, vx: across, vy: -along, life: 1 })
      }
    },
    draw(state, now) {
      if (!context || !court || !paddles || !core || !mote) return
      const dt = lastNow === null ? 0 : Math.min(0.1, (now - lastNow) / 1000)
      lastNow = now
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      context.drawImage(court, 0, 0)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (shake > 0 && !reduced) {
        const amount = shake * 2.5
        context.translate((random() - 0.5) * amount, (random() - 0.5) * amount)
        shake = Math.max(0, shake - dt * 8)
      } else {
        shake = 0
      }

      for (const side of ['player', 'rival'] as const) {
        const sprite = paddles[side]
        const center = toScreen(PADDLE_U[side], state.paddles[side].v)
        context.globalAlpha = 1
        context.drawImage(sprite, center.x - sprite.width / ratio / 2, center.y - sprite.height / ratio / 2, sprite.width / ratio, sprite.height / ratio)
      }

      const settings = QUALITY[quality]
      const ball = toScreen(state.ball.u, state.ball.v)
      const ballPx = BALL_RADIUS * scale
      context.globalCompositeOperation = 'lighter'
      if (!reduced && settings.trail > 0 && state.phase === 'play') {
        trail.push(ball)
        if (trail.length > settings.trail) trail.splice(0, trail.length - settings.trail)
        for (let index = 0; index < trail.length; index += 1) {
          const point = trail[index]!
          const life = (index + 1) / trail.length
          drawSprite(mote, point.x, point.y, ballPx * (1.2 + life * 2.2), life * 0.35)
        }
      } else if (trail.length > 0) {
        trail = []
      }
      drawSprite(core, ball.x, ball.y, Math.max(6, ballPx * 3.2), 1)
      const time = reduced ? 0 : now / 1000
      for (let n = 0; n < settings.particles; n += 1) {
        const particle = orbit[n]!
        const angle = particle.angle + particle.speed * time
        const radius = particle.radius * ballPx
        drawSprite(mote, ball.x + Math.cos(angle) * radius, ball.y + Math.sin(angle) * radius, Math.max(2.5, ballPx * particle.size * 1.4), 0.85)
      }
      if (sparks.length > 0) {
        sparks = sparks.filter((spark) => spark.life > 0)
        for (const spark of sparks) {
          spark.x += spark.vx * dt
          spark.y += spark.vy * dt
          spark.life -= dt * 2.6
          if (spark.life > 0) drawSprite(mote, spark.x, spark.y, Math.max(2, ballPx * 0.9), spark.life * 0.9)
        }
      }
      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      if (state.phase === 'point' && state.winner) {
        const lost = state.winner === 'player' ? 'rival' : 'player'
        const a = toScreen(PADDLE_U[lost], 0)
        const b = toScreen(PADDLE_U[lost], COURT.width)
        context.strokeStyle = lost === 'rival' ? 'rgba(255, 255, 255, 0.5)' : `${GREEN}88`
        context.lineWidth = 2
        context.beginPath()
        context.moveTo(a.x, a.y)
        context.lineTo(b.x, b.y)
        context.stroke()
      }
    },
    toCourt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      const fraction = orientation === 'landscape' ? (clientY - rect.top) / rect.height : (clientX - rect.left) / rect.width
      return Math.min(1, Math.max(0, fraction)) * COURT.width
    },
    get trailLength() {
      return trail.length
    },
    get shaking() {
      return shake > 0
    },
  }
}
