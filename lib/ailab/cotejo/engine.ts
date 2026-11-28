import { analyze, compactSummary, mergeFindings, reportHash, toMarkdown, toSarif, type CotejoReport, type Finding, type Layer } from 'cotejo-core'
import { checkInput } from './input'
import type { CotejoExports, CotejoInput } from './protocol'

export { checkInput, countLines, type InputCheck } from './input'

export function runDeterministic(input: CotejoInput, now: () => number = () => performance.now()): { report: CotejoReport; lines: number; ms: number } {
  const check = checkInput(input.text)
  if (!check.ok) throw new RangeError(`cotejo: entrada rechazada (${check.reason}, ${check.lines} líneas)`)
  const started = now()
  const report = analyze({ text: input.text, path: input.path, ...(input.lang ? { lang: input.lang } : {}), ...(input.profile ? { profile: input.profile } : {}) })
  return { report, lines: check.lines, ms: now() - started }
}

export type LayerExtras = {
  trace?: { findings: readonly Finding[]; ms: number } | null
  semantic?: { findings: readonly Finding[]; models: ReadonlyArray<{ id: string; sha256: string }>; onnxRuntime: string | null; ms: { C2: number; C3: number | null } } | null
}

export function combine(base: CotejoReport, extras: LayerExtras): CotejoReport {
  const findings = [...(extras.trace?.findings ?? []), ...(extras.semantic?.findings ?? [])]
  const timingsMs: Partial<Record<Layer, number | null>> = {}
  if (extras.trace) timingsMs.C4 = extras.trace.ms
  if (extras.semantic) {
    timingsMs.C2 = extras.semantic.ms.C2
    timingsMs.C3 = extras.semantic.ms.C3
  }
  if (findings.length === 0 && !extras.trace && !extras.semantic) return base
  return mergeFindings(base, {
    findings,
    timingsMs,
    ...(extras.semantic ? { models: extras.semantic.models, onnxRuntime: extras.semantic.onnxRuntime } : {}),
  })
}

export function exportsOf(report: CotejoReport): CotejoExports {
  return {
    json: `${JSON.stringify(report, null, 2)}\n`,
    sarif: `${JSON.stringify(toSarif(report, { max: 1000 }), null, 2)}\n`,
    markdown: toMarkdown(report, report.lang),
    summary: compactSummary(report, report.lang),
    hash: reportHash(report),
  }
}
