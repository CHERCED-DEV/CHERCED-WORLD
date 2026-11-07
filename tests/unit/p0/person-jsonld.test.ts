import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { jsonLdScript, personId, personJsonLd } from '@/lib/seo/person'

const BASE = new URL('https://cherced-world.vercel.app')

function meta(lang: 'es' | 'en'): string {
  const dict = JSON.parse(readFileSync(join(process.cwd(), 'content', 'i18n', lang, 'common.json'), 'utf8')) as Record<string, string>
  return dict['meta.description']!
}

describe('JSON-LD Person (FR-470, R-404, SC-408)', () => {
  it('arma el objeto de contenido.md §22 con la URL base del sitio', () => {
    expect(personJsonLd('es', BASE)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': 'https://cherced-world.vercel.app/#person',
      name: 'Camilo Hernández',
      alternateName: ['Camilo Hernandez', 'Camilo Hernández Cediel', 'Camilo Alonso Hernández Cediel', 'CHERCED'],
      jobTitle: 'Software Solutions Engineer',
      description: meta('es'),
      url: 'https://cherced-world.vercel.app/',
      image: 'https://cherced-world.vercel.app/assets/imgs/about/retrato-oscuro.webp',
      sameAs: ['https://www.linkedin.com/in/cherced/', 'https://github.com/CHERCED-DEV', 'https://platzi.com/p/Cherced/'],
      address: { '@type': 'PostalAddress', addressLocality: 'Armenia', addressCountry: 'CO' },
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'Institución Universitaria EAM' },
      knowsAbout: ['Software architecture', 'Microservices', 'Micro-frontends', '.NET Core', 'Angular'],
      subjectOf: {
        '@type': 'DigitalDocument',
        name: 'CV de Camilo Hernández',
        url: 'https://cherced-world.vercel.app/cv/camilo-hernandez-cv-es.pdf',
        encodingFormat: 'application/pdf',
        inLanguage: 'es',
      },
    })
  })

  it('en inglés enlaza el CV en inglés (T911 de la 007)', () => {
    expect(personJsonLd('en', BASE).subjectOf).toEqual({
      '@type': 'DigitalDocument',
      name: "Camilo Hernández's CV",
      url: 'https://cherced-world.vercel.app/cv/camilo-hernandez-cv-en.pdf',
      encodingFormat: 'application/pdf',
      inLanguage: 'en',
    })
  })

  it('usa la meta description del idioma y un @id estable para la 005', () => {
    expect(personJsonLd('en', BASE).description).toBe(meta('en'))
    expect(personJsonLd('en', BASE)['@id']).toBe(personJsonLd('es', BASE)['@id'])
    expect(personId(new URL('https://example.com/es/blog?x=1'))).toBe('https://example.com/#person')
  })

  it('no publica correo, teléfono ni dirección exacta', () => {
    const text = JSON.stringify(personJsonLd('es', BASE))
    expect(text).not.toMatch(/@gmail|mailto:|email|telephone|\+57|streetAddress|postalCode/i)
  })

  it('escapa "<" para que ningún texto cierre el script', () => {
    const script = jsonLdScript({ name: '</script><script>alert(1)</script>', ok: 'a<b' })
    expect(script).not.toContain('<')
    expect(script).toContain('\\u003c/script>')
    expect(JSON.parse(script)).toEqual({ name: '</script><script>alert(1)</script>', ok: 'a<b' })
  })

  it('el layout publica el script en ES y EN', () => {
    const layout = readFileSync(join(process.cwd(), 'app', '[lang]', 'layout.tsx'), 'utf8')
    expect(layout).toMatch(/type="application\/ld\+json"/)
    expect(layout).toContain('jsonLdScript(personJsonLd(lang))')
  })
})
