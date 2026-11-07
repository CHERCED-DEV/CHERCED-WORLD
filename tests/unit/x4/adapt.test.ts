import { describe, expect, it } from 'vitest'
import { ADAPTATION_LEVELS, createFrameBudget } from '@/lib/ailab/games/adapt'

function feed(budget: ReturnType<typeof createFrameBudget>, ms: number, frames: number) {
  const changes = []
  for (let n = 0; n < frames; n += 1) {
    const change = budget.sample(ms)
    if (change) changes.push(change)
  }
  return changes
}

describe('adaptación ante un equipo lento (T756, FR-332)', () => {
  it('primero entrena menos seguido, después baja la calidad visual, y nunca toca la física', () => {
    const budget = createFrameBudget({ window: 10 })
    expect(budget.current).toEqual({ level: 0, trainEvery: 1, quality: 'high' })
    const changes = feed(budget, 26, 10 * 6)
    expect(changes.map((change) => [change.trainEvery, change.quality])).toEqual([
      [2, 'high'],
      [4, 'high'],
      [4, 'medium'],
      [4, 'low'],
    ])
    const firstVisual = ADAPTATION_LEVELS.findIndex((level) => level.quality !== 'high')
    const lastTraining = ADAPTATION_LEVELS.findIndex((level) => level.trainEvery === 4)
    expect(lastTraining).toBeLessThan(firstVisual)
  })

  it('con cuadros sanos no cambia nada', () => {
    const budget = createFrameBudget({ window: 10 })
    expect(feed(budget, 16.7, 200)).toEqual([])
  })

  it('se recupera poco a poco cuando el equipo respira, y descarta mediciones absurdas', () => {
    const budget = createFrameBudget({ window: 10, recoverAfter: 2 })
    feed(budget, 30, 20)
    expect(budget.current.level).toBe(2)
    expect(feed(budget, 1000, 50)).toEqual([])
    const back = feed(budget, 16, 10 * 4)
    expect(back.map((change) => change.level)).toEqual([1, 0])
    budget.reset()
    expect(budget.current.level).toBe(0)
  })
})
