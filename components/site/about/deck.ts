export type DeckSlot = { x: number; y: number; rotate: number }

export const DECK_MIN_WIDTH = 992

const SLOTS: readonly DeckSlot[] = [
  { x: 0.0, y: 0.04, rotate: -5 },
  { x: 0.31, y: 0.0, rotate: 3.5 },
  { x: 0.63, y: 0.1, rotate: -2.5 },
  { x: 0.97, y: 0.02, rotate: 5 },
  { x: 0.06, y: 0.8, rotate: 4 },
  { x: 0.37, y: 0.96, rotate: -4 },
  { x: 0.68, y: 0.76, rotate: 2 },
  { x: 1.0, y: 0.92, rotate: -3.5 },
]

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function deckSlot(index: number): DeckSlot {
  const base = SLOTS[index % SLOTS.length]!
  const lap = Math.floor(index / SLOTS.length)
  if (lap === 0) return base
  const nudge = ((lap * 37) % 9) / 100
  return { x: round(Math.min(1, base.x + nudge)), y: round(Math.max(0, base.y - nudge)), rotate: -base.rotate }
}

export const HAND_QUERY = `(max-width: ${DECK_MIN_WIDTH - 0.02}px)`

export const HAND_VISIBLE_BEHIND = 3

const HAND_TILTS: readonly number[] = [-2.5, 2, -1.5, 3, -3, 1.5, -2, 2.5]

export function handTilt(index: number): number {
  return HAND_TILTS[index % HAND_TILTS.length]!
}

export function handOrder(count: number): number[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => index)
}

export function cycleHand(order: readonly number[], direction: 'prev' | 'next'): number[] {
  if (order.length < 2) return [...order]
  return direction === 'next' ? [...order.slice(1), order[0]!] : [order.at(-1)!, ...order.slice(0, -1)]
}

export function handToTop(order: readonly number[], index: number): number[] {
  const position = order.indexOf(index)
  if (position <= 0) return [...order]
  return [...order.slice(position), ...order.slice(0, position)]
}

export type HandPose = { depth: number; shown: boolean; tilt: number; lift: number; scale: number }

export function handPose(index: number, order: readonly number[]): HandPose {
  const depth = Math.max(0, order.indexOf(index))
  const visible = Math.min(depth, HAND_VISIBLE_BEHIND)
  return {
    depth,
    shown: depth <= HAND_VISIBLE_BEHIND,
    tilt: depth === 0 ? 0 : handTilt(index),
    lift: visible * 12,
    scale: Math.round((1 - visible * 0.045) * 1000) / 1000,
  }
}

export type FlightGeometry = { dx: number; dy: number; sx: number; sy: number; rotate: number }

export type Box = { left: number; top: number; width: number; height: number }

export function flightFrom(source: Box & { offsetWidth: number; offsetHeight: number; rotate: number }, target: Box): FlightGeometry {
  const sourceX = source.left + source.width / 2
  const sourceY = source.top + source.height / 2
  const targetX = target.left + target.width / 2
  const targetY = target.top + target.height / 2
  return {
    dx: round(sourceX - targetX),
    dy: round(sourceY - targetY),
    sx: round(target.width > 0 ? source.offsetWidth / target.width : 1),
    sy: round(target.height > 0 ? source.offsetHeight / target.height : 1),
    rotate: source.rotate,
  }
}

export function flightTransform({ dx, dy, sx, sy, rotate }: FlightGeometry): string {
  return `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(${sx}, ${sy})`
}
