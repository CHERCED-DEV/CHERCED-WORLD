import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Certifications } from '@/components/site/about/Certifications'
import { RecruitersBlock } from '@/components/site/home/RecruitersBlock'
import { now } from '@/content/now'
import { site } from '@/content/site'
import { getProjects } from '@/lib/content'
import { personJsonLd } from '@/lib/seo/person'

const recruiters = site.recruiters!

function text(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('FR-710: bloque "Para reclutadores"', () => {
  it.each(['es', 'en'] as const)('%s: roles, modalidad, inglés como nivel y los tres botones', (lang) => {
    const html = renderToStaticMarkup(createElement(RecruitersBlock, { lang, content: recruiters, writeHref: `/${lang}/contactMe` }))
    const visible = text(html)
    expect(html).toMatch(/<section id="recruiters"[^>]*aria-labelledby="recruiters-title"/)
    expect(visible).toContain(lang === 'es' ? 'Para reclutadores' : 'For recruiters')
    expect([...html.matchAll(/<li /g)]).toHaveLength(4)
    for (const role of recruiters.roles) expect(visible).toContain(role[lang])
    expect(visible).toContain('Angular')
    expect(visible).toContain(lang === 'es' ? 'Remoto · UTC−5 · Abierto a reubicación' : 'Remote · UTC−5 · Open to relocation')
    expect(visible).toContain(lang === 'es' ? 'B1 (B2 en uso profesional frecuente)' : 'B1 (B2 in regular professional use)')
    expect(visible).not.toMatch(/\d+\s*%/)
    expect(html).toContain('data-cw-cv-download')
    expect(html).toContain('data-cw-cv-alternate')
    expect(html).toContain('data-cw-cv-link')
    const write = /<a [^>]*data-cw-recruiters-write=""[^>]*>([^<]+)<\/a>/.exec(html)!
    expect(write[0]).toContain(`href="/${lang}/contactMe"`)
    expect(write[1]).toBe(lang === 'es' ? 'Escríbeme' : 'Write to me')
  })

  it('en Contacto no repite los botones del CV y "Escríbeme" lleva al formulario', () => {
    const html = renderToStaticMarkup(createElement(RecruitersBlock, { lang: 'es', content: recruiters, writeHref: '#contact-form', withCv: false, compact: true }))
    expect(html).not.toContain('data-cw-cv-download')
    expect(/<a [^>]*data-cw-recruiters-write=""[^>]*>/.exec(html)![0]).toContain('href="#contact-form"')
  })

  it('no publica cifras internas del empleador ni testimonios', () => {
    const all = JSON.stringify(recruiters)
    expect(all).not.toMatch(/Sistecr|700|1\.000|1,000|90\s*%|testimoni/i)
  })
})

describe('FR-711: certificaciones', () => {
  it.each(['es', 'en'] as const)('%s: Fundamentos de Arquitectura (nov 2025) y 140+ cursos, con el perfil de Platzi', (lang) => {
    const html = renderToStaticMarkup(
      createElement(Certifications, {
        lang,
        items: site.about.certifications ?? [],
        profileHref: site.about.courses.platzi.href,
        labels: { title: lang === 'es' ? 'Certificaciones' : 'Certifications', profile: site.about.courses.platzi.label[lang], newTab: '(nueva pestaña)' },
      }),
    )
    const visible = text(html)
    expect([...html.matchAll(/data-cw-certification=""/g)]).toHaveLength(2)
    expect(visible).toContain(lang === 'es' ? 'Fundamentos de Arquitectura de Software' : 'Software Architecture Fundamentals')
    expect(html).toContain('<time dateTime="2025-11">')
    expect(visible).toContain(lang === 'es' ? 'Más de 140 cursos certificados' : '140+ certified software development courses')
    expect(html).toMatch(/href="https:\/\/platzi\.com\/p\/Cherced\/" target="_blank" rel="noopener noreferrer"/)
  })
})

describe('FR-712: "Ver código" solo con repos públicos de CHERCED-DEV', () => {
  it('Director y líneas enlaza el arnés; Espacio de trabajo legal y Puente de eventos van sin código', () => {
    const projects = getProjects()
    expect(projects.find((project) => project.id === '13')!.links.repos).toEqual([
      { label: 'Synergos.Fabrica', href: 'https://github.com/CHERCED-DEV/Synergos.Fabrica' },
    ])
    for (const id of ['14', '15']) expect(projects.find((project) => project.id === id)!.links.repos, id).toBeUndefined()
  })
})

describe('B12 y B13: HYROX y nombre', () => {
  it('HYROX en Río de Janeiro, sin fecha', () => {
    const hyrox = now.preparing.map((entry) => `${entry.es} ${entry.en}`).join(' ')
    expect(hyrox).toContain('HYROX Río de Janeiro')
    expect(hyrox).not.toMatch(/São Paulo|19 de noviembre|November 19/)
  })

  it('el JSON-LD usa "Camilo Hernández" y conoce las otras formas del nombre', () => {
    const person = personJsonLd('es', new URL('https://cherced-world.vercel.app'))
    expect(person.name).toBe('Camilo Hernández')
    expect(person.alternateName).toEqual(['Camilo Hernandez', 'Camilo Hernández Cediel', 'Camilo Alonso Hernández Cediel', 'CHERCED'])
  })
})
