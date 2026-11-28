import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { reportHash, type CotejoReport, type Lang } from 'cotejo-core'
import { loadIndex, type LoadedIndex, type RepoIndex } from 'cotejo-trace'
import repoIndex from '@/content/ailab/cotejo/repo-index.json'
import samples from '@/content/ailab/cotejo/samples.json'
import { COTEJO_DEFECTS, COTEJO_SAMPLE_LINES, COTEJO_SAMPLE_PATHS, COTEJO_TRACE_TRUTH } from '@/content/ailab/cotejo/truth'
import { checkInput, countLines, exportsOf, runDeterministic } from '@/lib/ailab/cotejo/engine'
import { candidateRecall, matchDefect, scoreFindings, scoreTrace } from '@/lib/ailab/cotejo/metrics'
import { COTEJO_MAX_CHARS, COTEJO_MAX_LINES, TRACE_VARIANTS } from '@/lib/ailab/cotejo/protocol'
import { runTrace } from '@/lib/ailab/cotejo/trace'

const ROOT = process.cwd()
const LANGS: Lang[] = ['es', 'en']

function disk(lang: Lang): string {
  return readFileSync(join(ROOT, COTEJO_SAMPLE_PATHS[lang]), 'utf8').replace(/\r\n/g, '\n')
}

function sample(lang: Lang): { report: CotejoReport; ms: number; lines: number } {
  return runDeterministic({ text: samples[lang], path: `muestra.${lang}.md`, lang })
}

function source(path: string): string {
  return readFileSync(join(ROOT, path), 'utf8')
}

describe('la muestra de unas 600 líneas y su verdad (T4716)', () => {
  it('samples.json es copia byte a byte de sample.es.md y sample.en.md', () => {
    expect(Object.keys(samples).sort()).toEqual(['en', 'es'])
    for (const lang of LANGS) expect(samples[lang], `regenera samples.json desde ${COTEJO_SAMPLE_PATHS[lang]}`).toBe(disk(lang))
  })

  it('las dos versiones tienen las mismas líneas, y cada defecto está en su línea en ES y en EN', () => {
    for (const lang of LANGS) expect(countLines(samples[lang]), lang).toBe(COTEJO_SAMPLE_LINES)
    expect(COTEJO_SAMPLE_LINES).toBeGreaterThanOrEqual(550)
    expect(COTEJO_SAMPLE_LINES).toBeLessThanOrEqual(650)
    const es = samples.es.split('\n')
    const en = samples.en.split('\n')
    es.forEach((line, index) => expect(line === '', `línea ${index + 1}`).toBe(en[index] === ''))
    for (const defect of COTEJO_DEFECTS) {
      for (const lang of LANGS) {
        const lines = samples[lang].split('\n')
        expect(lines[defect.lines[0]! - 1], `${defect.id} ${lang}`).toContain(defect.quote[lang])
        for (const id of defect.units) expect(defect.lines.some((line) => lines[line - 1]!.includes(`**${id}**`) || lines[line - 1]!.includes(id)), `${defect.id} ${id}`).toBe(true)
      }
      expect(defect.note.es.trim()).not.toBe('')
      expect(defect.note.en.trim()).not.toBe('')
    }
    expect(new Set(COTEJO_DEFECTS.map((defect) => defect.id)).size).toBe(COTEJO_DEFECTS.length)
  })

  it('siembra 31 defectos para la capa determinista y 3 que solo ven las capas semánticas', () => {
    expect(COTEJO_DEFECTS.filter((defect) => defect.layer === 'C1')).toHaveLength(31)
    expect(COTEJO_DEFECTS.filter((defect) => defect.layer === 'C3').map((defect) => defect.id)).toEqual(['S32', 'S33', 'S34'])
    const families = new Set(COTEJO_DEFECTS.map((defect) => defect.family))
    for (const family of ['value-conflict', 'polarity-conflict', 'duplicates', 'references', 'ids', 'language', 'numbers', 'glossary', 'structure']) expect(families.has(family as never), family).toBe(true)
  })

  it('todo es ficticio: sin personas, empresas ni marcas reales', () => {
    const corpus = [samples.es, samples.en, source('content/ailab/cotejo/truth.ts')].join('\n')
    for (const pattern of [/sistecr/i, /factor[ií]a/i, /google/i, /microsoft/i, /apple/i, /amazon/i, /chrome/i, /safari/i, /firefox/i, /\b@\w+\.\w+/, /[A-Z]:\\Users/i]) {
      expect(corpus, String(pattern)).not.toMatch(pattern)
    }
  })
})

