import 'server-only'
import { NEW_PIECE, uiPieces } from '@/content/ailab/ui-pieces'
import { generateJson } from '@/lib/ai/generate'
import { GEMINI_MODELS } from '@/lib/ai/models'
import type { Locale } from '@/lib/i18n/config'
import { SHOT_GRID, SHOT_MAX_NODES, shotSchema, type ShotResult } from './model'

const LEVEL = { primitiva: 'primitiva', composicion: 'composición', modulo: 'módulo' } as const

const BOX = { type: 'OBJECT', properties: { x: { type: 'INTEGER' }, y: { type: 'INTEGER' }, an: { type: 'INTEGER' }, al: { type: 'INTEGER' } }, required: ['x', 'y', 'an', 'al'] }

export const SHOT_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    resumen: { type: 'STRING' },
    nodos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          nombre: { type: 'STRING' },
          pieza: { type: 'STRING', enum: [...uiPieces.map((piece) => piece.id), NEW_PIECE] },
          padre: { type: 'STRING' },
          props: { type: 'STRING' },
          caja: BOX,
        },
        required: ['id', 'nombre', 'pieza', 'padre', 'props', 'caja'],
      },
    },
    huecos: { type: 'ARRAY', items: { type: 'OBJECT', properties: { que: { type: 'STRING' }, por_que: { type: 'STRING' } }, required: ['que', 'por_que'] } },
  },
  required: ['resumen', 'nodos', 'huecos'],
}

export function shotInstruction(lang: Locale): string {
  const language = lang === 'es' ? 'español' : 'inglés'
  return [
    'Miras la captura de una interfaz y propones cómo construirla con el sistema de diseño de este sitio, ordenado en capas atómicas como Synergos: primitivas, composiciones y módulos.',
    'Piezas disponibles (id, nombre, capa: qué hace):',
    ...uiPieces.map((piece) => `- ${piece.id} (${piece.name}, ${LEVEL[piece.level]}): ${piece.does.es}`),
    `Reglas: cada nodo usa el id de una pieza de la lista o "${NEW_PIECE}" si ninguna sirve. Anida con "padre" (vacío en la raíz). Máximo ${SHOT_MAX_NODES} nodos y solo las regiones que se ven.`,
    `"caja" ubica el nodo en una cuadrícula de ${SHOT_GRID} × ${SHOT_GRID} sobre la captura, en enteros: x e y arriba a la izquierda, an y al el tamaño.`,
    `"props" son las props sugeridas en una frase corta. Cada nodo "${NEW_PIECE}" lleva su hueco en "huecos": qué falta y por qué no alcanza ninguna pieza.`,
    `Ids cortos en minúscula, sin espacios. Nombres, props, resumen y huecos en ${language}. Si la imagen no es una interfaz, dilo en el resumen y devuelve un solo nodo "${NEW_PIECE}".`,
  ].join('\n')
}

export async function analyzeShot(
  input: { key: string; lang: Locale; image: { mimeType: string; data: string } },
  fetcher: typeof fetch = fetch,
): Promise<ShotResult> {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const reply = await generateJson(
      {
        key: input.key,
        model: GEMINI_MODELS.text,
        system: shotInstruction(input.lang),
        prompt:
          attempt === 0
            ? 'Propón el árbol de componentes de esta captura.'
            : 'Propón el árbol de componentes de esta captura. Revisa que cada padre exista y que los ids no se repitan.',
        schema: SHOT_RESPONSE_SCHEMA,
        images: [input.image],
        temperature: 0.2,
        maxOutputTokens: 3000,
      },
      fetcher,
    )
    try {
      return shotSchema.parse(JSON.parse(reply.text || '{}'))
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('respuesta inválida')
}
