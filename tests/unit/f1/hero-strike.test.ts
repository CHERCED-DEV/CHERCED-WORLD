import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { compile } from 'sass'
import { describe, expect, it } from 'vitest'
import { AA_NORMAL, contrastRatio, parseColor } from '@/lib/motion/contrast'

const root = process.cwd()
const css = compile(join(root, 'components', 'site', 'HomeBanner.module.scss'), { loadPaths: [join(root, 'styles')], style: 'expanded' }).css
const tokens = readFileSync(join(root, 'styles', 'tokens.scss'), 'utf8')

function rule(selector: string): string {
  const match = new RegExp(`(^|\\n)${selector.replace('.', '\\.')} \\{([^}]*)\\}`).exec(css)
  if (!match) throw new Error(`no encontré ${selector}`)
  return match[2] ?? ''
}

function token(theme: 'dark-theme' | 'light-theme', name: string): string {
  const start = tokens.indexOf(`@mixin ${theme}`)
  const block = tokens.slice(start, tokens.indexOf('\n}', start))
  const value = new RegExp(`${name}:\\s*([^;]+);`).exec(block)?.[1]?.trim()
  if (!value) throw new Error(`${theme} no define ${name}`)
  return value
}

describe('el título anterior del hero se lee y su tachado es tinta del texto (F1, hallazgo 1)', () => {
  it('la línea del tachado se pinta con currentColor en el acento, no como un fondo encima del texto', () => {
    const strike = rule('.strike')
    expect(strike).toMatch(/color: var\(--cw-graphic-accent\);/)
    expect(strike).toMatch(/background: currentColor;/)
    expect(strike).not.toMatch(/background: var\(/)
  })

  for (const theme of ['dark-theme', 'light-theme'] as const) {
    it(`${theme}: el título atenuado llega a AA sobre el cristal sólido del banner`, () => {
      const text = parseColor(token(theme, '--cw-fg-muted'))!
      const glass = parseColor(token(theme, '--cw-glass-solid-subtle-bg'))!
      expect(contrastRatio(text, glass)).toBeGreaterThanOrEqual(AA_NORMAL)
    })
  }
})
