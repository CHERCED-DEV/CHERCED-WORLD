import 'server-only'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { usageCost } from '@/lib/ai/agent/usage'
import { generateJson } from '@/lib/ai/generate'
import { LAB_END_REASONS, LAB_INTENTS, type LabRepo, type LabSessionRecord, type LabSummary, type LabTurn } from '@/lib/data/types'

export const LAB_CONSENT_VERSION = '2026-11-15'

export const LAB_RETENTION_DAYS = 90

export const LAB_TURNS_MAX = 40

export const LAB_TURN_CHARS = 600

export const LAB_SUMMARY_MODEL = 'gemini-3.8-flash'

const DAY = 24 * 60 * 60 * 1000

export const labSessionInput = z.object({
  lang: z.enum(['es', 'en']),
  mode: z.enum(['live', 'local']),
  interview: z.string().max(20).nullable().optional(),
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive(),
  endReason: z.enum(LAB_END_REASONS),
  turns: z
    .array(z.object({ who: z.enum(['you', 'agent']), text: z.string().trim().min(1).max(LAB_TURN_CHARS) }))
    .min(1)
    .max(LAB_TURNS_MAX),
  trace: z
    .object({
      turns: z.number().int().min(0).max(500),
      latencyP50: z.number().nonnegative().nullable(),
      latencyP95: z.number().nonnegative().nullable(),
      tokens: z.number().int().min(0),
      costUsd: z.number().min(0).max(5),
      tools: z.array(z.string().max(40)).max(60),
    })
    .nullable()
    .optional(),
})

export type LabSessionInput = z.infer<typeof labSessionInput>

export function labRecordFrom(input: LabSessionInput, accountId: string, now: Date, id: string = randomUUID()): LabSessionRecord {
  const endedAt = Math.min(input.endedAt, now.getTime())
  const startedAt = Math.min(input.startedAt, endedAt)
  return {
    id,
    accountId,
    experiment: 'V5',
    lang: input.lang,
    mode: input.mode,
    interview: input.interview ?? null,
    startedAt: new Date(startedAt),
    endedAt: new Date(endedAt),
    endReason: input.endReason,
    turns: input.turns.map((turn) => ({ who: turn.who, text: turn.text })),
    trace: input.trace ?? null,
    summary: null,
    createdAt: new Date(now),
    expiresAt: new Date(now.getTime() + LAB_RETENTION_DAYS * DAY),
  }
}

export async function hasLabConsent(repo: LabRepo, accountId: string): Promise<boolean> {
  const consent = await repo.getConsent(accountId)
  return Boolean(consent && !consent.revokedAt)
}

const SUMMARY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    points: { type: 'ARRAY', items: { type: 'STRING' }, description: 'De 3 a 5 puntos clave de la conversación, en español, cada uno de una frase.' },
    intent: { type: 'STRING', enum: [...LAB_INTENTS], description: 'Quién parece ser el visitante.' },
    topic: { type: 'STRING', description: 'El tema que más le interesó, en pocas palabras.' },
    unanswered: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Preguntas del visitante que Mini Cherced no supo responder o esquivó porque no estaban en el sitio. Vacío si respondió todo.',
    },
  },
  required: ['points', 'intent', 'topic', 'unanswered'],
} as const

const summaryReply = z.object({
  points: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  intent: z.enum(LAB_INTENTS),
  topic: z.string().trim().max(120),
  unanswered: z.array(z.string().trim().min(1).max(300)).max(10),
})

export function transcriptText(turns: readonly LabTurn[]): string {
  return turns.map((turn) => `${turn.who === 'you' ? 'Visitante' : 'Mini Cherced'}: ${turn.text}`).join('\n')
}

export async function summarizeConversation(key: string, turns: readonly LabTurn[], now: Date, fetcher: typeof fetch = fetch): Promise<LabSummary | null> {
  const reply = await generateJson(
    {
      key,
      model: LAB_SUMMARY_MODEL,
      system:
        'Resumes conversaciones entre un visitante y Mini Cherced, el agente del portafolio de Camilo. Solo usas lo que dice la transcripción, sin inventar. Escribe en español.',
      prompt: transcriptText(turns),
      schema: SUMMARY_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 600,
    },
    fetcher,
  )
  const parsed = summaryReply.safeParse(JSON.parse(reply.text || '{}'))
  if (!parsed.success) return null
  return { ...parsed.data, model: LAB_SUMMARY_MODEL, costUsd: usageCost(LAB_SUMMARY_MODEL, reply.usage), createdAt: new Date(now) }
}

export type UnansweredGroup = { question: string; count: number; lastAt: Date }

export function groupUnanswered(records: readonly LabSessionRecord[]): UnansweredGroup[] {
  const groups = new Map<string, UnansweredGroup>()
  for (const record of records)
    for (const question of record.summary?.unanswered ?? []) {
      const key = question
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
      if (!key) continue
      const current = groups.get(key)
      if (current) {
        current.count += 1
        if (record.createdAt > current.lastAt) current.lastAt = record.createdAt
      } else groups.set(key, { question, count: 1, lastAt: record.createdAt })
    }
  return [...groups.values()].sort((a, b) => b.count - a.count || b.lastAt.getTime() - a.lastAt.getTime())
}
