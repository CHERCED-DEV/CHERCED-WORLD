import 'server-only'
import { RUBRIC_VERSION } from '@/content/ailab/gates/rubric'
import { PRICE_SOURCES, USD_TO_COP, USD_TO_COP_DATE } from '@/lib/ai/pricing'
import { roundUsd } from '@/lib/ai/providers/cost'
import type { Port } from '@/lib/ai/providers/port'
import { safeReason } from '@/lib/ai/providers/redact'
import {
  BudgetExhaustedError,
  BudgetUnavailableError,
  PAID_PROVIDERS,
  ProviderRequestError,
  ProvidersUnavailableError,
  type GenerateJsonInput,
  type GenerateJsonResult,
  type PaidProviderId,
  type ProviderAttempt,
  type ProviderId,
  type TokenUsage,
} from '@/lib/ai/providers/types'
import { checkLines, runChecks, type CheckResult, type CotejoCore } from './checks'
import { changedPlaces } from './markdown'
import { blockers, mergeFindings, minors, toFix, type DeterministicFinding, type ReviewBatch } from './merge'
import { correctionPrompt, reviewerPrompt, reviewerSystem, verifierPrompt, verifierSystem, writerPrompt, writerSystem } from './prompts'
import {
  isPaid,
  needsVerification,
  pickReviewers,
  pickVerifier,
  pickWriter,
  reportersOf,
  REVIEWER_TASK,
  seatsFrom,
  seatUsd,
  STEP_ESTIMATES,
  VERIFIER_TASK,
  WRITER_TASK,
} from './providers'
import {
  GATE_SCHEMA_VERSION,
  reviewReplyWire,
  SPEC_LIMITS,
  specBreve,
  verifierReplyWire,
  writerReplyWire,
  type FindingVerification,
  type GateNote,
  type GateRequest,
  type GateRound,
  type GateRoundNumber,
  type GateRun,
  type GateRunMode,
  type GateStep,
  type MergedFinding,
  type ReviewReplyWire,
  type SpecBreve,
  type StepKind,
  type StopReason,
  type WriterKind,
  type WriterReplyWire,
} from './schema'
import { gateSimulator, type GateSimulator } from './simulator'
import { GATE_RUN_CAP_USD, overCap, recommendRun, shouldStop } from './stop'
import { canRequestChanges } from './view'

export { needsVerification, pickReviewers } from './providers'
export { recommend, shouldStop } from './stop'
export { canRequestChanges } from './view'

export type GatePort = Pick<Port, 'generateJson' | 'availableProviders' | 'providersMode' | 'assertMonthlyBudget'>

export type GateDeps = {
  port: GatePort
  core: CotejoCore
  onStep?: (step: GateStep) => void
  onNote?: (note: GateNote) => void
  now?: () => Date
  clock?: () => number
  deadlineAt?: number | null
  mode?: GateRunMode
  simulator?: GateSimulator
}

export const GATE_ERROR_CODES = ['off', 'writer', 'budget', 'budget_unavailable', 'invalid_run'] as const

export type GateErrorCode = (typeof GATE_ERROR_CODES)[number]

export class GateError extends Error {
  constructor(
    readonly code: GateErrorCode,
    readonly steps: GateStep[] = [],
    message = `La corrida no pudo seguir: ${code}`,
  ) {
    super(message)
    this.name = 'GateError'
  }
}

export const PHASE_BUDGET_MS = { revisar: 20_000, verificar: 8_000, ronda: 30_000 } as const

