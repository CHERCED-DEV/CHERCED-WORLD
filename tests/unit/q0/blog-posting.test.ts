import { describe, expect, it } from 'vitest'
import { blogPostingJsonLd, postOgImagePath } from '@/lib/seo/blog-posting'
import { jsonLdScript, personId, personJsonLd } from '@/lib/seo/person'
import { post } from './support/posts'

const BASE = new URL('https://cherced-world.test')

describe('JSON-LD BlogPosting (FR-521, R-507)', () => {
  const meta = post('post4', {
    lang: 'es',
    title: 'Un título </script><script>alert(1)</script>',
    description: 'Una descripción',
    date: '2026-11-02',
    tags: ['spec-driven-development', 'ai-agents'],
  })

  it('arma los campos de R-507 con el autor como referencia al Person de la 004', () => {
    const url = 'https://cherced-world.test/es/blog/post4'
    expect(blogPostingJsonLd(meta, 'es', url, BASE)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: meta.title,
      description: 'Una descripción',
      datePublished: '2026-11-02',
      inLanguage: 'es',
      image: 'https://cherced-world.test/es/blog/post4/opengraph-image/og',
      keywords: ['spec-driven-development', 'ai-agents'],
      url,
      isPartOf: { '@type': 'Blog', url: 'https://cherced-world.test/es/blog' },
      author: { '@id': 'https://cherced-world.test/#person' },
    })
  })

  it('el autor es el mismo @id del Person del layout, sin repetir sus datos', () => {
    const data = blogPostingJsonLd(meta, 'en', 'https://cherced-world.test/en/blog/post4', BASE)
    expect(data.author).toEqual({ '@id': personId(BASE) })
    expect((data.author as { '@id': string })['@id']).toBe(personJsonLd('en', BASE)['@id'])
    expect(Object.keys(data.author)).toEqual(['@id'])
  })

  it('un post invitado lleva el nombre de quien lo escribió, no el Person del sitio (spec 017)', () => {
    const data = blogPostingJsonLd({ ...meta, author: 'Ana Invitada' }, 'es', 'u', BASE)
    expect(data.author).toEqual({ '@type': 'Person', name: 'Ana Invitada' })
  })

  it('solo publica dateModified si hay updated', () => {
    expect(blogPostingJsonLd(meta, 'es', 'u', BASE)).not.toHaveProperty('dateModified')
    expect(blogPostingJsonLd({ ...meta, updated: '2026-12-01' }, 'es', 'u', BASE).dateModified).toBe('2026-12-01')
  })

  it('el idioma es el del contenido: un fallback declara el idioma que realmente se lee', () => {
    const english = post('solo-en', { lang: 'en', originalLang: 'en' })
    const data = blogPostingJsonLd(english, 'es', 'https://cherced-world.test/en/blog/solo-en', BASE)
    expect(data.inLanguage).toBe('en')
    expect(data.isPartOf.url).toBe('https://cherced-world.test/es/blog')
  })

  it('la imagen apunta a la ruta OG del post en el idioma de la página', () => {
    expect(postOgImagePath('en', 'post4')).toBe('/en/blog/post4/opengraph-image/og')
  })

  it('se serializa con jsonLdScript sin cerrar el <script>', () => {
    const script = jsonLdScript(blogPostingJsonLd(meta, 'es', 'u', BASE))
    expect(script).not.toContain('</script>')
    expect(script).not.toContain('<')
    expect(JSON.parse(script).headline).toBe(meta.title)
  })
})
