import { z } from 'zod'
import { evidenceOf, type EvidenceCatalog } from './catalog'
import {
  coverageOf,
  MATCH_KINDS,
  MATCH_LEVELS,
  MATCH_MAX_EVIDENCE,
  MATCH_MAX_REQUIREMENTS,
  MATCH_QUESTIONS,
  MATCH_ROLE_MAX,
  MATCH_TEXT_MAX,
  type MatchEvidence,
  type MatchKind,
  type MatchLevel,
  type MatchRequirement,
  type MatchResult,
} from './config'

export const MATCH_OUTPUT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    rol: { type: 'STRING', description: 'Nombre corto del cargo de la vacante.' },
    requisitos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          texto: { type: 'STRING', description: 'El requisito, en pocas palabras y en el idioma de la vacante.' },
          tipo: { type: 'STRING', enum: [...MATCH_KINDS] },
          nivel: { type: 'STRING', enum: [...MATCH_LEVELS] },
          evidencia: { type: 'ARRAY', items: { type: 'STRING', description: 'Un id exacto del catálogo, entre corchetes en el catálogo pero sin ellos aquí.' } },
          nota: { type: 'STRING', description: 'Una frase que explica el nivel, en el idioma de la vacante.' },
        },
        required: ['texto', 'tipo', 'nivel', 'evidencia', 'nota'],
      },
    },
    preguntas: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['rol', 'requisitos', 'preguntas'],
} as const

const modelOutput = z.object({
  rol: z.string().catch(''),
  requisitos: z.array(
    z.object({
      texto: z.string(),
      tipo: z.string().catch('obligatorio'),
      nivel: z.string().catch('sin_evidencia'),
      evidencia: z.array(z.unknown()).catch([]),
      nota: z.string().catch(''),
    }),
  ),
  preguntas: z.array(z.unknown()).catch([]),
})

export type ModelMatch = z.infer<typeof modelOutput>

export class MatchOutputError extends Error {}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

function kindOf(value: string): MatchKind {
  return (MATCH_KINDS as readonly string[]).includes(value) ? (value as MatchKind) : 'obligatorio'
}

function levelOf(value: string): MatchLevel {
  return (MATCH_LEVELS as readonly string[]).includes(value) ? (value as MatchLevel) : 'sin_evidencia'
}

function normalized(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function parseModelMatch(raw: unknown): ModelMatch {
  let value = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      throw new MatchOutputError('La respuesta no es JSON')
    }
  }
  const parsed = modelOutput.safeParse(value)
  if (!parsed.success) throw new MatchOutputError('La respuesta no sigue el esquema')
  if (parsed.data.requisitos.length === 0) throw new MatchOutputError('La respuesta no trae requisitos')
  return parsed.data
}

export function sanitizeMatch(output: ModelMatch, catalog: EvidenceCatalog, mode: MatchResult['mode'], costUsd = 0): MatchResult {
  let dropped = 0
  const seen = new Set<string>()
  const requirements: MatchRequirement[] = []
  for (const item of output.requisitos) {
    const text = clip(item.texto, MATCH_TEXT_MAX)
    const key = normalized(text)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const evidence: MatchEvidence[] = []
    for (const id of item.evidencia) {
      const found = typeof id === 'string' ? evidenceOf(catalog, id.replace(/^\[|\]$/g, '')) : null
      if (!found) {
        dropped += 1
        continue
      }
      if (!evidence.some((entry) => entry.id === found.id) && evidence.length < MATCH_MAX_EVIDENCE) evidence.push(found)
    }
    const claimed = levelOf(item.nivel)
    const level: MatchLevel = evidence.length === 0 ? 'sin_evidencia' : claimed
    requirements.push({
      text,
      kind: kindOf(item.tipo),
      level,
      evidence: level === 'sin_evidencia' ? [] : evidence,
      note: clip(item.nota, MATCH_TEXT_MAX),
    })
    if (requirements.length === MATCH_MAX_REQUIREMENTS) break
  }
  if (requirements.length === 0) throw new MatchOutputError('Ningún requisito quedó después de limpiar')
  const questions = output.preguntas
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => clip(value, MATCH_TEXT_MAX))
    .slice(0, MATCH_QUESTIONS)
  return {
    mode,
    role: clip(output.rol, MATCH_ROLE_MAX),
    requirements,
    questions,
    coverage: coverageOf(requirements),
    dropped,
    costUsd,
  }
}
