import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import {
  OBRA_CONTINGENCY,
  OBRA_DIMENSIONS,
  OBRA_KINDS,
  OBRA_LIMITS,
  OBRA_LOG,
  OBRA_PRICES,
  OBRA_PRICE_IDS,
  OBRA_SAMPLE,
  OBRA_STEEL_RATIOS,
} from '@/content/ailab/showcases/obra'
import { ESTIMATE_FILE, ESTIMATE_PY } from '@/lib/ailab/pyodide/estimate-source'
import {
  OBRA_FIELDS,
  entryText,
  formatMoney,
  initialDraft,
  inputKey,
  obraInput,
  parseField,
  readDraft,
} from '@/lib/ailab/pyodide/input'
import { ESTIMATE_ENTRY, PYODIDE_INDEX_URL, PYODIDE_MODULE_URL, PYODIDE_VERSION } from '@/lib/ailab/pyodide/protocol'

const ROOT = process.cwd()

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8').replace(/\r\n/g, '\n')
}

describe('los precios de Obra son de ejemplo y lo dicen (US9 escenario 3, FR-358)', () => {
  it('cada precio, cuantía e imprevisto va marcado como ejemplo', () => {
    expect(OBRA_PRICES.map((price) => price.id)).toEqual([...OBRA_PRICE_IDS])
    for (const price of OBRA_PRICES) {
      expect(price.example, price.id).toBe(true)
      expect(Number.isInteger(price.value) && price.value > 0, price.id).toBe(true)
      expect(price.label.es.trim(), price.id).not.toBe('')
      expect(price.label.en.trim(), price.id).not.toBe('')
    }
    for (const kind of OBRA_KINDS) expect(OBRA_STEEL_RATIOS[kind].example, kind).toBe(true)
    expect(OBRA_CONTINGENCY.example).toBe(true)
  })

  it('la tarjeta lo dice en ES y EN: precios de ejemplo y datos inventados', () => {
    expect(OBRA_SAMPLE.fictional).toBe(true)
    expect(OBRA_SAMPLE.examplePrices.es).toMatch(/de ejemplo: no son de ningún proveedor ni de una obra real/)
    expect(OBRA_SAMPLE.examplePrices.en).toMatch(/not from any supplier or real site/)
    expect(es['ailab.a4.obra.prices']).toBe('Precios de ejemplo')
    expect(en['ailab.a4.obra.prices']).toBe('Sample prices')
    expect(es['ailab.a4.obra.madeUp']).toMatch(/^Datos inventados/)
    expect(en['ailab.a4.obra.madeUp']).toMatch(/^Made-up data/)
    expect(es['ailab.a4.despacho.madeUp']).toMatch(/^Datos inventados/)
    expect(en['ailab.a4.despacho.madeUp']).toMatch(/^Made-up data/)
  })

  it('no nombra proveedores, clientes ni el empleador', () => {
    const corpus = [read('content/ailab/showcases/obra.ts'), read('content/ailab/showcases/despacho.ts'), read(ESTIMATE_FILE)].join('\n')
    for (const pattern of [/sistecr/i, /cemex/i, /argos/i, /holcim/i, /diaco/i, /homecenter/i, /sodimac/i, /ferrasa/i, /[A-Z]:\\Users/i]) {
      expect(corpus, String(pattern)).not.toMatch(pattern)
    }
  })
})

