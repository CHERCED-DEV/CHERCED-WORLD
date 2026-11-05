import { describe, expect, it } from 'vitest'
import { series } from '@/content/posts/series'
import { findSeries, partsOfSeries, seriesPosition } from '@/lib/blog/series'
import { ids, post } from './support/posts'

const fixture = [{ id: 'building', name: { es: 'Construyendo', en: 'Building' } }]

const posts = [
  post('tercera', { series: { id: 'building', part: 3 } }),
  post('suelta'),
  post('primera', { series: { id: 'building', part: 1 } }),
  post('otra', { series: { id: 'otra-serie', part: 1 } }),
]

describe('series (FR-512, R-506)', () => {
  it('arranca vacía: ninguna serie está decidida', () => {
    expect(series).toEqual([])
    expect(findSeries('building')).toBeNull()
  })

  it('encuentra el nombre de una serie en los datos', () => {
    expect(findSeries('building', fixture)?.name.en).toBe('Building')
    expect(findSeries('nada', fixture)).toBeNull()
  })

  it('devuelve las partes publicadas de la serie ordenadas por part', () => {
    expect(ids(partsOfSeries(posts, 'building'))).toEqual(['primera', 'tercera'])
    expect(partsOfSeries(posts, 'nada')).toEqual([])
  })

  it('la posición y el total cuentan solo las partes publicadas', () => {
    const parts = partsOfSeries(posts, 'building')
    expect(seriesPosition(parts, 'tercera')).toEqual({ n: 2, total: 2 })
    expect(seriesPosition(parts, 'primera')).toEqual({ n: 1, total: 2 })
    expect(seriesPosition(parts, 'suelta')).toBeNull()
  })
})
