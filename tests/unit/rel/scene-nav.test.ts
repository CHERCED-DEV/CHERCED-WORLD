import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SCENE_TAB_QUERY, SceneNav, sceneTabGeometry, sceneTabState } from '@/components/site/about/SceneNav'

const scenes = [
  { id: 'scene-who', label: 'Quién soy' },
  { id: 'scene-career', label: 'Carrera' },
  { id: 'scene-knowledge', label: 'Lo que sé' },
  { id: 'scene-heading', label: 'Hacia dónde voy' },
]

const css = readFileSync(path.resolve(process.cwd(), 'components/site/about/SceneNav.module.scss'), 'utf8')

describe('pestaña de escenas de Sobre mí', () => {
  it('solo se compacta en celular con movimiento, al bajar, sin toque ni foco de teclado', () => {
    const base = { compactable: true, direction: 'down', pinned: false, focused: false } as const
    expect(sceneTabState(base)).toBe('compact')
    expect(sceneTabState({ ...base, direction: 'up' })).toBe('open')
    expect(sceneTabState({ ...base, compactable: false })).toBe('open')
    expect(sceneTabState({ ...base, pinned: true })).toBe('open')
    expect(sceneTabState({ ...base, focused: true })).toBe('open')
    expect(SCENE_TAB_QUERY).toBe('(max-width: 767.98px) and (prefers-reduced-motion: no-preference)')
  })

  it('al compactarse el cristal sale por el marco y cada píldora llega al inicio, junto al número', () => {
    const lefts = [4, 88, 154, 235]
    const { shift, pulls } = sceneTabGeometry({ track: 375, start: 4, end: 4, badge: 30, scroll: 0, width: 67, lefts })
    expect(shift).toBe(375 - (4 + 30 + 67 + 4))
    pulls.forEach((pull, index) => expect(lefts[index]! + pull - shift).toBe(4 + 30))
  })

  it('cuenta el desplazamiento de la pista y nunca estira la pestaña', () => {
    const lefts = [4, 86, 148, 250]
    const { shift, pulls } = sceneTabGeometry({ track: 360, start: 4, end: 4, badge: 30, scroll: 36, width: 143, lefts })
    expect(lefts[3]! - 36 + pulls[3]! - shift).toBe(34)
    expect(sceneTabGeometry({ track: 100, start: 4, end: 4, badge: 30, scroll: 0, width: 143, lefts: [4] }).shift).toBe(0)
  })

  it('sin JS se sirve entera: nav con nombre, cuatro anclas, la primera actual y lo decorativo oculto', () => {
    const html = renderToStaticMarkup(createElement(SceneNav, { label: 'Escenas de Sobre mí', scenes }))
    expect(html).toMatch(/<nav [^>]*aria-label="Escenas de Sobre mí"[^>]*data-cw-scene-nav=""/)
    expect(html).not.toContain('data-cw-compact')
    expect(html).not.toContain('data-cw-measured')
    expect(html.match(/<a href="#scene-[a-z]+"/g)).toEqual(scenes.map((scene) => `<a href="#${scene.id}"`))
    expect(html).toMatch(/<a href="#scene-who"[^>]*aria-current="true"/)
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
    expect(html).toMatch(/<span [^>]*aria-hidden="true" data-cw-scene-badge="">01<\/span>/)
    expect(html).toMatch(/<span [^>]*aria-hidden="true" data-cw-scene-indicator=""><\/span>/)
  })

  it('compacta solo en < md y con movimiento; solo anima translate, transform y opacity (FR-650, FR-653)', () => {
    expect(css).toMatch(/@include bp\.down\(md\) \{\s*@include site\.motion-ok \{[\s\S]*?\.sceneNav\[data-cw-compact\] \{/)
    const compactBlock = css.slice(css.indexOf('.sceneNav[data-cw-compact]'))
    expect(compactBlock.slice(0, compactBlock.indexOf('.sceneDots'))).not.toMatch(/\b(width|left|right|clip-path|margin|padding)\s*:/)
    const transitioned = [...css.matchAll(/transition:\s*([^;]+);/g)].flatMap((match) =>
      match[1]!.split(',').map((part) => part.trim().split(/\s+/)[0]!),
    )
    expect(transitioned).toContain('translate')
    for (const property of transitioned) expect(['none', 'color', 'translate', 'opacity', 'transform', 'visibility', 'background-color', 'border-color']).toContain(property)
  })

  it('el acento solo marca la escena activa y la línea de progreso, sin colores nuevos', () => {
    const colors = new Set([...css.matchAll(/#[0-9a-f]{3,8}\b|rgb\([^)]*\)/gi)].map((match) => match[0].toLowerCase()))
    expect([...colors].sort()).toEqual(['#000', 'rgb(37 237 158 / 0.32)', 'rgb(37 237 158 / 0.7)'])
  })
})