const SYNTHETIC = {
  es: {
    noVerifier: 'No había un verificador de otro proveedor: el hallazgo queda en pie.',
    noVerdict: 'El verificador no dio veredicto sobre este hallazgo: queda en pie.',
    verifierDown: 'El verificador no respondió: el hallazgo queda en pie.',
    selfVerifier: 'Respondió el mismo proveedor que reportó el hallazgo: se descarta el veredicto y el hallazgo queda en pie.',
    selfReviewer: 'Respondió el proveedor del redactor: la revisión se descarta.',
    outOfTime: 'Sin tiempo para verificar antes del límite de la función: los hallazgos quedan en pie.',
    strict: 'La spec no cumplió el contrato dos veces.',
  },
  en: {
    noVerifier: 'There was no verifier from another provider: the finding stands.',
    noVerdict: 'The verifier gave no verdict on this finding: it stands.',
    verifierDown: 'The verifier did not answer: the finding stands.',
    selfVerifier: 'The same provider that reported the finding answered: the verdict is discarded and the finding stands.',
    selfReviewer: 'The writer’s provider answered: the review is discarded.',
    outOfTime: 'No time to verify before the function limit: the findings stand.',
    strict: 'The spec did not meet the contract twice.',
  },
} as const

type Ctx = {
  deps: GateDeps
  request: GateRequest
  live: boolean
  simulated: boolean
  seats: PaidProviderId[]
  writer: { seat: PaidProviderId; provider: ProviderId }
  steps: GateStep[]
  notes: GateNote[]
  rounds: GateRound[]
  sim: GateSimulator
}

type Called<T> = { ok: true; result: GenerateJsonResult<T> } | { ok: false; error: unknown; attempts: ProviderAttempt[] }

function clock(ctx: Ctx): number {
  return (ctx.deps.clock ?? (() => performance.now()))()
}

function spent(ctx: Ctx): number {
  return roundUsd(ctx.steps.reduce((sum, step) => sum + step.costUsd, 0))
}

function addStep(ctx: Ctx, step: GateStep): void {
  ctx.steps.push(step)
  ctx.deps.onStep?.(step)
}

function addNote(ctx: Ctx, note: Omit<GateNote, 'detail' | 'seat' | 'where'> & Partial<Pick<GateNote, 'detail' | 'seat' | 'where'>>): void {
  const full: GateNote = { seat: null, where: null, ...note, detail: note.detail ? safeReason(note.detail, 380) : null }
  ctx.notes.push(full)
  ctx.deps.onNote?.(full)
}

function deadlineSoon(ctx: Ctx, ms: number): boolean {
  const deadline = ctx.deps.deadlineAt
  return typeof deadline === 'number' && clock(ctx) + ms > deadline
}

function usageOf(attempts: readonly ProviderAttempt[]): TokenUsage {
  return attempts.reduce((sum, attempt) => ({ inputTokens: sum.inputTokens + (attempt.usage?.inputTokens ?? 0), outputTokens: sum.outputTokens + (attempt.usage?.outputTokens ?? 0) }), { inputTokens: 0, outputTokens: 0 })
}

function modelStep(input: { kind: StepKind; round: GateRoundNumber; seat: PaidProviderId; provider: ProviderId; model: string | null; attempts: ProviderAttempt[]; latencyMs: number; costUsd: number; count: number; ids: string[]; status?: 'ok' | 'error'; reason?: string | null }): GateStep {
  const usage = usageOf(input.attempts)
  return {
    kind: input.kind,
    round: input.round,
    provider: input.provider,
    seat: input.seat,
    model: input.model,
    attempts: input.attempts,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    costUsd: roundUsd(input.costUsd),
    status: input.status ?? 'ok',
    count: input.count,
    ids: input.ids.slice(0, 64),
    reason: input.reason ? safeReason(input.reason, 380) : null,
  }
}

function failedStep(kind: StepKind, round: GateRoundNumber, seat: PaidProviderId, attempts: ProviderAttempt[], reason: string): GateStep {
  const last = attempts.filter((attempt) => attempt.outcome !== 'skipped').at(-1) ?? attempts.at(-1)
  return modelStep({
    kind,
    round,
    seat,
    provider: last?.provider ?? seat,
    model: last?.model ?? null,
    attempts,
    latencyMs: attempts.reduce((sum, attempt) => sum + attempt.latencyMs, 0),
    costUsd: attempts.reduce((sum, attempt) => sum + attempt.costUsd, 0),
    count: 0,
    ids: [],
    status: 'error',
    reason,
  })
}

