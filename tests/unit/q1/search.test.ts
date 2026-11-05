import { describe, expect, it } from 'vitest'
import { anyShown, isShown } from '@/components/blog/index/BlogFilter'
import { searchStatus, type BlogSearchLabels } from '@/components/blog/index/BlogSearch'
import { blogSearcher, isBlankQuery, matchPosts, toSearchDocs } from '@/components/blog/index/search'
import { centeredScrollLeft } from '@/components/blog/index/TagFilter'
import { post } from '../q0/support/posts'

const POSTS = [
  post('post9', { title: 'La compensación es dato', description: 'Sagas en Synergos: deshacer una reserva no es soltar un apartado.', tags: ['sagas', 'arquitectura'] }),
  post('post6', { title: 'Lo que 2.353 tests no vieron', description: 'Criterio, no volumen.', tags: ['tests', 'calidad'] }),
  post('post3', { title: 'Cuando una plataforma de pagos falla', description: 'Un cuento corto.', tags: ['cuento', 'humor'] }),
  post('post2', { title: 'El futuro de la humanidad', description: 'La IA como aliada.', tags: ['inteligencia artificial', 'opinión'] }),
  post('post7', { title: 'Untranslated saga notes', description: 'Only in English.', tags: ['sagas'], fallback: true, lang: 'en' }),
]

const searcher = blogSearcher(toSearchDocs(POSTS))

const LABELS: BlogSearchLabels = {
  search: 'Buscar en el blog',
  clear: 'Limpiar',
  noResults: 'Sin resultados para «{query}».',
  result: '1 resultado',
  results: '{count} resultados',
}

describe('búsqueda del blog (T615, FR-506)', () => {
  it('busca en título, descripción y etiquetas con el motor del índice del sitio', () => {
    expect([...(matchPosts(searcher, 'saga') ?? [])]).toEqual(['post9'])
    expect([...(matchPosts(searcher, 'tests') ?? [])]).toEqual(['post6'])
    expect(matchPosts(searcher, 'humor')).toEqual(new Set(['post3']))
    expect(matchPosts(searcher, 'aliada')).toEqual(new Set(['post2']))
  })

  it('ignora tildes y mayúsculas', () => {
    expect(matchPosts(searcher, 'OPINION')).toEqual(new Set(['post2']))
    expect(matchPosts(searcher, 'compensacion')).toEqual(new Set(['post9']))
  })

  it('un post sin traducción no aparece en la búsqueda del otro idioma', () => {
    expect(toSearchDocs(POSTS).map((doc) => doc.id)).not.toContain('post7')
    expect(matchPosts(searcher, 'untranslated')).toEqual(new Set())
  })

  it('una consulta vacía muestra todo y una sin coincidencias deja el conjunto vacío', () => {
    expect(isBlankQuery('   ')).toBe(true)
    expect(matchPosts(searcher, '  ')).toBeNull()
    expect(matchPosts(searcher, 'kubernetes')).toEqual(new Set())
  })

  it('anuncia la cantidad en singular, en plural y sin resultados', () => {
    expect(searchStatus(LABELS, '', null)).toBe('')
    expect(searchStatus(LABELS, 'humor', new Set(['post3']))).toBe('1 resultado')
    expect(searchStatus(LABELS, 'a', new Set(['post3', 'post2']))).toBe('2 resultados')
    expect(searchStatus(LABELS, ' saga  ', new Set())).toBe('Sin resultados para «saga».')
  })

  it('el filtro oculta tarjetas y grupos que no coinciden, y sin consulta no oculta nada', () => {
    expect(isShown({ visible: null }, 'post3')).toBe(true)
    expect(isShown({ visible: new Set(['post9']) }, 'post3')).toBe(false)
    expect(anyShown({ visible: new Set(['post9']) }, ['post3', 'post9'])).toBe(true)
    expect(anyShown({ visible: new Set() }, ['post3'])).toBe(false)
  })
})

describe('fila de etiquetas en móvil', () => {
  it('centra la etiqueta activa sin pasarse de los bordes del carrusel', () => {
    const scroller = { clientWidth: 300, scrollWidth: 1000 }
    expect(centeredScrollLeft(scroller, { offsetLeft: 600, offsetWidth: 100 })).toBe(500)
    expect(centeredScrollLeft(scroller, { offsetLeft: 20, offsetWidth: 80 })).toBe(0)
    expect(centeredScrollLeft(scroller, { offsetLeft: 950, offsetWidth: 50 })).toBe(700)
  })
})
