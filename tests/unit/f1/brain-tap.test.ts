import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { compile } from 'sass'
import { describe, expect, it } from 'vitest'
import { RAIN_HOLD_ATTRIBUTE, rainActive } from '@/components/site/about/rain'

const root = process.cwd()
const css = compile(join(root, 'components', 'site', 'about', 'Brain.module.scss'), { loadPaths: [join(root, 'styles')], style: 'expanded' }).css
const source = readFileSync(join(root, 'components', 'site', 'about', 'BrainMap.tsx'), 'utf8')
const MOBILE = '@media (max-width: 767.98px)'

function mobileBlocks(): string {
  return css
    .split(MOBILE)
    .slice(1)
    .map((part) => {
      let depth = 0
      for (let index = part.indexOf('{'); index < part.length; index += 1) {
        if (part[index] === '{') depth += 1
        if (part[index] === '}') depth -= 1
        if (depth === 0) return part.slice(0, index + 1)
      }
      return part
    })
    .join('\n')
}

describe('tocar un lóbulo responde rápido en el mapa compacto (F1, hallazgo 2, SC-603)', () => {
  it('la hoja se abre después de pintar el lóbulo marcado, no dentro del clic', () => {
    const choose = source.slice(source.indexOf('const choose = '), source.indexOf('const onLobeKey'))
    expect(choose).toContain('openSheetAfterPaint()')
    expect(choose).not.toContain('setSheetOpen(true)')
    const after = source.slice(source.indexOf('const openSheetAfterPaint = '), source.indexOf('const choose = '))
    expect(after).toMatch(/requestAnimationFrame\(\(\) => \{\s*pending\.timer = window\.setTimeout\(\(\) => setSheetOpen\(true\), 0\)/)
  })

  it('cada lóbulo del mapa es un componente memorizado: cambiar de lóbulo no repinta todas las neuronas', () => {
    expect(source).toMatch(/const FullLobe = memo\(/)
    expect(source).toMatch(/const CompactLobe = memo\(/)
    expect(source).toMatch(/const LobePanel = memo\(/)
    expect(source).toContain('{compact ? null : <FullMap data={data} lit={lit} />}')
  })

  it('en móvil las conexiones encendidas no animan stroke-dashoffset (FR-653) y el mapa se queda quieto bajo la hoja', () => {
    const mobile = mobileBlocks()
    expect(mobile).toMatch(/\.svgCompact \.synOn \{\s*animation: none;/)
    expect(mobile).toMatch(/\.map\[data-cw-held\] \*,\s*\.map\[data-cw-held\] \*::before,\s*\.map\[data-cw-held\] \*::after \{\s*animation-play-state: paused;/)
  })

  it('la lluvia se detiene mientras la hoja la tapa', () => {
    const base = { running: true, visible: true, inView: true, reduced: false }
    expect(RAIN_HOLD_ATTRIBUTE).toBe('data-cw-held')
    expect(rainActive({ ...base, held: false })).toBe(true)
    expect(rainActive({ ...base, held: true })).toBe(false)
    expect(source).toMatch(/<canvas [^>]*data-cw-rain="" data-cw-held=\{sheetOpen \? '' : undefined\}/)
  })
})
