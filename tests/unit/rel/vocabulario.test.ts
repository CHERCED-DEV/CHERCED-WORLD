import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SystemBlueprint } from '@/components/site/synergos/arquitectura/SystemBlueprint'
import { synergosFacts } from '@/content/synergos'
import { synergosShowcase } from '@/content/synergos-showcase'

const WORDS = {
  es: { capabilities: 'capacidades', orchestrators: 'orquestadores' },
  en: { capabilities: 'capabilities', orchestrators: 'orchestrators' },
} as const

describe('U2: el backend de Synergos se cuenta con un solo vocabulario (R1.2, desbloquea R2.4)', () => {
  for (const lang of ['es', 'en'] as const) {
    it(`${lang}: /synergos habla de capacidades y orquestadores, no de servicios API y BFF`, () => {
      const backend = synergosShowcase.copy.what.backend[lang]
      expect(backend).toContain(`{api} ${WORDS[lang].capabilities}`)
      expect(backend).toContain(`{bff} ${WORDS[lang].orchestrators}`)
      expect(backend).not.toMatch(/\bBFF\b|\bAPI\b/)
    })

    it(`${lang}: el hero de la arquitectura usa las mismas palabras y las mismas cifras`, () => {
      const html = renderToStaticMarkup(createElement(SystemBlueprint, { lang }))
      expect(html).toContain(`${synergosFacts.orchestrators} ${WORDS[lang].orchestrators} → ${synergosFacts.capabilities} ${WORDS[lang].capabilities}`)
      expect(html).not.toMatch(/\d+ BFF|\d+ API/)
    })
  }
})