async function call<T>(ctx: Ctx, input: Omit<GenerateJsonInput<T>, 'line'>): Promise<Called<T>> {
  try {
    return { ok: true, result: await ctx.deps.port.generateJson({ ...input, line: 'gates' }) }
  } catch (error) {
    if (error instanceof BudgetExhaustedError || error instanceof BudgetUnavailableError) throw error
    const attempts = error instanceof ProvidersUnavailableError || error instanceof ProviderRequestError ? error.attempts : []
    return { ok: false, error, attempts }
  }
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

export function normalizeSpec(wire: WriterReplyWire['spec']): { ok: true; spec: SpecBreve } | { ok: false; issues: string } {
  const items = (list: readonly string[]) => list.map((item) => clip(item, SPEC_LIMITS.item)).filter(Boolean)
  const candidate = {
    title: clip(wire.title, SPEC_LIMITS.title),
    problem: clip(wire.problem, SPEC_LIMITS.problem),
    includes: items(wire.includes),
    excludes: items(wire.excludes),
    requirements: wire.requirements.map((item) => ({ id: item.id.trim(), text: clip(item.text, SPEC_LIMITS.requirement) })),
    criteria: wire.criteria.map((item) => ({
      id: item.id.trim(),
      covers: item.covers.map((id) => id.trim()),
      given: clip(item.given, SPEC_LIMITS.clause),
      when: clip(item.when, SPEC_LIMITS.clause),
      then: clip(item.then, SPEC_LIMITS.clause),
    })),
    questions: wire.questions.map((item) => ({ id: item.id.trim(), question: clip(item.question, SPEC_LIMITS.question), byDefault: clip(item.byDefault, SPEC_LIMITS.question) })),
  }
  const parsed = specBreve.safeParse(candidate)
  if (parsed.success) return { ok: true, spec: parsed.data }
  return { ok: false, issues: parsed.error.issues.slice(0, 3).map((issue) => `${issue.path.join('.') || 'raíz'}: ${issue.message}`).join('; ') }
}

function others(seat: PaidProviderId): PaidProviderId[] {
  return PAID_PROVIDERS.filter((provider) => provider !== seat)
}

async function writeSpec(ctx: Ctx, kind: 'redactar' | 'corregir', round: GateRoundNumber, prompt: string, simulate: () => WriterReplyWire): Promise<{ spec: SpecBreve; kind: WriterKind } | null> {
  const seat = ctx.writer.seat
  const attempts: ProviderAttempt[] = []
  let latencyMs = 0
  let costUsd = 0
  let issues = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const extra = attempt === 0 ? '' : `\n\nTu respuesta anterior no cumplió el contrato de la spec (${issues}). Responde otra vez con la spec completa.`
    const called = await call(ctx, {
      task: WRITER_TASK,
      system: writerSystem(ctx.request.lang),
      prompt: prompt + extra,
      schema: writerReplyWire,
      prefer: seat,
      exclude: others(seat),
      estimate: STEP_ESTIMATES[kind],
      simulate,
    })
    if (!called.ok) {
      attempts.push(...called.attempts)
      addStep(ctx, failedStep(kind, round, seat, attempts, safeReason(called.error)))
      return null
    }
    const { result } = called
    attempts.push(...result.attempts)
    latencyMs += result.latencyMs
    costUsd += result.costUsd
    const normalized = normalizeSpec(result.data.spec)
    if (normalized.ok) {
      if (kind === 'redactar') ctx.writer = { seat, provider: result.provider }
      addStep(ctx, modelStep({ kind, round, seat, provider: result.provider, model: result.model, attempts, latencyMs, costUsd, count: normalized.spec.requirements.length, ids: [] }))
      return { spec: normalized.spec, kind: result.data.kind }
    }
    issues = normalized.issues
    addNote(ctx, { round, kind: 'esquema-reintento', seat, detail: issues })
  }
  const last = attempts.at(-1)
  addStep(ctx, modelStep({ kind, round, seat, provider: last?.provider ?? seat, model: last?.model ?? null, attempts, latencyMs, costUsd, count: 0, ids: [], status: 'error', reason: SYNTHETIC[ctx.request.lang].strict }))
  return null
}

