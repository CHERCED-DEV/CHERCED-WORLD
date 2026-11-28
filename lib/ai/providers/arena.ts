import { clipReason, JUDGE_RUBRIC, JUDGE_RUBRIC_VERSION, judgePrompt, judgeSchema } from '@/content/ailab/arena/judge'
import { caseCostUsd, type ArenaCase, type ArenaColumn, type ArenaJudge, type ArenaRedTeam, type ArenaRun, type ArenaRunMode } from '@/content/ailab/arena/results'
import { arenaSchema, freeSchema } from '@/content/ailab/arena/schemas'
import type { ArenaKind, ArenaRules, ArenaTask } from '@/content/ailab/arena/tasks'
import { gradeExpect } from '@/lib/ai/evals/grade'
import { PRICE_SOURCES, USD_TO_COP, USD_TO_COP_DATE } from '@/lib/ai/pricing'
import type { Locale } from '@/lib/i18n/config'
import type { z } from 'zod'
import { estimateTokens, roundUsd } from './cost'
import { modelFor } from './models'
import { safeReason } from './redact'
import { planRoute } from './router'
import { BudgetExhaustedError, BudgetUnavailableError, PAID_PROVIDERS, ProviderRequestError, ProvidersUnavailableError, type GenerateJsonInput, type GenerateJsonResult, type PaidProviderId, type ProviderAttempt, type ProviderId, type TokenUsage } from './types'

export const ARENA_ANSWER_TASK = 'balanced' as const

export const ARENA_JUDGE_TASK = 'cheap' as const

export const ARENA_ANSWER_ESTIMATE: TokenUsage = { inputTokens: 1500, outputTokens: 1200 }

export const ARENA_JUDGE_ESTIMATE: TokenUsage = { inputTokens: 1800, outputTokens: 300 }

export const ARENA_LIVE_MAX_USD = 0.05

export const JUDGE_ROTATION: Readonly<Record<PaidProviderId, PaidProviderId>> = { gemini: 'claude', claude: 'openai', openai: 'gemini' }

export type ArenaGenerate = <T>(input: GenerateJsonInput<T>) => Promise<GenerateJsonResult<T>>

export type ArenaRunnable = {
  id: string | null
  lang: Locale
  kind: ArenaKind | null
  instruction: string
  input: string
  rules: ArenaRules | null
  maxOutputTokens: number
  sample: unknown
}

export function runnable(task: ArenaTask): ArenaRunnable {
  return { id: task.id, lang: task.lang, kind: task.kind, instruction: task.instruction, input: task.input, rules: task.rules, maxOutputTokens: task.maxOutputTokens, sample: task.sample }
}

type Json = Record<string, unknown>

function at(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as Json)[key] : undefined), value)
}

export function textView(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(textView).filter(Boolean).join('\n')
  if (value && typeof value === 'object') return Object.values(value as Json).map(textView).filter(Boolean).join('\n')
  return ''
}

const NUMBER = /\d+(?:[.,]\d+)*/g

export function gradeRules(rules: ArenaRules, data: unknown): { pass: boolean; reasons: string[] } {
  const text = textView(rules.textPath ? at(data, rules.textPath) : data)
  const reasons = [...gradeExpect(rules.expect, { text, tools: [] }).reasons]
  if (rules.count) {
    const list = at(data, rules.count.path)
    const length = Array.isArray(list) ? list.length : 0
    if (length < rules.count.min || length > rules.count.max) {
      reasons.push(rules.count.min === rules.count.max ? `trae ${length} ítems, se esperaban ${rules.count.min}` : `trae ${length} ítems, se esperaban de ${rules.count.min} a ${rules.count.max}`)
    }
  }
  if (rules.ids) {
    const list = at(data, rules.ids.path)
    const ids = Array.isArray(list) ? list.map((item) => String(rules.ids!.field ? at(item, rules.ids!.field) : item)) : []
    const unknown = ids.filter((id) => !rules.ids!.allowed.includes(id))
    if (unknown.length) reasons.push(`ids que no existen: ${[...new Set(unknown)].join(', ')}`)
    const missing = (rules.ids.required ?? []).filter((id) => !ids.includes(id))
    if (missing.length) reasons.push(`faltan los ids ${missing.join(', ')}`)
  }
  if (rules.labels) {
    const list = at(data, rules.labels.path)
    const items = Array.isArray(list) ? list : []
    const correct = Object.entries(rules.labels.expected).filter(([id, label]) => items.some((item) => String(at(item, rules.labels!.idField)) === id && at(item, rules.labels!.labelField) === label)).length
    if (correct < rules.labels.minCorrect) reasons.push(`${correct} de ${Object.keys(rules.labels.expected).length} bien clasificados, se esperaban ${rules.labels.minCorrect} o más`)
  }
  for (const field of rules.fields ?? []) {
    const value = at(data, field.path)
    if (value !== field.equals) reasons.push(`${field.path} debía ser ${String(field.equals)}`)
  }
  if (rules.numbers) {
    const invented = (text.match(NUMBER) ?? []).filter((number) => !rules.numbers!.allowed.includes(number))
    if (invented.length) reasons.push(`cifras que no están en el texto: ${[...new Set(invented)].join(', ')}`)
  }
  return { pass: reasons.length === 0, reasons }
}

