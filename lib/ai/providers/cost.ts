import { isPricedModel, MODEL_PRICES, type ModelPrice } from '@/lib/ai/pricing'
import { fallbackTargets, portModels } from './models'
import type { TokenUsage } from './types'

const PER_TOKEN = 1_000_000

const SNAPSHOT = /-(?:\d{4}-\d{2}-\d{2}|\d{8})$/

export function modelPrice(model: string): ModelPrice | null {
  if (isPricedModel(model)) return MODEL_PRICES[model]
  const base = model.replace(/^models\//, '').replace(SNAPSHOT, '')
  return isPricedModel(base) ? MODEL_PRICES[base] : null
}

export function isModelPriced(model: string): boolean {
  return modelPrice(model) !== null
}

export function priceRates(price: ModelPrice, inputTokens: number): { input: number; output: number } {
  const long = price.longContext
  if (long && inputTokens > long.aboveInputTokens) return { input: long.input, output: long.output }
  return { input: price.input.text, output: price.output.text }
}

function tokens(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function usageCostUsd(price: ModelPrice, usage: TokenUsage): number {
  const rates = priceRates(price, usage.inputTokens)
  return (tokens(usage.inputTokens) * rates.input + tokens(usage.outputTokens) * rates.output) / PER_TOKEN
}

export function costUsd(model: string, usage: TokenUsage): number | null {
  const price = modelPrice(model)
  return price ? usageCostUsd(price, usage) : null
}

export function servedCostUsd(served: string | null, requested: string, usage: TokenUsage): number {
  return costUsd(served ?? requested, usage) ?? costUsd(requested, usage) ?? 0
}

export function reservationCostUsd(model: string, usage: TokenUsage): number | null {
  const own = costUsd(model, usage)
  if (own === null) return null
  return Math.max(own, ...fallbackTargets(model).map((target) => costUsd(target, usage) ?? own))
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3)
}

export function roundUsd(usd: number, digits = 6): number {
  const factor = 10 ** digits
  return Math.round(usd * factor) / factor
}

export function pricesToReview(today: string, models: readonly string[] = portModels()): string[] {
  return models.filter((model) => {
    const until = modelPrice(model)?.validUntil
    return typeof until === 'string' && until < today
  })
}
