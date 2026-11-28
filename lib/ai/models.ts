import { isPricedModel, tokenCost, type Modality } from './pricing'

export const GEMINI_MODELS = {
  live: 'gemini-3.8-live',
  text: 'gemini-3.8-flash',
  tts: 'gemini-3.8-flash-tts',
  image: 'gemini-3.1-flash-image',
} as const

export type GeminiRole = keyof typeof GEMINI_MODELS

export const GEMINI_TTS_VOICES = ['Kore', 'Puck', 'Charon', 'Aoede'] as const

export type GeminiTtsVoice = (typeof GEMINI_TTS_VOICES)[number]

type Budget = { model: string; input: Partial<Record<Modality, number>>; output: Partial<Record<Modality, number>>; also?: readonly Budget[] }

const ARENA_COMPARISON: Budget = {
  model: 'claude-sonnet-5-5',
  input: { text: 1500 },
  output: { text: 1200 },
  also: [
    { model: GEMINI_MODELS.text, input: { text: 1500 }, output: { text: 600 } },
    { model: 'gpt-6.2-sol', input: { text: 1500 }, output: { text: 1200 } },
    { model: 'claude-haiku-5-5', input: { text: 1200 }, output: { text: 300 } },
    { model: 'gpt-6-luna', input: { text: 1200 }, output: { text: 300 } },
    { model: GEMINI_MODELS.text, input: { text: 1200 }, output: { text: 300 } },
  ],
}

const GATES_RUN: Budget = {
  model: GEMINI_MODELS.text,
  input: { text: 1800 },
  output: { text: 1500 },
  also: [
    { model: GEMINI_MODELS.text, input: { text: 2500 }, output: { text: 1500 } },
    { model: 'claude-sonnet-5-5', input: { text: 2800 }, output: { text: 700 } },
    { model: 'gpt-6.2-sol', input: { text: 2800 }, output: { text: 700 } },
    { model: 'claude-haiku-5-5', input: { text: 1500 }, output: { text: 300 } },
    { model: 'gpt-6-luna', input: { text: 1500 }, output: { text: 300 } },
  ],
}

export const TYPICAL_USE: Record<string, Budget> = {
  V5: { model: GEMINI_MODELS.live, input: { text: 9000, audio: 6000 }, output: { text: 1200, audio: 6000 } },
  A6: { model: GEMINI_MODELS.text, input: { text: 7000 }, output: { text: 1800 } },
  code: { model: GEMINI_MODELS.text, input: { text: 8000 }, output: { text: 1500 } },
  summary: { model: GEMINI_MODELS.text, input: { text: 3000 }, output: { text: 300 } },
  diagram: { model: GEMINI_MODELS.text, input: { text: 1500 }, output: { text: 1200 } },
  A9: { model: GEMINI_MODELS.text, input: { text: 1500 }, output: { text: 1200 } },
  A7: { model: GEMINI_MODELS.text, input: { text: 1500 }, output: { text: 2500 } },
  spec: { model: GEMINI_MODELS.text, input: { text: 1500 }, output: { text: 2500 } },
  shot: { model: GEMINI_MODELS.text, input: { text: 800, image: 1300 }, output: { text: 3000 } },
  A8: { model: GEMINI_MODELS.text, input: { text: 800, image: 1300 }, output: { text: 3000 } },
  pixel: { model: GEMINI_MODELS.image, input: { text: 400, image: 1300 }, output: { image: 1290 } },
  panel: { model: GEMINI_MODELS.text, input: { text: 6000 }, output: { text: 5000 } },
  cover: { model: GEMINI_MODELS.image, input: { text: 200 }, output: { image: 1290 } },
  V6: { model: GEMINI_MODELS.live, input: { text: 400, audio: 4500 }, output: { text: 600, audio: 4500 } },
  P1: { model: GEMINI_MODELS.image, input: { text: 400, image: 1300 }, output: { image: 1290 } },
  listen: { model: GEMINI_MODELS.tts, input: { text: 1500 }, output: { audio: 15000 } },
  listenChunk: { model: GEMINI_MODELS.tts, input: { text: 60 }, output: { audio: 400 } },
  arena: ARENA_COMPARISON,
  A10: ARENA_COMPARISON,
  gates: GATES_RUN,
  A12: GATES_RUN,
}

function budgetCostUsd(budget: Budget): number | null {
  if (!isPricedModel(budget.model)) return null
  const model = budget.model
  let usd = 0
  for (const [modality, tokens] of Object.entries(budget.input) as Array<[Modality, number]>) usd += tokenCost(model, 'input', modality, tokens)
  for (const [modality, tokens] of Object.entries(budget.output) as Array<[Modality, number]>) usd += tokenCost(model, 'output', modality, tokens)
  for (const part of budget.also ?? []) {
    const extra = budgetCostUsd(part)
    if (extra === null) return null
    usd += extra
  }
  return usd
}

export function typicalCostUsd(id: string): number | null {
  const budget = TYPICAL_USE[id]
  return budget ? budgetCostUsd(budget) : null
}

export function formatUsd(usd: number, lang: 'es' | 'en'): string {
  const digits = usd < 0.01 ? 3 : 2
  return new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(usd)
}
