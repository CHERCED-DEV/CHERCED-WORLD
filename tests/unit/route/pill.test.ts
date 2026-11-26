import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { routePillLabels } from '@/components/ailab/route/labels'
import { RouteReturnPill, RouteReturnPillView } from '@/components/ailab/route/RouteReturnPill'
import { EMPTY_PROGRESS, setActive, startRoute } from '@/lib/ailab/route/progress'
import { routeDictionary } from './support'

const T0 = Date.parse('2026-11-26T15:00:00Z')
const ORDER = ['agente-en-vivo', 'encaje-y-pitch', 'codigo-real', 'de-spec-a-commit']
const labels = { es: routePillLabels(routeDictionary('es')), en: routePillLabels(routeDictionary('en')) }

function pill(lang: 'es' | 'en', now: number) {
  const progress = setActive(startRoute(EMPTY_PROGRESS, T0, ORDER), 'agente-en-vivo')
  return renderToStaticMarkup(createElement(RouteReturnPillView, { lang, labels: labels[lang], progress, now, onClose: () => {} }))
}

describe('pastilla «Volver a la ruta» (FR-4211, P-4204)', () => {
  it('dice «Volver a la ruta» con el tiempo que queda y lleva a la estación activa', () => {
    const html = pill('es', T0 + 3 * 60_000 + 28_000)
    expect(html).toContain('Volver a la ruta')
    expect(html).toContain('(06:32)')
    expect(html).toContain('href="/es/ai-lab/ruta#estacion-agente-en-vivo"')
    expect(html).toContain('aria-label="Ruta de 10 minutos"')
  })

  it('se cierra con un botón nativo que tiene nombre, y el enlace se opera con teclado', () => {
    const html = pill('es', T0)
    expect(html).toMatch(/<button type="button"[^>]*aria-label="Ocultar el acceso a la ruta"[^>]*data-cw-route-pill-close=""/)
    expect(html).toMatch(/<a [^>]*href="\/es\/ai-lab\/ruta#estacion-agente-en-vivo"/)
    expect(html).not.toContain('tabindex="-1"')
  })

  it('pasado el tiempo sigue en negativo y lo marca', () => {
    const html = pill('en', T0 + 10 * 60_000 + 83_000)
    expect(html).toContain('Back to the route')
    expect(html).toContain('(−01:23)')
    expect(html).toContain('data-over=""')
    expect(html).toContain('href="/en/ai-lab/ruta#estacion-agente-en-vivo"')
  })

  it('US4: sin una ruta activa en la pestaña no pinta nada', () => {
    expect(renderToStaticMarkup(createElement(RouteReturnPill, { lang: 'es', labels: labels.es }))).toBe('')
  })
})
