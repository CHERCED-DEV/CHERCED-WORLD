import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { fold } from 'cotejo-core'
import type { Embedder, NliModel, NliPair, NliScores } from 'cotejo-semantic'
import { SemanticLayers, semanticDownloads } from '@/components/ailab/cotejo/SemanticLayers'
import { E5_SMALL, NLI_EN, NLI_ES, labExperiment } from '@/content/ailab/catalog'
import samples from '@/content/ailab/cotejo/samples.json'
import { COTEJO_DEFECTS } from '@/content/ailab/cotejo/truth'
import type { CotejoClient } from '@/lib/ailab/cotejo/client'
import { semanticDevice } from '@/lib/ailab/cotejo/client'
import { combine, runDeterministic } from '@/lib/ailab/cotejo/engine'
import { aggregateProgress, onnxVersion, withFallback } from '@/lib/ailab/cotejo/loading'
import { candidateRecall, scoreFindings } from '@/lib/ailab/cotejo/metrics'
import { EMBEDDING_MODEL, NLI_MODELS, SEMANTIC_DTYPE, SEMANTIC_RESOURCES, UNKNOWN_SHA256, resolvedPairs, runSemantic, semanticUnits } from '@/lib/ailab/cotejo/semantic'
import { MEANING_DTYPE, MEANING_MODEL } from '@/lib/ailab/search/meaning'

const DIMS = 64

const TOPICS: Array<[RegExp, number]> = [
  [/tema claro|modo oscuro/, 1],
  [/tiempo estimado de lectura|cuantos minutos toma leerla/, 2],
  [/historial de lectura|paginas que abrio cada lector/, 3],
]

function slot(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return 8 + ((h >>> 0) % (DIMS - 8))
}

function topicEmbedder(): Embedder & { calls: number } {
  const model = {
    id: 'prueba/temas',
    calls: 0,
    async embed(texts: readonly string[]) {
      model.calls += 1
      return texts.map((raw) => {
        const text = fold(raw)
        const vector = new Array<number>(DIMS).fill(0)
        const topic = TOPICS.find(([pattern]) => pattern.test(text))
        if (topic) vector[topic[1]] = 1
        else vector[slot(text)] = 1
        return vector
      })
    },
  }
  return model
}

function serverNli(): NliModel & { pairs: NliPair[] } {
  const model = {
    id: 'prueba/nli',
    sha256: 'f'.repeat(64),
    pairs: [] as NliPair[],
    async classify(pairs: readonly NliPair[]): Promise<NliScores[]> {
      model.pairs.push(...pairs)
      return pairs.map((pair) => {
        const both = fold(`${pair.premise} | ${pair.hypothesis}`)
        if (/navegador/.test(both) && /servidor/.test(both)) return { entailment: 0.02, neutral: 0.03, contradiction: 0.95 }
        return { entailment: 0.92, neutral: 0.06, contradiction: 0.02 }
      })
    },
  }
  return model
}

const base = runDeterministic({ text: samples.es, path: 'muestra.es.md', lang: 'es' }).report

