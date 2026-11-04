import { describe, expect, it } from 'vitest'
import { caseStudyExtraLabels, portfolioKeys } from '@/components/site/portfolio/labels'
import { STACK_LAYERS } from '@/components/site/portfolio/stack'
import { MissingTranslationError } from '@/lib/i18n'

const echo = Object.fromEntries(portfolioKeys().map((key) => [key, `«${key}»`]))

describe('textos del caso de estudio', () => {
  it('pide cada clave una sola vez', () => {
    expect(new Set(portfolioKeys()).size).toBe(portfolioKeys().length)
  })

  it('arma todos los grupos de etiquetas desde el diccionario', () => {
    const labels = caseStudyExtraLabels(echo)
    expect(labels.eyebrow).toBe('«case.eyebrow»')
    expect(labels.embed.openLive).toBe('«embed.openLive»')
    expect(labels.gallery.thumb).toBe('«gallery.thumb»')
    for (const layer of STACK_LAYERS) expect(labels.layers[layer]).toBe(`«case.layer.${layer}»`)
    const values = [
      ...Object.values(labels).filter((value): value is string => typeof value === 'string'),
      ...Object.values(labels.layers),
      ...Object.values(labels.gallery),
      ...Object.values(labels.embed),
    ]
    expect(values.sort()).toEqual(Object.values(echo).sort())
  })

  it('falla en voz alta si falta una clave', () => {
    const { ['embed.retry']: _missing, ...partial } = echo
    expect(() => caseStudyExtraLabels(partial)).toThrow(MissingTranslationError)
  })
})
