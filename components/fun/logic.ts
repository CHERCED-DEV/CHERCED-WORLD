import {
  FUN_ANNOUNCE_GAP_MS,
  FUN_BASE_LINES,
  FUN_BEG_LINE,
  FUN_CALM_AFTER_MS,
  FUN_HINT_LINE,
  FUN_LEVEL_LINES,
  FUN_MAX_LEVEL,
  FUN_PACE,
  FUN_POWERED,
  FUN_STORAGE_KEY,
  type FunPace,
} from '@/content/fun'

export type Point = { x: number; y: number }

export type Size = { width: number; height: number }

export type Box = { left: number; top: number; width: number; height: number }

export type FunPhase = 'awake' | 'sulking' | 'leaving'

export type FunEvent = { type: 'escape' } | { type: 'toggle' } | { type: 'press'; elapsedMs: number }

export type FunReply = 'sulk' | 'free' | 'beg' | 'bye' | null

export type FunOutcome = { phase: FunPhase; reply: FunReply }

export type Facing = 'left' | 'right'

export type FunStorage = Pick<Storage, 'getItem' | 'setItem'>

export type FunActivity = { chase: boolean; pokes: boolean; lines: boolean; animate: boolean }

const MAX_WAKES = 999

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function nextPhase(phase: FunPhase, event: FunEvent): FunOutcome {
  if (phase === 'leaving') return { phase, reply: null }
  if (event.type === 'press') return canCalm(event.elapsedMs) ? { phase: 'leaving', reply: 'bye' } : { phase, reply: 'beg' }
  if (event.type === 'escape') return phase === 'awake' ? { phase: 'sulking', reply: 'sulk' } : { phase, reply: null }
  return phase === 'awake' ? { phase: 'sulking', reply: 'sulk' } : { phase: 'awake', reply: 'free' }
}

export function canCalm(elapsedMs: number): boolean {
  return elapsedMs >= FUN_CALM_AFTER_MS
}

export function secondsLeft(elapsedMs: number): number {
  return Math.max(0, Math.ceil((FUN_CALM_AFTER_MS - elapsedMs) / 1000))
}

export function activity(phase: FunPhase, reduced: boolean): FunActivity {
  const awake = phase === 'awake'
  return { chase: awake && !reduced, pokes: awake && !reduced, lines: awake, animate: phase !== 'sulking' && !reduced }
}

export function levelFor(wakes: number): number {
  return clamp(Math.floor(Number.isFinite(wakes) ? wakes : 1), 1, FUN_MAX_LEVEL)
}

export function paceFor(level: number, powered: boolean): FunPace {
  const base = FUN_PACE[levelFor(level)]!
  if (!powered) return base
  return {
    lineMs: Math.max(FUN_POWERED.minLineMs, Math.round(base.lineMs * FUN_POWERED.line)),
    pokeMs: Math.max(FUN_POWERED.minPokeMs, Math.round(base.pokeMs * FUN_POWERED.poke)),
    rate: base.rate * FUN_POWERED.rate,
  }
}

export function linePool(level: number): number[] {
  return levelFor(level) >= 2 ? [...FUN_BASE_LINES, ...FUN_LEVEL_LINES] : [...FUN_BASE_LINES]
}

export type LineContext = { level: number; elapsedMs: number; previous: number | null; random: () => number }

export function pickLine({ level, elapsedMs, previous, random }: LineContext): number {
  if (canCalm(elapsedMs) && previous !== FUN_HINT_LINE) return FUN_HINT_LINE
  const pool = linePool(level).filter((line) => line !== previous)
  return pool[clamp(Math.floor(random() * pool.length), 0, pool.length - 1)]!
}

export type BegLine = { key: 'line'; line: number } | { key: 'beg'; seconds: number }

export function begLine(begs: number, elapsedMs: number): BegLine {
  return begs === 0 ? { key: 'line', line: FUN_BEG_LINE } : { key: 'beg', seconds: secondsLeft(elapsedMs) }
}

export function canAnnounce(now: number, lastAt: number | null, gapMs: number = FUN_ANNOUNCE_GAP_MS): boolean {
  return lastAt === null || now - lastAt >= gapMs
}

export function readWakes(storage: FunStorage | null): number {
  if (!storage) return 0
  try {
    const value = Number.parseInt(storage.getItem(FUN_STORAGE_KEY) ?? '', 10)
    return Number.isFinite(value) ? clamp(value, 0, MAX_WAKES) : 0
  } catch {
    return 0
  }
}

export function recordWake(storage: FunStorage | null): number {
  const wakes = Math.min(MAX_WAKES, readWakes(storage) + 1)
  try {
    storage?.setItem(FUN_STORAGE_KEY, String(wakes))
  } catch {}
  return wakes
}

export function approach(from: Point, to: Point, dtMs: number, rate: number): Point {
  const k = 1 - Math.exp((-rate * clamp(dtMs, 0, 100)) / 1000)
  return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k }
}

export function settled(a: Point, b: Point, epsilon = 0.5): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon
}

export type Bounds = { top: number; margin: number }

export function clampToView(point: Point, size: Size, view: Size, bounds: Bounds = { top: 0, margin: 4 }): Point {
  const maxX = Math.max(bounds.margin, view.width - size.width - bounds.margin)
  const maxY = Math.max(bounds.top, view.height - size.height - bounds.margin)
  return { x: clamp(point.x, bounds.margin, maxX), y: clamp(point.y, bounds.top, maxY) }
}

export function followTarget(pointer: Point, size: Size, touch: boolean): Point {
  if (touch) return { x: pointer.x - size.width / 2, y: pointer.y - size.height - 28 }
  return { x: pointer.x + 18, y: pointer.y + 18 }
}

export function besideBox(box: Box, size: Size, view: Size, gap = 12): Point {
  const right = box.left + box.width + gap
  const x = right + size.width <= view.width ? right : box.left - gap - size.width
  return { x, y: box.top + box.height / 2 - size.height / 2 }
}

export function closestPoint(point: Point, box: Box): Point {
  return {
    x: clamp(point.x, box.left, box.left + box.width),
    y: clamp(point.y, box.top, box.top + box.height),
  }
}

export function distanceToBox(point: Point, box: Box): number {
  const near = closestPoint(point, box)
  return Math.hypot(point.x - near.x, point.y - near.y)
}

export function nearestBox(point: Point, boxes: readonly Box[], radius: number): number | null {
  let best: number | null = null
  let bestDistance = radius
  for (let index = 0; index < boxes.length; index++) {
    const box = boxes[index]!
    if (box.width <= 0 || box.height <= 0) continue
    const distance = distanceToBox(point, box)
    if (distance <= bestDistance) {
      best = index
      bestDistance = distance
    }
  }
  return best
}

export function facingOf(from: Point, to: Point, current: Facing): Facing {
  const dx = to.x - from.x
  if (Math.abs(dx) < 2) return current
  return dx < 0 ? 'left' : 'right'
}

export type BubbleAlign = 'start' | 'center' | 'end'

export function bubbleAlign(x: number, size: Size, view: Size, room = 80): BubbleAlign {
  if (x < room) return 'start'
  if (x + size.width > view.width - room) return 'end'
  return 'center'
}
