export type Quality = 'high' | 'medium' | 'low'

export type Adaptation = { level: number; trainEvery: number; quality: Quality }

export const ADAPTATION_LEVELS: readonly Adaptation[] = [
  { level: 0, trainEvery: 1, quality: 'high' },
  { level: 1, trainEvery: 2, quality: 'high' },
  { level: 2, trainEvery: 4, quality: 'high' },
  { level: 3, trainEvery: 4, quality: 'medium' },
  { level: 4, trainEvery: 4, quality: 'low' },
]

export type FrameBudgetOptions = { window?: number; slowMs?: number; fastMs?: number; recoverAfter?: number }

export type FrameBudget = {
  readonly current: Adaptation
  sample(deltaMs: number): Adaptation | null
  reset(): void
}

export const FRAME_SLOW_MS = 20

export const FRAME_FAST_MS = 17.5

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2
}

export function createFrameBudget(options: FrameBudgetOptions = {}): FrameBudget {
  const size = options.window ?? 60
  const slow = options.slowMs ?? FRAME_SLOW_MS
  const fast = options.fastMs ?? FRAME_FAST_MS
  const recoverAfter = options.recoverAfter ?? 4
  let level = 0
  let calm = 0
  let samples: number[] = []

  return {
    get current() {
      return ADAPTATION_LEVELS[level]!
    },
    sample(deltaMs) {
      if (!Number.isFinite(deltaMs) || deltaMs <= 0 || deltaMs > 250) return null
      samples.push(deltaMs)
      if (samples.length < size) return null
      const typical = median(samples)
      samples = []
      if (typical > slow) {
        calm = 0
        if (level < ADAPTATION_LEVELS.length - 1) {
          level += 1
          return ADAPTATION_LEVELS[level]!
        }
        return null
      }
      if (typical < fast && level > 0) {
        calm += 1
        if (calm >= recoverAfter) {
          calm = 0
          level -= 1
          return ADAPTATION_LEVELS[level]!
        }
      } else {
        calm = 0
      }
      return null
    },
    reset() {
      level = 0
      calm = 0
      samples = []
    },
  }
}