function check(ctx: Ctx, round: GateRoundNumber, spec: SpecBreve): CheckResult {
  const result = runChecks(spec, ctx.request.lang, ctx.deps.core, ctx.deps.clock)
  addStep(ctx, {
    kind: 'chequear',
    round,
    provider: 'deterministic',
    seat: null,
    model: result.model,
    attempts: [],
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: result.ms,
    costUsd: 0,
    status: 'ok',
    count: result.failures.length,
    ids: [...new Set(result.failures.map((item) => item.where))],
    reason: null,
  })
  return result
}

function writerSide(ctx: Ctx): PaidProviderId[] {
  return PAID_PROVIDERS.filter((provider) => provider === ctx.writer.seat || provider === ctx.writer.provider)
}

function clipReview(findings: ReviewReplyWire['findings']): ReviewReplyWire['findings'] {
  return findings.slice(0, 8).map((item) => ({ ...item, problem: clip(item.problem, SPEC_LIMITS.findingText), fix: clip(item.fix, SPEC_LIMITS.findingText) }))
}

async function review(ctx: Ctx, round: GateRoundNumber, spec: SpecBreve, reviewers: readonly PaidProviderId[], changed: readonly string[] | null, previous: readonly MergedFinding[]): Promise<ReviewBatch[]> {
  const blocked = writerSide(ctx)
  const settled = await Promise.allSettled(
    reviewers.map((seat, index) =>
      call(ctx, {
        task: REVIEWER_TASK,
        system: reviewerSystem(ctx.request.lang),
        prompt: reviewerPrompt({ lang: ctx.request.lang, request: ctx.request.text, spec, changed, previous }),
        schema: reviewReplyWire,
        prefer: seat,
        exclude: PAID_PROVIDERS.filter((provider) => blocked.includes(provider) || (provider !== seat && reviewers.includes(provider))),
        estimate: STEP_ESTIMATES.revisar,
        simulate: () => ctx.sim.review({ request: ctx.request, spec, round, index, previous }),
      }),
    ),
  )
  const batches: ReviewBatch[] = []
  let fatal: unknown = null
  settled.forEach((outcome, index) => {
    const seat = reviewers[index]!
    if (outcome.status === 'rejected') {
      fatal ??= outcome.reason
      return
    }
    const called = outcome.value
    if (!called.ok) {
      addStep(ctx, failedStep('revisar', round, seat, called.attempts, safeReason(called.error)))
      addNote(ctx, { round, kind: 'revisor-caido', seat, detail: safeReason(called.error) })
      return
    }
    const { result } = called
    if (isPaid(result.provider) && blocked.includes(result.provider)) {
      addStep(ctx, modelStep({ kind: 'revisar', round, seat, provider: result.provider, model: result.model, attempts: result.attempts, latencyMs: result.latencyMs, costUsd: result.costUsd, count: 0, ids: [], status: 'error', reason: SYNTHETIC[ctx.request.lang].selfReviewer }))
      addNote(ctx, { round, kind: 'revisor-caido', seat, detail: SYNTHETIC[ctx.request.lang].selfReviewer })
      return
    }
    const findings = clipReview(result.data.findings)
    addStep(ctx, modelStep({ kind: 'revisar', round, seat, provider: result.provider, model: result.model, attempts: result.attempts, latencyMs: result.latencyMs, costUsd: result.costUsd, count: findings.length, ids: [] }))
    batches.push({ seat, provider: result.provider, findings, resolved: round === 1 ? [] : result.data.resolved })
  })
  if (fatal) throw fatal
  return batches
}

