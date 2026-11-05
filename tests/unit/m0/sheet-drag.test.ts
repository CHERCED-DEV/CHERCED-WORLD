import { describe, expect, it, vi } from 'vitest'
import {
  SHEET_DISMISS_DISTANCE,
  SHEET_DRAG_VAR,
  SHEET_DRAGGING_ATTRIBUTE,
  SHEET_RUBBER_MAX,
  attachSheetDrag,
  sheetDragOffset,
  shouldDismissSheet,
  type SheetDragHandle,
} from '@/lib/fx/sheet'

describe('decisión del arrastre de la hoja (FR-603)', () => {
  it('cierra al pasar la distancia o con un tirón rápido; nunca hacia arriba', () => {
    expect(shouldDismissSheet(SHEET_DISMISS_DISTANCE, 0, 2000)).toBe(true)
    expect(shouldDismissSheet(SHEET_DISMISS_DISTANCE - 1, 0, 2000)).toBe(false)
    expect(shouldDismissSheet(100, 0, 400)).toBe(true)
    expect(shouldDismissSheet(30, 0.8, 600)).toBe(true)
    expect(shouldDismissSheet(10, 2, 600)).toBe(false)
    expect(shouldDismissSheet(-200, 3, 600)).toBe(false)
  })

  it('hacia arriba resiste y no pasa del tope', () => {
    expect(sheetDragOffset(80)).toBe(80)
    expect(sheetDragOffset(-50)).toBe(-10)
    expect(sheetDragOffset(-1000)).toBe(-SHEET_RUBBER_MAX)
  })
})

type Listener = (event: Event) => void

function setup(height = 500) {
  const listeners = new Map<string, Listener>()
  const vars: Record<string, string> = {}
  const attrs: Record<string, string> = {}
  const handle: SheetDragHandle = {
    addEventListener: (type, cb) => void listeners.set(type, cb),
    removeEventListener: (type) => void listeners.delete(type),
    setPointerCapture: vi.fn(),
    hasPointerCapture: () => true,
    releasePointerCapture: vi.fn(),
  }
  const panel = {
    style: { setProperty: (name: string, value: string) => void (vars[name] = value) },
    setAttribute: (name: string, value: string) => void (attrs[name] = value),
    removeAttribute: (name: string) => void delete attrs[name],
    getBoundingClientRect: () => ({ height }),
  }
  const fire = (type: string, y: number, time: number, target: unknown = { closest: () => null }) =>
    listeners.get(type)?.({ pointerId: 3, pointerType: 'touch', button: 0, isPrimary: true, clientY: y, timeStamp: time, target } as unknown as Event)
  return { handle, panel, vars, attrs, fire, listeners }
}

describe('attachSheetDrag', () => {
  it('sigue al dedo con la variable de arrastre y cierra al soltar pasado el umbral', () => {
    const fake = setup()
    const onDismiss = vi.fn()
    const stop = attachSheetDrag(fake.handle, fake.panel, onDismiss)
    fake.fire('pointerdown', 100, 0)
    fake.fire('pointermove', 160, 200)
    expect(fake.vars[SHEET_DRAG_VAR]).toBe('60px')
    expect(fake.attrs[SHEET_DRAGGING_ATTRIBUTE]).toBe('')
    fake.fire('pointermove', 260, 400)
    fake.fire('pointerup', 260, 420)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(fake.attrs[SHEET_DRAGGING_ATTRIBUTE]).toBeUndefined()
    stop()
    expect(fake.listeners.size).toBe(0)
  })

  it('un arrastre corto y lento vuelve a su sitio', () => {
    const fake = setup()
    const onDismiss = vi.fn()
    attachSheetDrag(fake.handle, fake.panel, onDismiss)
    fake.fire('pointerdown', 100, 0)
    fake.fire('pointermove', 140, 300)
    fake.fire('pointerup', 140, 600)
    expect(onDismiss).not.toHaveBeenCalled()
    expect(fake.vars[SHEET_DRAG_VAR]).toBe('0px')
  })

  it('pointercancel nunca cierra y el botón "Cerrar" no arranca un arrastre', () => {
    const fake = setup()
    const onDismiss = vi.fn()
    attachSheetDrag(fake.handle, fake.panel, onDismiss)
    fake.fire('pointerdown', 100, 0)
    fake.fire('pointermove', 400, 50)
    fake.fire('pointercancel', 400, 60)
    expect(onDismiss).not.toHaveBeenCalled()
    expect(fake.vars[SHEET_DRAG_VAR]).toBe('0px')

    const button = { closest: (selector: string) => (selector.includes('button') ? {} : null) }
    fake.fire('pointerdown', 100, 0, button)
    fake.fire('pointermove', 400, 50, button)
    fake.fire('pointerup', 400, 60, button)
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
