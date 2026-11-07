import { describe, expect, it } from 'vitest'
import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { projectTitle } from '@/lib/content/project-title'
import type { Locale } from '@/lib/i18n/config'
import { postBreadcrumbJsonLd } from '@/lib/seo/blog-posting'
import { breadcrumbJsonLd } from '@/lib/seo/breadcrumbs'
import { caseBreadcrumbJsonLd, caseOgImagePath, caseStudyJsonLd } from '@/lib/seo/case-study'
import { jsonLdScript, PERSON_NAME, personId, personJsonLd, personSameAs } from '@/lib/seo/person'
import { profilePageJsonLd } from '@/lib/seo/profile-page'
import { synergosJsonLd } from '@/lib/seo/synergos'
import { websiteId, websiteJsonLd } from '@/lib/seo/website'

const BASE = new URL('https://dominio-nuevo.example')
const LANGS: Locale[] = ['es', 'en']
const COMMON = { es: commonEs, en: commonEn } as const
const PRIVATE = /@gmail|mailto:|"email"|telephone|\+57|streetAddress|postalCode|cédula|cedula|passport/i
const URL_KEYS = new Set(['url', 'item', 'image', '@id', 'codeRepository'])

type Node = Record<string, unknown>

function walk(value: unknown, visit: (key: string, value: unknown, path: string) => void, path = '$'): void {
  if (Array.isArray(value)) return value.forEach((item, index) => walk(item, visit, `${path}[${index}]`))
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      visit(key, item, `${path}.${key}`)
      walk(item, visit, `${path}.${key}`)
    }
  }
}

function assertValid(node: Node, type: string): void {
  expect(node['@context']).toBe('https://schema.org')
  expect(node['@type']).toBe(type)
  expect(JSON.parse(jsonLdScript(node))).toEqual(node)
  expect(JSON.stringify(node)).not.toMatch(PRIVATE)
  walk(node, (key, value, path) => {
    expect(value, path).not.toBeUndefined()
    if (typeof value === 'string') expect(value.trim(), path).not.toBe('')
    if (Array.isArray(value) && key !== 'hasPart') expect(value.length, path).toBeGreaterThan(0)
    if (URL_KEYS.has(key) && typeof value === 'string') {
      const url = new URL(value)
      expect(url.protocol, path).toBe('https:')
      if (key !== 'codeRepository') expect(url.origin, path).toBe(BASE.origin)
    }
  })
}

describe('Person con sameAs completo (FR-810)', () => {
  it('enlaza LinkedIn, GitHub CHERCED-DEV, Instagram (P-806) y el perfil de Platzi, sin repetir', () => {
    expect(personSameAs()).toEqual([
      'https://www.linkedin.com/in/cherced/',
      'https://github.com/CHERCED-DEV',
      'https://www.instagram.com/cherced/',
      site.about.courses.platzi.href,
    ])
    expect(site.about.courses.platzi.href).toBe('https://platzi.com/p/Cherced/')
  })

  it.each(LANGS)('%s: conoce las variantes del nombre que la gente teclea', (lang) => {
    const person = personJsonLd(lang, BASE)
    assertValid(person, 'Person')
    expect(person.name).toBe('Camilo Hernández')
    for (const name of ['Camilo Hernandez', 'Camilo Hernández Cediel', 'CHERCED']) expect(person.alternateName).toContain(name)
    for (const href of person.sameAs) expect(new URL(href).protocol).toBe('https:')
  })
})

describe('WebSite en Home (FR-811)', () => {
  it.each(LANGS)('%s: nombre del sitio, origen y autor por @id', (lang) => {
    const data = websiteJsonLd(lang, BASE)
    assertValid(data as unknown as Node, 'WebSite')
    expect(data['@id']).toBe(`${BASE.origin}/#website`)
    expect(data['@id']).toBe(websiteId(BASE))
    expect(data.url).toBe(`${BASE.origin}/`)
    expect(data.name).toBe(COMMON[lang]['brand.name'])
    expect(data.alternateName).toEqual([PERSON_NAME, COMMON.es['intro.name']])
    expect(data.description).toBe(COMMON[lang]['meta.description'])
    expect(data.inLanguage).toEqual(['es', 'en'])
    expect(data.author).toEqual({ '@id': personId(BASE) })
    expect(data.publisher).toEqual({ '@id': personId(BASE) })
  })
})