function verifyEstimate(count: number): TokenUsage {
  return { inputTokens: 1200 + 150 * count, outputTokens: 80 + 110 * count }
}

async function verify(ctx: Ctx, round: GateRoundNumber, spec: SpecBreve, findings: readonly MergedFinding[]): Promise<MergedFinding[]> {
  const copy = SYNTHETIC[ctx.request.lang]
  const pending = findings.filter(needsVerification)
  if (!pending.length) return [...findings]
  const verdicts = new Map<string, FindingVerification>()
  if (deadlineSoon(ctx, PHASE_BUDGET_MS.verificar)) {
    addNote(ctx, { round, kind: 'corte', detail: copy.outOfTime })
    return [...findings]
  }
  const groups = new Map<string, { reporters: PaidProviderId[]; verifier: PaidProviderId | null; items: MergedFinding[] }>()
  for (const item of pending) {
    const reporters = reportersOf(item)
    const key = reporters.join('+')
    const group = groups.get(key) ?? { reporters, verifier: pickVerifier(ctx.seats, reporters), items: [] }
    group.items.push(item)
    groups.set(key, group)
  }
  const runnable = [...groups.values()].filter((group) => {
    if (group.verifier) return true
    for (const item of group.items) {
      verdicts.set(item.id, { result: 'no-se-sabe', reason: copy.noVerifier, seat: null, provider: null })
      addNote(ctx, { round, kind: 'sin-verificador', where: item.where, detail: item.id })
    }
    return false
  })
  const settled = await Promise.allSettled(
    runnable.map((group) =>
      call(ctx, {
        task: VERIFIER_TASK,
        system: verifierSystem(ctx.request.lang),
        prompt: verifierPrompt({ lang: ctx.request.lang, request: ctx.request.text, spec, findings: group.items }),
        schema: verifierReplyWire,
        prefer: group.verifier!,
        exclude: group.reporters,
        estimate: verifyEstimate(group.items.length),
        simulate: () => ctx.sim.verify(ctx.request, round, group.items),
      }),
    ),
  )
  let fatal: unknown = null
  settled.forEach((outcome, index) => {
    const group = runnable[index]!
    const seat = group.verifier!
    const ids = group.items.map((item) => item.id)
    if (outcome.status === 'rejected') {
      fatal ??= outcome.reason
      return
    }
    const called = outcome.value
    const standing = (reason: string) => {
      for (const item of group.items) verdicts.set(item.id, { result: 'no-se-sabe', reason, seat, provider: null })
    }
    if (!called.ok) {
      standing(copy.verifierDown)
      addStep(ctx, failedStep('verificar', round, seat, called.attempts, safeReason(called.error)))
      addNote(ctx, { round, kind: 'verificador-caido', seat, detail: safeReason(called.error) })
      return
    }
    const { result } = called
    if (isPaid(result.provider) && group.reporters.includes(result.provider)) {
      standing(copy.selfVerifier)
      addStep(ctx, modelStep({ kind: 'verificar', round, seat, provider: result.provider, model: result.model, attempts: result.attempts, latencyMs: result.latencyMs, costUsd: result.costUsd, count: 0, ids, status: 'error', reason: copy.selfVerifier }))
      return
    }
    let answered = 0
    for (const item of group.items) {
      const verdict = result.data.verdicts.find((entry) => entry.id === item.id)
      if (verdict) {
        answered++
        verdicts.set(item.id, { result: verdict.result, reason: clip(verdict.reason, SPEC_LIMITS.reason), seat, provider: result.provider })
      } else {
        verdicts.set(item.id, { result: 'no-se-sabe', reason: copy.noVerdict, seat, provider: result.provider })
        addNote(ctx, { round, kind: 'sin-veredicto', seat, where: item.where, detail: item.id })
      }
    }
    addStep(ctx, modelStep({ kind: 'verificar', round, seat, provider: result.provider, model: result.model, attempts: result.attempts, latencyMs: result.latencyMs, costUsd: result.costUsd, count: answered, ids }))
  })
  if (fatal) throw fatal
  return findings.map((item) => (verdicts.has(item.id) ? { ...item, verification: verdicts.get(item.id)! } : item))
}

