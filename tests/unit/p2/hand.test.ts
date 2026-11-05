import { describe, expect, it } from 'vitest'
import { FIGURE_FLOATS } from '@/components/site/about/AboutFigures'
import { cycleHand, DECK_MIN_WIDTH, deckSlot, HAND_QUERY, HAND_VISIBLE_BEHIND, handOrder, handPose, handTilt, handToTop } from '@/components/site/about/deck'
import { getSite } from '@/lib/content'

const jobs = getSite().about.career.length

describe('mazo en la mano bajo 992 px (T830, FR-630, P-602)', () => {
  it('se activa bajo el mismo corte que la mesa de escritorio', () => {
    expect(DECK_MIN_WIDTH).toBe(992)
    expect(HAND_QUERY).toBe('(max-width: 991.98px)')
  })

  it('arranca con la carrera en orden y la primera arriba', () => {
    expect(jobs).toBe(8)
    expect(handOrder(jobs)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(handOrder(0)).toEqual([])
  })

  it('Siguiente manda la de arriba al fondo y Anterior la trae de vuelta, en círculo', () => {
    const start = handOrder(jobs)
    const next = cycleHand(start, 'next')
    expect(next).toEqual([1, 2, 3, 4, 5, 6, 7, 0])
    expect(cycleHand(next, 'prev')).toEqual(start)
    let order = start
    for (let i = 0; i < jobs; i++) order = cycleHand(order, 'next')
    expect(order).toEqual(start)
    expect(cycleHand(start, 'prev')).toEqual([7, 0, 1, 2, 3, 4, 5, 6])
    expect(cycleHand([3], 'next')).toEqual([3])
  })

  it('puede traer cualquier carta arriba sin perder el orden', () => {
    expect(handToTop(handOrder(jobs), 5)).toEqual([5, 6, 7, 0, 1, 2, 3, 4])
    expect(handToTop(handOrder(jobs), 0)).toEqual(handOrder(jobs))
    expect(handToTop(handOrder(jobs), 42)).toEqual(handOrder(jobs))
  })

  it('las de atrás asoman giradas entre −3° y 3°, siempre igual; la de arriba va derecha', () => {
    for (let index = 0; index < 16; index++) {
      expect(Math.abs(handTilt(index))).toBeLessThanOrEqual(3)
      expect(handTilt(index)).toBe(handTilt(index))
    }
    const tilts = Array.from({ length: jobs }, (_, index) => handTilt(index))
    expect(new Set(tilts.map(Math.sign))).toEqual(new Set([-1, 1]))
    const order = handOrder(jobs)
    expect(handPose(0, order)).toEqual({ depth: 0, shown: true, tilt: 0, lift: 0, scale: 1 })
    expect(handPose(1, order).tilt).toBe(handTilt(1))
  })

  it('solo asoman tres detrás; las demás esperan ocultas a la misma altura', () => {
    const order = handOrder(jobs)
    const poses = order.map((index) => handPose(index, order))
    expect(poses.filter((pose) => pose.shown)).toHaveLength(1 + HAND_VISIBLE_BEHIND)
    expect(poses.map((pose) => pose.lift)).toEqual([0, 12, 24, 36, 36, 36, 36, 36])
    for (let depth = 1; depth < poses.length; depth++) expect(poses[depth]!.scale).toBeLessThanOrEqual(poses[depth - 1]!.scale)
  })

  it('la mesa de escritorio no cambia', () => {
    expect(deckSlot(0)).toEqual({ x: 0, y: 0.04, rotate: -5 })
    expect(deckSlot(8)).toEqual({ x: 0.01, y: 0.03, rotate: 5 })
  })
})

describe('"En cifras" flotante (T832, FR-632)', () => {
  it('cada tarjeta tiene un nivel de 1 a 3 distinto del de sus vecinas en la cuadrícula 2×2', () => {
    expect(FIGURE_FLOATS).toHaveLength(4)
    for (const level of FIGURE_FLOATS) expect([1, 2, 3]).toContain(level)
    const [a, b, c, d] = FIGURE_FLOATS
    expect(a).not.toBe(b)
    expect(c).not.toBe(d)
    expect(a).not.toBe(c)
    expect(b).not.toBe(d)
  })
})