describe('capas semánticas con dobles de los modelos (T4734, FR-4708, FR-4709)', () => {
  it('usa el mismo modelo y el mismo dtype que el buscador A5, así que comparten la caché', () => {
    expect(EMBEDDING_MODEL).toBe(MEANING_MODEL)
    expect(SEMANTIC_DTYPE).toBe(MEANING_DTYPE)
    expect(NLI_MODELS).toEqual({ es: 'Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7', en: 'Xenova/nli-deberta-v3-xsmall' })
    expect(SEMANTIC_RESOURCES).toEqual({ embeddings: E5_SMALL.resource, nli: { es: NLI_ES.resource, en: NLI_EN.resource } })
    const downloads = labExperiment('A11').downloads
    expect(semanticDownloads(downloads, 'es')).toEqual({ embeddings: E5_SMALL, nli: NLI_ES })
    expect(semanticDownloads(downloads, 'en')).toEqual({ embeddings: E5_SMALL, nli: NLI_EN })
  })

  it('las unidades son requisitos, criterios e historias, y los pares que C1 ya resolvió no vuelven como candidatos', () => {
    const units = semanticUnits(samples.es, 'muestra.es.md', 'es')
    expect(units.length).toBeGreaterThan(100)
    expect(units.some((unit) => unit.id === 'FR-006')).toBe(true)
    const resolved = resolvedPairs(base, units)
    const key = (a: string, b: string) => [units.find((unit) => unit.id === a)!.key, units.find((unit) => unit.id === b)!.key].sort().join('|')
    expect(resolved.has(key('FR-015', 'FR-018'))).toBe(true)
    expect(resolved.has(key('FR-026', 'FR-032'))).toBe(true)
    expect(resolved.has(key('FR-006', 'FR-56'))).toBe(false)
  })

  it('solo con embeddings: propone candidatos y no decide nada', async () => {
    const run = await runSemantic(samples.es, 'muestra.es.md', base, { embedder: topicEmbedder(), nli: null, device: 'wasm', onnxRuntime: null })
    expect(run.findings).toEqual([])
    expect(run.view.ranking).toBeNull()
    expect(run.ms.C3).toBeNull()
    expect(run.models).toEqual([{ id: 'prueba/temas', sha256: UNKNOWN_SHA256 }])
    expect(candidateRecall(run.view.pairs, COTEJO_DEFECTS).covered.sort()).toEqual(['S32', 'S33', 'S34'])
    expect(run.view.total).toBe(run.view.pairs.length)
    expect(run.view.candidates.length).toBeLessThanOrEqual(25)
  })

  it('con NLI: ordena los candidatos, saca notas para revisar y no toca las capas que ya estaban', async () => {
    const nli = serverNli()
    const cache = new Map<string, NliScores>()
    const run = await runSemantic(samples.es, 'muestra.es.md', base, { embedder: topicEmbedder(), nli, device: 'wasm', onnxRuntime: '1.23.0' }, cache)
    expect(nli.pairs.length).toBeGreaterThan(0)
    expect(run.view.ranking?.contradictions[0]?.contradiction).toBeGreaterThanOrEqual(0.9)
    for (const finding of run.findings) {
      expect(finding.severity).toBe('note')
      expect(finding.layers).toEqual(['C2', 'C3'])
      expect(finding.why.es).toContain('no un veredicto')
    }
    const merged = combine(base, { semantic: { findings: run.findings, models: run.models, onnxRuntime: run.onnxRuntime, ms: run.ms } })
    expect(merged.reproducibility.models.map((model) => model.id).sort()).toEqual(['prueba/nli', 'prueba/temas'])
    expect(merged.reproducibility.onnxRuntime).toBe('1.23.0')
    expect(typeof merged.timingsMs.C3).toBe('number')
    const score = scoreFindings(merged.findings, COTEJO_DEFECTS)
    expect(score.byLayer.C3).toEqual({ defects: 3, found: 3 })
    expect(score.byLayer.C1).toEqual({ defects: 31, found: 31 })
    const again = await runSemantic(samples.es, 'muestra.es.md', base, { embedder: topicEmbedder(), nli, device: 'wasm', onnxRuntime: null }, cache)
    expect(again.view.ranking?.stats.cacheHits).toBeGreaterThan(0)
  })

  it('la carga suma el progreso de varios archivos, cae de WebGPU a WASM y lee la versión de ONNX Runtime', async () => {
    const seen: Array<[number, number]> = []
    const progress = aggregateProgress((loaded, total) => seen.push([loaded, total]))
    progress({ status: 'progress', file: 'a', loaded: 10, total: 100 })
    progress({ status: 'progress', file: 'b', loaded: 5, total: 50 })
    progress({ status: 'done', file: 'a' })
    progress({ status: 'progress', file: 'a', loaded: 100, total: 100 })
    expect(seen).toEqual([
      [10, 100],
      [15, 150],
      [105, 150],
    ])
    const tried: string[] = []
    const result = await withFallback('webgpu', async (device) => {
      tried.push(device)
      if (device === 'webgpu') throw new Error('sin adaptador')
      return 'listo'
    })
    expect(result).toEqual({ value: 'listo', device: 'wasm' })
    expect(tried).toEqual(['webgpu', 'wasm'])
    expect(onnxVersion({ backends: { onnx: { versions: { web: '1.22.0' } } } })).toBe('1.22.0')
    expect(onnxVersion({})).toBeNull()
    expect(semanticDevice({ gpu: {} })).toBe('webgpu')
    expect(semanticDevice({})).toBe('wasm')
  })
})

describe('la tarjeta de las capas semánticas (T4734, historia 5)', () => {
  const client = {} as CotejoClient

  it('sin aceptar nada, no hay descarga en marcha y el NLI espera a los embeddings', () => {
    const html = renderToStaticMarkup(
      createElement(SemanticLayers, { lang: 'es', experiment: 'A11', client, downloads: labExperiment('A11').downloads, specLang: 'es', sample: true, disabled: false, onResult: () => {} }),
    )
    expect(html).toContain('data-cw-cotejo-semantic="off"')
    expect(html).toContain('118 MB')
    expect(html).toContain('339 MB')
    expect(html).toContain('con su misma caché')
    expect(html).toContain('Se enciende después de los embeddings.')
    expect(html).toMatch(/data-cw-cotejo-nli=""[^>]*disabled=""|disabled=""[^>]*data-cw-cotejo-nli=""/)
    expect(html).not.toContain('<progress')
  })

  it('en inglés ofrece el NLI de 87 MB', () => {
    const html = renderToStaticMarkup(
      createElement(SemanticLayers, { lang: 'en', experiment: 'A11', client, downloads: labExperiment('A11').downloads, specLang: 'en', sample: true, disabled: false, onResult: () => {} }),
    )
    expect(html).toContain('87 MB')
    expect(html).toContain('nli-deberta-v3-xsmall')
  })

  it('el worker solo pide modelos después del permiso, desde el código de la tarjeta', () => {
    const source = readFileSync(join(process.cwd(), 'components', 'ailab', 'cotejo', 'SemanticLayers.tsx'), 'utf8')
    const ask = source.indexOf('requestDownload(toDownloadRequest(experiment, download))')
    const load = source.indexOf('client.load(kind, device')
    expect(ask).toBeGreaterThan(0)
    expect(load).toBeGreaterThan(ask)
  })
})
