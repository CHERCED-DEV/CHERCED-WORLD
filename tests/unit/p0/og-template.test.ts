import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, isValidElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { projects } from '@/content/projects'
import { projectTitle } from '@/lib/content/project-title'
import { ogCase, ogSection } from '@/lib/og/sections'
import { OG_CONTENT_TYPE, OG_DOMAIN, OG_FONT_DIR, OG_SIZE, OgCard, ogAlt, ogFonts, ogImageMetadata, renderOgImage } from '@/lib/og/template'

function texts(node: ReactNode): string[] {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(texts)
  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (typeof node.type === 'function') return texts((node.type as (props: unknown) => ReactNode)(node.props))
    return texts(node.props.children)
  }
  return []
}

describe('plantilla OG (R-403, FR-471)', () => {
  it('mide 1200 × 630 en PNG y arma el alt "{título}: {línea}"', () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
    expect(OG_CONTENT_TYPE).toBe('image/png')
    expect(ogAlt('es', 'Sobre mí', 'Software Solutions Engineer · AI-First')).toBe('Sobre mí: Software Solutions Engineer · AI-First')
    expect(ogImageMetadata('og', { lang: 'en', title: 'Services', line: 'x' })).toEqual({
      id: 'og',
      alt: 'Services: x',
      size: OG_SIZE,
      contentType: 'image/png',
    })
  })

  it('trae los textos de contenido.md §23 para cada sección', () => {
    expect(ogSection('es', 'home')).toEqual({ lang: 'es', title: 'Camilo Hernández', line: 'DISEÑO SISTEMAS DE SOFTWARE QUE ESCALAN' })
    expect(ogSection('en', 'home')).toEqual({ lang: 'en', title: 'Camilo Hernández', line: 'I DESIGN SOFTWARE SYSTEMS THAT SCALE' })
    expect(ogSection('es', 'about')).toMatchObject({ title: 'Sobre mí', line: 'Software Solutions Engineer · AI-First' })
    expect(ogSection('en', 'about')).toMatchObject({ title: 'About me', line: 'Software Solutions Engineer · AI-First' })
    expect(ogSection('es', 'services')).toMatchObject({ title: 'Servicios', line: 'Tu oficio, con un equipo de agentes a la medida' })
    expect(ogSection('en', 'services')).toMatchObject({ title: 'Services', line: 'Your craft, with a tailor-made team of agents' })
    expect(ogSection('es', 'portfolio')).toMatchObject({ title: 'Portafolio', line: `${projects.length} casos de estudio` })
    expect(ogSection('en', 'portfolio')).toMatchObject({ title: 'Portfolio', line: '15 case studies' })
    expect(ogSection('es', 'contact')).toMatchObject({ title: 'Contacto', line: 'Armenia, Colombia · UTC−5 · Te respondo en menos de 48 h' })
    expect(ogSection('en', 'contact')).toMatchObject({ title: 'Contact', line: 'Armenia, Colombia · UTC−5 · I reply within 48 h' })
    expect(ogSection('en', 'now')).toMatchObject({ title: 'Now' })
  })

  it('cada caso usa su título y su resumen', () => {
    for (const project of projects) {
      for (const lang of ['es', 'en'] as const) {
        expect(ogCase(lang, project.id)).toEqual({ lang, title: projectTitle(project, lang), line: project.summary[lang] })
      }
    }
    expect(ogCase('es', 'no-existe')).toBeNull()
  })

  it('pinta título, línea y dominio con Montserrat TTF de la carpeta pública', () => {
    const card = createElement(OgCard, { title: 'Synergos', line: 'Una plataforma de composición' })
    const content = texts(card)
    for (const text of ['CHERCED-WORLD', 'Synergos', 'Una plataforma de composición', OG_DOMAIN]) expect(content).toContain(text)
    const fonts = ogFonts()
    expect(fonts.map((font) => font.weight)).toContain(400)
    if (existsSync(join(process.cwd(), OG_FONT_DIR, 'Montserrat-Bold.ttf'))) expect(fonts.map((font) => font.weight)).toContain(700)
    for (const font of fonts) {
      expect(font.name).toBe('Montserrat')
      expect(font.data.readUInt32BE(0)).toBe(0x00010000)
    }
    expect(readFileSync(join(process.cwd(), OG_FONT_DIR, 'Montserrat-Regular.ttf')).length).toBeGreaterThan(10_000)
  })

  it('genera un PNG de 1200 × 630', async () => {
    const response = renderOgImage(ogSection('es', 'services'))
    const png = Buffer.from(await response.arrayBuffer())
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
  }, 60_000)
})
