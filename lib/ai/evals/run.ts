import 'server-only'
import { EVAL_BATTERY, type EvalCase } from '@/content/ailab/evals/battery'
import { agentInstruction } from '@/lib/ai/agent/knowledge'
import { AGENT_TOOLS, createToolRunner, type AgentToolCall } from '@/lib/ai/agent/tools'
import { parseUsage, usageCost } from '@/lib/ai/agent/usage'
import { GEMINI_API_BASE } from '@/lib/ai/gemini'
import { GeminiError, googleReason } from '@/lib/ai/generate'
import type { Locale } from '@/lib/i18n/config'
import { buildSearchIndex } from '@/lib/search/build-index'
import { gradeAnswer, summarizeRun, type EvalAnswer, type EvalRun, type EvalToolCall } from './grade'
import { instructionHash } from './hash'

export const EVAL_MODEL = 'gemini-3.8-flash'

export const EVAL_MAX_STEPS = 3

const TIMEOUT_MS = 30_000

type Part = Record<string, unknown>

type Content = { role: 'user' | 'model'; parts: Part[] }

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

async function generate(key: string, system: string, contents: Content[], fetcher: typeof fetch) {
  const response = await fetcher(`${GEMINI_API_BASE}/models/${EVAL_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      tools: AGENT_TOOLS,
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!response.ok) throw new GeminiError(response.status, await googleReason(response))
  const data = record(await response.json().catch(() => null)) ?? {}
  const candidate = Array.isArray(data.candidates) ? record(data.candidates[0]) : undefined
  const parts = (record(candidate?.content)?.parts as Part[] | undefined) ?? []
  return { parts: parts.filter((part) => part.thought !== true), usage: parseUsage(data.usageMetadata, 'text') }
}

export async function askAgent(key: string, system: string, item: EvalCase, fetcher: typeof fetch = fetch): Promise<EvalAnswer> {
  const runner = createToolRunner({ lang: item.lang, index: () => buildSearchIndex(item.lang), navigate: () => {} })
  const contents: Content[] = [{ role: 'user', parts: [{ text: item.question }] }]
  const tools: EvalToolCall[] = []
  let text = ''
  let costUsd = 0
  const started = performance.now()
  for (let step = 0; step < EVAL_MAX_STEPS; step++) {
    const { parts, usage } = await generate(key, system, contents, fetcher)
    costUsd += usageCost(EVAL_MODEL, usage)
    contents.push({ role: 'model', parts })
    text += parts.map((part) => (typeof part.text === 'string' ? part.text : '')).join('')
    const calls = parts.flatMap((part) => {
      const call = record(part.functionCall)
      return call && typeof call.name === 'string' ? [{ name: call.name, args: record(call.args) ?? {} }] : []
    })
    if (calls.length === 0) break
    const responses: Part[] = []
    for (const [index, call] of calls.entries()) {
      tools.push(call)
      const result = await runner({ id: `eval-${index}`, ...call } satisfies AgentToolCall)
      responses.push({ functionResponse: { name: call.name, response: result.response.response } })
    }
    contents.push({ role: 'user', parts: responses })
  }
  return { text, tools, latencyMs: Math.round(performance.now() - started), costUsd }
}

export async function runEvals(key: string, fetcher: typeof fetch = fetch, battery: readonly EvalCase[] = EVAL_BATTERY): Promise<EvalRun> {
  const systems = new Map<Locale, string>()
  for (const lang of ['es', 'en'] as const) systems.set(lang, await agentInstruction(lang))
  const results = []
  for (const item of battery) {
    let answer: EvalAnswer
    try {
      answer = await askAgent(key, systems.get(item.lang)!, item, fetcher)
    } catch (error) {
      answer = { text: `[error: ${error instanceof Error ? error.message : 'desconocido'}]`, tools: [], latencyMs: 0, costUsd: 0 }
    }
    results.push({ item, answer, grade: gradeAnswer(item, answer) })
  }
  const at = new Date().toISOString()
  return summarizeRun({ id: at.replace(/[:.]/g, '-'), at, model: EVAL_MODEL, instructionHash: instructionHash(systems.get('es')!) }, results)
}
