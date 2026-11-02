import { join } from 'node:path'
import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

const loadPaths = [join(process.cwd(), 'styles')]

function compile(body: string): string {
  return compileString(`@use 'glass' as *;\n${body}`, { loadPaths, style: 'expanded' }).css
}

function declarations(css: string, selector: string): string[] {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`no encontré ${selector}`)
  return css
    .slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
    .split(';')
    .map((line) => line.trim())
    .filter(Boolean)
}

describe('mixins del cristal v2', () => {
  it('glass() de la 001 queda igual', () => {
    expect(declarations(compile('.x { @include glass(standard); }'), '.x')).toEqual([
      'background: var(--cw-glass-standard-bg)',
      '-webkit-backdrop-filter: blur(var(--cw-glass-standard-blur)) saturate(var(--cw-glass-saturate))',
      'backdrop-filter: blur(var(--cw-glass-standard-blur)) saturate(var(--cw-glass-saturate))',
      'border: 1px solid var(--cw-glass-border)',
      'border-radius: var(--cw-glass-radius)',
      'box-shadow: var(--cw-glass-shadow)',
      'color: var(--cw-fg)',
    ])
  })

  it('glass-grain agrega una capa de imagen sin tocar el color de fondo', () => {
    const css = declarations(compile('.x { @include glass(subtle); @include glass-grain; }'), '.x')
    expect(css).toContain('background: var(--cw-glass-subtle-bg)')
    expect(css).toContain('background-image: var(--cw-glass-grain)')
    expect(css.findIndex((d) => d.startsWith('background:'))).toBeLessThan(css.findIndex((d) => d.startsWith('background-image')))
  })

  it('glass-depth reemplaza la sombra por la de profundidad', () => {
    expect(declarations(compile('.x { @include glass-depth; }'), '.x')).toEqual(['box-shadow: var(--cw-glass-depth)'])
  })

  it('glass-edge dibuja el brillo especular en ::before, sobre el borde y sin capturar el puntero', () => {
    const css = compile('.x { @include glass-edge; }')
    const before = declarations(css, '.x::before').join(';')
    expect(before).toContain('conic-gradient(')
    expect(before).toContain('mask-composite: xor')
    expect(before).toMatch(/mask:\s+linear-gradient\(#000 0 0\) content-box exclude/)
    expect(before).toContain('pointer-events: none')
    expect(declarations(css, '.x')).toContain('isolation: isolate')
  })

  it('glass-light pone el reflejo detrás del contenido y solo sigue al puntero con hover fino y sin movimiento reducido', () => {
    const css = compile('.x { @include glass-light; }')
    const after = declarations(css, '.x::after').join(';')
    expect(after).toContain('z-index: -1')
    expect(after).toContain('var(--cw-glass-sheen)')
    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\) and \(prefers-reduced-motion: no-preference\) \{\s*\.x:hover \{\s*--cw-light-x: var\(--cw-mx, 22%\);/,
    )
  })

  it('glass-crystal compone todas las capas sobre glass()', () => {
    const css = compile('.x { @include glass-crystal(strong); }')
    const x = declarations(css, '.x').join(';')
    expect(x).toContain('background: var(--cw-glass-strong-bg)')
    expect(x).toContain('background-image: var(--cw-glass-grain)')
    expect(x).toContain('box-shadow: var(--cw-glass-depth)')
    expect(css).toContain('.x::before')
    expect(css).toContain('.x::after')
  })

  it('rechaza variantes desconocidas', () => {
    expect(() => compile('.x { @include glass-crystal(neon); }')).toThrow(/variante desconocida/)
  })
})
