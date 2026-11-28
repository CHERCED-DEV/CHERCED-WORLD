import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RoutePageView, routePageInput } from '@/components/ailab/route/RoutePage'
import { coreRoute, routeGuides, routeStations } from '@/content/ailab/route'
import { routeViewModel } from '@/lib/ailab/route/view'
import { routeDictionary } from './support'

async function html(lang: 'es' | 'en') {
  return renderToStaticMarkup(createElement(RoutePageView, await routePageInput(lang)))
}

function count(text: string, needle: string | RegExp): number {
  return text.match(typeof needle === 'string' ? new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : needle)?.length ?? 0
}

describe('página de la ruta renderizada en el servidor (FR-4201, FR-4203)', () => {
  it('trae las cuatro estaciones núcleo en orden, con objetivo, minutos, pasos, botón y evidencia', async () => {
    const page = await html('es')
    expect(page).toContain('<h1')
    expect(page).toContain('Pruébame en 10 minutos')
    const order = [...page.matchAll(/data-cw-route-station="([a-z-]+)" data-cw-route-core=""/g)].map((match) => match[1])
    expect(order).toEqual(['agente-en-vivo', 'encaje-y-pitch', 'codigo-real', 'tablero-en-numeros'])
    for (const [n, title] of [
      [1, 'Agente en vivo'],
      [2, 'Encaje y pitch'],
      [3, 'Código real'],
      [4, 'El tablero en números'],
    ] as const) {
      expect(page).toContain(`Estación ${n} de 4`)
      expect(page).toContain(title)
    }
    expect(page).toContain('Abre a Mini Cherced y elige el modo entrevista, pista Técnica.')
    expect(page).toContain('href="/es/ai-lab#lab-v5"')
    expect(page).toContain('href="/es/ai-lab#lab-a6"')
    expect(page).toContain('href="/es/ai-lab/codigo"')
    expect(page).toContain('href="https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/specs/030-modo-entrevista/spec.md"')
    expect(page).toContain('href="/es/portfolio/12#case-pitch-12"')
    expect(page).toContain('La traza exportada en JSON')
    expect(count(page, 'data-cw-route-open=')).toBe(routeStations.length)
  })

  it('las estaciones extra van en «Más pruebas» de su prueba, con la etiqueta de la otra prueba que demuestran', async () => {
    const page = await html('es')
    const more = page.slice(page.indexOf('data-cw-route-more="1"'))
    expect(more).toContain('Más pruebas de «Agentes que funcionan» (4)')
    expect(more).toContain('data-cw-route-station="arena"')
    expect(more).toContain('data-cw-route-station="rompelo"')
    expect(more).toContain('data-cw-route-station="diseno-de-sistemas"')
    expect(more).toContain('data-cw-route-station="mcp-en-tu-agente"')
    expect(page).toContain('También prueba 3: Código de calidad')
    expect(page).not.toContain('data-cw-route-more="2"')
  })

  it('sin JavaScript se ven pasos y enlaces, y el aviso dice que el reloj, las marcas y el acta piden JavaScript', async () => {
    const page = await html('es')
    expect(page).toContain('<noscript>')
    expect(page).toContain('El reloj, las marcas, las notas y el acta piden JavaScript.')
    expect(page).toMatch(/<button[^>]*disabled=""[^>]*data-cw-route-start=""/)
    expect(count(page, /<fieldset[^>]*disabled=""/g)).toBe(routeStations.length)
    expect(page).toContain('10:00')
  })

  it('FR-4212: la estación del agente dice qué hacer sin modelo y trae la traza grabada, marcada como simulada', async () => {
    const page = await html('es')
    const agent = page.slice(page.indexOf('data-cw-route-station="agente-en-vivo"'), page.indexOf('data-cw-route-station="encaje-y-pitch"'))
    expect(agent).toContain('data-cw-route-offline')
    expect(agent).toContain('data-cw-route-recorded="local"')
    expect(agent).toContain('Traza grabada (simulada)')
    expect(agent).toContain('simulador local')
    expect(agent).toContain('Cómo pensó (3)')
  })

  it('US3: la estación del agente trae Rómpelo con tres ataques de la batería y dice que no hay corrida publicada', async () => {
    const page = await html('es')
    const agent = page.slice(page.indexOf('data-cw-route-station="agente-en-vivo"'), page.indexOf('data-cw-route-station="encaje-y-pitch"'))
    expect(agent.match(/data-cw-route-attack=/g)).toHaveLength(3)
    expect(agent).toContain('Todavía no hay una corrida publicada.')
    expect(agent).toContain('href="/es/ai-lab/evals"')
    expect(page.match(/data-cw-route-breakit=/g)).toHaveLength(1)
  })

  it('en inglés trae lo mismo, traducido', async () => {
    const page = await html('en')
    expect(page).toContain('Try me in 10 minutes')
    expect(page).toContain('Station 4 of 4')
    expect(page).toContain('href="/en/ai-lab#lab-v5"')
    expect(page).toContain('More tests for “Agents that work” (4)')
    expect(page).toContain('Recorded trace (simulated)')
    expect(page).not.toContain('Estación')
  })

  it('cada texto de la vista sale del diccionario en los dos idiomas', () => {
    for (const lang of ['es', 'en'] as const) {
      const model = routeViewModel(lang, routeDictionary(lang), routeStations, coreRoute, routeGuides)
      expect(model.order).toEqual(Object.values(coreRoute))
      for (const station of model.stations) {
        expect(station.goal.trim(), station.id).not.toBe('')
        expect(station.action.label.trim(), station.id).not.toBe('')
        for (const item of station.evidence) expect(item.text.trim(), `${station.id} ${item.id}`).not.toBe('')
      }
    }
  })
})
