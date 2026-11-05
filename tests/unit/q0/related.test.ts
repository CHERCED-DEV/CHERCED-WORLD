import { describe, expect, it } from 'vitest'
import { RELATED_LIMIT, relatedPosts } from '@/lib/blog/related'
import { ids, post } from './support/posts'

const current = post('actual', { date: '2026-05-01', tags: ['Arquitectura', 'sagas', 'tests'] })

const posts = [
  current,
  post('anterior', { date: '2026-04-01', tags: ['arquitectura', 'sagas', 'tests'] }),
  post('siguiente', { date: '2026-06-01', tags: ['sagas', 'tests'] }),
  post('tres', { date: '2025-01-01', tags: ['arquitectura', 'Sagas', 'tests'] }),
  post('dos-viejo', { date: '2023-01-01', tags: ['arquitectura', 'sagas'] }),
  post('dos-nuevo', { date: '2024-01-01', tags: ['tests', 'sagas', 'opinión'] }),
  post('uno', { date: '2026-10-01', tags: ['tests'] }),
  post('ninguno', { date: '2026-11-01', tags: ['humor'] }),
]

describe('relatedPosts (FR-513, R-506)', () => {
  it('ordena por etiquetas en común y luego por fecha, hasta 3', () => {
    expect(RELATED_LIMIT).toBe(3)
    expect(ids(relatedPosts(current, posts))).toEqual(['anterior', 'tres', 'siguiente'])
  })

  it('no repite el anterior, el siguiente ni el propio', () => {
    const related = relatedPosts(current, posts, ['anterior', 'siguiente'])
    expect(ids(related)).toEqual(['tres', 'dos-nuevo', 'dos-viejo'])
    expect(ids(related)).not.toContain('actual')
  })

  it('deja fuera los posts sin etiquetas en común, aunque sobren huecos', () => {
    const related = relatedPosts(current, posts, ['anterior', 'siguiente', 'tres', 'dos-nuevo', 'dos-viejo'])
    expect(ids(related)).toEqual(['uno'])
    expect(relatedPosts(post('solo', { tags: ['humor'] }), [post('otro', { tags: ['cuento'] })])).toEqual([])
  })

  it('compara etiquetas por slug y cuenta cada una una vez', () => {
    const repeated = post('repetido', { date: '2020-01-01', tags: ['Tests', 'tests', 'TESTS'] })
    const one = post('una', { date: '2021-01-01', tags: ['sagas'] })
    expect(ids(relatedPosts(current, [repeated, one]))).toEqual(['una', 'repetido'])
  })
})
