import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomeView, type HomeViewLabels } from '@/components/site/home/HomeView'
import { splitAround } from '@/components/site/home/now'
import type { SiteContent } from '@/content/types'
import { getProjects, getSite } from '@/lib/content'

const site = getSite()
const projects = getProjects()

const labels: HomeViewLabels = {
  socials: 'Contáctame',
  cue: 'Bajar a «Ahora trabajo en»',
  now: { title: 'Ahora trabajo en', since: 'Desde {date}', caseStudy: 'Ver caso de estudio', more: 'Conoce mi trayectoria' },
}

function render(content: SiteContent = site, lang: 'es' | 'en' = 'es'): string {
  return renderToStaticMarkup(createElement(HomeView, { lang, site: content, projects, labels }))
}

function section(html: string, attribute: string): string {
  const start = html.indexOf(attribute)
  expect(start, attribute).toBeGreaterThan(-1)
  const open = html.lastIndexOf('<section', start)
  const close = html.indexOf('</section>', start)
  return html.slice(open, close)
}

describe('banner del home', () => {
  it('conserva saludo, nombre, título, separador y las tres redes', () => {
    const banner = section(render(), 'data-cw-home-banner')
    expect(banner).toMatch(new RegExp(`${site.home.greeting.es} <strong>${site.home.name}</strong>`))
    expect(banner).toMatch(new RegExp(`<h1 id="home-title"[^>]*>${site.home.title.es}</h1>`))
    expect(banner).toContain('<hr aria-hidden="true"')
    const nav = /<nav aria-label="Contáctame">([\s\S]*?)<\/nav>/.exec(banner)?.[1] ?? ''
    expect([...nav.matchAll(/<a /g)]).toHaveLength(3)
    expect(nav).toContain('href="mailto:')
  })

  it('tiene un único h1 y grafismos decorativos ocultos a los lectores de pantalla', () => {
    const html = render()
    expect([...html.matchAll(/<h1[\s>]/g)]).toHaveLength(1)
    expect(html).toMatch(/<div[^>]*aria-hidden="true"[^>]*data-cw-home-orbit=""/)
  })

  it('en inglés usa el título de 2023', () => {
    expect(render(site, 'en')).toContain(`>${site.home.title.en.replaceAll("'", '&#x27;')}</h1>`)
  })
})

describe('"Ahora trabajo en"', () => {
  it('lista el rol actual y Synergos Labs con su fecha de inicio', () => {
    const now = section(render(), 'data-cw-home-now')
    expect(now).toContain('id="home-now"')
    expect(now).toMatch(/<h2 id="home-now-title"[^>]*>Ahora trabajo en<\/h2>/)
    const roles = [...now.matchAll(/data-cw-home-role="([^"]+)"/g)].map((match) => match[1])
    expect(roles).toEqual(['sistecredito-ai-first', 'synergos-labs'])
    expect(now).toContain('>Sistecrédito</h3>')
    expect(now).toContain('>Software Solutions Engineer · AI-First</p>')
    expect(now).toContain('>Synergos Labs</h3>')
    expect(now).toContain('<time dateTime="2026-02">feb 2026</time>')
    expect(now).toContain('<time dateTime="2024-02">feb 2024</time>')
  })

  it('enlaza el caso de estudio de Synergos y la trayectoria completa', () => {
    const now = section(render(), 'data-cw-home-now')
    const synergos = projects.find((project) => project.title === 'Synergos')
    expect(now).toContain(`href="/es/portfolio/${synergos?.id}"`)
    expect(now).toContain('<span class="cw-visually-hidden">: Synergos</span>')
    expect(now).toContain('href="/es/aboutMe"')
    expect([...now.matchAll(/data-cw-home-link="case"/g)]).toHaveLength(1)
  })

  it('la señal del hero apunta al bloque y no existe si no hay roles actuales', () => {
    expect(render()).toMatch(/<a href="#home-now"[^>]*aria-label="Bajar a «Ahora trabajo en»"/)
    const empty: SiteContent = { ...site, about: { ...site.about, career: site.about.career.filter((entry) => entry.end !== null) } }
    const html = render(empty)
    expect(html).not.toContain('data-cw-home-now')
    expect(html).not.toContain('href="#home-now"')
    expect(html).toContain('data-cw-home-banner')
  })
})

describe('plantilla de fecha', () => {
  it('parte el texto alrededor de {date}', () => {
    expect(splitAround('Desde {date}', 'date')).toEqual(['Desde ', ''])
    expect(splitAround('{date} en adelante', 'date')).toEqual(['', ' en adelante'])
    expect(splitAround('Desde', 'date')).toEqual(['Desde ', ''])
  })
})
