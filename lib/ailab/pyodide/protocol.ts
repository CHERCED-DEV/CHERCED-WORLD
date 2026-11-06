import type { ObraKind, ObraPriceId, ObraUnit } from '@/content/ailab/showcases/obra'

export const PYODIDE_VERSION = '0.29.0'

export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

export const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`

export const PYODIDE_PACKAGES = ['numpy'] as const

export const ESTIMATE_ENTRY = 'estimate_json'

export type ObraItemInput = { id: string; kind: ObraKind; count: number; a: number; b: number; c: number }

export type ObraInput = {
  items: ObraItemInput[]
  prices: Record<ObraPriceId, number>
  ratios: Record<ObraKind, number>
  contingency: number
}

export type ObraItemResult = { id: string; volume: number; formwork: number; steel: number }

export type ObraLine = { id: ObraPriceId; quantity: number; unit: ObraUnit; price: number; cost: number }

export type ObraEstimate = {
  items: ObraItemResult[]
  lines: ObraLine[]
  subtotal: number
  contingency: number
  total: number
}

export type ObraLoadRequest = { type: 'load'; source: string }

export type ObraEstimateRequest = { type: 'estimate'; input: ObraInput }

export type ObraRequest = ObraLoadRequest | ObraEstimateRequest

export type ObraRuntimeInfo = { pyodide: string; python: string; numpy: string }

export type ObraReady = { type: 'ready'; ms: number } & ObraRuntimeInfo

export type ObraEstimated = { type: 'estimate'; estimate: ObraEstimate; ms: number }

export type ObraResult = ObraReady | ObraEstimated

export const OBRA_STAGES = ['core', 'numpy', 'source'] as const

export type ObraStage = (typeof OBRA_STAGES)[number]

export type ObraProgress = { stage: ObraStage }
