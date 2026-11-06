import type { LabTaskContext } from '@/lib/ailab/core/worker-runtime'
import {
  ESTIMATE_ENTRY,
  PYODIDE_PACKAGES,
  PYODIDE_VERSION,
  type ObraEstimate,
  type ObraInput,
  type ObraProgress,
  type ObraRequest,
  type ObraResult,
  type ObraRuntimeInfo,
} from './protocol'

export type PyodideRuntime = {
  version?: string
  loadPackage(names: string | string[]): Promise<unknown>
  runPython(code: string): unknown
  globals: { get(name: string): unknown }
}

export type ObraEngineDeps = {
  load: () => Promise<PyodideRuntime>
  now?: () => number
}

type Context = Pick<LabTaskContext<ObraProgress>, 'progress' | 'checkpoint'>

type Entry = (payload: string) => unknown

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function assertObraInput(input: ObraInput): void {
  const ok =
    Array.isArray(input?.items) &&
    input.items.every((item) => typeof item.id === 'string' && [item.count, item.a, item.b, item.c].every((value) => finite(value) && value >= 0)) &&
    Object.values(input.prices ?? {}).every(finite) &&
    Object.values(input.ratios ?? {}).every(finite) &&
    finite(input.contingency)
  if (!ok) throw new TypeError('La entrada del estimado no es válida')
}

export function parseEstimate(raw: unknown): ObraEstimate {
  if (typeof raw !== 'string') throw new TypeError(`${ESTIMATE_ENTRY} debe devolver un texto JSON`)
  const value = JSON.parse(raw) as ObraEstimate
  const ok =
    Array.isArray(value.items) &&
    Array.isArray(value.lines) &&
    value.items.every((item) => [item.volume, item.formwork, item.steel].every(finite)) &&
    value.lines.every((line) => [line.quantity, line.price, line.cost].every(finite)) &&
    [value.subtotal, value.contingency, value.total].every(finite)
  if (!ok) throw new TypeError(`${ESTIMATE_ENTRY} devolvió un estimado incompleto`)
  return value
}

export function createObraEngine({ load, now = () => performance.now() }: ObraEngineDeps) {
  let runtime: Promise<PyodideRuntime> | null = null
  let entry: Entry | null = null
  let loadedSource: string | null = null
  let info: ObraRuntimeInfo | null = null

  const boot = (): Promise<PyodideRuntime> => {
    runtime ??= load().catch((error: unknown) => {
      runtime = null
      throw error
    })
    return runtime
  }

  async function ready(source: string, context: Context): Promise<ObraResult> {
    const started = now()
    context.progress({ stage: 'core' })
    const py = await boot()
    await context.checkpoint()
    context.progress({ stage: 'numpy' })
    await py.loadPackage([...PYODIDE_PACKAGES])
    await context.checkpoint()
    context.progress({ stage: 'source' })
    if (loadedSource !== source || !entry || !info) {
      entry = null
      py.runPython(source)
      const found = py.globals.get(ESTIMATE_ENTRY)
      if (typeof found !== 'function') throw new TypeError(`estimate.py no define ${ESTIMATE_ENTRY}()`)
      entry = found as Entry
      loadedSource = source
      info = {
        pyodide: py.version ?? PYODIDE_VERSION,
        python: String(py.runPython('import sys\nsys.version.split()[0]')),
        numpy: String(py.runPython('import numpy\nnumpy.__version__')),
      }
    }
    return { type: 'ready', ms: Math.round(now() - started), ...info }
  }

  function estimate(input: ObraInput): ObraResult {
    if (!entry) throw new Error('Python todavía no está listo: primero hay que cargarlo')
    assertObraInput(input)
    const started = now()
    const result = parseEstimate(entry(JSON.stringify(input)))
    return { type: 'estimate', estimate: result, ms: Math.max(0, Math.round((now() - started) * 10) / 10) }
  }

  return {
    handle(request: ObraRequest, context: Context): Promise<ObraResult> {
      if (request.type === 'load') return ready(request.source, context)
      return Promise.resolve().then(() => estimate(request.input))
    },
  }
}