describe('ProfilePage en Sobre mí (FR-812)', () => {
  it.each(LANGS)('%s: su entidad principal es el mismo Person del layout', (lang) => {
    const data = profilePageJsonLd(lang, { name: 'Sobre mí', description: 'Descripción' }, BASE)
    assertValid(data as unknown as Node, 'ProfilePage')
    expect(data.url).toBe(`${BASE.origin}/${lang}/aboutMe`)
    expect(data['@id']).toBe(`${data.url}#profile`)
    expect(data.inLanguage).toBe(lang)
    expect(data.isPartOf).toEqual({ '@id': websiteId(BASE) })
    const { '@context': _context, ...person } = personJsonLd(lang, BASE)
    expect(data.mainEntity).toEqual(person)
    expect(data.mainEntity['@id']).toBe(personId(BASE))
    expect(data.mainEntity).not.toHaveProperty('@context')
  })
})

describe('CreativeWork para cada caso del portafolio (FR-813)', () => {
  for (const lang of LANGS) {
    it.each(projects.map((project) => project.id))(`${lang}: caso %s sale de su contenido, sin datos inventados`, (id) => {
      const project = projects.find((item) => item.id === id)!
      const data = caseStudyJsonLd(project, lang, BASE)
      assertValid(data as unknown as Node, 'CreativeWork')
      expect(data.name).toBe(projectTitle(project, lang))
      expect(data.description).toBe(project.summary[lang])
      expect(data.url).toBe(`${BASE.origin}/${lang}/portfolio/${id}`)
      expect(data['@id']).toBe(`${data.url}#work`)
      expect(data.image).toBe(new URL(caseOgImagePath(lang, id), BASE).toString())
      expect(data.keywords).toEqual(project.technologies)
      expect(data.author).toEqual({ '@id': personId(BASE) })
      expect(data.isPartOf.url).toBe(`${BASE.origin}/${lang}/portfolio`)
      const repos = [...(project.links.github ? [project.links.github] : []), ...(project.links.repos ?? []).map((repo) => repo.href)]
      expect((data.hasPart ?? []).map((part) => part.codeRepository)).toEqual([...new Set(repos)])
      if (repos.length === 0) expect(data).not.toHaveProperty('hasPart')
      for (const key of ['dateCreated', 'datePublished', 'aggregateRating', 'offers', 'review']) expect(data).not.toHaveProperty(key)
    })
  }
})

describe('BreadcrumbList en casos y posts (FR-814)', () => {
  it('numera desde 1 y usa URLs absolutas del origen', () => {
    const data = breadcrumbJsonLd([
      { name: 'Inicio', path: '/es' },
      { name: 'Blog', path: '/es/blog' },
    ], BASE)
    assertValid(data as unknown as Node, 'BreadcrumbList')
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${BASE.origin}/es` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE.origin}/es/blog` },
    ])
  })

  it.each(LANGS)('%s: caso → Inicio › Portafolio › título', (lang) => {
    const project = projects.find((item) => item.id === '13')!
    const data = caseBreadcrumbJsonLd(project, lang, { home: COMMON[lang]['nav.home'], section: COMMON[lang]['nav.portfolio'] }, BASE)
    assertValid(data as unknown as Node, 'BreadcrumbList')
    expect(data.itemListElement.map((item) => [item.position, item.name, new URL(item.item).pathname])).toEqual([
      [1, COMMON[lang]['nav.home'], `/${lang}`],
      [2, COMMON[lang]['nav.portfolio'], `/${lang}/portfolio`],
      [3, projectTitle(project, lang), `/${lang}/portfolio/13`],
    ])
  })

  it('post → Inicio › Blog › título, con la canónica del contenido', () => {
    const data = postBreadcrumbJsonLd({ id: 'post4', title: 'Un post' }, 'en', '/es/blog/post4', { home: 'Home', blog: 'Blog' }, BASE)
    expect(data.itemListElement.map((item) => new URL(item.item).pathname)).toEqual(['/en', '/en/blog', '/es/blog/post4'])
    expect(data.itemListElement.at(-1)?.name).toBe('Un post')
  })
})

describe('Synergos y Synergos Labs (FR-815)', () => {
  it.each(LANGS)('%s: el showcase declara a Synergos Labs como productora, fundada por el Person', (lang) => {
    const data = synergosJsonLd(lang, BASE)
    expect(data.producer).toEqual({ '@type': 'Organization', name: 'Synergos Labs', founder: { '@id': personId(BASE) } })
    expect(site.about.career.some((entry) => entry.company === 'Synergos Labs')).toBe(true)
  })
})
