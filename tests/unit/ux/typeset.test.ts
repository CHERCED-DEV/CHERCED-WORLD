import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { nbsp, typeset } from '@/components/site/typeset'
import { site } from '@/content/site'

function html(node: ReturnType<typeof typeset>): string {
  return renderToStaticMarkup(createElement(Fragment, null, node))
}

describe('T2: ".NET" no queda solo al inicio de una línea', () => {
  it('pone un espacio de no separación antes de ".NET" y deja ASP.NET y .NET 8 como están', () => {
    expect(nbsp('microservicios .NET y sagas')).toBe('microservicios .NET y sagas')
    expect(nbsp('Umbraco (.NET) y ASP.NET Core')).toBe('Umbraco (.NET) y ASP.NET Core')
    expect(nbsp('un backend .NET 8')).toBe('un backend .NET 8')
  })

  it('el hero de Home lo trae en los dos idiomas', () => {
    for (const lang of ['es', 'en'] as const) expect(html(typeset(site.home.subtitle![lang], lang))).toMatch(/ \.NET/)
  })
})

describe('T1: los términos en inglés van con lang="en" en las páginas en español', () => {
  it('marca cargos y términos sin tocar el resto', () => {
    const out = html(typeset('Soy Camilo, Software Solutions Engineer. Trabajo AI-first y spec-driven con server-side rendering.', 'es'))
    expect(out).toContain('<span lang="en">Software Solutions Engineer</span>')
    expect(out).toContain('<span lang="en" style="white-space:nowrap">AI-first</span>')
    expect(out).toContain('<span lang="en">spec-driven</span>')
    expect(out).toContain('<span lang="en">server-side rendering</span>')
    expect(out.startsWith('Soy Camilo, ')).toBe(true)
  })

  it('en inglés no marca nada con lang', () => {
    expect(html(typeset('I am a Software Solutions Engineer and I work AI-first.', 'en'))).not.toContain('lang=')
  })

  it('respeta los límites de palabra: "harnesses" o "Engineering" no se marcan', () => {
    expect(html(typeset('Engineering teams and harnesses', 'es'))).toBe('Engineering teams and harnesses')
  })

  it('el texto corrido ya no se guiona solo: hyphens manual en el mixin prose (y no queda ningún hyphens: auto)', () => {
    const mixin = readFileSync(join(process.cwd(), 'components/site/_site.scss'), 'utf8')
    expect(mixin).toMatch(/@mixin prose \{[^}]*hyphens: manual;/)
    expect(mixin).not.toMatch(/hyphens: auto/)
  })
})

describe('T3: "AI-First" no se parte en el guion', () => {
  it('en los dos idiomas, el cargo va sin corte', () => {
    expect(html(typeset('Software Solutions Engineer · AI-First', 'en'))).toBe('Software Solutions Engineer · <span style="white-space:nowrap">AI-First</span>')
    expect(html(typeset('Software Solutions Engineer · AI-First', 'es'))).toContain('<span lang="en" style="white-space:nowrap">AI-First</span>')
  })

  it('con keepHyphens, cualquier palabra con guion queda entera (hero de Home)', () => {
    expect(html(typeset('Micro-frontends y más', 'en', { keepHyphens: true }))).toBe('<span style="white-space:nowrap">Micro-frontends</span> y más')
    expect(html(typeset('Micro-frontends y más', 'en'))).toBe('Micro-frontends y más')
  })

  it('P1: con keepHyphens, un término de varias palabras se parte entre palabras y solo la palabra con guion queda entera', () => {
    const title = 'built with Spec-Driven Development and agents'
    expect(html(typeset(title, 'en', { keepHyphens: true }))).toBe(
      'built with <span><span style="white-space:nowrap">Spec-Driven</span> Development</span> and agents',
    )
    expect(html(typeset(title, 'es', { keepHyphens: true }))).toBe(
      'built with <span lang="en"><span style="white-space:nowrap">Spec-Driven</span> Development</span> and agents',
    )
  })
})
