import { describe, expect, it } from 'vitest'
import { coreRoute, routeGuides, routeStations } from '@/content/ailab/route'
import { clock } from '@/lib/ai/agent/interview'
import { proofState, routeActa, routeActaFileName } from '@/lib/ailab/route/acta'
import { EMPTY_PROGRESS, finishRoute, setMark, setNote, startRoute, type RouteProgress } from '@/lib/ailab/route/progress'
import { routeViewModel } from '@/lib/ailab/route/view'
import { routeDictionary } from './support'

const ORIGIN = 'https://ejemplo.test'
const T0 = Date.parse('2026-11-26T15:00:00Z')
const models = { es: routeViewModel('es', routeDictionary('es'), routeStations, coreRoute, routeGuides), en: routeViewModel('en', routeDictionary('en'), routeStations, coreRoute, routeGuides) }

function acta(progress: RouteProgress, lang: 'es' | 'en' = 'es', now = T0 + 9 * 60_000 + 41_000) {
  const model = models[lang]
  return routeActa({ lang, stations: model.stations, proofs: model.proofs, progress, origin: ORIGIN, now })
}

function headings(text: string, level: string): string[] {
  return text.split('\n').filter((line) => line.startsWith(`${level} `))
}

const ORDER = models.es.order

describe('acta de la ruta (FR-4206)', () => {
  it('las cuatro pruebas salen siempre, sin probar por defecto, aunque la ruta no se haya empezado', () => {
    const text = acta(EMPTY_PROGRESS)
    expect(text.startsWith('# Acta de la ruta de 10 minutos\n')).toBe(true)
    expect(headings(text, '##')).toEqual([
      '## Prueba 1. Agentes que funcionan: sin probar',
      '## Prueba 2. Problemas de negocio: sin probar',
      '## Prueba 3. Código de calidad: sin probar',
      '## Prueba 4. Entrega rápida con IA: sin probar',
    ])
    expect(text).toContain('- **Duración:** la ruta no se empezó')
    expect(text).not.toMatch(/: comprobada|: no funcionó/)
    expect(headings(text, '###')).toHaveLength(4)
  })

  it('US2: con tres estaciones marcadas y una sin probar, salen tres marcadas y una sin probar, y nada que no marcó', () => {
    let progress = startRoute(EMPTY_PROGRESS, T0, ORDER)
    progress = setMark(progress, 'agente-en-vivo', 'checked', ORDER)
    progress = setMark(progress, 'encaje-y-pitch', 'failed', ORDER)
    progress = setMark(progress, 'de-spec-a-commit', 'checked', ORDER)
    const text = acta(progress)
    expect(headings(text, '##')).toEqual([
      '## Prueba 1. Agentes que funcionan: comprobada',
      '## Prueba 2. Problemas de negocio: no funcionó',
      '## Prueba 3. Código de calidad: sin probar',
      '## Prueba 4. Entrega rápida con IA: comprobada',
    ])
    expect(headings(text, '###')).toEqual([
      '### Agente en vivo: comprobada',
      '### Encaje y pitch: no funcionó',
      '### Código real: sin probar',
      '### De spec a commit: comprobada',
    ])
  })

  it('US2: las notas salen tal cual, debajo de su estación', () => {
    const note = 'Citó /es/synergos y la traza mostró 2 herramientas.\n# No es un título\n- ni una lista *de verdad*'
    const progress = setNote(startRoute(EMPTY_PROGRESS, T0, ORDER), 'codigo-real', note)
    const text = acta(progress)
    const start = text.indexOf('### Código real')
    const end = text.indexOf('## Prueba 4')
    expect(text.slice(start, end)).toContain(`**Notas:**\n\n${note}`)
    expect(text.split(note)).toHaveLength(2)
  })

  it('la evidencia va enlazada con URL absoluta, también la de GitHub', () => {
    const text = acta(startRoute(EMPTY_PROGRESS, T0, ORDER))
    expect(text).toContain('[Abrir a Mini Cherced](https://ejemplo.test/es/ai-lab#lab-v5)')
    expect(text).toContain('[Pegar tu vacante](https://ejemplo.test/es/ai-lab#lab-a6)')
    expect(text).toContain('[El pitch de Synergos (60 s)](https://ejemplo.test/es/portfolio/12#case-pitch-12)')
    expect(text).toContain('[Abrir la spec 030](https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/specs/030-modo-entrevista/spec.md)')
    expect(text).toContain('(https://github.com/CHERCED-DEV/CHERCED-WORLD/commit/54d87c2face40b77df5e9a56c2a47e2fe3b9a73f)')
    expect(text).toContain('- **Ruta:** https://ejemplo.test/es/ai-lab/ruta')
    expect(text).not.toMatch(/\]\(\//)
  })

  it('fecha en America/Bogota y duración con el mismo clock del acta de la 030', () => {
    const done = finishRoute(startRoute(EMPTY_PROGRESS, T0, ORDER), T0 + 9 * 60_000 + 41_000)
    const text = acta(done, 'es', T0 + 60 * 60_000)
    const date = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(T0))
    expect(date).toMatch(/^26 de noviembre de 2026/)
    expect(date).toMatch(/10:00/)
    expect(text).toContain(`- **Fecha:** ${date}`)
    expect(text).toContain(`- **Duración:** ${clock(9 * 60_000 + 41_000)}`)
    expect(text).toContain('- **Duración:** 09:41')
  })

  it('cierra con la nota fija de que la marcó quien entrevista', () => {
    const text = acta(EMPTY_PROGRESS)
    expect(text.trimEnd().split('\n').at(-1)).toMatch(/^> Esta acta la marcó quien entrevista, en su navegador/)
  })

  it('las estaciones extra solo salen si se marcaron o tienen notas, y alsoProves cuenta en su otra prueba', () => {
    let progress = startRoute(EMPTY_PROGRESS, T0, ORDER)
    expect(acta(progress)).not.toContain('Diseño de sistemas en vivo')
    progress = setMark(progress, 'diseno-de-sistemas', 'checked', ORDER)
    progress = setMark(progress, 'rompelo', 'failed', ORDER)
    const text = acta(progress)
    expect(text).toContain('## Prueba 1. Agentes que funcionan: comprobada en parte')
    expect(text).toContain('### Diseño de sistemas en vivo: comprobada')
    expect(text).toContain('### Rómpelo: red team guiado: no funcionó')
    expect(text).toContain('## Prueba 3. Código de calidad: comprobada')
    expect(text).toContain('- Diseño de sistemas en vivo (estación de la prueba 1): comprobada')
  })

  it('en inglés el acta sale traducida', () => {
    const progress = setMark(startRoute(EMPTY_PROGRESS, T0, ORDER), 'codigo-real', 'checked', ORDER)
    const text = acta(progress, 'en')
    expect(text.startsWith('# 10-minute route record\n')).toBe(true)
    expect(text).toContain('## Test 3. Quality code: checked')
    expect(text).toContain('## Test 1. Agents that work: not tested')
    expect(text).toContain('https://ejemplo.test/en/ai-lab/codigo')
    expect(text).toMatch(/> This record was marked by the interviewer/)
  })

  it('el estado de una prueba sale de las marcas, nunca se inventa', () => {
    expect(proofState([])).toBe('untested')
    expect(proofState(['untested', 'untested'])).toBe('untested')
    expect(proofState(['checked', 'untested'])).toBe('checked')
    expect(proofState(['failed'])).toBe('failed')
    expect(proofState(['checked', 'failed'])).toBe('mixed')
    expect(routeActaFileName('acta-ruta-10-minutos', new Date(2026, 10, 26, 9, 5).getTime())).toBe('acta-ruta-10-minutos-20261126-0905.md')
  })
})
