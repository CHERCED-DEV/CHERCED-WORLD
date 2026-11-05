import { afterEach, describe, expect, it, vi } from 'vitest'
import { SWIPE_SLOP, SWIPE_THRESHOLD, attachSwipe, swipeAxis, swipeResult, type SwipeTarget } from '@/lib/fx/swipe'

describe('swipeAxis y swipeResult (FR-610)', () => {
  it('no decide hasta pasar el margen de arrastre', () => {
    expect(swipeAxis(SWIPE_SLOP - 3, 2)).toBeNull()
    expect(swipeAxis(14, 3)).toBe('x')
    expect(swipeAxis(6, 14)).toBe('y')
  })

  it('pide el umbral y que el gesto sea más horizontal que vertical', () => {
    expect(swipeResult(-(SWIPE_THRESHOLD - 1), 0)).toBeNull()
    expect(swipeResult(-SWIPE_THRESHOLD, 0)).toBe('next')
    expect(swipeResult(SWIPE_THRESHOLD + 10, 5)).toBe('prev')
    expect(swipeResult(-80, 90)).toBeNull()
    expect(swipeResult(-80, 80)).toBeNull()
    expect(swipeResult(-30, 0, 24)).toBe('next')
  })
})

type Listener = (event: Event) => void

function target() {
  const listeners = new Map<string, Listener>()
  const captured = new Set<number>()
  const element: SwipeTarget & { listeners: Map<string, Listener> } = {
    listeners,
    style: { touchAction: '' },
    addEventListener: (type, listener) => void listeners.set(type, listener),
    removeEventListener: (type) => void listeners.delete(type),
    setPointerCapture: (id) => void captured.add(id),
    hasPointerCapture: (id) => captured.has(id),
    releasePointerCapture: (id) => void captured.delete(id),
  }
  const fire = (type: string, x: number, y: number, extra: Record<string, unknown> = {}) =>
    listeners.get(type)?.({ pointerId: 1, pointerType: 'touch', button: 0, isPrimary: true, clientX: x, clientY: y, ...extra } as unknown as Event)
  return { element, fire, captured, listeners }
}

describe('attachSwipe', () => {
  afterEach(() => vi.useRealTimers())

  it('desliza a la izquierda para "siguiente" y a la derecha para "anterior", y deja pan-y para el scroll', () => {
    const fake = target()
    const onNext = vi.fn()
    const onPrev = vi.fn()
    const onMove = vi.fn()
    const stop = attachSwipe(fake.element, { onNext, onPrev, onMove })
    expect(fake.element.style.touchAction).toBe('pan-y')

    fake.fire('pointerdown', 200, 100)
    fake.fire('pointermove', 180, 102)
    expect(fake.captured.has(1)).toBe(true)
    fake.fire('pointermove', 120, 104)
    fake.fire('pointerup', 120, 104)
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onMove).toHaveBeenLastCalledWith(-80)
    expect(fake.captured.size).toBe(0)

    fake.fire('pointerdown', 100, 100)
    fake.fire('pointermove', 130, 100)
    fake.fire('pointerup', 170, 100)
    expect(onPrev).toHaveBeenCalledTimes(1)

    stop()
    expect(fake.element.style.touchAction).toBe('')
    expect(fake.listeners.size).toBe(0)
  })

  it('si el gesto es más vertical, gana el scroll y no dispara nada', () => {
    const fake = target()
    const onNext = vi.fn()
    attachSwipe(fake.element, { onNext })
    fake.fire('pointerdown', 200, 100)
    fake.fire('pointermove', 195, 130)
    fake.fire('pointermove', 100, 140)
    fake.fire('pointerup', 100, 140)
    expect(onNext).not.toHaveBeenCalled()
    expect(fake.captured.size).toBe(0)
  })

  it('por debajo del umbral no dispara, y pointercancel reinicia', () => {
    const fake = target()
    const onNext = vi.fn()
    const onEnd = vi.fn()
    attachSwipe(fake.element, { onNext, onEnd })
    fake.fire('pointerdown', 200, 100)
    fake.fire('pointermove', 180, 100)
    fake.fire('pointerup', 170, 100)
    expect(onNext).not.toHaveBeenCalled()
    expect(onEnd).toHaveBeenCalledTimes(1)

    fake.fire('pointerdown', 200, 100)
    fake.fire('pointermove', 150, 100)
    fake.fire('pointercancel', 150, 100)
    fake.fire('pointerup', 100, 100)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('tras un deslizamiento se traga el clic que le sigue (tocar no es deslizar)', () => {
    vi.useFakeTimers()
    const fake = target()
    attachSwipe(fake.element, { onNext: () => {} })
    fake.fire('pointerdown', 200, 100)
    fake.fire('pointermove', 150, 100)
    fake.fire('pointerup', 100, 100)
    const click = { preventDefault: vi.fn(), stopPropagation: vi.fn() }
    fake.listeners.get('click')?.(click as unknown as Event)
    expect(click.preventDefault).toHaveBeenCalled()
    const later = { preventDefault: vi.fn(), stopPropagation: vi.fn() }
    vi.runAllTimers()
    fake.listeners.get('click')?.(later as unknown as Event)
    expect(later.preventDefault).not.toHaveBeenCalled()
  })

  it('respeta un touch-action que ya traía el elemento y el botón secundario del mouse', () => {
    const fake = target()
    fake.element.style.touchAction = 'none'
    const onNext = vi.fn()
    const stop = attachSwipe(fake.element, { onNext })
    fake.fire('pointerdown', 200, 100, { pointerType: 'mouse', button: 2 })
    fake.fire('pointermove', 100, 100, { pointerType: 'mouse' })
    fake.fire('pointerup', 100, 100, { pointerType: 'mouse' })
    expect(onNext).not.toHaveBeenCalled()
    stop()
    expect(fake.element.style.touchAction).toBe('none')
  })
})