describe('la bitácora de ejemplo (T743)', () => {
  it('cada fundida trae valores dentro de los límites, su frase y sus etiquetas en ES y EN', () => {
    expect(OBRA_LOG.map((entry) => entry.kind)).toEqual([...OBRA_KINDS])
    expect(OBRA_LOG.map((entry) => entry.day)).toEqual([...OBRA_LOG.map((entry) => entry.day)].sort((a, b) => a - b))
    for (const entry of OBRA_LOG) {
      for (const field of OBRA_FIELDS) {
        const value = entry.values[field]
        const limits = OBRA_LIMITS[field]
        expect(value, `${entry.id}.${field}`).toBeGreaterThanOrEqual(limits.min)
        expect(value, `${entry.id}.${field}`).toBeLessThanOrEqual(limits.max)
        if (limits.integer) expect(Number.isInteger(value), `${entry.id}.${field}`).toBe(true)
      }
      for (const lang of ['es', 'en'] as const) {
        for (const field of OBRA_FIELDS) expect(entry.text[lang], `${entry.id} ${lang}`).toContain(`{${field}}`)
        for (const dim of OBRA_DIMENSIONS) expect(entry.labels[dim][lang].trim(), `${entry.id} ${dim} ${lang}`).not.toBe('')
      }
    }
  })

  it('el borrador arranca con los valores de ejemplo, con la coma decimal en español', () => {
    const es = initialDraft('es')
    expect(es['Z-1']).toEqual({ count: '6', a: '1,2', b: '1,2', c: '0,4' })
    expect(initialDraft('en')['P-1']).toEqual({ count: '1', a: '6', b: '8', c: '0.12' })
    const reading = readDraft(es)
    expect(reading.errors).toEqual({})
    expect(reading.values).toEqual(Object.fromEntries(OBRA_LOG.map((entry) => [entry.id, entry.values])))
    expect(entryText(OBRA_LOG[0]!, es['Z-1']!, 'es')).toBe('Fundida de zapatas Z-1 (cantidad: 6) de 1,2 × 1,2 m en planta y 0,4 m de alto.')
  })

  it('lee números con coma o con punto y rechaza lo que no es una medida válida', () => {
    const dim = OBRA_LIMITS.a
    expect(parseField('1,25', dim)).toBe(1.25)
    expect(parseField(' 0.4 ', dim)).toBe(0.4)
    for (const bad of ['', 'abc', '-1', '1e2', '1,2,3', '0', '31', '0,01']) expect(parseField(bad, dim), bad).toBeNull()
    expect(parseField('12', OBRA_LIMITS.count)).toBe(12)
    expect(parseField('0', OBRA_LIMITS.count)).toBe(0)
    for (const bad of ['1,5', '201', '-3']) expect(parseField(bad, OBRA_LIMITS.count), bad).toBeNull()
  })

  it('marca el campo inválido y no arma la entrada hasta que se corrige', () => {
    const draft = initialDraft('es')
    draft['V-1'] = { ...draft['V-1']!, c: 'cinco' }
    const reading = readDraft(draft)
    expect(reading.values).toBeNull()
    expect(reading.errors).toEqual({ 'V-1': { c: true } })
    expect(entryText(OBRA_LOG[2]!, draft['V-1']!, 'es')).toContain('cinco m de largo')
  })

  it('la entrada para Python lleva las fundidas, los precios, las cuantías y los imprevistos', () => {
    const values = readDraft(initialDraft('en')).values!
    const input = obraInput({ ...values, 'C-1': { ...values['C-1']!, count: 8 } })
    expect(input.items).toHaveLength(4)
    expect(input.items[1]).toEqual({ id: 'C-1', kind: 'column', count: 8, a: 0.3, b: 0.3, c: 2.7 })
    expect(input.prices).toEqual({ concrete: 620_000, steel: 5_400, formwork: 42_000, labor: 180_000 })
    expect(input.ratios).toEqual({ footing: 70, column: 160, beam: 130, slab: 90 })
    expect(input.contingency).toBe(0.05)
    expect(inputKey(input)).not.toBe(inputKey(obraInput(values)))
  })

  it('el dinero sale en pesos colombianos en cada idioma', () => {
    expect(formatMoney(22_838_886, 'es').replace(/\s/g, ' ')).toBe('$ 22.838.886')
    expect(formatMoney(22_838_886, 'en').replace(/\s/g, ' ')).toBe('COP 22,838,886')
  })
})

describe('el código Python que corre es el de estimate.py (R-705)', () => {
  it('el texto que va al worker es, tal cual, lib/ailab/pyodide/estimate.py', () => {
    expect(ESTIMATE_FILE).toBe('lib/ailab/pyodide/estimate.py')
    expect(ESTIMATE_PY).toBe(read(ESTIMATE_FILE))
  })

  it('define la función de entrada y usa numpy', () => {
    expect(ESTIMATE_PY).toContain(`def ${ESTIMATE_ENTRY}(payload):`)
    expect(ESTIMATE_PY).toMatch(/^import numpy as np$/m)
    expect(ESTIMATE_PY).not.toMatch(/\b(open|eval|exec|__import__|urllib|requests|pyodide\.http)\b/)
  })

  it('Pyodide va con la versión fija 0.29.0 desde jsDelivr', () => {
    expect(PYODIDE_VERSION).toBe('0.29.0')
    expect(PYODIDE_INDEX_URL).toBe('https://cdn.jsdelivr.net/pyodide/v0.29.0/full/')
    expect(PYODIDE_MODULE_URL).toBe('https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.mjs')
  })
})
