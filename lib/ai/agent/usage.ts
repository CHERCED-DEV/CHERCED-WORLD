import { isPricedModel, tokenCost, type Modality } from '@/lib/ai/pricing'

export type TokenSplit = Readonly<Record<Modality, number>>

export type LiveUsage = {
  prompt: number
  response: number
  thoughts: number
  toolPrompt: number
  cached: number
  total: number
  input: TokenSplit
  output: TokenSplit
}

type Json = Record<string, unknown>

const EMPTY: TokenSplit = { text: 0, audio: 0, image: 0 }

function record(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

function modalityOf(value: unknown): Modality | null {
  if (value === 'TEXT') return 'text'
  if (value === 'AUDIO') return 'audio'
  if (value === 'IMAGE' || value === 'VIDEO' || value === 'DOCUMENT') return 'image'
  return null
}

function split(details: unknown): { tokens: TokenSplit; listed: number } {
  const tokens = { ...EMPTY }
  let listed = 0
  if (!Array.isArray(details)) return { tokens, listed }
  for (const entry of details) {
    const detail = record(entry)
    const modality = modalityOf(detail?.modality)
    const value = count(detail?.tokenCount)
    if (!modality || value === 0) continue
    tokens[modality] += value
    listed += value
  }
  return { tokens, listed }
}

function add(a: TokenSplit, b: TokenSplit): TokenSplit {
  return { text: a.text + b.text, audio: a.audio + b.audio, image: a.image + b.image }
}

export function parseUsage(value: unknown, fallbackOutput: Modality = 'audio'): LiveUsage | null {
  const usage = record(value)
  if (!usage) return null
  const prompt = count(usage.promptTokenCount)
  const response = count(usage.responseTokenCount) || count(usage.candidatesTokenCount)
  const thoughts = count(usage.thoughtsTokenCount)
  const toolPrompt = count(usage.toolUsePromptTokenCount)
  const cached = count(usage.cachedContentTokenCount)
  const total = count(usage.totalTokenCount) || prompt + response + thoughts + toolPrompt
  if (total === 0) return null

  const promptSplit = split(usage.promptTokensDetails)
  const toolSplit = split(usage.toolUsePromptTokensDetails)
  const responseSplit = split(usage.responseTokensDetails ?? usage.candidatesTokensDetails)

  const input = add(promptSplit.tokens, toolSplit.tokens)
  const unlistedInput = Math.max(0, prompt - promptSplit.listed) + Math.max(0, toolPrompt - toolSplit.listed)
  const output = { ...responseSplit.tokens }
  const unlistedOutput = Math.max(0, response - responseSplit.listed)
  output[fallbackOutput] += unlistedOutput
  output.text += thoughts

  return {
    prompt,
    response,
    thoughts,
    toolPrompt,
    cached,
    total,
    input: { ...input, text: input.text + unlistedInput },
    output,
  }
}

export function mergeUsage(current: LiveUsage | null, next: LiveUsage): LiveUsage {
  if (!current) return next
  return next.total >= current.total ? next : current
}

export function usageCost(model: string, usage: LiveUsage | null): number {
  if (!usage || !isPricedModel(model)) return 0
  let usd = 0
  for (const modality of ['text', 'audio', 'image'] as const) {
    usd += tokenCost(model, 'input', modality, usage.input[modality])
    usd += tokenCost(model, 'output', modality, usage.output[modality])
  }
  return usd
}
