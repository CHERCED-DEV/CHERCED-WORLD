import type { RouteStation } from '@/content/ailab/route/stations'
import type { Localized } from '@/content/types'
import { GATES_STATION_ID } from '@/lib/ai/gates/export'

export const GATES_CODE_HREF = 'https://github.com/CHERCED-DEV/CHERCED-WORLD/tree/main/lib/ai/gates'

export const GATES_EVIDENCE_TEXT: Readonly<Record<'gates-revision', Localized>> = {
  'gates-revision': {
    es: 'El pedido, la recomendación con su motivo de parada y tu decisión; cuántos hallazgos hubo, cuántos tumbó el verificador y el costo; spec.md y revision.json (046).',
    en: 'The request, the recommendation with its stop reason and your decision; how many findings there were, how many the verifier knocked down and the cost; spec.md and revision.json (046).',
  },
}

export const gatesStation: RouteStation = {
  id: GATES_STATION_ID,
  proof: 4,
  alsoProves: [1],
  title: { es: 'Del pedido a la spec', en: 'From request to spec' },
  minutes: 3,
  steps: [
    {
      es: 'Abre la tarjeta y elige uno de los tres pedidos de ejemplo, o escribe el tuyo si tienes cuenta.',
      en: 'Open the card and pick one of the three sample requests, or write your own if you have an account.',
    },
    {
      es: 'Mira los pasos: el redactor, los chequeos deterministas, dos revisores que nunca son del proveedor del redactor, el verificador y la corrección, cada uno con su proveedor, tokens, tiempo y costo.',
      en: 'Watch the steps: the writer, the deterministic checks, two reviewers that are never from the writer’s provider, the verifier and the fix, each with its provider, tokens, time and cost.',
    },
    {
      es: 'Abre un hallazgo tachado por el verificador y lee por qué se cayó.',
      en: 'Open a finding the verifier struck through and read why it fell.',
    },
    {
      es: 'Decide: aprobar, pedir cambios o rechazar. Descarga spec.md y revision.json y súmalo al acta; el código está en lib/ai/gates/.',
      en: 'Decide: approve, request changes or reject. Download spec.md and revision.json and add it to the record; the code lives in lib/ai/gates/.',
    },
  ],
  href: '/ai-lab#lab-a12',
  evidence: ['gates-revision', 'github-lines'],
  spec: '046',
}
