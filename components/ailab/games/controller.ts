import { createFrameBudget, type Adaptation } from '@/lib/ailab/games/adapt'
import type { Match, RallyOutcome } from '@/lib/ailab/games/match'
import type { Trace } from '@/lib/ailab/games/net'
import { STEP, type Phase, type Side, type StepEvents } from '@/lib/ailab/games/physics'
import { towardTarget } from '@/lib/ailab/games/policy'
import { createRenderer, type Orientation, type Renderer } from './render'

export type PauseReason = 'user' | 'hidden' | 'offscreen'

export type ControllerEvent =
  | { type: 'point'; winner: Side; score: Record<Side, number>; game: Side | null; nextGame: number }
  | { type: 'serve'; side: Side }
  | { type: 'phase'; phase: Phase; serving: boolean }
  | { type: 'pause'; paused: boolean; reasons: PauseReason[] }
  | { type: 'rally'; outcome: RallyOutcome }
  | { type: 'adapt'; adaptation: Adaptation }

export type ControllerOptions = {
  canvas: HTMLCanvasElement
  surface: HTMLElement
  match: Match
  reducedMotion: boolean
  onEvent: (event: ControllerEvent) => void
  onBrain: (trace: Trace | null, action: number) => void
}

const UP_KEYS = new Set(['ArrowUp', 'ArrowLeft', 'w', 'W', 'a', 'A'])

const DOWN_KEYS = new Set(['ArrowDown', 'ArrowRight', 's', 'S', 'd', 'D'])

const MAX_STEPS = 5

export class GameController {
  private match: Match
  private readonly canvas: HTMLCanvasElement
  private readonly surface: HTMLElement
  private readonly renderer: Renderer
  private readonly budget = createFrameBudget()
  private readonly onEvent: ControllerOptions['onEvent']
  private readonly onBrain: ControllerOptions['onBrain']
  private readonly reasons = new Set<PauseReason>()
  private readonly cleanup: Array<() => void> = []
  private frame: number | null = null
  private last: number | null = null
  private accumulator = 0
  private lastBrain = 0
  private lastReport = 0
  private frames = 0
  private up = false
  private down = false
  private target: number | null = null
  private reduced: boolean
  private watching = false
  private phase: Phase
  private serving: boolean
  private destroyed = false

  constructor(options: ControllerOptions) {
    this.match = options.match
    this.canvas = options.canvas
    this.surface = options.surface
    this.onEvent = options.onEvent
    this.onBrain = options.onBrain
    this.reduced = options.reducedMotion
    this.renderer = createRenderer(options.canvas, { reducedMotion: options.reducedMotion, quality: 'high' })
    this.phase = this.match.state.phase
    this.serving = this.match.serving
    this.listen()
  }

  get paused(): boolean {
    return this.reasons.size > 0
  }

  get pauseReasons(): PauseReason[] {
    return [...this.reasons]
  }

  setMatch(match: Match): void {
    this.match = match
    this.phase = match.state.phase
    this.serving = match.serving
    this.emitPhase()
    this.render(performance.now())
  }

  setWatching(watching: boolean): void {
    this.watching = watching
    this.match.playerDriver = watching ? 'coach' : 'human'
    this.up = false
    this.down = false
    this.target = null
  }

  setReducedMotion(reduced: boolean): void {
    this.reduced = reduced
    this.renderer.setReducedMotion(reduced)
  }

  resize(width: number, height: number, orientation: Orientation): void {
    this.renderer.resize(width, height, window.devicePixelRatio || 1, orientation)
    this.render(performance.now())
  }

  serve(): void {
    if (this.paused) this.resume('user')
    if (this.match.serving && this.match.playerDriver === 'human') this.match.human.serve = true
  }

  pause(reason: PauseReason): void {
    const before = this.paused
    this.reasons.add(reason)
    if (reason !== 'user' && !this.watching) this.reasons.add('user')
    if (!before) this.stop()
    this.report(true)
    this.onEvent({ type: 'pause', paused: true, reasons: this.pauseReasons })
  }

  resume(reason: PauseReason): void {
    if (!this.reasons.delete(reason)) return
    if (reason === 'user') {
      this.reasons.delete('hidden')
      this.reasons.delete('offscreen')
      if (typeof document !== 'undefined' && document.hidden) this.reasons.add('hidden')
    }
    this.onEvent({ type: 'pause', paused: this.paused, reasons: this.pauseReasons })
    if (!this.paused) this.start()
    this.report(true)
  }

  togglePause(): void {
    if (this.paused) this.resume('user')
    else this.pause('user')
  }

  start(): void {
    if (this.destroyed || this.paused || this.frame !== null) return
    this.last = null
    this.frame = requestAnimationFrame(this.loop)
  }

