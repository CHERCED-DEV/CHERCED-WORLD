import type { Localized } from '@/content/types'

export const OBRA_KINDS = ['footing', 'column', 'beam', 'slab'] as const

export type ObraKind = (typeof OBRA_KINDS)[number]

export const OBRA_DIMENSIONS = ['a', 'b', 'c'] as const

export type ObraDimension = (typeof OBRA_DIMENSIONS)[number]

export type ObraValues = { count: number } & Record<ObraDimension, number>

export type ObraField = keyof ObraValues

export type ObraEntry = {
  id: string
  day: number
  kind: ObraKind
  values: ObraValues
  text: Localized
  labels: Record<ObraDimension, Localized>
}

export const OBRA_PRICE_IDS = ['concrete', 'steel', 'formwork', 'labor'] as const

export type ObraPriceId = (typeof OBRA_PRICE_IDS)[number]

export type ObraUnit = 'm3' | 'kg' | 'm2'

export type ObraExampleValue = { value: number; example: true }

export type ObraPrice = ObraExampleValue & { id: ObraPriceId; label: Localized; unit: ObraUnit }

export type ObraLimits = { min: number; max: number; integer: boolean }

export const OBRA_LIMITS: Readonly<Record<ObraField, ObraLimits>> = {
  count: { min: 0, max: 200, integer: true },
  a: { min: 0.05, max: 30, integer: false },
  b: { min: 0.05, max: 30, integer: false },
  c: { min: 0.05, max: 30, integer: false },
}

export const OBRA_UNIT_SYMBOL: Readonly<Record<ObraUnit, string>> = { m3: 'm³', kg: 'kg', m2: 'm²' }

export const OBRA_CURRENCY = 'COP'

export const OBRA_SAMPLE = {
  fictional: true,
  title: {
    es: 'Bitácora de ejemplo: la estructura de una casa de dos pisos',
    en: 'Sample log: the structure of a two-story house',
  },
  summary: {
    es: 'Cuatro fundidas anotadas en la bitácora. Python las lee, saca las cantidades de concreto, acero y formaleta, y arma el estimado en pesos colombianos.',
    en: 'Four pours written down in the log. Python reads them, works out the quantities of concrete, steel and formwork, and builds the estimate in Colombian pesos.',
  },
  examplePrices: {
    es: 'Precios y cuantías de ejemplo: no son de ningún proveedor ni de una obra real.',
    en: 'Sample prices and steel ratios: they are not from any supplier or real site.',
  },
} as const satisfies { fictional: true; title: Localized; summary: Localized; examplePrices: Localized }

export const OBRA_LOG: readonly ObraEntry[] = [
  {
    id: 'Z-1',
    day: 1,
    kind: 'footing',
    values: { count: 6, a: 1.2, b: 1.2, c: 0.4 },
    text: {
      es: 'Fundida de zapatas Z-1 (cantidad: {count}) de {a} × {b} m en planta y {c} m de alto.',
      en: 'Pour of footings Z-1 (count: {count}), {a} × {b} m in plan and {c} m high.',
    },
    labels: {
      a: { es: 'Largo', en: 'Length' },
      b: { es: 'Ancho', en: 'Width' },
      c: { es: 'Alto', en: 'Height' },
    },
  },
  {
    id: 'C-1',
    day: 4,
    kind: 'column',
    values: { count: 6, a: 0.3, b: 0.3, c: 2.7 },
    text: {
      es: 'Fundida de columnas C-1 (cantidad: {count}) de {a} × {b} m de sección y {c} m de alto.',
      en: 'Pour of columns C-1 (count: {count}), {a} × {b} m in section and {c} m high.',
    },
    labels: {
      a: { es: 'Ancho', en: 'Width' },
      b: { es: 'Fondo', en: 'Depth' },
      c: { es: 'Alto', en: 'Height' },
    },
  },
  {
    id: 'V-1',
    day: 9,
    kind: 'beam',
    values: { count: 4, a: 0.3, b: 0.4, c: 5 },
    text: {
      es: 'Fundida de vigas V-1 (cantidad: {count}) de {a} m de base, {b} m de altura y {c} m de largo.',
      en: 'Pour of beams V-1 (count: {count}), {a} m wide, {b} m deep and {c} m long.',
    },
    labels: {
      a: { es: 'Base', en: 'Width' },
      b: { es: 'Altura', en: 'Depth' },
      c: { es: 'Largo', en: 'Length' },
    },
  },
  {
    id: 'P-1',
    day: 12,
    kind: 'slab',
    values: { count: 1, a: 6, b: 8, c: 0.12 },
    text: {
      es: 'Fundida de la placa maciza P-1 (cantidad: {count}) de {a} × {b} m y {c} m de espesor.',
      en: 'Pour of solid slab P-1 (count: {count}), {a} × {b} m and {c} m thick.',
    },
    labels: {
      a: { es: 'Largo', en: 'Length' },
      b: { es: 'Ancho', en: 'Width' },
      c: { es: 'Espesor', en: 'Thickness' },
    },
  },
]

export const OBRA_PRICES: readonly ObraPrice[] = [
  { id: 'concrete', label: { es: 'Concreto de 3.000 psi', en: '3,000 psi concrete' }, unit: 'm3', value: 620_000, example: true },
  { id: 'steel', label: { es: 'Acero de refuerzo', en: 'Reinforcing steel' }, unit: 'kg', value: 5_400, example: true },
  { id: 'formwork', label: { es: 'Formaleta', en: 'Formwork' }, unit: 'm2', value: 42_000, example: true },
  { id: 'labor', label: { es: 'Mano de obra de la fundida', en: 'Pouring labor' }, unit: 'm3', value: 180_000, example: true },
]

export const OBRA_STEEL_RATIOS: Readonly<Record<ObraKind, ObraExampleValue & { label: Localized }>> = {
  footing: { value: 70, example: true, label: { es: 'Zapatas', en: 'Footings' } },
  column: { value: 160, example: true, label: { es: 'Columnas', en: 'Columns' } },
  beam: { value: 130, example: true, label: { es: 'Vigas', en: 'Beams' } },
  slab: { value: 90, example: true, label: { es: 'Placa', en: 'Slab' } },
}

export const OBRA_CONTINGENCY: ObraExampleValue = { value: 0.05, example: true }
