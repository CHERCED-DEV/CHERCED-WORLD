import { describe, expect, it, vi } from 'vitest'
import { ESTIMATE_PY } from '@/lib/ailab/pyodide/estimate-source'
import { initialDraft, obraInput, readDraft } from '@/lib/ailab/pyodide/input'
import { assertObraInput, createObraEngine, parseEstimate, type PyodideRuntime } from '@/lib/ailab/pyodide/engine'
import type { ObraEstimate, ObraInput, ObraProgress } from '@/lib/ailab/pyodide/protocol'

const ESTIMATE: ObraEstimate = {
  items: [{ id: 'Z-1', volume: 3.46, formwork: 11.52, steel: 242 }],
  lines: [{ id: 'concrete', quantity: 3.46, unit: 'm3', price: 620_000, cost: 2_145_200 }],
  subtotal: 2_145_200,
  contingency: 107_260,
  total: 2_252_460,
}

function sampleInput(): ObraInput {
  return obraInput(readDraft(initialDraft('es')).values!)
}

function fakeRuntime(options: { define?: boolean; reply?: (payload: string) => unknown } = {}) {
  const calls: string[] = []
  const payloads: string[] = []
  const entry = vi.fn((payload: string) => {
    payloads.push(payload)
    return options.reply ? options.reply(payload) : JSON.stringify(ESTIMATE)
  })
  const runtime: PyodideRuntime = {
    version: '0.29.0',
    loadPackage: vi.fn(async (names: string | string[]) => {
      calls.push(`loadPackage:${[names].flat().join(',')}`)
    }),
    runPython: vi.fn((code: string) => {
      if (code.includes('sys.version')) return '3.13.2'
      if (code.includes('numpy.__version__')) return '2.2.5'
      calls.push('runPython:source')
      return undefined
    }),
    globals: { get: (name: string) => (options.define === false ? undefined : name === 'estimate_json' ? entry : undefined) },
  }
  return { runtime, calls, payloads, entry }
}

function context() {
  const stages: ObraProgress['stage'][] = []
  return {
    stages,
    ctx: {
      progress: (progress: ObraProgress) => {
        stages.push(progress.stage)
      },
      checkpoint: vi.fn(async () => {}),
    },
  }
}

describe('motor de Obra en el worker de Pyodide (T743, R-705)', () => {
  it('carga Pyodide, numpy y estimate.py en ese orden, y dice qué versiones corren', async () => {
    const fake = fakeRuntime()
    const load = vi.fn(async () => fake.runtime)
    const engine = createObraEngine({ load, now: () => 0 })
    const { stages, ctx } = context()
    const ready = await engine.handle({ type: 'load', source: ESTIMATE_PY }, ctx)
    expect(stages).toEqual(['core', 'numpy', 'source'])
    expect(fake.calls).toEqual(['loadPackage:numpy', 'runPython:source'])
    expect(ready).toEqual({ type: 'ready', ms: 0, pyodide: '0.29.0', python: '3.13.2', numpy: '2.2.5' })
    expect(ctx.checkpoint).toHaveBeenCalledTimes(2)
    expect(fake.runtime.runPython).toHaveBeenCalledWith(ESTIMATE_PY)
  })

  it('no vuelve a descargar ni a correr el código si ya está cargado', async () => {
    const fake = fakeRuntime()
    const load = vi.fn(async () => fake.runtime)
    const engine = createObraEngine({ load })
    await engine.handle({ type: 'load', source: ESTIMATE_PY }, context().ctx)
    await engine.handle({ type: 'load', source: ESTIMATE_PY }, context().ctx)
    expect(load).toHaveBeenCalledTimes(1)
    expect(fake.calls.filter((call) => call === 'runPython:source')).toHaveLength(1)
  })

  it('si la descarga falla, el siguiente intento vuelve a cargar', async () => {
    const fake = fakeRuntime()
    const load = vi.fn<() => Promise<PyodideRuntime>>().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(fake.runtime)
    const engine = createObraEngine({ load })
    await expect(engine.handle({ type: 'load', source: ESTIMATE_PY }, context().ctx)).rejects.toThrow('Failed to fetch')
    await expect(engine.handle({ type: 'load', source: ESTIMATE_PY }, context().ctx)).resolves.toMatchObject({ type: 'ready' })
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('una cancelación en medio de la carga se respeta', async () => {
    const fake = fakeRuntime()
    const engine = createObraEngine({ load: async () => fake.runtime })
    const abort = Object.assign(new Error('cancelado'), { name: 'AbortError' })
    const ctx = { progress: () => {}, checkpoint: vi.fn(async () => Promise.reject(abort)) }
    await expect(engine.handle({ type: 'load', source: ESTIMATE_PY }, ctx)).rejects.toMatchObject({ name: 'AbortError' })
    expect(fake.calls).toEqual([])
  })

  it('el código debe definir estimate_json', async () => {
    const engine = createObraEngine({ load: async () => fakeRuntime({ define: false }).runtime })
    await expect(engine.handle({ type: 'load', source: 'x = 1' }, context().ctx)).rejects.toThrow(/estimate_json/)
  })

  it('no calcula antes de cargar Python', async () => {
    const engine = createObraEngine({ load: async () => fakeRuntime().runtime })
    await expect(engine.handle({ type: 'estimate', input: sampleInput() }, context().ctx)).rejects.toThrow(/todavía no está listo/)
  })

  it('le pasa a Python la entrada en JSON y devuelve el estimado con su tiempo', async () => {
    const fake = fakeRuntime()
    let clock = 10
    const engine = createObraEngine({ load: async () => fake.runtime, now: () => (clock += 2.5) })
    await engine.handle({ type: 'load', source: ESTIMATE_PY }, context().ctx)
    const input = sampleInput()
    const result = await engine.handle({ type: 'estimate', input }, context().ctx)
    expect(JSON.parse(fake.payloads[0]!)).toEqual(input)
    expect(result).toEqual({ type: 'estimate', estimate: ESTIMATE, ms: 2.5 })
  })

  it('rechaza una entrada mal formada y una respuesta incompleta', async () => {
    const fake = fakeRuntime({ reply: () => JSON.stringify({ items: [], lines: [], subtotal: 1 }) })
    const engine = createObraEngine({ load: async () => fake.runtime })
    await engine.handle({ type: 'load', source: ESTIMATE_PY }, context().ctx)
    const bad = { ...sampleInput(), contingency: Number.NaN }
    await expect(engine.handle({ type: 'estimate', input: bad }, context().ctx)).rejects.toThrow(TypeError)
    await expect(engine.handle({ type: 'estimate', input: sampleInput() }, context().ctx)).rejects.toThrow(/incompleto/)
    expect(() => parseEstimate(42)).toThrow(TypeError)
    expect(() => assertObraInput({ ...sampleInput(), items: [{ id: 'Z-1', kind: 'footing', count: -1, a: 1, b: 1, c: 1 }] })).toThrow(TypeError)
    expect(parseEstimate(JSON.stringify(ESTIMATE))).toEqual(ESTIMATE)
  })
})