  private stop(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame)
    this.frame = null
    this.last = null
    this.up = false
    this.down = false
    this.match.human.intent = 0
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    for (const off of this.cleanup) off()
    this.cleanup.length = 0
  }

  private listen(): void {
    const { surface, canvas } = this
    const keydown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        if (event.repeat) return
        if (this.paused || (this.match.serving && this.match.playerDriver === 'human')) this.serve()
        else this.pause('user')
        return
      }
      if (UP_KEYS.has(event.key)) {
        event.preventDefault()
        this.up = true
        this.target = null
      } else if (DOWN_KEYS.has(event.key)) {
        event.preventDefault()
        this.down = true
        this.target = null
      }
    }
    const keyup = (event: KeyboardEvent) => {
      if (UP_KEYS.has(event.key)) this.up = false
      if (DOWN_KEYS.has(event.key)) this.down = false
    }
    const blur = () => {
      this.up = false
      this.down = false
    }
    const point = (event: PointerEvent) => {
      if (this.watching) return
      if (event.pointerType !== 'mouse' && event.type === 'pointermove' && !canvas.hasPointerCapture(event.pointerId)) return
      const v = this.renderer.toCourt(event.clientX, event.clientY)
      if (v !== null) this.target = v
    }
    const down = (event: PointerEvent) => {
      if (!event.isPrimary) return
      if (event.pointerType !== 'mouse') {
        try {
          canvas.setPointerCapture(event.pointerId)
        } catch {}
      }
      point(event)
      if (this.paused || this.match.serving) this.serve()
      surface.focus({ preventScroll: true })
    }
    const up = (event: PointerEvent) => {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    }
    const visibility = () => {
      if (document.hidden) this.pause('hidden')
      else if (this.watching) this.resume('hidden')
      else {
        this.reasons.delete('hidden')
        this.onEvent({ type: 'pause', paused: this.paused, reasons: this.pauseReasons })
      }
    }
    surface.addEventListener('keydown', keydown)
    surface.addEventListener('keyup', keyup)
    surface.addEventListener('blur', blur)
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', point, { passive: true })
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    document.addEventListener('visibilitychange', visibility)
    this.cleanup.push(() => {
      surface.removeEventListener('keydown', keydown)
      surface.removeEventListener('keyup', keyup)
      surface.removeEventListener('blur', blur)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', point)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      document.removeEventListener('visibilitychange', visibility)
    })
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries.at(-1)
          if (!entry) return
          if (entry.isIntersecting) {
            if (this.watching) this.resume('offscreen')
            else if (this.reasons.delete('offscreen')) this.onEvent({ type: 'pause', paused: this.paused, reasons: this.pauseReasons })
          } else if (!this.reasons.has('offscreen')) {
            this.pause('offscreen')
          }
        },
        { threshold: 0.15 },
      )
      observer.observe(surface)
      this.cleanup.push(() => observer.disconnect())
    }
  }

  private intent(): number {
    if (this.up !== this.down) return this.up ? -1 : 1
    if (this.target !== null) return towardTarget(this.match.state.paddles.player.v, this.target)
    return 0
  }

  private handle(events: StepEvents): void {
    const { state } = this.match
    if (events.hit) this.renderer.hit(events.hit, state)
    if (events.serve) this.onEvent({ type: 'serve', side: events.serve })
    if (events.point) {
      this.onEvent({ type: 'point', winner: events.point, score: { ...state.score }, game: events.game ?? null, nextGame: state.game + (events.game ? 1 : 0) })
    }
    for (const outcome of this.match.takeOutcomes()) this.onEvent({ type: 'rally', outcome })
  }

  private emitPhase(): void {
    this.onEvent({ type: 'phase', phase: this.phase, serving: this.serving })
  }

  private readonly loop = (now: number): void => {
    this.frame = null
    if (this.destroyed || this.paused) return
    const delta = this.last === null ? STEP * 1000 : now - this.last
    this.last = now
    const change = this.budget.sample(delta)
    if (change) {
      this.renderer.setQuality(change.quality)
      this.onEvent({ type: 'adapt', adaptation: change })
    }
    this.accumulator += Math.min(delta, 100) / 1000
    let steps = 0
    while (this.accumulator >= STEP && steps < MAX_STEPS) {
      if (this.match.playerDriver === 'human') this.match.human.intent = this.intent()
      this.handle(this.match.tick())
      this.accumulator -= STEP
      steps += 1
    }
    if (steps === MAX_STEPS) this.accumulator = 0
    const phase = this.match.state.phase
    const serving = this.match.serving
    if (phase !== this.phase || serving !== this.serving) {
      this.phase = phase
      this.serving = serving
      this.emitPhase()
    }
    this.render(now)
    this.frames += 1
    const brainEvery = this.reduced ? 250 : 80
    if (now - this.lastBrain >= brainEvery) {
      this.lastBrain = now
      this.onBrain(this.match.rivalDriver === 'net' && this.match.decided ? this.match.trace : null, this.match.action)
    }
    this.report(false, now)
    this.frame = requestAnimationFrame(this.loop)
  }

  private render(now: number): void {
    this.renderer.draw(this.match.state, now)
  }

  private report(force: boolean, now: number = performance.now()): void {
    if (!force && now - this.lastReport < 100) return
    this.lastReport = now
    const { state } = this.match
    const data = this.surface.dataset
    data.state = this.paused ? 'paused' : 'running'
    data.phase = state.phase
    data.player = state.paddles.player.v.toFixed(3)
    data.rival = state.paddles.rival.v.toFixed(3)
    data.frames = String(this.frames)
    data.trail = String(this.renderer.trailLength)
    data.shake = this.renderer.shaking ? 'on' : 'off'
    data.quality = this.budget.current.quality
    data.motion = this.reduced ? 'reduced' : 'full'
  }
}
