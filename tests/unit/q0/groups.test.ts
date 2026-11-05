import { describe, expect, it } from 'vitest'
import { featuredPost, groupByYear, postYear } from '@/lib/blog/groups'
import { ids, post } from './support/posts'

const posts = [
  post('p2025', { date: '2025-06-10' }),
  post('p2023a', { date: '2023-04-06' }),
  post('p2026a', { date: '2026-11-02' }),
  post('p2026b', { date: '2026-11-02' }),
  post('p2023b', { date: '2023-09-01' }),
]

describe('groupByYear (FR-502, R-504)', () => {
  it('agrupa del año más nuevo al más viejo y ordena cada grupo del más nuevo al más viejo', () => {
    const groups = groupByYear(posts)
    expect(groups.map((group) => [group.year, group.label])).toEqual([
      [2026, 'now'],
      [2025, 'archive'],
      [2023, 'archive'],
    ])
    expect(ids(groups[0]!.posts)).toEqual(['p2026a', 'p2026b'])
    expect(ids(groups[2]!.posts)).toEqual(['p2023b', 'p2023a'])
  })

  it('"Ahora" es el año más reciente con posts, no el año del calendario', () => {
    const old = [post('x', { date: '2023-04-06' }), post('y', { date: '2022-01-15' })]
    const groups = groupByYear(old)
    expect(groups[0]).toMatchObject({ year: 2023, label: 'now' })
    expect(groups[1]).toMatchObject({ year: 2022, label: 'archive' })
  })

  it('saca el destacado de su grupo sin repetirlo, y "Ahora" se decide antes de sacarlo', () => {
    const groups = groupByYear(posts, ['p2026a'])
    expect(ids(groups[0]!.posts)).toEqual(['p2026b'])
    expect(groups.flatMap((group) => ids(group.posts))).not.toContain('p2026a')

    const onlyOneNew = [post('nuevo', { date: '2026-11-02' }), post('viejo', { date: '2023-04-06' })]
    expect(groupByYear(onlyOneNew, ['nuevo']).map((group) => [group.year, group.label])).toEqual([[2023, 'archive']])
  })

  it('sin posts no hay grupos', () => {
    expect(groupByYear([])).toEqual([])
    expect(postYear('2026-11-02')).toBe(2026)
  })
})

describe('featuredPost (FR-501)', () => {
  it('sin ninguno marcado, es el más reciente; en empate, el primero del orden recibido', () => {
    expect(featuredPost(posts)?.id).toBe('p2026a')
    expect(featuredPost([posts[3]!, posts[2]!])?.id).toBe('p2026b')
  })

  it('el marcado con featured gana aunque sea más viejo', () => {
    const marked = [...posts, post('viejo', { date: '2023-01-01', featured: true })]
    expect(featuredPost(marked)?.id).toBe('viejo')
  })

  it('con más de uno marcado gana el más reciente', () => {
    const twice = [post('a', { date: '2024-01-01', featured: true }), post('b', { date: '2025-01-01', featured: true }), post('c', { date: '2026-01-01' })]
    expect(featuredPost(twice)?.id).toBe('b')
  })

  it('sin posts es null', () => {
    expect(featuredPost([])).toBeNull()
  })
})
