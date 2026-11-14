export const PRICES_CHECKED_AT = '2026-11-14'

export const PRICES_SOURCE = 'https://ai.google.dev/gemini-api/docs/pricing'

export const USD_TO_COP = 3297

export const USD_TO_COP_DATE = '2026-11-11'

export const USD_TO_COP_SOURCE = 'TRM, Superintendencia Financiera de Colombia'

export type Modality = 'text' | 'audio' | 'image'

export type ModelPrice = {
  input: Readonly<Partial<Record<Modality, number>>> & { text: number }
  output: Readonly<Partial<Record<Modality, number>>> & { text: number }
  validUntil: string | null
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
