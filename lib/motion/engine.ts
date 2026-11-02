import { type Intensity } from './intensity'
import { type Field, type Particle, particleAlpha, spawnParticle, stepParticles } from './particles'

export { POINTER_RADIUS } from './particles'

export const FRAME_WINDOW = 60
export const SLOW_FRAME_MS = 20
export const REDUCTION_FACTOR = 0.7
export const MIN_PARTICLES = 60
export const MAX_PARTICLES = 320
export const ACCENT_SHARE = 0.1
export const MAX_STEP_SECONDS = 1 / 20

export const CANVAS_CEILING: Record<Intensity, number> = { full: 0.7, subtle: 0.45 }

const PROFILE: Record<Intensity, { density: number; alpha: number; speed: number }> = {
  full: { density: 1, alpha: 1, speed: 1 },
  subtle: { density: 0.5, alpha: 0.8, speed: 0.7 },
}

const AREA_PER_PARTICLE = 4600
const FULL_FLOOR = 120

export type ThemeMode = 'dark' | 'light'

export type Palette = { mode: ThemeMode; particle: string; accent: string }

export const DEFAULT_PALETTE: Palette = { mode: 'dark', particle: '#ffffff', accent: '#25ed9e' }

export type EngineState = 'running' | 'paused' | 'static' | 'destroyed'

export type PauseReason = 'hidden' | 'offscreen'

export type DrawingContext = {
  globalAlpha: number
  globalCompositeOperation: GlobalCompositeOperation
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void
  clearRect(x: number, y: number, w: number, h: number): void
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
}

export type DrawingSurface = {
  width: number
  height: number
  getContext(contextId: '2d'): DrawingContext | null
}

export type FrameScheduler = {
  request(callback: (time: number) => void): number
  cancel(id: number): void
}

export type SpriteFactory = (color: string, radius: number) => CanvasImageSource

export type EngineStats = {
  state: EngineState
  intensity: Intensity
  particles: number
  capacity: number
  medianFrameMs: number | null
  pointer: boolean
}

export type EngineOptions = {
  surface: DrawingSurface
  scheduler: FrameScheduler
  createSprite: SpriteFactory
  width: number
  height: number
  pixelRatio?: number
  intensity?: Intensity
  palette?: Palette
  reducedMotion?: boolean
  random?: () => number
  onStats?: (stats: EngineStats) => void
}

export type Engine = {
  resize(width: number, height: number, pixelRatio?: number): void
  setIntensity(intensity: Intensity): void
  setPalette(palette: Palette): void
  setReducedMotion(reduced: boolean): void
  setPointer(x: number, y: number): void
  clearPointer(): void
  pause(reason: PauseReason): void
  resume(reason: PauseReason): void
  destroy(): void
  stats(): EngineStats
}

const SPRITE_RADIUS = 32

