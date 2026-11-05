export const SHEET_DRAG_VAR = '--cw-sheet-drag'

export const SHEET_DRAGGING_ATTRIBUTE = 'data-dragging'

export const SHEET_DISMISS_DISTANCE = 120

export const SHEET_DISMISS_RATIO = 0.25

export const SHEET_DISMISS_VELOCITY = 0.6

export const SHEET_FLICK_MIN = 24

export const SHEET_RUBBER = 0.2

export const SHEET_RUBBER_MAX = 24

export function sheetDragOffset(dy: number): number {
  if (dy >= 0) return dy
  return -Math.min(SHEET_RUBBER_MAX, -dy * SHEET_RUBBER)
}

export function shouldDismissSheet(dy: number, velocity: number, height: number): boolean {
  if (dy <= 0) return false
  if (velocity >= SHEET_DISMISS_VELOCITY && dy >= SHEET_FLICK_MIN) return true
  return dy >= Math.min(SHEET_DISMISS_DISTANCE, Math.max(1, height) * SHEET_DISMISS_RATIO)
}

type Listener = (event: Event) => void

export type SheetDragPanel = {
  style: { setProperty(name: string, value: string): void }
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
  getBoundingClientRect(): { height: number }
}

export type SheetDragHandle = {
  addEventListener(type: string, listener: Listener): void
  removeEventListener(type: string, listener: Listener): void
  setPointerCapture?(id: number): void
  hasPointerCapture?(id: number): boolean
  releasePointerCapture?(id: number): void
}

type SheetPointer = Pick<PointerEvent, 'pointerId' | 'clientY' | 'button' | 'isPrimary' | 'pointerType' | 'timeStamp'> & {
  target: unknown
}

const INTERACTIVE = 'button, a[href], input, select, textarea, [contenteditable]'

function onInteractive(target: unknown): boolean {
  const node = target as { closest?: (selector: string) => unknown } | null
  return typeof node?.closest === 'function' && node.closest(INTERACTIVE) !== null
}

export function attachSheetDrag(handle: SheetDragHandle, panel: SheetDragPanel, onDismiss: () => void): () => void {
  let pointer: number | null = null
  let startY = 0
  let lastY = 0
  let lastTime = 0
  let velocity = 0
  let height = 1

  const resetOffset = () => {
    panel.style.setProperty(SHEET_DRAG_VAR, '0px')
    panel.removeAttribute(SHEET_DRAGGING_ATTRIBUTE)
  }

  const onDown: Listener = (raw) => {
    const event = raw as unknown as SheetPointer
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || onInteractive(event.target)) return
    pointer = event.pointerId
    startY = event.clientY
    lastY = startY
    lastTime = event.timeStamp
    velocity = 0
    height = panel.getBoundingClientRect().height
    handle.setPointerCapture?.(event.pointerId)
  }

  const onMove: Listener = (raw) => {
    const event = raw as unknown as SheetPointer
    if (event.pointerId !== pointer) return
    const elapsed = Math.max(1, event.timeStamp - lastTime)
    velocity = (event.clientY - lastY) / elapsed
    lastY = event.clientY
    lastTime = event.timeStamp
    panel.setAttribute(SHEET_DRAGGING_ATTRIBUTE, '')
    panel.style.setProperty(SHEET_DRAG_VAR, `${Math.round(sheetDragOffset(event.clientY - startY))}px`)
  }

  const finish = (event: SheetPointer, cancelled: boolean) => {
    if (event.pointerId !== pointer) return
    pointer = null
    if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture?.(event.pointerId)
    const dy = event.clientY - startY
    panel.removeAttribute(SHEET_DRAGGING_ATTRIBUTE)
    if (!cancelled && shouldDismissSheet(dy, velocity, height)) {
      onDismiss()
      return
    }
    resetOffset()
  }

  const onUp: Listener = (raw) => finish(raw as unknown as SheetPointer, false)
  const onCancel: Listener = (raw) => finish(raw as unknown as SheetPointer, true)

  handle.addEventListener('pointerdown', onDown)
  handle.addEventListener('pointermove', onMove)
  handle.addEventListener('pointerup', onUp)
  handle.addEventListener('pointercancel', onCancel)

  return () => {
    handle.removeEventListener('pointerdown', onDown)
    handle.removeEventListener('pointermove', onMove)
    handle.removeEventListener('pointerup', onUp)
    handle.removeEventListener('pointercancel', onCancel)
    resetOffset()
  }
}