function stepUsd(ctx: Ctx, kind: keyof typeof STEP_ESTIMATES, seat: PaidProviderId): number {
  if (ctx.simulated) return 0
  const task = kind === 'verificar' ? VERIFIER_TASK : kind === 'revisar' ? REVIEWER_TASK : WRITER_TASK
  return seatUsd(seat, task, STEP_ESTIMATES[kind])
}

export function reviewEstimateUsd(ctx: Pick<Ctx, 'simulated' | 'seats'>, reviewers: readonly PaidProviderId[]): number {
  if (ctx.simulated) return 0
  let usd = 0
  for (const reviewer of reviewers) {
    usd += seatUsd(reviewer, REVIEWER_TASK, STEP_ESTIMATES.revisar)
    const verifier = pickVerifier(ctx.seats, [reviewer])
    if (verifier) usd += seatUsd(verifier, VERIFIER_TASK, STEP_ESTIMATES.verificar)
  }
  return usd
}

function roundEstimateUsd(ctx: Ctx): number {
  return stepUsd(ctx, 'corregir', ctx.writer.seat) + reviewEstimateUsd(ctx, pickReviewers(ctx.seats, ctx.writer.seat))
}

async function budgetAvailable(ctx: Ctx, usd: number): Promise<boolean> {
  if (!ctx.live) return true
  try {
    await ctx.deps.port.assertMonthlyBudget(usd)
    return true
  } catch (error) {
    if (error instanceof BudgetExhaustedError || error instanceof BudgetUnavailableError) return false
    throw error
  }
}

function setRound(ctx: Ctx, round: GateRound): void {
  const index = ctx.rounds.findIndex((item) => item.round === round.round)
  if (index >= 0) ctx.rounds[index] = round
  else ctx.rounds.push(round)
}

async function reviewRound(
  ctx: Ctx,
  input: { round: GateRoundNumber; spec: SpecBreve; draft: SpecBreve | null; deterministic: readonly DeterministicFinding[]; changed: readonly string[] | null; previous: readonly MergedFinding[] | null; comment: string | null },
): Promise<StopReason | null> {
  const base: GateRound = { round: input.round, spec: input.spec, draft: input.draft, findings: [], reviewed: false, reviewers: [], changed: input.changed ? [...input.changed] : null, comment: input.comment }
  const unreviewed = () => mergeFindings({ round: input.round, spec: input.spec, deterministic: input.deterministic, reviews: [], changed: null, previous: null }).findings
  setRound(ctx, { ...base, findings: unreviewed() })
  const reviewers = pickReviewers(ctx.seats, ctx.writer.seat)
  if (!reviewers.length) return 'revision-no-disponible'
  if (reviewers.length === 1) addNote(ctx, { round: input.round, kind: 'un-revisor', seat: reviewers[0]! })
  if (overCap(spent(ctx), reviewEstimateUsd(ctx, reviewers))) return 'tope-corrida'
  if (deadlineSoon(ctx, PHASE_BUDGET_MS.revisar)) return 'sin-tiempo'
  const previous = input.previous ? input.previous.filter((item) => item.origin === 'revisor' && item.verification?.result !== 'se-cae') : []
  const batches = await review(ctx, input.round, input.spec, reviewers, input.changed, previous)
  if (!batches.length) return 'revision-no-disponible'
  if (reviewers.length === 2 && batches.length === 1) addNote(ctx, { round: input.round, kind: 'un-revisor', seat: batches[0]!.seat, detail: reviewers.find((seat) => seat !== batches[0]!.seat) ?? null })
  const merged = mergeFindings({ round: input.round, spec: input.spec, deterministic: input.deterministic, reviews: batches, changed: input.changed, previous: input.previous })
  for (const note of merged.notes) addNote(ctx, note)
  setRound(ctx, { ...base, findings: merged.findings, reviewed: true, reviewers: batches.map((batch) => batch.seat) })
  const verified = await verify(ctx, input.round, input.spec, merged.findings)
  setRound(ctx, { ...base, findings: verified, reviewed: true, reviewers: batches.map((batch) => batch.seat) })
  return null
}

