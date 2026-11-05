import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomeView, type HomeViewLabels } from '@/components/site/home/HomeView'
import { ROLE_FLOAT_LEVELS, roleFloatLevel } from '@/components/site/home/HomeNow'
import { ToastProvider } from '@/components/ui/Toast'
import { getProjects, getSite } from '@/lib/content'

const ROOT = join(__dirname, '..', '..', '..')
const labels: HomeViewLabels = {
  socials: 'Contáctame',
  previousTitle: 'Antes decía:',
  cue: 'Bajar a «Ahora trabajo en»',
  now: { title: 'Ahora trabajo en', since: 'Desde {date}', caseStudy: 'Ver caso de estudio', more: 'Conoce mi trayectoria' },
}

const Provider = ToastProvider as (props: { closeLabel: string; children?: ReactNode }) => ReactElement

function render(): string {
  return renderToStaticMarkup(
    createElement(Provider, { closeLabel: 'Cerrar' }, createElement(HomeView, { lang: 'es', site: getSite(), projects: getProjects(), labels })),
  )
}

function source(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8')
}

function keyframes(css: string, name: string): string {
  const start = css.indexOf(`@keyframes ${name}`)
  expect(start, name).toBeGreaterThan(-1)
  let depth = 0
  for (let index = css.indexOf('{', start); index < css.length; index += 1) {
    if (css[index] === '{') depth += 1
    if (css[index] === '}') depth -= 1
    if (depth === 0) return css.slice(start, index + 1)
  }
  return ''
}

function properties(block: string): string[] {
  return [...new Set([...block.matchAll(/([a-z-]+)\s*:/g)].map((match) => match[1] ?? ''))]
}

describe('home en móvil (006, US10, FR-633)', () => {
  it('cada rol de "Ahora trabajo en" flota con un desfase distinto al de su vecino y trae su barrido', () => {
    const html = render()
    const roles = [...html.matchAll(/<li [^>]*data-cw-home-role="[^"]+"[^>]*>/g)].map((match) => match[0])
    expect(roles.length).toBeGreaterThan(1)
    const levels = roles.map((tag) => /data-cw-float="(\d)"/.exec(tag)?.[1])
    expect(levels).toEqual(roles.map((_, index) => String(roleFloatLevel(index))))
    for (let index = 1; index < levels.length; index += 1) expect(levels[index]).not.toBe(levels[index - 1])
    const now = html.slice(html.indexOf('data-cw-home-now'))
    expect([...now.matchAll(/<span aria-hidden="true" data-cw-sweep="">/g)]).toHaveLength(roles.length)
  })

  it('los niveles son 1, 2 o 3 y no se repiten seguidos', () => {
    expect(new Set(ROLE_FLOAT_LEVELS).size).toBe(ROLE_FLOAT_LEVELS.length)
    for (const level of ROLE_FLOAT_LEVELS) expect([1, 2, 3]).toContain(level)
    expect(roleFloatLevel(ROLE_FLOAT_LEVELS.length)).toBe(ROLE_FLOAT_LEVELS[0])
  })

  it('el marco del banner lleva un barrido de una vez, decorativo y sin marca de blur', () => {
    const html = render()
    const banner = html.slice(html.indexOf('data-cw-home-banner'), html.indexOf('data-cw-home-now'))
    expect(banner).toMatch(/<span class="[^"]*" aria-hidden="true" data-cw-sweep="" data-cw-home-sweep=""><\/span><\/div><\/section>/)
    expect(html).not.toContain('data-cw-blur')
  })

  it('las animaciones nuevas solo mueven transform y opacity', () => {
    expect(properties(keyframes(source('components/site/home/Home.module.scss'), 'home-cue-breathe')).sort()).toEqual(['opacity', 'transform'])
    expect(properties(keyframes(source('components/site/HomeBanner.module.scss'), 'banner-sweep'))).toEqual(['transform'])
  })

  it('la respiración vive en móvil o táctil con JS, deriva del ritmo ambiental y se apaga con movimiento reducido', () => {
    const css = source('components/site/home/Home.module.scss')
    expect(css).toMatch(
      /@media \(max-width: #\{bp\.bp\(md\) - 0\.02px\}\), \(pointer: coarse\) \{\s*@media \(prefers-reduced-motion: no-preference\) \{\s*:global\(:root\[data-js\]\) \{\s*\.cue \{\s*animation: home-cue-breathe/,
    )
    expect(css).toContain('--cw-cue-breath: calc(var(--cw-duration-ambient) / 2);')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.cue,/)
  })
})
