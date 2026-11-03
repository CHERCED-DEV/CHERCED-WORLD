import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const tokens = readFileSync(join(root, 'styles', 'tokens.scss'), 'utf8')
const globals = readFileSync(join(root, 'styles', 'globals.scss'), 'utf8')
const graphics = readFileSync(join(root, 'components', 'ui', 'graphics', 'graphics.module.scss'), 'utf8')

function block(source: string, header: string): string {
  const start = source.indexOf(header)
  if (start < 0) throw new Error(`no encontré ${header}`)
  return source.slice(start, source.indexOf('\n}', start))
}

function declarations(text: string): Record<string, string> {
  return Object.fromEntries(
    [...text.matchAll(/(--cw-[a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1] ?? '', (match[2] ?? '').replace(/\s+/g, ' ').trim()]),
  )
}

const current = {
  root: declarations(block(tokens, ':root {')),
  dark: declarations(block(tokens, '@mixin dark-theme')),
  light: declarations(block(tokens, '@mixin light-theme')),
}

const TOKENS_001 = {
  root: {
    '--cw-glass-subtle-blur': '8px',
    '--cw-glass-standard-blur': '14px',
    '--cw-glass-strong-blur': '22px',
    '--cw-glass-saturate': '140%',
    '--cw-glass-radius': '20px',
    '--cw-space-1': '0.25rem',
    '--cw-space-2': '0.5rem',
    '--cw-space-3': '0.75rem',
    '--cw-space-4': '1rem',
    '--cw-space-5': '1.5rem',
    '--cw-space-6': '2rem',
    '--cw-space-7': '3rem',
    '--cw-space-8': '4rem',
    '--cw-radius-sm': '8px',
    '--cw-radius-md': '14px',
    '--cw-radius-lg': '20px',
    '--cw-z-base': '0',
    '--cw-z-header': '100',
    '--cw-z-menu': '200',
    '--cw-z-dialog': '300',
    '--cw-z-intro': '400',
    '--cw-z-toast': '500',
    '--cw-font-sans': "var(--cw-font-montserrat, 'Montserrat'), system-ui, -apple-system, 'Segoe UI', sans-serif",
    '--cw-text-xs': '0.75rem',
    '--cw-text-sm': '0.875rem',
    '--cw-text-md': '1rem',
    '--cw-text-lg': '1.25rem',
    '--cw-text-xl': '1.5rem',
    '--cw-text-2xl': '2.125rem',
    '--cw-text-3xl': 'clamp(2.5rem, 6vw + 1rem, 3.75rem)',
    '--cw-duration-fast': '120ms',
    '--cw-duration-base': '220ms',
    '--cw-duration-slow': '420ms',
    '--cw-ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
    '--cw-header-h': '4rem',
    '--cw-container-max': '1248px',
    '--cw-intro-accent': '#25ed9e',
  },
  dark: {
    '--cw-bg': '#000000',
    '--cw-fg': '#ffffff',
    '--cw-fg-muted': '#cfcfcf',
    '--cw-accent': '#ffffff',
    '--cw-accent-fg': '#000000',
    '--cw-focus': '#ffffff',
    '--cw-danger': '#ff8a8a',
    '--cw-icon-filter': 'none',
    '--cw-glass-subtle-bg': 'rgb(0 0 0 / 0.55)',
    '--cw-glass-standard-bg': 'rgb(0 0 0 / 0.65)',
    '--cw-glass-strong-bg': 'rgb(0 0 0 / 0.78)',
    '--cw-glass-border': 'rgb(255 255 255 / 0.16)',
    '--cw-glass-shadow': '0 8px 32px rgb(0 0 0 / 0.45), inset 0 1px 0 rgb(255 255 255 / 0.08)',
    '--cw-glass-solid-subtle-bg': '#0b0b0b',
    '--cw-glass-solid-standard-bg': '#111111',
    '--cw-glass-solid-strong-bg': '#161616',
  },
  light: {
    '--cw-bg': '#ffffff',
    '--cw-fg': '#000000',
    '--cw-fg-muted': '#3a3a3a',
    '--cw-accent': '#000000',
    '--cw-accent-fg': '#ffffff',
    '--cw-focus': '#000000',
    '--cw-danger': '#b00020',
    '--cw-icon-filter': 'invert(1)',
    '--cw-glass-subtle-bg': 'rgb(255 255 255 / 0.6)',
    '--cw-glass-standard-bg': 'rgb(255 255 255 / 0.7)',
    '--cw-glass-strong-bg': 'rgb(255 255 255 / 0.82)',
    '--cw-glass-border': 'rgb(0 0 0 / 0.12)',
    '--cw-glass-shadow': '0 8px 32px rgb(0 0 0 / 0.12), inset 0 1px 0 rgb(255 255 255 / 0.5)',
    '--cw-glass-solid-subtle-bg': '#fafafa',
    '--cw-glass-solid-standard-bg': '#f4f4f4',
    '--cw-glass-solid-strong-bg': '#eeeeee',
  },
} as const

const NEW_ROOT = [
  ...['sm', 'md', 'lg', 'xl'].map((size) => `--cw-display-${size}`),
  ...['display', 'tight', 'snug', 'body'].map((name) => `--cw-leading-${name}`),
  ...['display', 'label', 'eyebrow'].map((name) => `--cw-tracking-${name}`),
  '--cw-measure',
  '--cw-section-gap',
  ...['instant', 'page', 'reveal', 'ambient'].map((name) => `--cw-duration-${name}`),
  ...['out', 'in', 'in-out', 'spring'].map((name) => `--cw-ease-${name}`),
  '--cw-stagger',
  '--cw-reveal-distance',
  '--cw-press-scale',
  '--cw-hover-lift',
  '--cw-glass-edge-width',
  '--cw-glass-edge-angle',
  '--cw-glass-spot-size',
  '--cw-glass-light-size',
  '--cw-glass-grain-size',
  '--cw-graphic-accent',
  '--cw-graphic-cell',
]

const NEW_THEME = [
  '--cw-glass-edge-highlight',
  '--cw-glass-edge-soft',
  '--cw-glass-edge-shade',
  '--cw-glass-spot',
  '--cw-glass-spot-accent',
  '--cw-glass-spot-rest',
  '--cw-glass-sheen',
  '--cw-glass-grain',
  '--cw-glass-depth',
  '--cw-graphic-line',
  '--cw-graphic-line-strong',
  '--cw-graphic-glow',
]

function ms(value: string): number {
  const match = /^([0-9.]+)(ms|s)$/.exec(value.trim())
  if (!match) throw new Error(`duración inválida ${value}`)
  return Number(match[1]) * (match[2] === 's' ? 1000 : 1)
}

const BRAND_RGB = new Set(['255,255,255', '0,0,0', '37,237,158'])

function colorLiterals(text: string): string[] {
  const found: string[] = []
  for (const [, r, g, b] of text.matchAll(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/g)) found.push(`${r},${g},${b}`)
  for (const [, hex] of text.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const full = hex.length === 3 ? [...hex].map((d) => d + d).join('') : hex
    found.push([0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)).join(','))
  }
  return found
}