export function particleTarget(intensity: Intensity, width: number, height: number): number {
  const area = Math.max(0, width) * Math.max(0, height)
  const full = Math.min(MAX_PARTICLES, Math.max(FULL_FLOOR, Math.round(area / AREA_PER_PARTICLE)))
  if (intensity === 'full') return full
  return Math.max(MIN_PARTICLES, Math.round(full * PROFILE.subtle.density))
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function createEngine(options: EngineOptions): Engine {
  const { surface, scheduler, createSprite, onStats } = options
  const random = options.random ?? Math.random
  const context = surface.getContext('2d')
  const particles: Particle[] = []
  const reasons = new Set<PauseReason>()

  let width = options.width
  let height = options.height
  let ratio = options.pixelRatio ?? 1
  let intensity: Intensity = options.intensity ?? 'subtle'
  let palette: Palette = options.palette ?? DEFAULT_PALETTE
  let reduced = options.reducedMotion ?? false
  let capacity = MAX_PARTICLES
  let state: EngineState | null = null
  let frameId: number | null = null
  let lastTime: number | null = null
  let samples: number[] = []
  let medianFrameMs: number | null = null
  let pointer: { x: number; y: number } | null = null
  let sprites = makeSprites()

  const field: Field = { width, height, speed: PROFILE[intensity].speed, accentShare: ACCENT_SHARE, pointer: null }

  function makeSprites() {
    const radius = SPRITE_RADIUS * ratio
    return { particle: createSprite(palette.particle, radius), accent: createSprite(palette.accent, radius) }
  }

  function snapshot(): EngineStats {
    return {
      state: state ?? 'paused',
      intensity,
      particles: particles.length,
      capacity,
      medianFrameMs,
      pointer: pointer !== null,
    }
  }

  function report() {
    onStats?.(snapshot())
  }

  function sizeSurface() {
    surface.width = Math.max(1, Math.round(width * ratio))
    surface.height = Math.max(1, Math.round(height * ratio))
  }

  function syncField() {
    field.width = width
    field.height = height
    field.speed = PROFILE[intensity].speed
    field.pointer = pointer
  }

  function fill(initial: boolean) {
    const target = Math.min(particleTarget(intensity, width, height), capacity)
    if (particles.length > target) particles.length = target
    while (particles.length < target) particles.push(spawnParticle(field, random, initial))
  }

  function draw() {
    if (!context) return
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, surface.width, surface.height)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.globalCompositeOperation = palette.mode === 'dark' ? 'lighter' : 'source-over'
    const scale = PROFILE[intensity].alpha
    for (const particle of particles) {
      const alpha = particleAlpha(particle, scale)
      if (alpha < 0.01) continue
      context.globalAlpha = alpha
      const size = particle.r * 2
      context.drawImage(particle.accent ? sprites.accent : sprites.particle, particle.x - particle.r, particle.y - particle.r, size, size)
    }
    context.globalAlpha = 1
    context.globalCompositeOperation = 'source-over'
  }

  function sample(delta: number) {
    samples.push(delta)
    if (samples.length < FRAME_WINDOW) return
    medianFrameMs = median(samples)
    samples = []
    if (medianFrameMs > SLOW_FRAME_MS) {
      const next = Math.max(MIN_PARTICLES, Math.floor(particles.length * REDUCTION_FACTOR))
      capacity = Math.min(capacity, next)
      if (particles.length > capacity) particles.length = capacity
    }
    report()
  }

  function frame(time: number) {
    frameId = null
    if (state !== 'running') return
    let dt = 1 / 60
    if (lastTime !== null) {
      const delta = Math.max(0, time - lastTime)
      dt = Math.min(delta / 1000, MAX_STEP_SECONDS)
      sample(delta)
    }
    lastTime = time
    stepParticles(particles, dt, field, random)
    draw()
    if (state === 'running' && frameId === null) frameId = scheduler.request(frame)
  }

  function sync() {
    if (state === 'destroyed') return
    const next: EngineState = reduced ? 'static' : reasons.size > 0 ? 'paused' : 'running'
    if (next !== 'running' && frameId !== null) {
      scheduler.cancel(frameId)
      frameId = null
    }
    if (next === 'running' && frameId === null) {
      lastTime = null
      samples = []
      frameId = scheduler.request(frame)
    }
    const changed = next !== state
    state = next
    if (next === 'static') draw()
    if (changed) report()
  }

  sizeSurface()
  fill(true)
  sync()

  return {
    resize(nextWidth, nextHeight, nextRatio) {
      if (state === 'destroyed') return
      const ratioChanged = nextRatio !== undefined && nextRatio !== ratio
      width = nextWidth
      height = nextHeight
      if (nextRatio !== undefined) ratio = nextRatio
      if (ratioChanged) sprites = makeSprites()
      sizeSurface()
      syncField()
      fill(true)
      if (state !== 'running') draw()
      report()
    },
    setIntensity(next) {
      if (state === 'destroyed' || next === intensity) return
      intensity = next
      syncField()
      fill(false)
      if (state !== 'running') draw()
      report()
    },
    setPalette(next) {
      if (state === 'destroyed') return
      palette = next
      sprites = makeSprites()
      if (state !== 'running') draw()
    },
    setReducedMotion(next) {
      if (state === 'destroyed' || next === reduced) return
      reduced = next
      sync()
    },
    setPointer(x, y) {
      if (state === 'destroyed') return
      const wasActive = pointer !== null
      pointer = { x, y }
      field.pointer = pointer
      if (!wasActive) report()
    },
    clearPointer() {
      if (state === 'destroyed' || pointer === null) return
      pointer = null
      field.pointer = null
      report()
    },
    pause(reason) {
      if (state === 'destroyed' || reasons.has(reason)) return
      reasons.add(reason)
      sync()
    },
    resume(reason) {
      if (state === 'destroyed' || !reasons.delete(reason)) return
      sync()
    },
    destroy() {
      if (state === 'destroyed') return
      if (frameId !== null) scheduler.cancel(frameId)
      frameId = null
      state = 'destroyed'
      particles.length = 0
      if (context) {
        context.setTransform(1, 0, 0, 1, 0, 0)
        context.clearRect(0, 0, surface.width, surface.height)
      }
      pointer = null
      report()
    },
    stats: snapshot,
  }
}
