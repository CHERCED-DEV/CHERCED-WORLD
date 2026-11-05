import { useEffect, useEffectEvent, type RefObject } from 'react'

export type SwipeDirection = 'prev' | 'next'

export type SwipeAxis = 'x' | 'y'

export const SWIPE_THRESHOLD = 48

export const SWIPE_SLOP = 10

export function swipeAxis(dx: number, dy: number, slop: number = SWIPE_SLOP): SwipeAxis | null {
  if (Math.hypot(dx, dy) < slop) return null
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
}

export function swipeResult(dx: number, dy: number, threshold: number = SWIPE_THRESHOLD): SwipeDirection | null {
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return null
  return dx < 0 ? 'next' : 'prev'
}

export type SwipeOptions = {
  onPrev?: () => void
  onNext?: () => void
  onMove?: (dx: number) => void
  onEnd?: () => void
  threshold?: number
}

type Listener = (event: Event) => void

export type SwipeTarget = {
  style: { touchAction: string }
  addEventListener(type: string, listener: Listener, options?: AddEventListenerOptions | boolean): void
  removeEventListener(type: string, listener: Listener, options?: EventListenerOptions | boolean): void
  setPointerCapture?(id: number): void
  hasPointerCapture?(id: number): boolean
  releasePointerCapture?(id: number): void
}

type PointerLike = Pick<PointerEvent, 'pointerId' | 'pointerType' | 'clientX' | 'clientY' | 'button' | 'isPrimary'>

type ClickLike = { preventDefault(): void; stopPropagation(): void }

export function attachSwipe(element: SwipeTarget, options: SwipeOptions): () => void {
  const threshold = options.threshold ?? SWIPE_THRESHOLD
  let pointer: number | null = null
  let startX = 0
  let startY = 0
  let axis: SwipeAxis | null = null
  let suppressClick = false
  const previousTouchAction = element.style.touchAction
  if (!previousTouchAction) element.style.touchAction = 'pan-y'

  const reset = () => {
    if (pointer !== null && axis === 'x') options.onEnd?.()
    if (pointer !== null && element.hasPointerCapture?.(pointer)) element.releasePointerCapture?.(pointer)
    pointer = null
    axis = null
  }

  const onDown: Listener = (raw) => {
    const event = raw as unknown as PointerLike
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    pointer = event.pointerId
    startX = event.clientX
    startY = event.clientY
    axis = null
  }

  const onMove: Listener = (raw) => {
    const event = raw as unknown as PointerLike
    if (event.pointerId !== pointer) return
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (!axis) {
      axis = swipeAxis(dx, dy)
      if (axis === 'y') {
        pointer = null
        axis = null
        return
      }
      if (axis === 'x') element.setPointerCapture?.(event.pointerId)
    }
    if (axis === 'x') options.onMove?.(dx)
  }

  const onUp: Listener = (raw) => {
    const event = raw as unknown as PointerLike
    if (event.pointerId !== pointer) return
    const result = axis === 'x' ? swipeResult(event.clientX - startX, event.clientY - startY, threshold) : null
    reset()
    if (!result) return
    suppressClick = true
    setTimeout(() => {
      suppressClick = false
    }, 0)
    if (result === 'next') options.onNext?.()
    else options.onPrev?.()
  }

  const onCancel: Listener = (raw) => {
    const event = raw as unknown as PointerLike
    if (event.pointerId === pointer) reset()
  }

  const onClick: Listener = (raw) => {
    const event = raw as unknown as ClickLike
    if (!suppressClick) return
    suppressClick = false
    event.preventDefault()
    event.stopPropagation()
  }

  element.addEventListener('pointerdown', onDown, { passive: true })
  element.addEventListener('pointermove', onMove, { passive: true })
  element.addEventListener('pointerup', onUp, { passive: true })
  element.addEventListener('pointercancel', onCancel, { passive: true })
  element.addEventListener('click', onClick, true)

  return () => {
    element.removeEventListener('pointerdown', onDown)
    element.removeEventListener('pointermove', onMove)
    element.removeEventListener('pointerup', onUp)
    element.removeEventListener('pointercancel', onCancel)
    element.removeEventListener('click', onClick, true)
    if (!previousTouchAction) element.style.touchAction = ''
  }
}

export type UseSwipeOptions = SwipeOptions & { enabled?: boolean }

export function useSwipe(ref: RefObject<HTMLElement | null>, options: UseSwipeOptions): void {
  const { enabled = true, threshold } = options
  const prev = useEffectEvent(() => options.onPrev?.())
  const next = useEffectEvent(() => options.onNext?.())
  const move = useEffectEvent((dx: number) => options.onMove?.(dx))
  const end = useEffectEvent(() => options.onEnd?.())

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return
    return attachSwipe(element, {
      onPrev: () => prev(),
      onNext: () => next(),
      onMove: (dx) => move(dx),
      onEnd: () => end(),
      threshold,
    })
  }, [ref, enabled, threshold])
}
