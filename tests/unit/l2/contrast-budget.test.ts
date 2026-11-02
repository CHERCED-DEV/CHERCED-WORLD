import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrastRatio, over, parseColor, type Rgba, withAlpha } from '@/lib/motion/contrast'
import { CANVAS_CEILING } from '@/lib/motion/engine'
import { type Intensity } from '@/lib/motion/intensity'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const tokens = readFileSync(`${root}styles/tokens.scss`, 'utf8')
const backgroundStyles = readFileSync(`${root}components/motion/Background.module.scss`, 'utf8')

function block(source: string, header: string): string {
  const start = source.indexOf(header)
  if (start < 0) throw new Error(`no encontré ${header}`)
  const end = source.indexOf('\n}', start)
  return source.slice(start, end)
}

function variable(source: string, name: string): Rgba {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(source)
  const color = match ? parseColor(match[1]) : null
  if (!color) throw new Error(`no pude leer ${name}`)
  return color
}

const themes = {
  dark: block(tokens, '@mixin dark-theme'),
  light: block(tokens, '@mixin light-theme'),
} as const
const accent = variable(block(tokens, ':root {'), '--cw-intro-accent')
const sea = variable(backgroundStyles, '--cw-bg-sea')
const variants = ['subtle', 'standard', 'strong'] as const
const intensities: Intensity[] = ['full', 'subtle']

describe('presupuesto de contraste del fondo animado', () => {
  for (const [theme, source] of Object.entries(themes)) {
    const bg = variable(source, '--cw-bg')
    const particle = variable(source, '--cw-fg')
    const texts = { fg: variable(source, '--cw-fg'), muted: variable(source, '--cw-fg-muted') }

    it(`en tema ${theme}, ningún cuadro baja el texto sobre glass de AA (4.5:1)`, () => {
      const failures: string[] = []
      for (const intensity of intensities) {
        const bases = theme === 'dark' && intensity === 'full' ? [bg, over(sea, bg)] : [bg]
        for (const base of bases) {
          for (const color of [particle, accent]) {
            const canvas = over(withAlpha(color, CANVAS_CEILING[intensity]), base)
            for (const variant of variants) {
              const surface = over(variable(source, `--cw-glass-${variant}-bg`), canvas)
              for (const [name, text] of Object.entries(texts)) {
                const ratio = contrastRatio(text, surface)
                if (ratio < 4.5) failures.push(`${intensity}/${variant}/${name}: ${ratio.toFixed(2)}`)
              }
            }
          }
        }
      }
      expect(failures).toEqual([])
    })

    it(`en tema ${theme}, el fallback sólido también cumple AA`, () => {
      for (const variant of variants) {
        const solid = variable(source, `--cw-glass-solid-${variant}-bg`)
        for (const text of Object.values(texts)) expect(contrastRatio(text, solid)).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  it('en tema oscuro, el texto principal sin glass se lee sobre el fondo sutil', () => {
    const source = themes.dark
    const canvas = over(withAlpha(variable(source, '--cw-fg'), CANVAS_CEILING.subtle), variable(source, '--cw-bg'))
    expect(contrastRatio(variable(source, '--cw-fg'), canvas)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('matemática WCAG', () => {
  it('lee colores CSS y calcula razones conocidas', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseColor('rgb(0 0 0 / 0.55)')).toEqual({ r: 0, g: 0, b: 0, a: 0.55 })
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 })
    expect(parseColor('nada')).toBeNull()
    expect(contrastRatio(parseColor('#000')!, parseColor('#fff')!)).toBeCloseTo(21)
    expect(contrastRatio(parseColor('#777')!, parseColor('#fff')!)).toBeCloseTo(4.48, 2)
    expect(over({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 })).toEqual({ r: 127.5, g: 127.5, b: 127.5, a: 1 })
  })
})
