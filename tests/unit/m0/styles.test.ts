import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { compile, compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const loadPaths = [join(root, 'styles')]

const tokensCss = compile(join(root, 'styles', 'tokens.scss'), { loadPaths, style: 'expanded' }).css
const globalsCss = compile(join(root, 'styles', 'globals.scss'), { loadPaths, style: 'expanded' }).css
const tokensSource = readFileSync(join(root, 'styles', 'tokens.scss'), 'utf8')

function glass(body: string): string {
  return compileString(`@use 'glass' as *;\n${body}`, { loadPaths, style: 'expanded' }).css
}

function between(css: string, start: string, end?: string): string {
  const from = css.indexOf(start)
  if (from < 0) throw new Error(`no encontré ${start}`)
  const to = end ? css.indexOf(end, from + start.length) : -1
  return css.slice(from, to < 0 ? undefined : to)
}

function themeBlock(name: string): Record<string, string> {
  const start = tokensSource.indexOf(`@mixin ${name}`)
  const text = tokensSource.slice(start, tokensSource.indexOf('\n}', start))
  return Object.fromEntries([...text.matchAll(/(--cw-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1] ?? '', (m[2] ?? '').trim()]))
}

const MOBILE = '@media (max-width: 767.98px)'

describe('tokens móviles (FR-602, P-604)', () => {
  it('en < md el blur estándar baja a 10 px y el fuerte a 16 px; el de escritorio no cambia', () => {
    expect(tokensCss).toMatch(/--cw-glass-standard-blur: 14px;/)
    expect(tokensCss).toMatch(/--cw-glass-strong-blur: 22px;/)
    expect(tokensCss).toMatch(/--cw-glass-standard-blur-sm: 10px;/)
    expect(tokensCss).toMatch(/--cw-glass-strong-blur-sm: 16px;/)
    const mobile = between(tokensCss, MOBILE, '@supports not')
    expect(mobile).toContain('--cw-glass-standard-blur: var(--cw-glass-standard-blur-sm)')
    expect(mobile).toContain('--cw-glass-strong-blur: var(--cw-glass-strong-blur-sm)')
  })

  it('en < md el cristal sin marca es sólido y la marca recupera el tinte translúcido del tema', () => {
    const mobile = between(tokensCss, MOBILE, '@supports not')
    for (const v of ['subtle', 'standard', 'strong']) {
      expect(mobile).toContain(`--cw-glass-${v}-bg: var(--cw-glass-solid-${v}-bg)`)
      expect(mobile).toContain(`--cw-glass-${v}-bg: var(--cw-glass-${v}-tint)`)
    }
    expect(mobile).toMatch(/:where\(\[data-cw-blur\], :popover-open, dialog\[open\]\)/)
  })

  it('el tinte de cada tema es exactamente el fondo translúcido de la 001', () => {
    for (const theme of ['dark-theme', 'light-theme']) {
      const tokens = themeBlock(theme)
      for (const v of ['subtle', 'standard', 'strong']) expect(tokens[`--cw-glass-${v}-tint`], `${theme} ${v}`).toBe(tokens[`--cw-glass-${v}-bg`])
    }
  })

  it('con transparencia reducida o sin backdrop-filter, también lo marcado vuelve al sólido', () => {
    const tail = tokensCss.slice(tokensCss.indexOf('@supports not'))
    expect(tail).toMatch(/@supports not[\s\S]*:where\(\[data-cw-blur\], :popover-open, dialog\[open\]\) \{[\s\S]*--cw-glass-standard-blur: 0px/)
    expect(tail).toMatch(/prefers-reduced-transparency: reduce\)[\s\S]*:where\(\[data-cw-blur\][\s\S]*--cw-glass-standard-bg: var\(--cw-glass-solid-standard-bg\)/)
    expect(tokensCss.indexOf(MOBILE)).toBeLessThan(tokensCss.indexOf('@supports not'))
  })
})

describe('presupuesto de blur (R-601)', () => {
  it('en < md quita el backdrop-filter a todo lo que no está marcado, abierto en el top layer o es la marca', () => {
    expect(globalsCss).toMatch(
      /@media \(max-width: 767\.98px\) \{\s*:root :not\(\[data-cw-blur\], :popover-open, dialog\[open\]\) \{\s*-webkit-backdrop-filter: none !important;\s*backdrop-filter: none !important;/,
    )
  })
})

describe('luz táctil en el cristal (FR-601)', () => {
  it('con puntero grueso y sin movimiento reducido el reflejo sigue a data-cw-touching', () => {
    const css = glass('.x { @include glass-light; }')
    expect(css).toMatch(
      /@media \(pointer: coarse\) and \(prefers-reduced-motion: no-preference\) \{\s*\.x\[data-cw-touching\] \{\s*--cw-light-x: var\(--cw-mx, 22%\);\s*--cw-light-y: var\(--cw-my, 0%\);\s*--cw-spot-mix: 1;/,
    )
  })

  it('el borde se desvanece con --cw-touch-fade (300 ms) en táctil', () => {
    const css = glass('.x { @include glass-edge; }')
    expect(css).toMatch(/\(pointer: coarse\)[\s\S]*\.x::before \{\s*transition-duration: var\(--cw-duration-base\), var\(--cw-duration-base\), var\(--cw-touch-fade\)/)
    expect(tokensCss).toMatch(/--cw-touch-fade: 300ms;/)
  })
})

describe('barrido y profundidad (FR-604, FR-605, FR-653)', () => {
  const sweep = glass('.s { @include glass-sweep; }')
  const float = glass('.f { @include glass-float(3); }')

  it('el barrido solo existe en < md sin movimiento reducido, con view() dentro de @supports y respaldo de una vez', () => {
    expect(between(sweep, '.s {', '}')).toContain('display: none')
    const motion = between(sweep, '@media (max-width: 767.98px) and (prefers-reduced-motion: no-preference)', '@keyframes')
    expect(motion).toContain('display: block')
    expect(motion).toMatch(/@supports \(animation-timeline: view\(\)\)[\s\S]*animation-timeline: --cw-sweep/)
    expect(motion).toMatch(/@supports not \(animation-timeline: view\(\)\)[\s\S]*\.s\[data-cw-sweep=in\]::before \{\s*animation: cw-sweep var\(--cw-sweep-duration\) var\(--cw-ease-out\) 1 both/)
    const keyframes = between(sweep, '@keyframes cw-sweep')
    expect(keyframes.match(/^\s+(\w[\w-]*):/gm)?.map((line) => line.trim().replace(':', ''))).toEqual(['transform', 'transform'])
  })

  it('la duración del barrido está entre 600 y 800 ms', () => {
    const value = Number(/--cw-sweep-duration: (\d+)ms;/.exec(tokensCss)?.[1])
    expect(value).toBeGreaterThanOrEqual(600)
    expect(value).toBeLessThanOrEqual(800)
  })

  it('la profundidad usa solo translate, 3 niveles y 12 px como máximo', () => {
    expect(float).toContain('--cw-float-shift: var(--cw-float-3)')
    expect(float).toMatch(/@media \(max-width: 767\.98px\) and \(prefers-reduced-motion: no-preference\) \{\s*@supports \(animation-timeline: view\(\)\)/)
    const keyframes = between(float, '@keyframes cw-float')
    expect(keyframes.match(/^\s+(\w[\w-]*):/gm)?.map((line) => line.trim().replace(':', ''))).toEqual(['translate', 'translate'])
    const levels = [1, 2, 3].map((n) => Number(new RegExp(`--cw-float-${n}: (\\d+)px;`).exec(tokensCss)?.[1]))
    expect(levels).toEqual([4, 8, 12])
    expect(() => glass('.f { @include glass-float(4); }')).toThrow(/nivel desconocido/)
  })

  it('globals aplica los patrones por atributo', () => {
    expect(globalsCss).toContain('[data-cw-sweep] {')
    for (const n of [1, 2, 3]) expect(globalsCss).toContain(`[data-cw-float="${n}"]`)
  })
})

describe('espacio del dock y hojas (FR-607, T815)', () => {
  it('con JS en < md reserva abajo la altura del dock más el área segura', () => {
    expect(globalsCss).toMatch(/:root\[data-js\] body \{\s*padding-bottom: var\(--cw-dock-space\);/)
    expect(globalsCss).toMatch(/:root\[data-js\] \{\s*scroll-padding-bottom: var\(--cw-dock-space\);/)
    expect(tokensCss).toMatch(/--cw-dock-space: calc\(var\(--cw-dock-h\) \+ 2 \* var\(--cw-dock-offset\) \+ env\(safe-area-inset-bottom, 0px\)\);/)
  })

  it('con una hoja abierta en < md la página de atrás no se desplaza', () => {
    expect(globalsCss).toMatch(/:root:has\(dialog\[data-cw-sheet\]\[open\]\) \{\s*overflow: hidden;/)
  })

  it('la hoja usa 100dvh, áreas seguras y solo transform y opacity', () => {
    const sheet = compileString(`@use 'sheet' as *;\n.p { @include sheet-panel; }`, { loadPaths, style: 'expanded' }).css
    expect(sheet).toContain('max-height: calc(100dvh - var(--cw-sheet-gap) - var(--cw-keyboard-inset, 0px))')
    expect(sheet).toContain('env(safe-area-inset-bottom, 0px)')
    for (const transition of sheet.match(/transition:[^;]+;/g) ?? []) {
      const properties = transition
        .replace(/transition:|!important|;/g, '')
        .split(',')
        .map((part) => part.trim().split(/\s+/)[0])
      for (const property of properties) expect(['transform', 'opacity', 'none']).toContain(property)
    }
  })
})
