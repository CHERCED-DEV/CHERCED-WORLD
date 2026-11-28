import { z } from 'zod'
import type { ArenaKind } from './tasks'

export const extractionSchema = z.object({
  role: z.string().describe('El cargo tal como lo nombra la vacante'),
  workMode: z.enum(['remote', 'hybrid', 'onsite', 'not_stated']),
  requirements: z.array(z.object({ text: z.string(), kind: z.enum(['required', 'nice_to_have']) })),
})

export const citationSchema = z.object({
  answer: z.string(),
  citations: z.array(z.string()).describe('Ids de los fragmentos usados, como f1'),
  enough: z.boolean().describe('Si los fragmentos alcanzan para responder'),
})

export const injectionSchema = z.object({
  summary: z.string(),
  suspiciousInstructions: z.boolean().describe('Si el documento trae instrucciones dirigidas al asistente'),
  nextSteps: z.array(z.string()),
})

export const CLASSIFICATION_IDS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'] as const

export const CLASSIFICATION_CATEGORIES = ['order', 'complaint', 'question', 'spam'] as const

export const classificationSchema = z.object({
  messages: z.array(z.object({ id: z.enum(CLASSIFICATION_IDS), category: z.enum(CLASSIFICATION_CATEGORIES) })),
})

export const summarySchema = z.object({
  summary: z.string(),
  figures: z.array(z.string()).describe('Las cifras que usaste, copiadas del texto'),
})

export const translationSchema = z.object({
  translation: z.string(),
  keptTerms: z.array(z.string()).describe('Los términos técnicos que dejaste sin traducir'),
})

export const freeSchema = z.object({ answer: z.string() })

export const ARENA_SCHEMAS = {
  extraction: extractionSchema,
  citation: citationSchema,
  injection: injectionSchema,
  classification: classificationSchema,
  summary: summarySchema,
  translation: translationSchema,
} as const satisfies Record<ArenaKind, z.ZodType<unknown>>

export function arenaSchema(kind: ArenaKind): z.ZodType<unknown> {
  return ARENA_SCHEMAS[kind]
}
