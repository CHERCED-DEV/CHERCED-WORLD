import { useEffect, type RefObject } from 'react'
import { isKeyboardOpen, useKeyboardInset } from '@/lib/fx/viewport'

export const KEYBOARD_INSET_VAR = '--cw-keyboard-inset'

export const KEYBOARD_ATTRIBUTE = 'data-cw-keyboard'

type StyledElement = {
  style: { setProperty(name: string, value: string): void; removeProperty(name: string): string }
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
}

export function sheetInset(inset: number): number {
  return isKeyboardOpen(inset) ? inset : 0
}

export function applySheetInset(sheet: StyledElement | null | undefined, inset: number): void {
  if (!sheet) return
  if (inset > 0) {
    sheet.style.setProperty(KEYBOARD_INSET_VAR, `${inset}px`)
    sheet.setAttribute(KEYBOARD_ATTRIBUTE, 'open')
  } else {
    sheet.style.removeProperty(KEYBOARD_INSET_VAR)
    sheet.removeAttribute(KEYBOARD_ATTRIBUTE)
  }
}

export function useSheetKeyboard(ref: RefObject<HTMLElement | null>): number {
  const inset = sheetInset(useKeyboardInset())

  useEffect(() => {
    const sheet = ref.current?.closest('dialog')
    applySheetInset(sheet, inset)
  }, [inset, ref])

  useEffect(() => {
    const sheet = ref.current?.closest('dialog')
    return () => applySheetInset(sheet, 0)
  }, [ref])

  return inset
}
