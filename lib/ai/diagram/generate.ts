import 'server-only'
import { diagramSchemaWith, NODE_KINDS, SIMULATOR_DIAGRAM, type Diagram } from '@/lib/ai/agent/design'
import { generateJson } from '@/lib/ai/generate'
import { GEMINI_MODELS } from '@/lib/ai/models'
import type { Locale } from '@/lib/i18n/config'

export const TEXT_DIAGRAM_MAX_NODES = 40

export const DIAGRAM_PROMPT_MAX = 600

export const textDiagramSchema = diagramSchemaWith(TEXT_DIAGRAM_MAX_NODES)

const NODE = {
  type: 'OBJECT',
  properties: { id: { type: 'STRING' }, etiqueta: { type: 'STRING' }, tipo: { type: 'STRING', enum: [...NODE_KINDS] } },
  required: ['id', 'etiqueta', 'tipo'],
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    nodos: { type: 'ARRAY', items: NODE },
    conexiones: { type: 'ARRAY', items: { type: 'OBJECT', properties: { de: { type: 'STRING' }, a: { type: 'STRING' }, etiqueta: { type: 'STRING' } }, required: ['de', 'a'] } },
    grupos: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, etiqueta: { type: 'STRING' }, nodos: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['id', 'etiqueta', 'nodos'] },
    },
  },
  required: ['nodos', 'conexiones', 'grupos'],
}

export async function generateDiagram(input: { key: string; lang: Locale; prompt: string; current: Diagram | null }, fetcher: typeof fetch = fetch): Promise<Diagram> {
  const language = input.lang === 'es' ? 'español' : 'inglés'
  const base = input.current ? `Diagrama actual (JSON):\n${JSON.stringify(input.current)}\n\nCambio pedido: ${input.prompt}\nDevuelve el diagrama completo con el cambio aplicado.` : `Describe esta arquitectura como diagrama: ${input.prompt}`
  const reply = await generateJson(
    {
      key: input.key,
      model: GEMINI_MODELS.text,
      system: `Conviertes descripciones de arquitectura de software en diagramas. Etiquetas cortas en ${language}. Tipos: cliente, servicio, datos, cola, cache o externo. Máximo ${TEXT_DIAGRAM_MAX_NODES} nodos y 5 grupos. Las conexiones van en el sentido en que viaja la petición o el evento. Ids cortos en minúscula y sin espacios.`,
      prompt: base,
      schema: SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 2500,
    },
    fetcher,
  )
  return textDiagramSchema.parse(JSON.parse(reply.text || '{}'))
}

export function simulateDiagram(current: Diagram | null): Diagram {
  if (!current) return SIMULATOR_DIAGRAM
  const id = `nuevo${current.nodos.length + 1}`
  return { ...current, nodos: [...current.nodos, { id, etiqueta: 'Caché nueva', tipo: 'cache' }], conexiones: [...current.conexiones, { de: current.nodos[0]!.id, a: id }] }
}
