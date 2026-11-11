import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PatternAtlas } from '@/components/site/synergos/arquitectura/PatternAtlas'
import { SystemBlueprint } from '@/components/site/synergos/arquitectura/SystemBlueprint'
import { architecture, patternName } from '@/content/synergos-architecture'

describe('U7: los patrones de la arquitectura en español llevan su nombre canónico (R1.2)', () => {
  it('en español, cada patrón con nombre en inglés tiene título en español y el canónico debajo', () => {
    for (const pattern of [...architecture.patterns, ...architecture.decisions]) {
      const { title, canonical } = patternName(pattern, 'es')
      if (canonical === null) {
        expect(title, pattern.id).toBe(pattern.name)
        continue
      }
      expect(canonical).toBe(pattern.name)
      expect(title, pattern.id).not.toBe(pattern.name)
    }
    expect(patternName(architecture.patterns.find((item) => item.id === 'reserva-dos-tiempos')!, 'es')).toEqual({
      title: 'Reserva en dos tiempos',
      canonical: 'Two-phase reservation',
    })
  })

  it('en inglés queda solo el nombre canónico', () => {
    for (const pattern of architecture.patterns) expect(patternName(pattern, 'en')).toEqual({ title: pattern.name, canonical: null })
  })

  it('el atlas en español marca el nombre canónico con lang="en"', () => {
    const html = renderToStaticMarkup(createElement(PatternAtlas, { lang: 'es' }))
    expect(html).toContain('Higuera estranguladora')
    expect(html).toMatch(/lang="en"[^>]*>Strangler Fig</)
  })

  it('el texto en español ya no dice seams, back, design system ni showcase sueltos', () => {
    const text = JSON.stringify(architecture)
    expect(text).not.toContain('Los seams')
    expect(text).not.toContain('En el back,')
    expect(text).not.toContain('gemela del design system')
    expect(text).not.toContain('con el showcase')
  })
})

describe('U11: ↗ queda solo para enlaces externos (R1.2)', () => {
  it('el hero de la arquitectura no usa ↗ para anclas de la misma página', () => {
    for (const lang of ['es', 'en'] as const) expect(renderToStaticMarkup(createElement(SystemBlueprint, { lang }))).not.toContain('↗')
  })
})