describe('métricas en vivo contra la verdad (T4717, FR-4713)', () => {
  it('en español, la capa determinista encuentra los 31 defectos que le tocan sin un solo falso positivo', () => {
    const score = scoreFindings(sample('es').report.findings, COTEJO_DEFECTS)
    expect(score.findings).toBe(31)
    expect(score.falsePositives).toBe(0)
    expect(score.precision).toBe(1)
    expect(score.byLayer.C1).toEqual({ defects: 31, found: 31 })
    expect(score.byLayer.C3).toEqual({ defects: 3, found: 0 })
    expect(score.recall).toBeCloseTo(31 / 34, 10)
    expect(score.missed.map((defect) => defect.id)).toEqual(['S32', 'S33', 'S34'])
  })

  it('en inglés también encuentra los 31, y cuenta como falsos positivos los dos «how many» que el diccionario toma por cantidades vagas', () => {
    const { report } = sample('en')
    const score = scoreFindings(report.findings, COTEJO_DEFECTS)
    expect(score.byLayer.C1).toEqual({ defects: 31, found: 31 })
    expect(score.falsePositives).toBe(2)
    const extra = report.findings.filter((finding) => score.matches[finding.fingerprint] === null)
    expect(extra.map((finding) => [finding.rule, finding.components.term])).toEqual([
      ['language.vague-quantifier', 'many'],
      ['language.vague-quantifier', 'many'],
    ])
    expect(score.precision).toBeCloseTo(31 / 33, 10)
  })

  it('cada familia suma sus sembrados, sus encontrados y sus falsos positivos', () => {
    const score = scoreFindings(sample('es').report.findings, COTEJO_DEFECTS)
    const value = score.byFamily.find((row) => row.family === 'value-conflict')
    expect(value).toEqual({ family: 'value-conflict', seeded: 3, found: 3, findings: 3, falsePositives: 0 })
    const duplicates = score.byFamily.find((row) => row.family === 'duplicates')
    expect(duplicates).toEqual({ family: 'duplicates', seeded: 4, found: 2, findings: 2, falsePositives: 0 })
    expect(score.byFamily.reduce((sum, row) => sum + row.seeded, 0)).toBe(COTEJO_DEFECTS.length)
  })

  it('un hallazgo cuenta si es de la familia del defecto y toca una de sus líneas; los de C4 no entran', () => {
    const defect = COTEJO_DEFECTS.find((item) => item.id === 'S08')!
    const base = { fingerprint: 'f', layers: ['C1' as const], evidence: [{ file: 'x', line: 268, column: 1, unitId: null, fragment: '' }] }
    expect(matchDefect({ ...base, family: 'value-conflict' }, COTEJO_DEFECTS)?.id).toBe('S08')
    expect(matchDefect({ ...base, family: 'language' }, COTEJO_DEFECTS)).toBeNull()
    expect(matchDefect({ ...base, family: 'value-conflict', evidence: [{ ...base.evidence[0]!, line: 1 }] }, COTEJO_DEFECTS)).toBeNull()
    expect(defect.lines).toContain(268)
    const score = scoreFindings([{ ...base, family: 'language', layers: ['C4'] }], COTEJO_DEFECTS)
    expect(score.findings).toBe(0)
    expect(score.precision).toBeNull()
  })

  it('la cobertura de candidatos dice cuántos defectos semánticos quedaron entre los pares', () => {
    expect(candidateRecall([[252, 333], [10, 20], [334, 277]], COTEJO_DEFECTS)).toEqual({ semantic: 3, covered: ['S32', 'S33'] })
    expect(candidateRecall([], COTEJO_DEFECTS).covered).toEqual([])
  })

  it('el mismo texto da el mismo sha256 del reporte, y la capa determinista tarda menos de 1 s en Node', () => {
    const first = sample('es')
    const second = sample('es')
    expect(reportHash(first.report)).toBe(reportHash(second.report))
    expect(first.report.profile).toBe('speckit')
    expect(first.ms).toBeLessThan(1000)
    expect(first.lines).toBe(COTEJO_SAMPLE_LINES)
  })

  it('las descargas salen del mismo reporte: JSON, SARIF 2.1.0, Markdown y el resumen compacto', () => {
    const { report } = sample('es')
    const out = exportsOf(report)
    expect(JSON.parse(out.json)).toEqual(report)
    expect(JSON.parse(out.sarif).version).toBe('2.1.0')
    const run = JSON.parse(out.sarif).runs[0]
    expect(run.properties.totalFindings).toBe(report.findings.length)
    expect(run.results.length).toBeGreaterThanOrEqual(report.findings.length)
    expect(run.properties.omittedResults).toBe(0)
    expect(out.markdown).toContain('# Cotejo: reporte de muestra.es.md')
    expect(out.summary.split('\n')[0]).toContain('cotejo 0.1.0')
    expect(out.hash).toBe(reportHash(report))
  })
})

describe('el límite de 3.000 líneas pegadas (FR-4713, casos límite)', () => {
  const lines = (n: number) => Array.from({ length: n }, (_, i) => `Línea ${i + 1} de una spec pegada.`).join('\n')

  it('acepta hasta 3.000 líneas y rechaza la 3.001 antes de analizar', () => {
    expect(COTEJO_MAX_LINES).toBe(3000)
    expect(checkInput(lines(3000))).toEqual({ ok: true, lines: 3000 })
    expect(checkInput(`${lines(3000)}\n`)).toEqual({ ok: true, lines: 3000 })
    expect(checkInput(lines(3001))).toEqual({ ok: false, reason: 'lines', lines: 3001 })
    expect(() => runDeterministic({ text: lines(3001), path: 'tu-spec.md' })).toThrow(RangeError)
  })

  it('rechaza el texto vacío y una sola línea gigante', () => {
    expect(checkInput('   \n ')).toMatchObject({ ok: false, reason: 'empty' })
    expect(checkInput('x'.repeat(COTEJO_MAX_CHARS + 1))).toMatchObject({ ok: false, reason: 'chars', lines: 1 })
  })
})

