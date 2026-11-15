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

type Budget = { model: string; input: Partial<Record<Modality, number>>; output: Partial<Record<Modality, number>> }

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
  listen: { model: GEMINI_MODELS.tts, input: { text: 1500 }, output: { audio: 15000 } },
  listenChunk: { model: GEMINI_MODELS.tts, input: { text: 60 }, output: { audio: 400 } },
}

export function typicalCostUsd(id: string): number | null {
  const budget = TYPICAL_USE[id]
  if (!budget || !isPricedModel(budget.model)) return null
  const model = budget.model
  let usd = 0
  for (const [modality, tokens] of Object.entries(budget.input) as Array<[Modality, number]>) usd += tokenCost(model, 'input', modality, tokens)
  for (const [modality, tokens] of Object.entries(budget.output) as Array<[Modality, number]>) usd += tokenCost(model, 'output', modality, tokens)
  return usd
}

export function formatUsd(usd: number, lang: 'es' | 'en'): string {
  const digits = usd < 0.01 ? 3 : 2
  return new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(usd)
}
