import { z } from 'zod'
import type { PaidProviderId, ProviderAttempt, ProviderId } from '@/lib/ai/providers/types'

export const GATE_SCHEMA_VERSION = 1

export const REQUEST_MAX = 600

export const REQUEST_MIN = 12

export const COMMENT_MAX = 300

export const REVIEW_MAX_FINDINGS = 8

export const R_ID = /^R-\d{1,2}$/

export const C_ID = /^C-\d{1,2}$/

export const Q_ID = /^Q-\d{1,2}$/

export const FINDING_ID = /^H-\d{1,3}$/

export const SECTION_PLACES = ['title', 'problem', 'includes', 'excludes'] as const

export type SectionPlace = (typeof SECTION_PLACES)[number]

export const WHERE = /^(R-\d{1,2}|C-\d{1,2}|Q-\d{1,2}|title|problem|includes|excludes)$/

export const SPEC_LIMITS = {
  title: 120,
  problem: 600,
  item: 200,
  requirement: 300,
  clause: 200,
  question: 200,
  findingText: 300,
  reason: 300,
} as const

const rId = z.string().regex(R_ID)

export const specBreve = z.object({
  title: z.string().min(3).max(SPEC_LIMITS.title),
  problem: z.string().min(10).max(SPEC_LIMITS.problem),
  includes: z.array(z.string().max(SPEC_LIMITS.item)).min(1).max(8),
  excludes: z.array(z.string().max(SPEC_LIMITS.item)).min(1).max(8),
  requirements: z.array(z.object({ id: rId, text: z.string().max(SPEC_LIMITS.requirement) })).min(1).max(12),
  criteria: z
    .array(
      z.object({
        id: z.string().regex(C_ID),
        covers: z.array(rId).min(1),
        given: z.string().max(SPEC_LIMITS.clause),
        when: z.string().max(SPEC_LIMITS.clause),
        then: z.string().max(SPEC_LIMITS.clause),
      }),
    )
    .min(1)
    .max(16),
  questions: z.array(z.object({ id: z.string().regex(Q_ID), question: z.string().max(SPEC_LIMITS.question), byDefault: z.string().max(SPEC_LIMITS.question) })).max(6),
})

export type SpecBreve = z.infer<typeof specBreve>

export const RUBRIC_CRITERIA = ['verificable', 'acotada', 'completa', 'clara', 'honesta'] as const

export type RubricCriterion = (typeof RUBRIC_CRITERIA)[number]

export const GRAVITIES = ['bloqueante', 'importante', 'menor'] as const

export type Gravity = (typeof GRAVITIES)[number]

export const reviewFinding = z.object({
  criterion: z.enum(RUBRIC_CRITERIA),
  gravity: z.enum(GRAVITIES),
  where: z.string().regex(WHERE),
  problem: z.string().max(SPEC_LIMITS.findingText),
  fix: z.string().max(SPEC_LIMITS.findingText),
  confidence: z.number().min(0).max(1),
})

export type ReviewFinding = z.infer<typeof reviewFinding>

export const WRITER_KINDS = ['funcionalidad', 'no-es-software'] as const

export type WriterKind = (typeof WRITER_KINDS)[number]

const wireSpec = z.object({
  title: z.string().describe(`Título corto, de ${SPEC_LIMITS.title} caracteres o menos`),
  problem: z.string().describe(`El problema en una o dos frases, ${SPEC_LIMITS.problem} caracteres o menos`),
  includes: z.array(z.string()).min(1).max(8).describe('Lo que incluye, de 1 a 8 frases cortas'),
  excludes: z.array(z.string()).min(1).max(8).describe('Lo que no incluye, de 1 a 8 frases cortas: al menos una'),
  requirements: z
    .array(z.object({ id: z.string().regex(R_ID).describe('R-1, R-2…'), text: z.string() }))
    .min(1)
    .max(12),
  criteria: z
    .array(
      z.object({
        id: z.string().regex(C_ID).describe('C-1, C-2…'),
        covers: z.array(z.string().regex(R_ID)).min(1).describe('Los R-n que cubre este criterio'),
        given: z.string(),
        when: z.string(),
        then: z.string(),
      }),
    )
    .min(1)
    .max(16),
  questions: z
    .array(z.object({ id: z.string().regex(Q_ID).describe('Q-1, Q-2…'), question: z.string(), byDefault: z.string().describe('Lo que se hace si nadie responde') }))
    .max(6),
})

export const writerReplyWire = z.object({
  kind: z.enum(WRITER_KINDS).describe('funcionalidad si el pedido es software; no-es-software si no lo es'),
  spec: wireSpec,
})

export type WriterReplyWire = z.infer<typeof writerReplyWire>

