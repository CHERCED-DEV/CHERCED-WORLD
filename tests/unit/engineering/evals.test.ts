import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EVAL_BATTERY } from '@/content/ailab/evals/battery'
import { publishedEvals } from '@/content/engineering/evals'
import { gradeAnswer, summarizeRun } from '@/lib/ai/evals/grade'
import { checkEvalResults, latestRun } from '@/lib/engineering/evals'

const ROOT = process.cwd()

function run(id: string, at: string) {
  const item = EVAL_BATTERY[0]!
  const answer = { text: 'respuesta', tools: [], latencyMs: 500, costUsd: 0.001 }
  return summarizeRun({ id, at, model: 'modelo-de-prueba', instructionHash: 'hash' }, [{ item, answer, grade: gradeAnswer(item, answer) }])
}

describe('registro de evals publicadas (FR-4508, US5)', () => {
  it.each(publishedEvals.map((entry) => [entry.id, entry] as const))('%s cumple el esquema EvalResults de la 032', (_id, entry) => {
    const check = checkEvalResults(entry.results)
    expect(check.ok, check.ok ? '' : check.reason).toBe(true)
  })

  it('cada entrada apunta a su spec, a su archivo versionado y a una página interna, con su comando y su costo', () => {
    const specs = readdirSync(join(ROOT, 'specs'))
    const ids = new Set<string>()
    for (const entry of publishedEvals) {
      expect(ids.has(entry.id), entry.id).toBe(false)
      ids.add(entry.id)
      expect(specs.some((folder) => folder.startsWith(`${entry.spec}-`)), entry.spec).toBe(true)
      expect(existsSync(join(ROOT, entry.resultsFile)), entry.resultsFile).toBe(true)
      expect(JSON.parse(readFileSync(join(ROOT, entry.resultsFile), 'utf8'))).toEqual(entry.results)
      expect(entry.href).toMatch(/^\/[a-z0-9/-]+$/)
      expect(entry.title.es.trim()).not.toBe('')
      expect(entry.title.en.trim()).not.toBe('')
      expect(entry.command).toMatch(/^npm run [\w:-]+$/)
      expect(entry.costPerRun.es).toMatch(/USD/)
      expect(entry.costPerRun.en).toMatch(/USD/)
    }
  })

  it('la batería de la 032 está registrada y, sin corridas, no tiene una última corrida', () => {
    const mini = publishedEvals.find((entry) => entry.spec === '032')
    expect(mini?.resultsFile).toBe('content/ailab/evals/results.json')
    const check = checkEvalResults(mini!.results)
    expect(check.ok).toBe(true)
    if (check.ok) expect(latestRun(check.results) === null).toBe(mini!.results.runs.length === 0)
  })

  it('acepta una corrida bien formada y elige la más reciente', () => {
    const check = checkEvalResults({ runs: [run('vieja', '2026-11-20T10:00:00Z'), run('nueva', '2026-11-25T10:00:00Z')] })
    expect(check.ok).toBe(true)
    if (check.ok) expect(latestRun(check.results)?.id).toBe('nueva')
  })

  it('falla con el motivo cuando una línea entrega un archivo que no cumple el esquema', () => {
    const good = run('r1', '2026-11-25T10:00:00Z')
    const broken = checkEvalResults({ runs: [{ ...good, totals: { cases: 1, passed: 3 } }] })
    expect(broken.ok).toBe(false)
    if (!broken.ok) expect(broken.reason).toMatch(/runs\.0\.totals/)
    const missing = checkEvalResults({ runs: [{ ...good, byKind: { fact: { total: 1, passed: 1 } } }] })
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.reason).toMatch(/byKind/)
    expect(checkEvalResults({ corridas: [] }).ok).toBe(false)
  })
})
