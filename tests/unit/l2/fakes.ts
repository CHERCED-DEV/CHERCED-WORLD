import type { DrawingContext, DrawingSurface, FrameScheduler } from '@/lib/motion/engine'

export type FakeContext = DrawingContext & {
  draws: number
  clears: number
  alphas: number[]
  operations: string[]
}

export function fakeSurface(): DrawingSurface & { context: FakeContext } {
  const context: FakeContext = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    draws: 0,
    clears: 0,
    alphas: [],
    operations: [],
    setTransform() {},
    clearRect() {
      context.clears += 1
    },
    drawImage() {
      context.draws += 1
      context.alphas.push(context.globalAlpha)
      context.operations.push(context.globalCompositeOperation)
    },
  }
  return { width: 0, height: 0, context, getContext: () => context }
}

export type FakeScheduler = FrameScheduler & {
  pending(): number
  tick(ms?: number): void
  run(frames: number, ms?: number): void
  requested: number
  cancelled: number
}

export function fakeScheduler(): FakeScheduler {
  const queue = new Map<number, (time: number) => void>()
  let nextId = 0
  let now = 1000
  const scheduler: FakeScheduler = {
    requested: 0,
    cancelled: 0,
    request(callback) {
      nextId += 1
      scheduler.requested += 1
      queue.set(nextId, callback)
      return nextId
    },
    cancel(id) {
      if (queue.delete(id)) scheduler.cancelled += 1
    },
    pending: () => queue.size,
    tick(ms = 1000 / 60) {
      now += ms
      const callbacks = [...queue.values()]
      queue.clear()
      for (const callback of callbacks) callback(now)
    },
    run(frames, ms) {
      for (let i = 0; i < frames; i++) scheduler.tick(ms)
    },
  }
  return scheduler
}

export function seededRandom(seed = 42): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

export const fakeSprite = (color: string, radius: number) => ({ color, radius }) as unknown as CanvasImageSource
