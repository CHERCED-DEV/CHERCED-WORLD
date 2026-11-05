import { createElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Callout, CodeBlock, GlassDemo, MdxH2, MdxH3, mdxComponents, readCodeBlock } from '@/components/blog/mdx'
import { evaluateMdx, preparePost } from '@/components/blog/mdx/prepare'
import { postLabels } from '@/components/blog/labels'
import { getDictionary } from '@/lib/i18n/server'
import { useMDXComponents } from '@/mdx-components'

const h = createElement

function fence(code: string, className?: string) {
  return h('code', className ? { className } : null, code)
}

describe('bloques de código', () => {
  it('lee el lenguaje del fence y normaliza alias', () => {
    expect(readCodeBlock(fence('const a = 1\n', 'language-ts'))).toEqual({ code: 'const a = 1', fence: 'ts', language: 'typescript' })
    expect(readCodeBlock(fence('ls\n', 'language-bash')).language).toBe('shell')
    expect(readCodeBlock(fence('texto\n')).language).toBe('plaintext')
    expect(readCodeBlock(fence('x', 'language-inventado')).language).toBe('plaintext')
  })

  it('resalta en el servidor, escapa el HTML y agrega el botón de copiar con el texto exacto', () => {
    const labels = { copy: 'Copiar código', copied: 'Código copiado', copyError: 'No se pudo copiar' }
    const html = renderToStaticMarkup(h(CodeBlock, { labels }, fence('const tag = "<script>alert(1)</script>"\n', 'language-ts')))
    expect(html).toContain('sh__token--keyword')
    expect(html).toContain('var(--sh-string)')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Copiar código')
    expect(html).toContain('data-cw-copy="idle"')
    expect(html).toContain('cw-js-only')
    expect(html).toMatch(/<pre[^>]*tabindex="0"/)
  })

  it('no muestra el botón si nadie le pasó textos', () => {
    const html = renderToStaticMarkup(h(CodeBlock, null, fence('x', 'language-ts')))
    expect(html).not.toContain('data-cw-copy')
  })
})

describe('mdx-components', () => {
  it('expone el catálogo aprobado y los reemplazos de Markdown', () => {
    const components = useMDXComponents()
    expect(components).toBe(useMDXComponents())
    expect(Object.keys(components).sort()).toEqual(['Callout', 'GlassDemo', 'a', 'blockquote', 'h2', 'h3', 'img', 'pre'])
    expect(components.Callout).toBe(Callout)
    expect(components.GlassDemo).toBe(GlassDemo)
    expect(components.pre).toBe(CodeBlock)
    expect(mdxComponents.h2).toBe(MdxH2)
  })

  it('pone el ancla en los encabezados con id', () => {
    expect(renderToStaticMarkup(h(MdxH2, { id: 'intro' }, 'Intro'))).toMatch(/<h2 id="intro"[^>]*><a href="#intro"[^>]*>Intro<\/a><\/h2>/)
    expect(renderToStaticMarkup(h(MdxH3, null, 'Sin id'))).not.toContain('<a')
  })

  it('manda los enlaces externos a otra pestaña con rel seguro', () => {
    const Link = mdxComponents.a
    expect(renderToStaticMarkup(h(Link, { href: 'https://example.com' }, 'x'))).toContain('rel="noopener noreferrer"')
    expect(renderToStaticMarkup(h(Link, { href: '/es/blog' }, 'x'))).not.toContain('target=')
  })
})

describe('preparar un post', () => {
  function FakeMdx(): ReactNode {
    return h(
      Fragment,
      null,
      h('p', null, 'Uno dos tres.'),
      h(MdxH2, null, 'Primera sección'),
      h(CodeBlock, null, fence('const muchas = palabras + que + no + cuentan\n', 'language-ts')),
      h(MdxH3, null, 'Detalle'),
      h(MdxH2, null, 'Comentarios'),
      h(GlassDemo, null),
    )
  }

  it('evalúa el MDX, arma el índice, cuenta palabras y le pasa los textos a los componentes', async () => {
    const blog = await getDictionary('es', 'blog')
    const labels = postLabels(blog)
    const prepared = preparePost(FakeMdx, labels)
    expect(prepared.headings.map((heading) => [heading.id, heading.level])).toEqual([
      ['primera-seccion', 2],
      ['detalle', 3],
      ['comentarios', 2],
    ])
    expect(prepared.words).toBe(3 + 2 + 1 + 1)
    expect(prepared.minutes).toBe(1)

    const children = (prepared.body as ReactElement<{ children: ReactNode[] }>).props.children.filter(isValidElement) as ReactElement<
      Record<string, unknown>
    >[]
    expect(children.find((child) => child.type === CodeBlock)?.props.labels).toEqual(labels.code)
    expect(children.find((child) => child.type === GlassDemo)?.props.labels).toEqual(labels.glassDemo)

    const html = renderToStaticMarkup(h(Fragment, null, prepared.body))
    expect(html).toContain('<h2 id="primera-seccion"')
    expect(html).toContain('Copiar código')
    expect(html).toContain('Glass en vivo')
  })

  it('no deja que un encabezado choque con los ids de la página', () => {
    function Clash(): ReactNode {
      return h(MdxH2, null, 'cw comments')
    }
    const prepared = preparePost(Clash, {
      code: { copy: 'c', copied: 'c', copyError: 'c' },
      glassDemo: { title: 't', legend: 'l', subtle: 's', standard: 's', strong: 's', motion: 'm', sample: 's' },
    })
    expect(prepared.headings[0]?.id).toBe('cw-comments-2')
  })

  it('renderiza como elemento lo que no es un componente de función', () => {
    const node = evaluateMdx(FakeMdx)
    expect(isValidElement(node)).toBe(true)
  })
})