describe('nada sale del dispositivo (FR-4713, historia 1, escenario 3)', () => {
  let loaded: LoadedIndex
  beforeAll(() => {
    loaded = loadIndex(repoIndex as unknown as RepoIndex)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('analizar, buscar en el índice y exportar no llaman a fetch, XHR, WebSocket ni sendBeacon', () => {
    const calls: string[] = []
    const trap = (name: string) =>
      vi.fn(() => {
        calls.push(name)
        throw new Error(`${name} no debe llamarse`)
      })
    vi.stubGlobal('fetch', trap('fetch'))
    vi.stubGlobal('XMLHttpRequest', trap('XMLHttpRequest'))
    vi.stubGlobal('WebSocket', trap('WebSocket'))
    vi.stubGlobal('EventSource', trap('EventSource'))
    vi.stubGlobal('navigator', { sendBeacon: trap('sendBeacon') })
    const pasted = `${samples.es}\n- **FR-900**: Un secreto que no debe salir del navegador: marca-unica-4711.\n`
    const { report } = runDeterministic({ text: pasted, path: 'tu-spec.md' })
    const trace = runTrace(pasted, 'tu-spec.md', report.lang, loaded)
    exportsOf(report)
    expect(trace.view.variants.glossary.length).toBeGreaterThan(40)
    expect(calls).toEqual([])
  })

  it('el código de la demo no tiene llamadas de red, y el worker solo carga los modelos bajo pedido', () => {
    for (const path of ['lib/ailab/cotejo/engine.ts', 'lib/ailab/cotejo/input.ts', 'lib/ailab/cotejo/trace.ts', 'lib/ailab/cotejo/metrics.ts', 'lib/ailab/cotejo/semantic.ts', 'lib/ailab/cotejo/loading.ts', 'lib/ailab/cotejo/cotejo.worker.ts', 'lib/ailab/cotejo/client.ts']) {
      expect(source(path), path).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/)
    }
    const worker = source('lib/ailab/cotejo/cotejo.worker.ts')
    expect(worker).not.toMatch(/^import (?!type )[^\n]*['"](@huggingface\/transformers|cotejo-semantic|cotejo-trace|\.\/trace|\.\/semantic)['"]/m)
    expect(worker).toContain("await import('@huggingface/transformers')")
    expect(worker).toContain("await import('./trace')")
  })
})

describe('«posiblemente implementado» contra el índice del sitio (T4731, FR-4710)', () => {
  let loaded: LoadedIndex
  beforeAll(() => {
    loaded = loadIndex(repoIndex as unknown as RepoIndex)
  })

  it('el índice tiene fecha y no trae nada privado ni la demo misma', () => {
    const index = repoIndex as unknown as RepoIndex
    expect(index.schemaVersion).toBe(1)
    expect(index.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(index.files.length).toBeGreaterThan(500)
    for (const file of index.files) {
      expect(file.path, file.path).not.toMatch(/(^|\/)privado\/|(^|\/)cotejo\/|cotejo\.json$|node_modules|\.env/)
      expect(file.path, file.path).toMatch(/^(app|components|lib|content\/i18n)\//)
    }
  })

  it('el feed RSS sale entre los tres primeros con app/[lang]/feed.xml/, y el puente del glosario no empeora a BM25 solo', () => {
    for (const lang of LANGS) {
      const run = runTrace(samples[lang], `muestra.${lang}.md`, lang, loaded)
      const rss = run.view.variants.glossary.find((row) => row.unitId === 'FR-011')
      expect(rss?.top.slice(0, 3).some((hit) => hit.path.startsWith('app/[lang]/feed.xml/')), lang).toBe(true)
      const scores = TRACE_VARIANTS.map((variant) => scoreTrace(run.view.variants[variant], COTEJO_TRACE_TRUTH))
      expect(scores[2]!.hits, lang).toBeGreaterThanOrEqual(scores[0]!.hits)
      for (const finding of run.findings) {
        expect(finding.severity).toBe('note')
        expect(finding.layers).toEqual(['C4'])
        expect(finding.why.es).not.toMatch(/^Ya existe/)
      }
    }
  })

  it('la verdad de la traza separa lo que el sitio ya tiene de lo que no', () => {
    expect(COTEJO_TRACE_TRUTH.filter((item) => item.exists).length).toBe(18)
    expect(COTEJO_TRACE_TRUTH.filter((item) => !item.exists).length).toBe(8)
    for (const item of COTEJO_TRACE_TRUTH.filter((entry) => entry.exists)) {
      expect(loaded.index.files.some((file) => item.files.some((prefix) => file.path.startsWith(prefix))), item.unitId).toBe(true)
    }
  })
})
