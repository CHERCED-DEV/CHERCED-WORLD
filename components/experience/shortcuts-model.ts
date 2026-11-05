export type ShortcutAction = 'palette' | 'help' | 'theme'

export const SINGLE_KEY_SHORTCUTS: Readonly<Record<string, ShortcutAction>> = { '/': 'palette', '?': 'help', t: 'theme' }

export const SHORTCUT_KEYS: Readonly<Record<ShortcutAction, string>> = { palette: '/', help: '?', theme: 't' }

export const PALETTE_KEYSHORTCUTS = 'Control+K Meta+K'

const NOT_TEXT_INPUTS = new Set(['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'])

const EDITABLE = 'textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="combobox"]'

export type ShortcutEvent = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  isComposing: boolean
  defaultPrevented: boolean
  keyCode?: number
  target: EventTarget | null
}

type ElementLike = {
  tagName?: string
  type?: string
  isContentEditable?: boolean
  closest?: (selector: string) => unknown
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false
  const element = target as ElementLike
  if (element.isContentEditable) return true
  const tag = element.tagName?.toLowerCase()
  if (tag === 'input') return !NOT_TEXT_INPUTS.has((element.type ?? 'text').toLowerCase())
  if (typeof element.closest !== 'function') return false
  return Boolean(element.closest(EDITABLE))
}

export function shortcutFor(event: ShortcutEvent, enabled: boolean): ShortcutAction | null {
  if (!enabled || event.defaultPrevented) return null
  if (event.isComposing || event.keyCode === 229) return null
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  const action = Object.prototype.hasOwnProperty.call(SINGLE_KEY_SHORTCUTS, event.key) ? SINGLE_KEY_SHORTCUTS[event.key] : undefined
  if (!action) return null
  if (isEditableTarget(event.target)) return null
  return action
}

export function paletteKeyshortcuts(enabled: boolean): string {
  return enabled ? `${PALETTE_KEYSHORTCUTS} ${SHORTCUT_KEYS.palette}` : PALETTE_KEYSHORTCUTS
}