function emptyColumn(provider: PaidProviderId, requestedModel: string, attempts: ProviderAttempt[]): ArenaColumn {
  return {
    provider,
    status: 'error',
    servedBy: null,
    requestedModel,
    model: null,
    data: null,
    latencyMs: 0,
    usage: null,
    costUsd: roundUsd(attempts.reduce((sum, attempt) => sum + attempt.costUsd, 0)),
    truncated: false,
    reason: null,
    attempts,
    rules: null,
    judge: null,
    judgeError: null,
  }
}

function isFatal(error: unknown): boolean {
  return error instanceof BudgetExhaustedError || error instanceof BudgetUnavailableError
}

export function columnSchema(task: ArenaRunnable): z.ZodType<unknown> {
  return task.kind ? arenaSchema(task.kind) : freeSchema
}

export function answerEstimate(task: ArenaRunnable): TokenUsage {
  return { inputTokens: Math.max(ARENA_ANSWER_ESTIMATE.inputTokens, estimateTokens(task.instruction + task.input) + 400), outputTokens: ARENA_ANSWER_ESTIMATE.outputTokens }
}

export async function runColumn(task: ArenaRunnable, provider: PaidProviderId, generate: ArenaGenerate, requestedModel: string): Promise<ArenaColumn> {
  try {
    const result = await generate({
      task: ARENA_ANSWER_TASK,
      line: 'arena',
      system: task.instruction,
      prompt: task.input,
      schema: columnSchema(task),
      prefer: provider,
      exclude: PAID_PROVIDERS.filter((other) => other !== provider),
      maxOutputTokens: task.maxOutputTokens,
      estimate: answerEstimate(task),
      simulate: () => task.sample,
    })
    const last = result.attempts.at(-1)
    return {
      ...emptyColumn(provider, requestedModel, result.attempts),
      status: 'ok',
      servedBy: result.provider,
      model: result.model,
      data: result.data,
      latencyMs: result.latencyMs,
      usage: result.usage,
      costUsd: roundUsd(result.costUsd),
      truncated: Boolean(last?.reason?.includes('maxOutputTokens')),
      rules: task.rules ? gradeRules(task.rules, result.data) : null,
    }
  } catch (error) {
    if (isFatal(error)) throw error
    const attempts = error instanceof ProvidersUnavailableError || error instanceof ProviderRequestError ? error.attempts : []
    const column = emptyColumn(provider, requestedModel, attempts)
    const inactive = attempts.length > 0 && attempts.every((attempt) => attempt.outcome === 'skipped')
    const reason = attempts.filter((attempt) => attempt.reason).at(-1)?.reason ?? safeReason(error)
    return { ...column, status: inactive ? 'inactive' : 'error', reason }
  }
}