describe('tokens de la 002 (R0)', () => {
  it.each(['root', 'dark', 'light'] as const)('los tokens de la 001 en %s conservan nombre y valor', (scope) => {
    for (const [name, value] of Object.entries(TOKENS_001[scope])) {
      expect(current[scope][name], `${scope}: ${name}`).toBe(value)
    }
  })

  it('declara los tokens nuevos de tipografía, movimiento y cristal en :root', () => {
    for (const name of NEW_ROOT) expect(current.root[name], name).toBeTruthy()
  })

  it.each(['dark', 'light'] as const)('el tema %s declara las capas nuevas del cristal y los grafismos', (theme) => {
    for (const name of NEW_THEME) expect(current[theme][name], `${theme}: ${name}`).toBeTruthy()
  })

  it('la tipografía display es fluida con clamp()', () => {
    for (const size of ['sm', 'md', 'lg', 'xl']) expect(current.root[`--cw-display-${size}`]).toMatch(/^clamp\(/)
  })

  it('el grano no supera opacidad 0,05 en ninguna capa', () => {
    for (const theme of ['dark', 'light'] as const) {
      const svg = decodeURIComponent(current[theme]['--cw-glass-grain'] ?? '')
      const opacities = [...svg.matchAll(/opacity='([0-9.]+)'/g)].map((match) => Number(match[1]))
      expect(opacities.length, theme).toBeGreaterThan(0)
      for (const value of opacities) expect(value, theme).toBeLessThanOrEqual(0.05)
    }
  })

  it('la transición entre páginas dura 350 ms o menos', () => {
    expect(ms(current.root['--cw-duration-page'] ?? '')).toBeLessThanOrEqual(350)
    for (const pseudo of ['::view-transition-old(.cw-page)', '::view-transition-new(.cw-page)']) {
      const rule = block(globals, pseudo)
      const times = [...rule.matchAll(/(\d+ms)/g)].map((match) => ms(match[1] ?? '0'))
      const total = times.reduce((sum, value) => sum + value, 0)
      expect(total, pseudo).toBeLessThanOrEqual(350)
    }
    expect(globals).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*::view-transition-new\(\*\)[\s\S]*animation: none/)
  })

  it('los grafismos y las capas del cristal solo usan blanco, negro y #25ED9E', () => {
    const themeColors = (['dark', 'light'] as const).flatMap((theme) =>
      Object.entries(current[theme])
        .filter(([name]) => /^--cw-(graphic|glass-(edge|spot|sheen|depth))/.test(name))
        .map(([, value]) => value),
    )
    const literals = [...colorLiterals(graphics), ...colorLiterals(themeColors.join(' ')), ...colorLiterals(current.root['--cw-intro-accent'] ?? '')]
    expect(literals.length).toBeGreaterThan(0)
    for (const rgb of literals) expect(BRAND_RGB, rgb).toContain(rgb)
  })
})
