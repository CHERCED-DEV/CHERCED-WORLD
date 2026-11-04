import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio, over, parseColor, type Rgba, withAlpha } from '@/lib/motion/contrast'
import { CANVAS_CEILING } from '@/lib/motion/engine'
import type { Intensity } from '@/lib/motion/intensity'

const root = process.cwd()
const tokens = readFileSync(join(root, 'styles', 'tokens.scss'), 'utf8')
const backgroundStyles = readFileSync(join(root, 'components', 'motion', 'Background.module.scss'), 'utf8')

function block(source: string, header: string): string {
  const start = source.indexOf(header)
  if (start < 0) throw new Error(`no encontré ${header}`)
  return source.slice(start, source.indexOf('\n}', start))
}

function raw(source: string, name: string): string {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(source)
  if (!match?.[1]) throw new Error(`no pude leer ${name}`)
  return match[1].trim()
}

function color(source: string, name: string): Rgba {
  const parsed = parseColor(raw(source, name))
  if (!parsed) throw new Error(`${name} no es un color`)
  return parsed
}

type Overlay = { color: Rgba; light: boolean }

function grainOverlays(source: string): Overlay[] {
  const svg = decodeURIComponent(raw(source, '--cw-glass-grain'))
  const filters = new Map<string, Rgba>()
  for (const [, id, values] of svg.matchAll(/<filter id='(\w+)'[\s\S]*?feColorMatrix values='([^']+)'/g)) {
    const v = (values ?? '').trim().split(/\s+/).map(Number)
    filters.set(id ?? '', { r: (v[4] ?? 0) * 255, g: (v[9] ?? 0) * 255, b: (v[14] ?? 0) * 255, a: 1 })
  }
  return [...svg.matchAll(/filter='url\(#(\w+)\)' opacity='([0-9.]+)'/g)].map(([, id, opacity]) => {
    const base = filters.get(id ?? '')
    if (!base) throw new Error(`filtro ${id} sin matriz`)
    return { color: withAlpha(base, Number(opacity)), light: base.r > 127 }
  })
}

function apply(surface: Rgba, layers: Rgba[]): Rgba {
  return layers.reduce((acc, layer) => over(layer, acc), surface)
}

const themes = {
  dark: block(tokens, '@mixin dark-theme'),
  light: block(tokens, '@mixin light-theme'),
} as const
const accent = color(block(tokens, ':root {'), '--cw-intro-accent')
const sea = color(backgroundStyles, '--cw-bg-sea')
const intensities: Intensity[] = ['full', 'subtle']
const variants = ['subtle', 'standard', 'strong'] as const

describe('presupuesto de contraste del cristal v2', () => {
  for (const [theme, source] of Object.entries(themes)) {
    const bg = color(source, '--cw-bg')
    const particle = color(source, '--cw-fg')
    const texts = { fg: color(source, '--cw-fg'), muted: color(source, '--cw-fg-muted') }
    const sheen = color(source, '--cw-glass-sheen')
    const grain = grainOverlays(source)
    const line = color(source, '--cw-graphic-line')
    const glow = color(source, '--cw-graphic-glow')
    const sheenIsLight = sheen.r > 127

    const lightening = [...grain.filter((g) => g.light).map((g) => g.color), ...(sheenIsLight ? [sheen] : [])]
    const darkening = [...grain.filter((g) => !g.light).map((g) => g.color), ...(sheenIsLight ? [] : [sheen])]

    it(`en tema ${theme}, grano y reflejo mantienen AA sobre cualquier variante y cuadro del fondo`, () => {
      const failures: string[] = []
      for (const intensity of intensities) {
        const bases = theme === 'dark' && intensity === 'full' ? [bg, over(sea, bg)] : [bg]
        for (const base of bases) {
          for (const dot of [particle, accent, bg]) {
            const canvas = over(withAlpha(dot, CANVAS_CEILING[intensity]), base)
            for (const variant of variants) {
              const surface = over(color(source, `--cw-glass-${variant}-bg`), canvas)
              const graphics = variant === 'subtle' ? [[]] : [[], [line], [glow]]
              for (const extra of graphics) {
                for (const layers of [lightening, darkening]) {
                  const result = apply(surface, [...layers, ...extra])
                  for (const [name, text] of Object.entries(texts)) {
                    const ratio = contrastRatio(text, result)
                    if (ratio < 4.5) failures.push(`${intensity}/${variant}/${name}/${extra.length ? 'grafismo' : 'base'}: ${ratio.toFixed(2)}`)
                  }
                }
              }
            }
          }
        }
      }
      expect(failures).toEqual([])
    })

    it(`en tema ${theme}, el fallback sólido conserva AA con grano y reflejo`, () => {
      for (const variant of variants) {
        const solid = color(source, `--cw-glass-solid-${variant}-bg`)
        for (const layers of [lightening, darkening]) {
          const result = apply(solid, layers)
          for (const text of Object.values(texts)) expect(contrastRatio(text, result)).toBeGreaterThanOrEqual(4.5)
        }
      }
    })
  }
})
