import { describe, expect, it, vi } from 'vitest'
import type { Localized } from '@/content/types'

vi.mock('@/content/posts/registry', () => {
  const meta = (id: string, lang: 'es' | 'en', date: string) => ({
    id,
    lang,
    originalLang: 'en' as const,
    title: `${id}-${lang}`,
    description: 'd',
    date,
    tags: [],
    image: { src: '/assets/imgs/mePost.jpg', alt: 'alt', width: 256, height: 256 },
    author: 'Camilo Hernandez' as const,
  })
  const component = () => null
  return {
    postRegistry: {
      post1: {
        es: async () => ({ default: component, meta: meta('post1', 'es', '2023-03-03') }),
        en: async () => ({ default: component, meta: meta('post1', 'en', '2023-03-03') }),
      },
      solo: {
        en: async () => ({ default: component, meta: meta('solo', 'en', '2024-01-01') }),
      },
    },
  }
})

const content = await import('@/lib/content')

function localizedValues(value: unknown, path = 'root'): Array<[string, unknown]> {
  if (Array.isArray(value)) return value.flatMap((item, index) => localizedValues(item, `${path}[${index}]`))
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 2 && keys.includes('es') && keys.includes('en')) {
      const localized = value as Localized<unknown>
      return [
        [`${path}.es`, localized.es],
        [`${path}.en`, localized.en],
      ]
    }
    return Object.entries(value).flatMap(([key, item]) => localizedValues(item, `${path}.${key}`))
  }
  return []
}

describe('accesores de contenido', () => {
  it('ordena los proyectos por order y busca por id', () => {
    const projects = content.getProjects()
    expect(projects.map((p) => p.order)).toEqual([...projects.map((p) => p.order)].sort((a, b) => a - b))
    expect(content.getProject('1')?.title).toBe('Quantic Theatrum')
    expect(content.getProject('999')).toBeNull()
  })

  it('lista tecnologías únicas en orden alfabético', () => {
    const techs = content.getAllTechnologies()
    expect(new Set(techs).size).toBe(techs.length)
    expect(techs).toEqual([...techs].sort((a, b) => a.localeCompare(b, 'en')))
    expect(techs).toContain('REACT')
  })

  it('elige el valor del idioma', () => {
    expect(content.pick({ es: 'Hola', en: 'Hi' }, 'en')).toBe('Hi')
  })

  it('ordena la cápsula por fecha', () => {
    const dates = content.getCapsule().map((entry) => entry.date)
    expect(dates).toEqual([...dates].sort())
  })

  it('lista los ids de posts del registro', () => {
    expect(content.postIds()).toEqual(['post1', 'solo'])
  })

  it('carga un post en su idioma o en el original con fallback', async () => {
    expect((await content.loadPost('post1', 'es'))?.meta.lang).toBe('es')
    const solo = await content.loadPost('solo', 'es')
    expect(solo?.fallback).toBe(true)
    expect(solo?.meta.lang).toBe('en')
    expect(await content.loadPost('nope', 'es')).toBeNull()
    expect(await content.loadPost('constructor', 'es')).toBeNull()
  })

  it('lista posts del más nuevo al más viejo con su marca de fallback', async () => {
    const posts = await content.listPosts('es')
    expect(posts.map((p) => [p.id, p.fallback])).toEqual([
      ['solo', true],
      ['post1', false],
    ])
  })
})

describe('seeds de contenido', () => {
  it('no tienen textos bilingües vacíos', () => {
    const values = [
      ...localizedValues(content.getSite(), 'site'),
      ...localizedValues(content.getProjects(), 'projects'),
      ...localizedValues(content.getCapsule(), 'capsule'),
    ]
    expect(values.length).toBeGreaterThan(20)
    for (const [path, value] of values) {
      expect(typeof value, path).toBe('string')
      expect(String(value).trim(), path).not.toBe('')
    }
  })

  it('cumplen las reglas del modelo', () => {
    const site = content.getSite()
    for (const tech of site.about.skills.tech) expect(tech.progress).toBeGreaterThanOrEqual(0)
    for (const tech of site.about.skills.tech) expect(tech.progress).toBeLessThanOrEqual(100)
    expect(site.socials.find((s) => s.id === 'facebook')?.href).toBeNull()
    expect(site.about.career.some((entry) => entry.pending)).toBe(true)
    for (const entry of site.about.career) expect(entry.start).toMatch(/^\d{4}-\d{2}$/)
    const ids = content.getProjects().map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no arrastra textos 2023 sin corregir', () => {
    const text = JSON.stringify([content.getSite(), content.getProjects()])
    for (const wrong of ['Actually', 'Idioms', 'Rigths', 'Bussines', 'Desing', 'Theathrum', 'shools']) {
      expect(text).not.toContain(wrong)
    }
  })
})
