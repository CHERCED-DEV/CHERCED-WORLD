import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(join(process.cwd(), 'styles', 'tokens.scss'), 'utf8')

function block(name: string): string {
  const start = source.indexOf(`@mixin ${name}`)
  expect(start, `falta el mixin ${name}`).toBeGreaterThanOrEqual(0)
  const end = source.indexOf('\n}', start)
  return source.slice(start, end)
}

function declared(text: string): Set<string> {
  return new Set([...text.matchAll(/(--cw-[a-z0-9-]+)\s*:/g)].map((match) => match[1] ?? ''))
}

const variants = ['subtle', 'standard', 'strong']

const themeTokens = [
  '--cw-bg',
  '--cw-fg',
  '--cw-fg-muted',
  '--cw-accent',
  '--cw-focus',
  ...variants.map((v) => `--cw-glass-${v}-bg`),
  '--cw-glass-border',
  '--cw-glass-shadow',
]

const sharedTokens = [
  ...variants.map((v) => `--cw-glass-${v}-blur`),
  '--cw-glass-saturate',
  '--cw-glass-radius',
  ...Array.from({ length: 8 }, (_, i) => `--cw-space-${i + 1}`),
  ...['sm', 'md', 'lg'].map((size) => `--cw-radius-${size}`),
  ...['base', 'header', 'menu', 'dialog', 'intro', 'toast'].map((layer) => `--cw-z-${layer}`),
  '--cw-font-sans',
  ...['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((size) => `--cw-text-${size}`),
  ...['fast', 'base', 'slow'].map((speed) => `--cw-duration-${speed}`),
  '--cw-ease',
]

describe('contrato de design tokens (ui-shell.md)', () => {
  it.each(['dark-theme', 'light-theme'])('el tema %s define todos los tokens de color y glass', (theme) => {
    const tokens = declared(block(theme))
    for (const token of themeTokens) expect(tokens, `${theme}: ${token}`).toContain(token)
  })

  it('los dos temas definen exactamente los mismos tokens', () => {
    expect([...declared(block('dark-theme'))].sort()).toEqual([...declared(block('light-theme'))].sort())
  })

  it('define los tokens compartidos en :root', () => {
    const tokens = declared(source)
    for (const token of sharedTokens) expect(tokens, token).toContain(token)
  })

  it('aplica los temas por data-theme y por preferencia del sistema sin JS', () => {
    expect(source).toMatch(/:root\[data-theme='dark'\]\s*\{\s*@include dark-theme/)
    expect(source).toMatch(/:root\[data-theme='light'\]\s*\{\s*@include light-theme/)
    expect(source).toMatch(/prefers-color-scheme: light\)\s*\{\s*:root:not\(\[data-theme\]\)/)
  })

  it('tiene fallback sólido sin backdrop-filter y con reduced transparency', () => {
    expect(source).toContain('@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))')
    expect(source).toContain('@media (prefers-reduced-transparency: reduce)')
    const solid = declared(block('solid-glass'))
    for (const v of variants) {
      expect(solid).toContain(`--cw-glass-${v}-bg`)
      expect(solid).toContain(`--cw-glass-${v}-blur`)
    }
  })

  it('el glass oscuro arranca en opacidad 0.55 o más (research R-08)', () => {
    const dark = block('dark-theme')
    for (const v of variants) {
      const match = dark.match(new RegExp(`--cw-glass-${v}-bg:\\s*rgb\\(0 0 0 / ([0-9.]+)\\)`))
      expect(Number(match?.[1]), v).toBeGreaterThanOrEqual(0.55)
    }
  })
})
