import { join } from 'node:path'
import { compile } from 'sass'
import { describe, expect, it } from 'vitest'
import { applySheetInset, KEYBOARD_ATTRIBUTE, KEYBOARD_INSET_VAR, sheetInset } from '@/components/experience/sheet-keyboard'

const root = process.cwd()
const loadPaths = [join(root, 'styles')]
const MOBILE = '@media (max-width: 767.98px)'
const DESKTOP = '@media (min-width: 768px)'
const REDUCED = '@media (prefers-reduced-motion: reduce)'

function css(file: string): string {
  return compile(join(root, file), { loadPaths, style: 'expanded' }).css
}

function blocks(source: string, media: string): string {
  const parts: string[] = []
  let from = source.indexOf(media)
  while (from >= 0) {
    let depth = 0
    let end = from
    for (let index = source.indexOf('{', from); index < source.length; index++) {
      if (source[index] === '{') depth++
      if (source[index] === '}' && --depth === 0) {
        end = index
        break
      }
    }
    parts.push(source.slice(from, end + 1))
    from = source.indexOf(media, end)
  }
  return parts.join('\n')
}

function fakeSheet() {
  const style = new Map<string, string>()
  const attributes = new Map<string, string>()
  return {
    style: {
      setProperty: (name: string, value: string) => void style.set(name, value),
      removeProperty: (name: string) => {
        const old = style.get(name) ?? ''
        style.delete(name)
        return old
      },
    },
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
    removeAttribute: (name: string) => void attributes.delete(name),
    styleMap: style,
    attributes,
  }
}

describe('el teclado del sistema no tapa el campo (FR-637)', () => {
  it('solo cuenta el inset cuando el teclado está abierto (120 px o más)', () => {
    expect(sheetInset(0)).toBe(0)
    expect(sheetInset(40)).toBe(0)
    expect(sheetInset(119)).toBe(0)
    expect(sheetInset(120)).toBe(120)
    expect(sheetInset(312)).toBe(312)
  })

  it('pone y quita --cw-keyboard-inset y data-cw-keyboard en la hoja', () => {
    const sheet = fakeSheet()
    applySheetInset(sheet, 300)
    expect(sheet.styleMap.get(KEYBOARD_INSET_VAR)).toBe('300px')
    expect(sheet.attributes.get(KEYBOARD_ATTRIBUTE)).toBe('open')
    applySheetInset(sheet, 0)
    expect(sheet.styleMap.has(KEYBOARD_INSET_VAR)).toBe(false)
    expect(sheet.attributes.has(KEYBOARD_ATTRIBUTE)).toBe(false)
    expect(() => applySheetInset(null, 300)).not.toThrow()
  })
})

describe.each([
  ['paleta', 'components/experience/CommandPalette.module.scss', 'dialog.palette'],
  ['asistente', 'components/experience/Assistant.module.scss', 'dialog.assistant'],
])('%s como hoja casi a pantalla completa en < md', (_name, file, selector) => {
  const source = css(file)

  it('en < md ocupa el alto disponible menos el teclado; el ancho de escritorio no cambia', () => {
    const mobile = blocks(source, MOBILE)
    expect(mobile).toContain(selector)
    expect(mobile).toMatch(/height: calc\(100dvh - var\(--cw-sheet-gap\) - var\(--cw-keyboard-inset, 0px\)\)/)
    expect(mobile).not.toMatch(/\bwidth: min\(/)
    expect(blocks(source, DESKTOP)).toMatch(/width: min\(100% - 2 \* var\(--cw-space-4\), (640|600)px\)/)
  })
})

describe('cascada del menú (FR-637, A-603)', () => {
  const source = css('components/shell/FloatMenu.module.scss')

  it('en < md los enlaces entran con 35 ms entre cada uno, empezando en 0, y el idioma al final', () => {
    const mobile = blocks(source, MOBILE)
    const delays = [...mobile.matchAll(/li:nth-child\((\d)\)\s*\{\s*animation-delay: calc\((\d) \* 35ms\)/g)].map((match) => [
      Number(match[1]),
      Number(match[2]),
    ])
    expect(delays).toEqual(Array.from({ length: 8 }, (_, index) => [index + 1, index]))
    expect(mobile).toMatch(/animation-delay: calc\(var\(--cw-menu-items, 6\) \* 35ms\)/)
    const step = 35
    expect(step).toBeGreaterThanOrEqual(30)
    expect(step).toBeLessThanOrEqual(40)
  })

  it('anima solo con transform y opacity', () => {
    const keyframes = source.slice(source.indexOf('@keyframes menu-item-in'), source.indexOf('@keyframes menu-in'))
    const properties = [...keyframes.matchAll(/^\s+([a-z-]+):/gm)].map((match) => match[1])
    expect(new Set(properties)).toEqual(new Set(['opacity', 'transform']))
  })

  it('con movimiento reducido no hay cascada: todos a la vez', () => {
    const reduced = blocks(source, REDUCED)
    expect(reduced).toMatch(/nav li,\s*\.[\w-]+:popover-open \.[\w-]+ \{\s*animation: none;/)
  })
})
