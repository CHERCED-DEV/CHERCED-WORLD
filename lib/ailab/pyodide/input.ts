import {
  OBRA_CONTINGENCY,
  OBRA_CURRENCY,
  OBRA_LIMITS,
  OBRA_LOG,
  OBRA_PRICES,
  OBRA_STEEL_RATIOS,
  type ObraEntry,
  type ObraField,
  type ObraKind,
  type ObraLimits,
  type ObraPriceId,
  type ObraValues,
} from '@/content/ailab/showcases/obra'
import type { Locale } from '@/lib/i18n/config'
import type { ObraInput } from './protocol'

export const OBRA_FIELDS: readonly ObraField[] = ['count', 'a', 'b', 'c']

export type ObraDraft = Record<string, Record<ObraField, string>>

export type ObraDraftErrors = Record<string, Partial<Record<ObraField, true>>>

export type ObraReading = { values: Record<string, ObraValues> | null; errors: ObraDraftErrors }

function numberLocale(lang: Locale): string {
  return lang === 'es' ? 'es-CO' : 'en-US'
}

export function formatDecimal(value: number, lang: Locale, digits = 2): string {
  return new Intl.NumberFormat(numberLocale(lang), { maximumFractionDigits: digits, useGrouping: false }).format(value)
}

export function formatQuantity(value: number, lang: Locale, digits = 2): string {
  return new Intl.NumberFormat(numberLocale(lang), { maximumFractionDigits: digits }).format(value)
}

export function formatMoney(value: number, lang: Locale): string {
  return new Intl.NumberFormat(numberLocale(lang), { style: 'currency', currency: OBRA_CURRENCY, maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number, lang: Locale): string {
  return new Intl.NumberFormat(numberLocale(lang), { style: 'percent', maximumFractionDigits: 1 }).format(value)
}

export function parseField(text: string, limits: ObraLimits): number | null {
  const clean = text.trim().replace(',', '.')
  const pattern = limits.integer ? /^\d+$/ : /^\d+(\.\d+)?$/
  if (!pattern.test(clean)) return null
  const value = Number(clean)
  if (!Number.isFinite(value) || value < limits.min || value > limits.max) return null
  return value
}

export function initialDraft(lang: Locale, log: readonly ObraEntry[] = OBRA_LOG): ObraDraft {
  return Object.fromEntries(
    log.map((entry) => [entry.id, Object.fromEntries(OBRA_FIELDS.map((field) => [field, formatDecimal(entry.values[field], lang)])) as Record<ObraField, string>]),
  )
}

export function readDraft(draft: ObraDraft, log: readonly ObraEntry[] = OBRA_LOG): ObraReading {
  const values: Record<string, ObraValues> = {}
  const errors: ObraDraftErrors = {}
  for (const entry of log) {
    const row = draft[entry.id]
    const parsed = {} as ObraValues
    for (const field of OBRA_FIELDS) {
      const value = row ? parseField(row[field], OBRA_LIMITS[field]) : null
      if (value === null) errors[entry.id] = { ...errors[entry.id], [field]: true }
      else parsed[field] = value
    }
    values[entry.id] = parsed
  }
  return { values: Object.keys(errors).length === 0 ? values : null, errors }
}

export function obraInput(values: Record<string, ObraValues>, log: readonly ObraEntry[] = OBRA_LOG): ObraInput {
  return {
    items: log.map((entry) => ({ id: entry.id, kind: entry.kind, ...(values[entry.id] ?? entry.values) })),
    prices: Object.fromEntries(OBRA_PRICES.map((price) => [price.id, price.value])) as Record<ObraPriceId, number>,
    ratios: Object.fromEntries(Object.entries(OBRA_STEEL_RATIOS).map(([kind, ratio]) => [kind, ratio.value])) as Record<ObraKind, number>,
    contingency: OBRA_CONTINGENCY.value,
  }
}

export function inputKey(input: ObraInput): string {
  return JSON.stringify(input)
}

export function entryText(entry: ObraEntry, row: Record<ObraField, string>, lang: Locale): string {
  return entry.text[lang].replace(/\{(count|a|b|c)\}/g, (_, field: ObraField) => row[field].trim() || '—')
}
