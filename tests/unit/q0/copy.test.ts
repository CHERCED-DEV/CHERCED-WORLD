import { describe, expect, it } from 'vitest'
import { site } from '@/content/site'
import { languageName } from '@/lib/blog/format'
import { t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const WELCOME = {
  es: 'Notas de un arquitecto que trabaja con agentes: decisiones, errores y lo que los tests no vieron.',
  en: "Notes from an architect who works with agents: decisions, mistakes and what the tests didn't catch.",
}

const COPY: Record<string, { es: string; en: string }> = {
  'meta.blog.description': WELCOME,
  'index.featured': { es: 'Destacado', en: 'Featured' },
  'index.now': { es: 'Ahora', en: 'Now' },
  'index.archive': { es: 'Archivo', en: 'Archive' },
  'index.filter': { es: 'Filtrar por etiqueta', en: 'Filter by tag' },
  'index.allTags': { es: 'Todas', en: 'All' },
  'index.tagResults': { es: '{count} posts con «{tag}»', en: '{count} posts tagged “{tag}”' },
  'index.search': { es: 'Buscar en el blog', en: 'Search the blog' },
  'index.noResults': { es: 'Sin resultados para «{query}».', en: 'No results for “{query}”.' },
  'index.clear': { es: 'Limpiar', en: 'Clear' },
  'index.rss': { es: 'Suscríbete por RSS', en: 'Subscribe via RSS' },
  'callout.decision': { es: 'Decisión', en: 'Decision' },
  'callout.tradeoff': { es: 'Trade-off', en: 'Trade-off' },
  'callout.learned': { es: 'Lo que aprendí', en: 'What I learned' },
  'series.position': { es: '{series} · parte {n} de {total}', en: '{series} · part {n} of {total}' },
  'related.title': { es: 'Posts relacionados', en: 'Related posts' },
  'author.line': { es: 'Software Solutions Engineer · AI-First', en: 'Software Solutions Engineer · AI-First' },
  'author.cta': { es: 'Escríbeme', en: 'Write to me' },
  'post.translatedFrom': { es: 'Escrito originalmente en {lang}.', en: 'Originally written in {lang}.' },
  'post.updated': { es: 'Actualizado el {date}', en: 'Updated {date}' },
  'listen.play': { es: 'Escuchar este post', en: 'Listen to this post' },
  'listen.pause': { es: 'Pausar', en: 'Pause' },
  'listen.resume': { es: 'Seguir escuchando', en: 'Resume' },
  'listen.stop': { es: 'Detener', en: 'Stop' },
  'listen.status': { es: 'Leyendo: {heading}', en: 'Reading: {heading}' },
}

describe('copy del blog (spec 005 §Copy, FR-503, FR-542)', () => {
  it('la bienvenida del blog es la de la spec en ambos idiomas', () => {
    expect(site.blog.welcome).toEqual(WELCOME)
  })

  it.each(['es', 'en'] as const)('blog.json en %s trae cada texto de la tabla, palabra por palabra', async (lang) => {
    const blog = await getDictionary(lang, 'blog')
    for (const [key, value] of Object.entries(COPY)) expect(t(blog, key), `${lang}: ${key}`).toBe(value[lang])
  })

  it('el conteo de una etiqueta tiene su forma en singular (D-Q3)', async () => {
    const [es, en] = await Promise.all([getDictionary('es', 'blog'), getDictionary('en', 'blog')])
    expect(t(es, 'index.tagResults.one', { count: 1, tag: 'humor' })).toBe('1 post con «humor»')
    expect(t(en, 'index.tagResults.one', { count: 1, tag: 'humor' })).toBe('1 post tagged “humor”')
    expect(t(es, 'index.tagResults', { count: 0, tag: 'career' })).toBe('0 posts con «career»')
  })

  it('la nota de traducción nombra el idioma original en el idioma de la página (FR-515)', async () => {
    const [es, en] = await Promise.all([getDictionary('es', 'blog'), getDictionary('en', 'blog')])
    expect(t(es, 'post.translatedFrom', { lang: languageName('en', 'es') })).toBe('Escrito originalmente en inglés.')
    expect(t(en, 'post.translatedFrom', { lang: languageName('es', 'en') })).toBe('Originally written in Spanish.')
    expect(languageName('es', 'es')).toBe('español')
  })

  it('las claves que ya usan otras lanes no cambian', async () => {
    const es = await getDictionary('es', 'blog')
    expect(t(es, 'post.originalLanguage')).toBe('Escrito originalmente en inglés')
    expect(t(es, 'meta.blog.title')).toBe('Blog')
    expect(t(es, 'nav.index')).toBe('Ver todos los posts')
  })
})
