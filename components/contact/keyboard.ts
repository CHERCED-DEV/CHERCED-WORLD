export const COMPACT_QUERY = '(max-width: 767.98px)'

export const KEYBOARD_MARGIN = 12

export type Span = { top: number; bottom: number }

export type KeyboardScrollInput = {
  field: Span
  action: Span | null
  visibleTop: number
  visibleBottom: number
  margin?: number
}

export function keyboardScroll({ field, action, visibleTop, visibleBottom, margin = KEYBOARD_MARGIN }: KeyboardScrollInput): number {
  const top = visibleTop + margin
  const bottom = visibleBottom - margin
  if (bottom <= top) return 0
  const room = bottom - top
  const region = action && action.bottom > field.top && action.bottom - field.top <= room ? { top: field.top, bottom: action.bottom } : field
  if (region.bottom - region.top > room) return Math.round(region.top - top)
  if (region.bottom > bottom) return Math.round(region.bottom - bottom)
  if (region.top < top) return Math.round(region.top - top)
  return 0
}

export function stickyHeaderBottom(header: Element | null): number {
  if (!header) return 0
  const position = getComputedStyle(header).position
  if (position !== 'sticky' && position !== 'fixed') return 0
  return Math.max(0, header.getBoundingClientRect().bottom)
}
