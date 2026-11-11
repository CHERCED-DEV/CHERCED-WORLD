import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HeadingScene } from '@/components/site/about/HeadingScene'
import { site } from '@/content/site'
import en from '@/content/i18n/en/site.json'
import es from '@/content/i18n/es/site.json'
import type { Localized } from '@/content/types'

const heading = site.about.heading!
const LANGS = ['es', 'en'] as const

function texts(): Localized[] {
  return [heading.title, heading.intro, heading.hub, ...heading.today, ...heading.directions.flatMap((direction) => [direction.title, direction.text])]
}

describe('"Hacia dónde voy", cuarta escena de Sobre mí (R2.1, T960)', () => {
  it('trae título, intro, punto de partida y cuatro rumbos con ids únicos', () => {
    expect(heading.directions.map((direction) => direction.id)).toEqual(['fabrica', 'robotica', 'energia', 'marcas'])
    expect(heading.today.length).toBeGreaterThanOrEqual(2)
  })

  it('cada texto existe en español y en inglés, y son distintos', () => {
    for (const text of texts()) {
      for (const lang of LANGS) expect(text[lang].trim(), JSON.stringify(text)).not.toBe('')
    }
    for (const text of [heading.title, heading.intro, ...heading.directions.map((direction) => direction.text)]) expect(text.es).not.toBe(text.en)
  })

  it('no nombra empresas de terceros ni pone fechas, como pidió el autor', () => {
    const copy = texts().flatMap((text) => [text.es, text.en]).join(' ')
    for (const name of [/anatis/i, /sistecr[eé]dito/i, /newshore/i, /avianca/i]) expect(copy).not.toMatch(name)
    expect(copy).not.toMatch(/\b(19|20)\d{2}\b/)
  })

  it('el mapa tiene nombre accesible en los dos idiomas', () => {
    expect(es['about.heading.map']).toMatch(/hacia dónde voy/i)
    expect(en['about.heading.map']).toMatch(/where I'm heading/i)
  })

  it('cada rumbo del mapa enlaza a su tarjeta y las tarjetas llevan su título como h3', () => {
    for (const lang of LANGS) {
      const html = renderToStaticMarkup(createElement(HeadingScene, { id: 'scene-heading', lang, content: heading, mapLabel: 'Mapa' }))
      expect(html).toContain('aria-labelledby="about-heading"')
      for (const direction of heading.directions) {
        expect(html).toContain(`href="#heading-${direction.id}"`)
        expect(html).toContain(`id="heading-${direction.id}"`)
      }
      expect(html.match(/<h3[\s>]/g)).toHaveLength(heading.directions.length)
      expect(html).not.toMatch(/text-align:\s*justify/)
    }
  })
})