async function nextStop(ctx: Ctx, round: GateRound, previousBlockers: number | null): Promise<StopReason | null> {
  const nextEstimateUsd = roundEstimateUsd(ctx)
  const budgetOk = round.round >= 2 ? true : await budgetAvailable(ctx, nextEstimateUsd)
  const reason = shouldStop({ round: round.round, findings: round.findings, previousBlockers, spentUsd: spent(ctx), nextEstimateUsd, budgetOk })
  if (!reason && deadlineSoon(ctx, PHASE_BUDGET_MS.ronda)) return 'sin-tiempo'
  return reason
}

async function correctionRound(ctx: Ctx, number: GateRoundNumber, comment: string | null): Promise<StopReason> {
  const previous = ctx.rounds.at(-1)!
  if (overCap(spent(ctx), stepUsd(ctx, 'corregir', ctx.writer.seat))) return 'tope-corrida'
  const corrected = await writeSpec(
    ctx,
    'corregir',
    number,
    correctionPrompt({ lang: ctx.request.lang, request: ctx.request.text, spec: previous.spec, findings: toFix(previous.findings), minors: minors(previous.findings), checks: [], comment }),
    () => ctx.sim.correct(ctx.request, previous.spec, number, comment),
  )
  if (!corrected) return 'redactor-caido'
  const changed = changedPlaces(previous.spec, corrected.spec)
  setRound(ctx, { round: number, spec: corrected.spec, draft: null, findings: [], reviewed: false, reviewers: [], changed, comment })
  const checks = check(ctx, number, corrected.spec)
  const stopped = await reviewRound(ctx, { round: number, spec: corrected.spec, draft: null, deterministic: checks.findings, changed, previous: previous.findings, comment })
  if (stopped) return stopped
  return (await nextStop(ctx, ctx.rounds.at(-1)!, blockers(previous.findings))) ?? 'dos-rondas'
}

function createCtx(request: GateRequest, deps: GateDeps, writer?: GateRun['writer']): Ctx {
  const mode = deps.port.providersMode()
  if (mode === 'off') throw new GateError('off')
  const simulated = mode === 'local'
  const seats = simulated ? [...PAID_PROVIDERS] : seatsFrom(deps.port.availableProviders())
  const seat = writer?.seat ?? pickWriter(seats)
  if (!seat) throw new GateError('off')
  return { deps, request, live: mode === 'live', simulated, seats, writer: writer ?? { seat, provider: seat }, steps: [], notes: [], rounds: [], sim: deps.simulator ?? gateSimulator }
}

function buildRun(ctx: Ctx, stop: StopReason, seal: string | null = null): GateRun {
  const at = (ctx.deps.now ?? (() => new Date()))().toISOString()
  const totalUsd = spent(ctx)
  const last = ctx.rounds.at(-1)!
  return {
    schemaVersion: GATE_SCHEMA_VERSION,
    id: at.replace(/[:.]/g, '-'),
    at,
    mode: ctx.deps.mode ?? 'vivo',
    simulated: ctx.simulated,
    rubricVersion: RUBRIC_VERSION,
    request: ctx.request,
    writer: ctx.writer,
    rounds: ctx.rounds,
    steps: ctx.steps,
    notes: ctx.notes,
    recommendation: recommendRun(last, stop),
    stop,
    totalUsd,
    totalCop: Math.round(totalUsd * USD_TO_COP),
    capUsd: GATE_RUN_CAP_USD,
    copRate: { value: USD_TO_COP, date: USD_TO_COP_DATE },
    pricesCheckedAt: { gemini: PRICE_SOURCES.gemini.checkedAt, claude: PRICE_SOURCES.claude.checkedAt, openai: PRICE_SOURCES.openai.checkedAt },
    seal,
  }
}

