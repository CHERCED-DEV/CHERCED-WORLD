import { serveLabWorker } from '@/lib/ailab/core/worker-runtime'
import { createObraEngine, type PyodideRuntime } from './engine'
import { PYODIDE_INDEX_URL, PYODIDE_MODULE_URL, type ObraProgress, type ObraRequest, type ObraResult } from './protocol'

type PyodideModule = { loadPyodide(options: { indexURL: string }): Promise<PyodideRuntime> }

const engine = createObraEngine({
  load: async () => {
    const pyodide = (await import(/* webpackIgnore: true */ PYODIDE_MODULE_URL)) as PyodideModule
    return pyodide.loadPyodide({ indexURL: PYODIDE_INDEX_URL })
  },
})

serveLabWorker<ObraRequest, ObraResult, ObraProgress>((request, context) => engine.handle(request, context))
