import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomeView, type HomeViewLabels } from '@/components/site/home/HomeView'
import { splitAround } from '@/components/site/home/now'
import { ToastProvider } from '@/components/ui/Toast'
import type { SiteContent } from '@/content/types'
import { getProjects, getSite } from '@/lib/content'

const site = getSite()
const projects = getProjects()

const labels: HomeViewLabels = {
  socials: 'Contáctame',
  previousTitle: 'Antes decía:',
  cue: 'Bajar a «Ahora trabajo en»',
  now: { title: 'Ahora trabajo en', since: 'Desde {date}', caseStudy: 'Ver caso de estudio', more: 'Conoce mi trayectoria' },
}

const Provider = ToastProvider as (props: { closeLabel: string; children?: ReactNode }) => ReactElement

function render(content: SiteContent = site, lang: 'es' | 'en' = 'es'): string {
  return renderToStaticMarkup(createElement(Provider, { closeLabel: 'Cerrar' }, createElement(HomeView, { lang, site: content, projects, labels })))
}

function headingText(html: string): string {
  const inner = /<h1 id="home-title"[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? ''
  return inner.replace(/<[^>]+>/g, '').replaceAll('&#x27;', "'")
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
    expect(headingText(banner)).toBe(site.home.title.es)
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
    expect(headingText(render(site, 'en'))).toBe(site.home.title.en)
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
    expect(now).toContain('><span lang="en">Software Solutions Engineer</span> · <span lang="en" style="white-space:nowrap">AI-First</span></p>')
    expect(now).toContain('>Synergos Labs</h3>')
    expect(now, 'R2.7: desde el primer cargo continuo en Sistecrédito').toContain('<time dateTime="2025-03">mar 2025</time>')
    expect(now).toContain('<time dateTime="2024-02">feb 2024</time>')
  })

  it('enlaza el caso de estudio de Synergos y la trayectoria completa', () => {
    const now = section(render(), 'data-cw-home-now')
    const synergos = projects.find((project) => project.title === 'Synergos')
    expect(now).toContain(`href="/es/portfolio/${synergos?.id}"`)
    expect(now).toMatch(/<a [^>]*aria-label="Ver caso de estudio: Synergos"[^>]*>[\s\S]*?>Ver caso de estudio<\/span>/)
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

describe('vitrina de proyectos del home (auditoría 1)', () => {
  const featured = {
    ...labels,
    featured: {
      title: 'Proyectos destacados',
      viewCase: 'Ver caso',
      all: 'Ver los {count} proyectos',
      eras: { '2026': '2026', '2024-2026': '2024–2026', '2022-2023': '2022–2023' },
    },
  } satisfies HomeViewLabels

  function renderFeatured(): string {
    return renderToStaticMarkup(
      createElement(Provider, { closeLabel: 'Cerrar' }, createElement(HomeView, { lang: 'es', site, projects, labels: featured })),
    )
  }

  it('va después de «Ahora trabajo en» con tres casos que no repiten Synergos y un enlace al portafolio', () => {
    const html = renderFeatured()
    expect(html.indexOf('data-cw-home-featured')).toBeGreaterThan(html.indexOf('data-cw-home-now'))
    const block = section(html, 'data-cw-home-featured')
    expect(block).toMatch(/<h2 id="home-featured-title"[^>]*>Proyectos destacados<\/h2>/)
    const cases = [...block.matchAll(/data-cw-home-case="([^"]+)"/g)].map((match) => match[1])
    const expected = [...projects].sort((a, b) => a.order - b.order).filter((project) => project.id !== '12').slice(0, 3)
    expect(cases).toEqual(expected.map((project) => project.id))
    for (const id of cases) expect(block).toContain(`href="/es/portfolio/${id}"`)
    expect(block).not.toContain('href="/es/portfolio/12"')
    const all = block.match(/<a [^>]*data-cw-home-link="portfolio"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? ''
    expect(all).toContain('href="/es/portfolio"')
    expect(all).toContain('Ver los 15 proyectos')
  })

  it('sin las etiquetas no aparece, y el carril de «Ahora trabajo en» sigue igual', () => {
    const html = render()
    expect(html).not.toContain('data-cw-home-featured')
    expect([...section(html, 'data-cw-home-now').matchAll(/data-cw-home-link="case"/g)]).toHaveLength(1)
  })
})