export const reviewReplyWire = z.object({
  findings: z
    .array(
      z.object({
        criterion: z.enum(RUBRIC_CRITERIA),
        gravity: z.enum(GRAVITIES),
        where: z.string().regex(WHERE).describe('R-n, C-n, Q-n, title, problem, includes o excludes'),
        problem: z.string(),
        fix: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(REVIEW_MAX_FINDINGS),
})

export type ReviewReplyWire = z.infer<typeof reviewReplyWire>

export const VERIFICATIONS = ['se-sostiene', 'se-cae', 'no-se-sabe'] as const

export type Verification = (typeof VERIFICATIONS)[number]

export const verifierReplyWire = z.object({
  verdicts: z
    .array(z.object({ id: z.string().regex(FINDING_ID).describe('El id del hallazgo, como H-1'), result: z.enum(VERIFICATIONS), reason: z.string() }))
    .max(24),
})

export type VerifierReplyWire = z.infer<typeof verifierReplyWire>

export const RECOMMENDATIONS = ['lista', 'con-reservas', 'no-lista'] as const

export type Recommendation = (typeof RECOMMENDATIONS)[number]

export const STOP_REASONS = [
  'limpia',
  'dos-rondas',
  'empeoro',
  'tope-corrida',
  'sin-presupuesto',
  'revision-no-disponible',
  'no-es-software',
  'sin-tiempo',
  'ronda-pedida',
] as const

export type StopReason = (typeof STOP_REASONS)[number]

export const STEP_KINDS = ['redactar', 'chequear', 'revisar', 'verificar', 'corregir'] as const

export type StepKind = (typeof STEP_KINDS)[number]

export const GATE_ROUNDS = [1, 2, 3] as const

export type GateRoundNumber = (typeof GATE_ROUNDS)[number]

export const FINDING_ORIGINS = ['determinista', 'revisor'] as const

export type FindingOrigin = (typeof FINDING_ORIGINS)[number]

export type FindingReporter = {
  seat: PaidProviderId
  provider: ProviderId
  gravity: Gravity
  confidence: number
  problem: string
  fix: string
}

export type FindingVerification = { result: Verification; reason: string; seat: PaidProviderId | null; provider: ProviderId | null }

export type MergedFinding = {
  id: string
  criterion: RubricCriterion
  gravity: Gravity
  where: string
  problem: string
  fix: string
  confidence: number
  origin: FindingOrigin
  rules: string[]
  reporters: FindingReporter[]
  seenByBoth: boolean
  verification: FindingVerification | null
  carried: boolean
}

export type GateStep = {
  kind: StepKind
  round: GateRoundNumber
  provider: ProviderId | 'deterministic'
  seat: PaidProviderId | null
  model: string | null
  attempts: ProviderAttempt[]
  inputTokens: number
  outputTokens: number
  latencyMs: number
  costUsd: number
  status: 'ok' | 'error'
  count: number
  ids: string[]
  reason: string | null
}

export const NOTE_KINDS = [
  'lugar-inexistente',
  'fuera-de-cambio',
  'revisor-caido',
  'un-revisor',
  'sin-verificador',
  'verificador-caido',
  'sin-veredicto',
  'recortado',
  'esquema-reintento',
  'correccion-gratis',
  'corte',
] as const

export type NoteKind = (typeof NOTE_KINDS)[number]

export type GateNote = { round: GateRoundNumber; kind: NoteKind; seat: PaidProviderId | null; where: string | null; detail: string | null }

export type GateRound = {
  round: GateRoundNumber
  spec: SpecBreve
  draft: SpecBreve | null
  findings: MergedFinding[]
  reviewed: boolean
  reviewers: PaidProviderId[]
  changed: string[] | null
  comment: string | null
}

export const REQUEST_SOURCES = ['ejemplo', 'propio'] as const

export type GateLang = 'es' | 'en'

export type GateRequest = { text: string; lang: GateLang; source: (typeof REQUEST_SOURCES)[number]; exampleId: string | null }

export const RUN_MODES = ['grabada', 'vivo'] as const

export type GateRunMode = (typeof RUN_MODES)[number]

export type GateRun = {
  schemaVersion: typeof GATE_SCHEMA_VERSION
  id: string
  at: string
  mode: GateRunMode
  simulated: boolean
  rubricVersion: string
  request: GateRequest
  writer: { seat: PaidProviderId; provider: ProviderId }
  rounds: GateRound[]
  steps: GateStep[]
  notes: GateNote[]
  recommendation: Recommendation
  stop: StopReason
  totalUsd: number
  totalCop: number
  capUsd: number
  copRate: { value: number; date: string }
  pricesCheckedAt: Record<PaidProviderId, string>
  seal: string | null
}

export const DECISIONS = ['aprobar', 'pedir-cambios', 'rechazar'] as const

export type DecisionKind = (typeof DECISIONS)[number]

export type GateDecision = { decision: DecisionKind; comment: string | null; at: string }

export type GateRevision = Omit<GateRun, 'seal'> & { decision: GateDecision }

const paid = z.enum(['gemini', 'claude', 'openai'])

const provider = z.enum(['gemini', 'claude', 'openai', 'simulator'])

const usage = z.object({ inputTokens: z.number().int().min(0), outputTokens: z.number().int().min(0) })

const attemptSchema = z.object({
  provider,
  requestedModel: z.string(),
  model: z.string().nullable(),
  outcome: z.enum(['ok', 'error', 'refusal', 'invalid', 'skipped']),
  reason: z.string().max(400).nullable(),
  latencyMs: z.number().min(0),
  usage: usage.nullable(),
  costUsd: z.number().min(0),
})

const round = z.union([z.literal(1), z.literal(2), z.literal(3)])

const stepSchema = z.object({
  kind: z.enum(STEP_KINDS),
  round,
  provider: z.union([provider, z.literal('deterministic')]),
  seat: paid.nullable(),
  model: z.string().nullable(),
  attempts: z.array(attemptSchema),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  latencyMs: z.number().min(0),
  costUsd: z.number().min(0),
  status: z.enum(['ok', 'error']),
  count: z.number().int().min(0),
  ids: z.array(z.string().max(20)).max(64),
  reason: z.string().max(400).nullable(),
})

const reporterSchema = z.object({
  seat: paid,
  provider,
  gravity: z.enum(GRAVITIES),
  confidence: z.number().min(0).max(1),
  problem: z.string().max(SPEC_LIMITS.findingText),
  fix: z.string().max(SPEC_LIMITS.findingText),
})

const findingSchema = z.object({
  id: z.string().regex(FINDING_ID),
  criterion: z.enum(RUBRIC_CRITERIA),
  gravity: z.enum(GRAVITIES),
  where: z.string().regex(WHERE),
  problem: z.string().max(600),
  fix: z.string().max(600),
  confidence: z.number().min(0).max(1),
  origin: z.enum(FINDING_ORIGINS),
  rules: z.array(z.string().max(80)).max(16),
  reporters: z.array(reporterSchema).max(4),
  seenByBoth: z.boolean(),
  verification: z.object({ result: z.enum(VERIFICATIONS), reason: z.string().max(SPEC_LIMITS.reason), seat: paid.nullable(), provider: provider.nullable() }).nullable(),
  carried: z.boolean(),
})

const noteSchema = z.object({
  round,
  kind: z.enum(NOTE_KINDS),
  seat: paid.nullable(),
  where: z.string().max(20).nullable(),
  detail: z.string().max(400).nullable(),
})

const roundSchema = z.object({
  round,
  spec: specBreve,
  draft: specBreve.nullable(),
  findings: z.array(findingSchema).max(48),
  reviewed: z.boolean(),
  reviewers: z.array(paid).max(2),
  changed: z.array(z.string().regex(WHERE)).max(48).nullable(),
  comment: z.string().max(COMMENT_MAX).nullable(),
})

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const gateRunShape = {
  schemaVersion: z.literal(GATE_SCHEMA_VERSION),
  id: z.string().min(1).max(80),
  at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'fecha inválida'),
  mode: z.enum(RUN_MODES),
  simulated: z.boolean(),
  rubricVersion: z.string().min(1).max(20),
  request: z.object({ text: z.string().min(1).max(REQUEST_MAX), lang: z.enum(['es', 'en']), source: z.enum(REQUEST_SOURCES), exampleId: z.string().max(40).nullable() }),
  writer: z.object({ seat: paid, provider }),
  rounds: z.array(roundSchema).min(1).max(3),
  steps: z.array(stepSchema).max(80),
  notes: z.array(noteSchema).max(80),
  recommendation: z.enum(RECOMMENDATIONS),
  stop: z.enum(STOP_REASONS),
  totalUsd: z.number().min(0),
  totalCop: z.number().int().min(0),
  capUsd: z.number().positive(),
  copRate: z.object({ value: z.number().positive(), date: day }),
  pricesCheckedAt: z.object({ gemini: day, claude: day, openai: day }),
}

export const gateRunSchema = z.object({ ...gateRunShape, seal: z.string().max(128).nullable() }) satisfies z.ZodType<GateRun>

export const decisionSchema = z.object({
  decision: z.enum(DECISIONS),
  comment: z.string().max(COMMENT_MAX).nullable(),
  at: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'fecha inválida'),
}) satisfies z.ZodType<GateDecision>

export const revisionSchema = z.object({ ...gateRunShape, decision: decisionSchema }).strict() satisfies z.ZodType<GateRevision>
