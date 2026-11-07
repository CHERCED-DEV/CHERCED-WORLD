import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { site } from '@/content/site'
import { projectTitle } from '@/lib/content/project-title'
import { projects } from '@/content/projects'
import { BING_META_NAME, SEARCH_VERIFICATION, verificationMetadata } from '@/lib/seo/verification'

const I18N = join(process.cwd(), 'content', 'i18n')

function dict(lang: 'es' | 'en', ns: string): Record<string, string> {
  return JSON.parse(readFileSync(join(I18N, lang, `${ns}.json`), 'utf8')) as Record<string, string>
}

const LANGS = ['es', 'en'] as const

const TITLE_MAX = 70
const DESCRIPTION_RANGE = [40, 165] as const

const PAGES: Array<{ page: string; title: [string, string] | null; description: [string, string] }> = [
  { page: '/', title: null, description: ['site', 'meta.home.description'] },
  { page: '/aboutMe', title: ['site', 'meta.about.title'], description: ['site', 'meta.about.description'] },
  { page: '/services', title: ['site', 'meta.services.searchTitle'], description: ['site', 'meta.services.description'] },
  { page: '/portfolio', title: ['site', 'meta.portfolio.searchTitle'], description: ['site', 'meta.portfolio.description'] },
  { page: '/blog', title: ['blog', 'meta.blog.searchTitle'], description: ['blog', 'meta.blog.description'] },
  { page: '/ai-lab', title: ['ailab', 'ailab.meta.title'], description: ['ailab', 'ailab.meta.description'] },
  { page: '/contactMe', title: ['contact', 'meta.contact.title'], description: ['contact', 'meta.contact.description'] },
]

describe('títulos y descripciones para búsqueda (FR-820 a FR-822, SC-804)', () => {
  for (const lang of LANGS) {
    const template = dict(lang, 'common')['meta.titleTemplate']!

    it.each(PAGES)(`${lang} $page: título con el nombre y descripción de largo útil`, ({ title, description }) => {
      const full = title ? template.replace('%s', dict(lang, title[0])[title[1]]!) : dict(lang, 'common')['meta.title']!
      expect(full).toContain('Camilo Hernández')
      expect(full.length, full).toBeLessThanOrEqual(TITLE_MAX)
      const text = dict(lang, description[0])[description[1]]!
      expect(text.length, text).toBeGreaterThanOrEqual(DESCRIPTION_RANGE[0])
      expect(text.length, text).toBeLessThanOrEqual(DESCRIPTION_RANGE[1])
    })

    it(`${lang}: los casos 12 a 15 llevan sus palabras clave en el título`, () => {
      for (const id of ['12', '13', '14', '15']) {
        const title = template.replace('%s', projectTitle(projects.find((project) => project.id === id)!, lang))
        expect(title.length, title).toBeLessThanOrEqual(TITLE_MAX)
      }
    })
  }

  it('las descripciones nuevas solo nombran lo que el sitio ya cuenta', () => {
    expect(site.about.career.find((entry) => entry.id === 'synergos-labs')?.role.es).toMatch(/Founder/)
    expect(dict('es', 'common')['intro.name']).toBe('CHERCED')
    expect(site.profile?.cv.pdfs?.length).toBe(2)
    expect(site.services.audiences.find((item) => item.id === 'professionals')?.text.es).toMatch(/Abogados, ingenieros/)
    for (const lang of LANGS) {
      const home = dict(lang, 'site')['meta.home.description']!
      expect(home).toBe(dict(lang, 'common')['meta.description'])
      expect(home).not.toMatch(/Sistecr[eé]dito|FLYR|Avianca|HYROX|\+57|@/)
      expect(dict(lang, 'site')['meta.about.description']).not.toMatch(/Sistecr[eé]dito|FLYR|Avianca|HYROX/)
    }
  })
})

describe('verificación de Search Console y Bing (FR-840)', () => {
  it('no trae tokens inventados: los dos arrancan vacíos', () => {
    expect(SEARCH_VERIFICATION).toEqual({ google: null, bing: null })
    expect(verificationMetadata()).toBeUndefined()
  })

  it('con un token, publica la meta de Google o la de Bing', () => {
    expect(verificationMetadata({ google: ' abc123 ', bing: null })).toEqual({ google: 'abc123' })
    expect(verificationMetadata({ google: null, bing: 'XYZ' })).toEqual({ other: { [BING_META_NAME]: 'XYZ' } })
    expect(verificationMetadata({ google: 'g', bing: 'b' })).toEqual({ google: 'g', other: { 'msvalidate.01': 'b' } })
    expect(verificationMetadata({ google: '   ', bing: '' })).toBeUndefined()
  })

  it('el layout solo la agrega cuando hay token', () => {
    const layout = readFileSync(join(process.cwd(), 'app', '[lang]', 'layout.tsx'), 'utf8')
    expect(layout).toContain('verificationMetadata()')
    expect(layout).toMatch(/\.\.\.\(verification \? \{ verification \} : \{\}\)/)
  })
})
