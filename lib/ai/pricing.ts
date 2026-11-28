export const PRICES_CHECKED_AT = '2026-11-14'

export const PRICES_SOURCE = 'https://ai.google.dev/gemini-api/docs/pricing'

export const USD_TO_COP = 3297

export const USD_TO_COP_DATE = '2026-11-11'

export const USD_TO_COP_SOURCE = 'TRM, Superintendencia Financiera de Colombia'

export type Modality = 'text' | 'audio' | 'image'

export type LongContextPrice = { aboveInputTokens: number; input: number; output: number }

export type ModelPrice = {
  input: Readonly<Partial<Record<Modality, number>>> & { text: number }
  output: Readonly<Partial<Record<Modality, number>>> & { text: number }
  validUntil: string | null
  longContext?: LongContextPrice
}

export type PriceProvider = 'gemini' | 'claude' | 'openai'

export type PriceSource = { url: string; checkedAt: string }

export const PRICE_SOURCES: Readonly<Record<PriceProvider, PriceSource>> = {
  gemini: { url: PRICES_SOURCE, checkedAt: '2026-11-27' },
  claude: { url: 'https://platform.claude.com/docs/en/about-claude/pricing', checkedAt: '2026-11-27' },
  openai: { url: 'https://developers.openai.com/api/docs/pricing', checkedAt: '2026-11-27' },
}

export const MODEL_PRICES = {
  'gemini-3.8-live': {
    input: { text: 0.75, audio: 3, image: 1 },
    output: { text: 4.5, audio: 12 },
    validUntil: null,
  },
  'gemini-3.8-flash': {
    input: { text: 0.75 },
    output: { text: 3.75 },
    validUntil: '2026-12-31',
  },
  'gemini-3.8-flash-tts': {
    input: { text: 0.75 },
    output: { text: 9, audio: 9 },
    validUntil: '2026-12-31',
  },
  'gemini-3.1-flash-image': {
    input: { text: 0.5, image: 0.5 },
    output: { text: 3, image: 52 },
    validUntil: null,
  },
  'gemini-4-argon': {
    input: { text: 4 },
    output: { text: 20 },
    validUntil: null,
  },
  'claude-haiku-5-5': {
    input: { text: 0.1 },
    output: { text: 0.5 },
    validUntil: null,
    longContext: { aboveInputTokens: 100_000, input: 0.5, output: 2.5 },
  },
  'claude-sonnet-5-5': {
    input: { text: 2 },
    output: { text: 10 },
    validUntil: null,
  },
  'claude-opus-5-5': {
    input: { text: 4 },
    output: { text: 20 },
    validUntil: null,
  },
  'claude-sonnet-5': {
    input: { text: 2 },
    output: { text: 10 },
    validUntil: null,
  },
  'claude-opus-5': {
    input: { text: 5 },
    output: { text: 25 },
    validUntil: null,
  },
  'claude-opus-4-8': {
    input: { text: 5 },
    output: { text: 25 },
    validUntil: null,
  },
  'gpt-6-luna': {
    input: { text: 0.1 },
    output: { text: 0.5 },
    validUntil: null,
    longContext: { aboveInputTokens: 272_000, input: 0.2, output: 0.75 },
  },
  'gpt-6.2-sol': {
    input: { text: 2 },
    output: { text: 10 },
    validUntil: null,
    longContext: { aboveInputTokens: 272_000, input: 4, output: 15 },
  },
  'gpt-6.2-astra': {
    input: { text: 8 },
    output: { text: 40 },
    validUntil: null,
    longContext: { aboveInputTokens: 272_000, input: 16, output: 60 },
  },
} as const satisfies Record<string, ModelPrice>

export type PricedModel = keyof typeof MODEL_PRICES

const PER_TOKEN = 1_000_000

export function isPricedModel(model: string): model is PricedModel {
  return Object.hasOwn(MODEL_PRICES, model)
}

export function tokenCost(model: PricedModel, side: 'input' | 'output', modality: Modality, tokens: number): number {
  if (!Number.isFinite(tokens) || tokens <= 0) return 0
  const prices: Partial<Record<Modality, number>> = MODEL_PRICES[model][side]
  const price = prices[modality] ?? MODEL_PRICES[model][side].text
  return (tokens * price) / PER_TOKEN
}

export function toCop(usd: number): number {
  return usd * USD_TO_COP
}
