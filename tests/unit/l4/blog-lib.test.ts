import { createElement, Fragment, isValidElement, type ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import {
  buildOutline,
  countWords,
  createSlugger,
  formatCommentDate,
  formatPostDate,
  parsePostDate,
  postAlternates,
  postPath,
  postUrl,
  readingMinutes,
  shareTargets,
  shouldShowToc,
  slugify,
  textContent,
  WORDS_PER_MINUTE,
} from '@/lib/blog'

const h = createElement

describe('tiempo de lectura', () => {
  it('lee a 200 palabras por minuto, redondeando hacia arriba y con mínimo 1', () => {
    expect(WORDS_PER_MINUTE).toBe(200)
    expect(readingMinutes(0)).toBe(1)
    expect(readingMinutes(1)).toBe(1)
    expect(readingMinutes(200)).toBe(1)
    expect(readingMinutes(201)).toBe(2)
    expect(readingMinutes(1000)).toBe(5)
    expect(readingMinutes(Number.NaN)).toBe(1)
  })

  it('cuenta palabras con acentos y números, sin contar signos sueltos', () => {
    expect(countWords('Mi nombre es Camilo Hernández')).toBe(5)
    expect(countWords('  React 19 — y Next 16  ')).toBe(5)
    expect(countWords('')).toBe(0)
    expect(countWords('¿Qué tal?\n\nBien.')).toBe(3)
  })
})

describe('slugs de encabezados', () => {
  it('quita acentos y signos', () => {
    expect(slugify('¿Qué es el glassmorfismo?')).toBe('que-es-el-glassmorfismo')
    expect(slugify('Código con `sugar-high`')).toBe('codigo-con-sugar-high')
    expect(slugify('***')).toBe('section')
  })

  it('evita ids repetidos y respeta los reservados', () => {
    const slugger = createSlugger(['cw-comments'])
    expect(slugger.slug('Intro')).toBe('intro')
    expect(slugger.slug('Intro')).toBe('intro-2')
    expect(slugger.slug('Intro 2')).toBe('intro-2-2')
    expect(slugger.slug('cw comments')).toBe('cw-comments-2')
  })
})

describe('índice desde los encabezados', () => {
  function H2(props: { id?: string; children?: unknown }) {
    return h('h2', { id: props.id }, props.children as string)
  }
  function H3(props: { id?: string; children?: unknown }) {
    return h('h3', { id: props.id }, props.children as string)
  }
  function Code(props: { children?: unknown; labels?: unknown }) {
    return h('pre', null, props.children as string)
  }
  const headingLevel = (type: unknown) => (type === H2 ? 2 : type === H3 ? 3 : null)
  const isCode = (type: unknown) => type === Code

  const tree = h(
    Fragment,
    null,
    h(H2, null, 'Primera ', h('em', null, 'parte')),
    '\n',
    h('p', null, 'Uno dos tres cuatro.'),
    h(H3, null, 'Detalle'),
    h(Code, null, h('code', { className: 'language-ts' }, 'const a = 1 + 2 + 3 + 4 + 5')),
    h(H2, null, 'Primera parte'),
    h(H2, { id: 'fijo' }, 'Con id'),
  )

  it('extrae niveles, textos e ids únicos y se los pone a los encabezados', () => {
    const outline = buildOutline(tree, { headingLevel, isCode })
    expect(outline.headings).toEqual([
      { id: 'primera-parte', text: 'Primera parte', level: 2 },
      { id: 'detalle', text: 'Detalle', level: 3 },
      { id: 'primera-parte-2', text: 'Primera parte', level: 2 },
      { id: 'fijo', text: 'Con id', level: 2 },
    ])
    const children = (outline.node as ReactElement<{ children: ReactElement<{ id?: string }>[] }>).props.children
    const ids = children.filter((child) => isValidElement(child)).map((child) => (child as ReactElement<{ id?: string }>).props.id)
    expect(ids).toEqual(['primera-parte', undefined, 'detalle', undefined, 'primera-parte-2', 'fijo'])
  })

  it('cuenta las palabras del texto sin contar los bloques de código', () => {
    const { words } = buildOutline(tree, { headingLevel, isCode })
    expect(words).toBe(2 + 4 + 1 + 2 + 2)
  })

  it('inyecta props solo donde faltan y no toca el árbol original', () => {
    const labels = { copy: 'Copiar' }
    const outline = buildOutline(tree, { headingLevel, isCode, inject: new Map([[Code, { labels }]]) })
    const code = (outline.node as ReactElement<{ children: ReactElement[] }>).props.children.find(
      (child) => isValidElement(child) && child.type === Code,
    ) as ReactElement<{ labels?: unknown }>
    expect(code.props.labels).toBe(labels)
    const original = (tree as ReactElement<{ children: ReactElement[] }>).props.children.find(
      (child) => isValidElement(child) && child.type === Code,
    ) as ReactElement<{ labels?: unknown }>
    expect(original.props.labels).toBeUndefined()

    const explicit = h(Code, { labels: 'propio' }, 'x')
    const kept = buildOutline(explicit, { isCode, inject: new Map([[Code, { labels }]]) }).node as ReactElement<{ labels: unknown }>
    expect(kept.props.labels).toBe('propio')
  })

  it('devuelve el mismo nodo cuando no hay nada que cambiar', () => {
    const plain = h('p', null, 'hola ', h('strong', null, 'mundo'))
    const outline = buildOutline(plain)
    expect(outline.node).toBe(plain)
    expect(outline.words).toBe(2)
    expect(outline.headings).toEqual([])
  })

  it('muestra el índice solo con 3 encabezados o más', () => {
    const heading = { id: 'a', text: 'A', level: 2 as const }
    expect(shouldShowToc([heading, heading])).toBe(false)
    expect(shouldShowToc([heading, heading, heading])).toBe(true)
  })

  it('saca el texto plano de un árbol', () => {
    expect(textContent(h('span', null, 'a', 1, null, false, h('b', null, 'c')))).toBe('a1c')
  })
})

describe('URLs del post y para compartir', () => {
  const env = { VERCEL_URL_CORS: 'https://cherced.example' }

  it('arma rutas y URLs absolutas por idioma', () => {
    expect(postPath('es', 'post1')).toBe('/es/blog/post1')
    expect(postPath('en', 'post 1')).toBe('/en/blog/post%201')
    expect(postUrl('en', 'post1', env)).toBe('https://cherced.example/en/blog/post1')
  })

  it('genera enlaces de redes sin scripts, con la URL y el título codificados', () => {
    const url = 'https://cherced.example/es/blog/post1'
    const title = 'Código & café'
    const targets = shareTargets({ url, title })
    expect(targets.map((target) => target.id)).toEqual(['x', 'linkedin', 'facebook', 'whatsapp'])
    for (const target of targets) {
      const parsed = new URL(target.href)
      expect(parsed.protocol).toBe('https:')
      expect(target.href).not.toContain(' ')
      expect([...parsed.searchParams.values()].join(' ')).toContain(url)
    }
    expect(new URL(targets[0]!.href).searchParams.get('text')).toBe(title)
  })

  it('apunta la canónica al idioma original cuando el post es de respaldo', () => {
    expect(postAlternates('es', 'post1', { lang: 'es', fallback: false })).toEqual({
      canonical: '/es/blog/post1',
      languages: { es: '/es/blog/post1', en: '/en/blog/post1', 'x-default': '/blog/post1' },
    })
    expect(postAlternates('en', 'solo', { lang: 'es', fallback: true }).canonical).toBe('/es/blog/solo')
  })
})

describe('fechas', () => {
  it('formatea la fecha del post sin correrse de día', () => {
    expect(formatPostDate('2023-03-03', 'es')).toBe('3 de marzo de 2023')
    expect(formatPostDate('2023-03-03', 'en')).toBe('March 3, 2023')
    expect(formatPostDate('no-es-fecha', 'es')).toBe('no-es-fecha')
    expect(parsePostDate('2023-02-30')).toBeNull()
  })

  it('formatea los comentarios en hora de Colombia', () => {
    const lateNight = new Date('2026-11-02T03:30:00Z')
    expect(formatCommentDate(lateNight, 'es')).toBe('1 de noviembre de 2026')
    expect(formatCommentDate(lateNight, 'en')).toBe('November 1, 2026')
  })
})
