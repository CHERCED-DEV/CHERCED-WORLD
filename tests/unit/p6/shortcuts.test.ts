import { describe, expect, it, vi } from 'vitest'
import { readSingleKeyShortcuts, rememberSingleKeyShortcuts, SHORTCUTS_KEY } from '@/components/experience/preferences'
import { isEditableTarget, paletteKeyshortcuts, shortcutFor, type ShortcutEvent } from '@/components/experience/shortcuts-model'

function element(tagName: string, extra: Record<string, unknown> = {}, inside: string[] = []) {
  return {
    tagName: tagName.toUpperCase(),
    ...extra,
    closest: (selector: string) => {
      const own = [tagName, ...(extra.role ? [`[role="${String(extra.role)}"]`] : []), ...inside]
      return own.some((candidate) => selector.split(',').map((part) => part.trim()).some((part) => part === candidate || part.startsWith(`${candidate}`)))
        ? {}
        : null
    },
  } as unknown as EventTarget
}

function key(value: string, overrides: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return {
    key: value,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    defaultPrevented: false,
    target: element('body'),
    ...overrides,
  }
}

describe('atajos de una tecla (FR-452, R-407)', () => {
  it('/, ? y t abren la paleta, los atajos y cambian el tema', () => {
    expect(shortcutFor(key('/'), true)).toBe('palette')
    expect(shortcutFor(key('?'), true)).toBe('help')
    expect(shortcutFor(key('t'), true)).toBe('theme')
    expect(shortcutFor(key('?', { target: null }), true)).toBe('help')
  })

  it('ignora otras teclas, mayúscula T y teclas con nombre', () => {
    for (const value of ['T', 'k', 'Enter', 'Escape', 'Tab', ' ', 'tt']) expect(shortcutFor(key(value), true), value).toBeNull()
  })

  it('se ignoran con Ctrl, ⌘ o Alt, pero no con Shift (el ? y el / la necesitan en muchos teclados)', () => {
    expect(shortcutFor(key('/', { ctrlKey: true }), true)).toBeNull()
    expect(shortcutFor(key('t', { metaKey: true }), true)).toBeNull()
    expect(shortcutFor(key('?', { altKey: true }), true)).toBeNull()
    expect(shortcutFor({ ...key('?'), shiftKey: true } as ShortcutEvent, true)).toBe('help')
  })

  it('se ignoran durante una composición de teclado (IME) y si otro ya atendió la tecla', () => {
    expect(shortcutFor(key('t', { isComposing: true }), true)).toBeNull()
    expect(shortcutFor(key('t', { keyCode: 229 }), true)).toBeNull()
    expect(shortcutFor(key('/', { defaultPrevented: true }), true)).toBeNull()
  })

  it('se ignoran dentro de campos editables', () => {
    const editable = [
      element('input'),
      element('input', { type: 'text' }),
      element('input', { type: 'email' }),
      element('input', { type: 'search' }),
      element('textarea'),
      element('select'),
      element('div', { isContentEditable: true }),
      element('span', {}, ['[contenteditable]:not([contenteditable="false"])']),
      element('div', { role: 'combobox' }),
    ]
    for (const target of editable) {
      expect(isEditableTarget(target)).toBe(true)
      expect(shortcutFor(key('t', { target }), true)).toBeNull()
    }
    for (const target of [element('input', { type: 'checkbox' }), element('button'), element('a'), element('body')]) {
      expect(isEditableTarget(target)).toBe(false)
      expect(shortcutFor(key('t', { target }), true)).toBe('theme')
    }
  })

  it('apagados, ninguna tecla responde (SC-411)', () => {
    for (const value of ['/', '?', 't']) expect(shortcutFor(key(value), false)).toBeNull()
  })

  it('aria-keyshortcuts del botón de la paleta suma / solo cuando están encendidos (FR-453)', () => {
    expect(paletteKeyshortcuts(true)).toBe('Control+K Meta+K /')
    expect(paletteKeyshortcuts(false)).toBe('Control+K Meta+K')
  })
})

describe('preferencia cw-shortcuts (WCAG 2.1.4)', () => {
  function storage(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial))
    return {
      getItem: (name: string) => data.get(name) ?? null,
      setItem: (name: string, value: string) => void data.set(name, value),
      data,
    }
  }

  it('encendidos por defecto; "off" los apaga y se recuerda', () => {
    const local = storage()
    vi.stubGlobal('window', { localStorage: local })
    expect(readSingleKeyShortcuts()).toBe(true)
    rememberSingleKeyShortcuts(false)
    expect(local.data.get(SHORTCUTS_KEY)).toBe('off')
    expect(readSingleKeyShortcuts()).toBe(false)
    rememberSingleKeyShortcuts(true)
    expect(local.data.get(SHORTCUTS_KEY)).toBe('on')
    expect(readSingleKeyShortcuts()).toBe(true)
    vi.unstubAllGlobals()
  })

  it('si el navegador bloquea el almacenamiento, siguen encendidos y nada se rompe', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('SecurityError')
      },
    })
    expect(readSingleKeyShortcuts()).toBe(true)
    expect(() => rememberSingleKeyShortcuts(false)).not.toThrow()
    vi.unstubAllGlobals()
  })
})