export async function judgeColumn(task: ArenaRunnable, column: ArenaColumn, generate: ArenaGenerate): Promise<ArenaColumn> {
  if (column.status !== 'ok') return column
  try {
    const verdict = await generate({
      task: ARENA_JUDGE_TASK,
      line: 'arena',
      system: JUDGE_RUBRIC[task.lang],
      prompt: judgePrompt(task.lang, task, JSON.stringify(column.data)),
      schema: judgeSchema,
      exclude: [column.provider],
      prefer: JUDGE_ROTATION[column.provider],
      estimate: ARENA_JUDGE_ESTIMATE,
      simulate: () => ({ score: 2, reason: task.lang === 'es' ? 'Nota del simulador local: no es la opinión de un modelo.' : 'Local simulator grade: not a model opinion.' }),
    })
    if (verdict.provider === column.provider) throw new Error('el juez salió del proveedor evaluado')
    const judge: ArenaJudge = { provider: verdict.provider, model: verdict.model, score: verdict.data.score, reason: clipReason(verdict.data.reason), costUsd: roundUsd(verdict.costUsd) }
    return { ...column, judge, judgeError: null }
  } catch (error) {
    if (isFatal(error)) throw error
    const attempts = error instanceof ProvidersUnavailableError ? error.attempts : []
    const none = attempts.every((attempt) => attempt.outcome === 'skipped')
    return { ...column, judge: null, judgeError: none ? 'sin juez: no había otro proveedor activo' : safeReason(error) }
  }
}

export type CaseOptions = { generate: ArenaGenerate; models: Readonly<Record<PaidProviderId, string>> }

export async function compareCase(task: ArenaRunnable, options: CaseOptions): Promise<ArenaCase> {
  const answered = await Promise.all(PAID_PROVIDERS.map((provider) => runColumn(task, provider, options.generate, options.models[provider])))
  const columns = await Promise.all(answered.map((column) => judgeColumn(task, column, options.generate)))
  return { taskId: task.id, kind: task.kind, lang: task.lang, columns }
}

export function comparisonEstimateUsd(task: ArenaRunnable, available: readonly PaidProviderId[]): number {
  let usd = 0
  for (const provider of PAID_PROVIDERS) {
    if (!available.includes(provider)) continue
    const answer = planRoute({ task: ARENA_ANSWER_TASK, estimate: answerEstimate(task), prefer: provider, exclude: PAID_PROVIDERS.filter((other) => other !== provider) }, available).candidates[0]
    if (!answer) continue
    usd += answer.reserveUsd
    const judge = planRoute({ task: ARENA_JUDGE_TASK, estimate: ARENA_JUDGE_ESTIMATE, prefer: JUDGE_ROTATION[provider], exclude: [provider] }, available).candidates[0]
    if (judge) usd += judge.reserveUsd
  }
  return roundUsd(usd)
}

export const ARENA_RUBRIC_VERSION = JUDGE_RUBRIC_VERSION

export function arenaModels(): Record<PaidProviderId, string> {
  return { gemini: modelFor('gemini', ARENA_ANSWER_TASK), claude: modelFor('claude', ARENA_ANSWER_TASK), openai: modelFor('openai', ARENA_ANSWER_TASK) }
}

export function buildRun(input: { mode: ArenaRunMode; simulated: boolean; cases: ArenaCase[]; redTeam?: ArenaRedTeam[]; now: Date }): ArenaRun {
  const at = input.now.toISOString()
  const redTeam = input.redTeam ?? []
  const totalUsd = roundUsd(input.cases.reduce((sum, entry) => sum + caseCostUsd(entry), 0) + redTeam.reduce((sum, entry) => sum + entry.costUsd, 0))
  return {
    id: at.replace(/[:.]/g, '-'),
    at,
    mode: input.mode,
    simulated: input.simulated,
    rubricVersion: ARENA_RUBRIC_VERSION,
    models: arenaModels(),
    pricesCheckedAt: { gemini: PRICE_SOURCES.gemini.checkedAt, claude: PRICE_SOURCES.claude.checkedAt, openai: PRICE_SOURCES.openai.checkedAt },
    copRate: { value: USD_TO_COP, date: USD_TO_COP_DATE },
    cases: input.cases,
    redTeam,
    totalUsd,
    totalCop: Math.round(totalUsd * USD_TO_COP),
  }
}

export function judgeNeverSelf(columns: readonly ArenaColumn[]): boolean {
  return columns.every((column) => !column.judge || (column.judge.provider as ProviderId) !== column.provider)
}