async function guarded(ctx: Ctx, body: () => Promise<StopReason>): Promise<GateRun> {
  try {
    return buildRun(ctx, await body())
  } catch (error) {
    if (error instanceof BudgetExhaustedError) {
      if (!ctx.rounds.length) throw new GateError('budget', ctx.steps)
      return buildRun(ctx, 'sin-presupuesto')
    }
    if (error instanceof BudgetUnavailableError) throw new GateError('budget_unavailable', ctx.steps)
    throw error
  }
}

export async function runGate(request: GateRequest, deps: GateDeps): Promise<GateRun> {
  const ctx = createCtx(request, deps)
  return guarded(ctx, async () => {
    const draft = await writeSpec(ctx, 'redactar', 1, writerPrompt(request.text), () => ctx.sim.write(request))
    if (!draft) throw new GateError('writer', ctx.steps)
    if (draft.kind === 'no-es-software') {
      setRound(ctx, { round: 1, spec: draft.spec, draft: null, findings: [], reviewed: false, reviewers: [], changed: null, comment: null })
      return 'no-es-software'
    }
    let spec = draft.spec
    let first: SpecBreve | null = null
    setRound(ctx, { round: 1, spec, draft: null, findings: [], reviewed: false, reviewers: [], changed: null, comment: null })
    let checks = check(ctx, 1, spec)
    if (checks.failures.length && !overCap(spent(ctx), stepUsd(ctx, 'corregir', ctx.writer.seat))) {
      addNote(ctx, { round: 1, kind: 'correccion-gratis', detail: String(checks.failures.length) })
      const current = spec
      const fixed = await writeSpec(
        ctx,
        'corregir',
        1,
        correctionPrompt({ lang: request.lang, request: request.text, spec: current, findings: [], minors: [], checks: checkLines(checks.findings), comment: null }),
        () => ctx.sim.fixChecks(request, current),
      )
      if (fixed) {
        first = current
        spec = fixed.spec
        checks = check(ctx, 1, spec)
      }
    }
    const stopped = await reviewRound(ctx, { round: 1, spec, draft: first, deterministic: checks.findings, changed: null, previous: null, comment: null })
    if (stopped) return stopped
    const stop = await nextStop(ctx, ctx.rounds.at(-1)!, null)
    if (stop) return stop
    return correctionRound(ctx, 2, null)
  })
}

export function changesEstimateUsd(run: GateRun, available: readonly ProviderId[]): number {
  const seats = seatsFrom(available)
  if (run.simulated) return 0
  return seatUsd(run.writer.seat, WRITER_TASK, STEP_ESTIMATES.corregir) + reviewEstimateUsd({ simulated: false, seats }, pickReviewers(seats, run.writer.seat))
}

export async function continueGate(run: GateRun, comment: string, deps: GateDeps): Promise<GateRun> {
  if (!canRequestChanges(run)) throw new GateError('invalid_run')
  const ctx = createCtx(run.request, deps, run.writer)
  if (ctx.simulated !== run.simulated) throw new GateError('invalid_run')
  ctx.steps.push(...run.steps)
  ctx.notes.push(...run.notes)
  ctx.rounds.push(...run.rounds)
  return guarded(ctx, async () => {
    const stop = await correctionRound(ctx, 3, comment)
    return stop === 'dos-rondas' ? 'ronda-pedida' : stop
  })
}

export function isSoftwareRequest(text: string): boolean {
  return !gateSimulator.isNotSoftware(text)
}

export type { ReviewBatch }

export function liveEstimateUsd(available: readonly ProviderId[]): number {
  const seats = seatsFrom(available)
  const writer = pickWriter(seats)
  if (!writer) return 0
  return roundUsd(seatUsd(writer, WRITER_TASK, STEP_ESTIMATES.redactar) + reviewEstimateUsd({ simulated: false, seats }, pickReviewers(seats, writer)))
}
