import type { RouteStation } from '@/content/ailab/route/stations'
import type { Localized } from '@/content/types'

export const ARENA_PORT_HREF = 'https://github.com/CHERCED-DEV/CHERCED-WORLD/tree/main/lib/ai/providers'

export const ARENA_EVIDENCE_TEXT: Readonly<Record<'arena-comparison', Localized>> = {
  'arena-comparison': {
    es: 'La tarea, el proveedor más barato que pasó las reglas, la nota del juez, el costo y el JSON de la comparación (043).',
    en: 'The task, the cheapest provider that passed the rules, the judge’s grade, the cost and the comparison JSON (043).',
  },
}

export const arenaStation: RouteStation = {
  id: 'arena',
  proof: 1,
  alsoProves: [3],
  title: { es: 'Arena de modelos', en: 'Model arena' },
  minutes: 2,
  steps: [
    {
      es: 'Abre la arena y elige una tarea fija: la misma tarea resuelta por Gemini, Claude y OpenAI, con su latencia, sus tokens, su costo y la nota de un juez de otro proveedor.',
      en: 'Open the arena and pick a fixed task: the same task solved by Gemini, Claude and OpenAI, with its latency, tokens, cost and the grade of a judge from another provider.',
    },
    {
      es: 'Compara las tres columnas y abre la caja de cristal de una: los intentos, el modelo que de verdad respondió y lo que costó. Exporta la comparación en JSON.',
      en: 'Compare the three columns and open the glass box of one: the attempts, the model that really answered and what it cost. Export the comparison as JSON.',
    },
    {
      es: 'Si tienes cuenta, corre una en vivo. Antes de llamar a nadie, el puerto reserva el costo en un libro mensual con techo de 25 USD; su código está en lib/ai/providers/.',
      en: 'If you have an account, run one live. Before calling anyone, the port reserves the cost in a monthly ledger capped at 25 USD; its code lives in lib/ai/providers/.',
    },
  ],
  href: '/ai-lab#lab-a10',
  evidence: ['arena-comparison', 'github-lines'],
  spec: '043',
}
