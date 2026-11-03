import { describe, expect, it } from 'vitest'
import { activeHeading, adjacentPosts, orderPosts, readingProgress, spyLine } from '@/lib/blog'

const posts = [
  { id: 'post1', date: '2023-04-06' },
  { id: 'post2', date: '2023-04-06' },
  { id: 'post3', date: '2023-04-06' },
  { id: 'post4', date: '2026-11-02' },
  { id: 'post5', date: '2026-11-02' },
]
const registry = posts.map((post) => post.id)

describe('orden de los posts', () => {
  it('va del más nuevo al más viejo y, con la misma fecha, el último registrado va primero', () => {
    expect(orderPosts(posts, registry).map((post) => post.id)).toEqual(['post5', 'post4', 'post3', 'post2', 'post1'])
  })

  it('no muta la lista original y manda al final lo que no está en el registro', () => {
    const copy = [...posts, { id: 'suelto', date: '2023-04-06' }]
    const ordered = orderPosts(copy, registry)
    expect(copy[0]?.id).toBe('post1')
    expect(ordered.at(-1)?.id).toBe('suelto')
  })

  it('el anterior es el más viejo y el siguiente el más nuevo', () => {
    const ordered = orderPosts(posts, registry)
    expect(adjacentPosts(ordered, 'post4')).toEqual({ previous: { id: 'post3', date: '2023-04-06' }, next: { id: 'post5', date: '2026-11-02' } })
    expect(adjacentPosts(ordered, 'post5').next).toBeNull()
    expect(adjacentPosts(ordered, 'post1').previous).toBeNull()
    expect(adjacentPosts(ordered, 'catalog')).toEqual({ previous: null, next: null })
  })
})

describe('progreso de lectura', () => {
  it('empieza en 0 cuando el cuerpo está por debajo del header y llega a 1 cuando su final toca el borde inferior', () => {
    expect(readingProgress({ top: 600, height: 3000 }, 800, 64)).toBe(0)
    expect(readingProgress({ top: 64, height: 3000 }, 800, 64)).toBe(0)
    expect(readingProgress({ top: 800 - 3000, height: 3000 }, 800, 64)).toBe(1)
    expect(readingProgress({ top: -5000, height: 3000 }, 800, 64)).toBe(1)
    expect(readingProgress({ top: 64 - 1132, height: 3000 }, 800, 64)).toBeCloseTo(0.5, 5)
  })

  it('un cuerpo más corto que la pantalla vale 1 cuando se ve entero', () => {
    expect(readingProgress({ top: 100, height: 400 }, 800, 64)).toBe(1)
    expect(readingProgress({ top: 700, height: 400 }, 800, 64)).toBe(0)
  })

  it('no devuelve NaN', () => {
    expect(readingProgress({ top: Number.NaN, height: 3000 }, 800)).toBe(0)
  })
})

describe('sección activa del índice', () => {
  const headings = [
    { id: 'a', top: -900 },
    { id: 'b', top: -20 },
    { id: 'c', top: 400 },
  ]

  it('es el último encabezado que ya pasó la línea de lectura', () => {
    const line = spyLine(800, 64)
    expect(line).toBe(264)
    expect(activeHeading(headings, line)).toBe('b')
    expect(activeHeading(headings, 500)).toBe('c')
  })

  it('antes del primer encabezado no hay sección activa', () => {
    expect(activeHeading([{ id: 'a', top: 600 }], 264)).toBeNull()
    expect(activeHeading([], 264)).toBeNull()
  })
})
