import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AboutCareer } from '@/components/site/about/AboutCareer'
import { site } from '@/content/site'

const WITH_HIGHLIGHTS = ['sistecredito-ai-first', 'sistecredito-dev-solutions', 'synergos-labs', 'flyr', 'newshore', 'growup-it']

function render(lang: 'es' | 'en') {
  return renderToStaticMarkup(
    createElement(AboutCareer, {
      lang,
      title: 'Carrera',
      presentLabel: 'hoy',
      openLabel: 'Ver detalle',
      closeLabel: 'Cerrar',
      prevLabel: 'Anterior',
      nextLabel: 'Siguiente',
      entries: site.about.career,
    }),
  )
}

function job(html: string, id: string): string {
  const start = html.indexOf(`data-cw-job="${id}"`)
  expect(start, id).toBeGreaterThan(-1)
  const next = html.indexOf('data-cw-job=', start + 1)
  return html.slice(start, next > -1 ? next : html.indexOf('</ol>', start))
}

describe('T975: las experiencias llevan los bullets de LinkedIn', () => {
  it('cada experiencia con bullets los tiene en ES y EN, en la misma cantidad y sin vacíos', () => {
    for (const id of WITH_HIGHLIGHTS) {
      const entry = site.about.career.find((item) => item.id === id)
      expect(entry?.highlights?.length, id).toBeGreaterThan(1)
      for (const highlight of entry!.highlights!) {
        expect(highlight.es.trim(), id).not.toBe('')
        expect(highlight.en.trim(), id).not.toBe('')
      }
    }
    for (const id of ['platzi-master', 'squadra-arquitectura']) {
      expect(site.about.career.find((item) => item.id === id)?.highlights, id).toBeUndefined()
    }
  })

  it.each(['es', 'en'] as const)('%s: la tarjeta muestra la lista en vez del párrafo, y sin bullets queda el párrafo', (lang) => {
    const html = render(lang)
    const flyr = job(html, 'flyr')
    expect(flyr).toContain('data-cw-job-highlights=""')
    expect(flyr.match(/<li>/g)).toHaveLength(site.about.career.find((item) => item.id === 'flyr')!.highlights!.length)
    expect(flyr).not.toContain(site.about.career.find((item) => item.id === 'flyr')!.description[lang])
    const platzi = job(html, 'platzi-master')
    expect(platzi).not.toContain('data-cw-job-highlights')
    expect(platzi).toContain(site.about.career.find((item) => item.id === 'platzi-master')!.description[lang])
  })
})
