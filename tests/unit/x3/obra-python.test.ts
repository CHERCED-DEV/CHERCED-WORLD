import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OBRA_LOG } from '@/content/ailab/showcases/obra'
import { ESTIMATE_FILE } from '@/lib/ailab/pyodide/estimate-source'
import { obraInput } from '@/lib/ailab/pyodide/input'
import type { ObraEstimate, ObraInput } from '@/lib/ailab/pyodide/protocol'

const RUNNER = [
  'import importlib.util, sys',
  'spec = importlib.util.spec_from_file_location("estimate", sys.argv[1])',
  'module = importlib.util.module_from_spec(spec)',
  'spec.loader.exec_module(module)',
  'print(module.estimate_json(sys.stdin.read()))',
].join('\n')

function findPython(): string | null {
  for (const command of ['python3', 'python']) {
    const probe = spawnSync(command, ['-I', '-c', 'import numpy'], { encoding: 'utf8' })
    if (probe.status === 0) return command
  }
  return null
}

const PYTHON = findPython()

function runPython(input: ObraInput): ObraEstimate {
  const result = spawnSync(PYTHON!, ['-I', '-c', RUNNER, join(process.cwd(), ESTIMATE_FILE)], { input: JSON.stringify(input), encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr)
  return JSON.parse(result.stdout) as ObraEstimate
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits
  return Math.floor(value * factor + 0.5) / factor
}

function reference(input: ObraInput): ObraEstimate {
  const items = input.items.map((item) => {
    const volume = item.count * item.a * item.b * item.c
    const formwork =
      item.kind === 'beam' ? item.count * (item.a + 2 * item.b) * item.c
      : item.kind === 'slab' ? item.count * item.a * item.b
      : item.count * 2 * (item.a + item.b) * item.c
    return { id: item.id, volume: round(volume, 2), formwork: round(formwork, 2), steel: round(volume * input.ratios[item.kind]) }
  })
  const sum = (key: 'volume' | 'formwork' | 'steel') => items.reduce((total, item) => total + item[key], 0)
  const concrete = round(sum('volume'), 2)
  const quantities = { concrete: [concrete, 'm3'], steel: [round(sum('steel')), 'kg'], formwork: [round(sum('formwork'), 2), 'm2'], labor: [concrete, 'm3'] } as const
  const lines = (Object.keys(quantities) as Array<keyof typeof quantities>).map((id) => {
    const [quantity, unit] = quantities[id]
    return { id, quantity, unit, price: input.prices[id], cost: round(quantity * input.prices[id]) }
  })
  const subtotal = lines.reduce((total, line) => total + line.cost, 0)
  const contingency = round(subtotal * input.contingency)
  return { items, lines, subtotal, contingency, total: subtotal + contingency }
}

const sample = () => obraInput(Object.fromEntries(OBRA_LOG.map((entry) => [entry.id, entry.values])))

describe.skipIf(!PYTHON)('estimate.py con Python y numpy de verdad (si están en la máquina)', () => {
  it('con la bitácora de ejemplo da el estimado esperado', () => {
    const result = runPython(sample())
    expect(result.items.map((item) => [item.id, item.volume, item.formwork, item.steel])).toEqual([
      ['Z-1', 3.46, 11.52, 242],
      ['C-1', 1.46, 19.44, 233],
      ['V-1', 2.4, 22, 312],
      ['P-1', 5.76, 48, 518],
    ])
    expect(result.lines.map((line) => [line.id, line.quantity, line.cost])).toEqual([
      ['concrete', 13.08, 8_109_600],
      ['steel', 1305, 7_047_000],
      ['formwork', 100.96, 4_240_320],
      ['labor', 13.08, 2_354_400],
    ])
    expect([result.subtotal, result.contingency, result.total]).toEqual([21_751_320, 1_087_566, 22_838_886])
  })

  it('coincide con una cuenta hecha a mano en TypeScript al cambiar los valores', () => {
    const base = sample()
    const variants: ObraInput[] = [
      { ...base, items: base.items.map((item) => (item.id === 'C-1' ? { ...item, count: 9, c: 3.15 } : item)) },
      { ...base, items: base.items.map((item) => (item.id === 'P-1' ? { ...item, a: 7.35, b: 9.8, c: 0.15 } : item)) },
      { ...base, items: base.items.map((item) => ({ ...item, count: 0 })) },
    ]
    for (const input of variants) {
      const python = runPython(input)
      const expected = reference(input)
      expect(python.items).toEqual(expected.items)
      for (const [index, line] of python.lines.entries()) {
        expect(line.id).toBe(expected.lines[index]!.id)
        expect(line.quantity).toBeCloseTo(expected.lines[index]!.quantity, 2)
        expect(Math.abs(line.cost - expected.lines[index]!.cost)).toBeLessThanOrEqual(1)
      }
      expect(Math.abs(python.total - expected.total)).toBeLessThanOrEqual(2)
    }
  })
})
