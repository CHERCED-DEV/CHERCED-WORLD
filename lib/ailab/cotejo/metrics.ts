import type { Family, Finding } from 'cotejo-core'
import type { CotejoSeededDefect, CotejoTraceTruth } from '@/content/ailab/cotejo/truth'
import type { TraceRowView } from './protocol'

export const FAMILY_ORDER: readonly Family[] = [
  'value-conflict',
  'polarity-conflict',
  'duplicates',
  'references',
  'ids',
  'language',
  'numbers',
  'glossary',
  'structure',
  'coverage',
]

export type ScoredFinding = Pick<Finding, 'fingerprint' | 'family' | 'layers' | 'evidence'>

export type FamilyScore = { family: Family; seeded: number; found: number; findings: number; falsePositives: number }

export type LayerRecall = { defects: number; found: number }

export type SampleScore = {
  findings: number
  truePositives: number
  falsePositives: number
  defects: number
  found: number
  missed: CotejoSeededDefect[]
  precision: number | null
  recall: number | null
  f1: number | null
  byFamily: FamilyScore[]
  byLayer: { C1: LayerRecall; C3: LayerRecall }
  matches: Record<string, string | null>
}

export function isScored(finding: Pick<Finding, 'layers'>): boolean {
  return !finding.layers.includes('C4')
}

export function matchDefect(finding: ScoredFinding, defects: readonly CotejoSeededDefect[]): CotejoSeededDefect | null {
  const lines = new Set(finding.evidence.map((item) => item.line))
  return defects.find((defect) => defect.family === finding.family && defect.lines.some((line) => lines.has(line))) ?? null
}

function ratio(part: number, whole: number): number | null {
  return whole === 0 ? null : part / whole
}

export function scoreFindings(findings: readonly ScoredFinding[], defects: readonly CotejoSeededDefect[]): SampleScore {
  const scored = findings.filter(isScored)
  const matches: Record<string, string | null> = {}
  const found = new Set<string>()
  let truePositives = 0
  for (const finding of scored) {
    const defect = matchDefect(finding, defects)
    matches[finding.fingerprint] = defect?.id ?? null
    if (defect) {
      truePositives += 1
      found.add(defect.id)
    }
  }
  const falsePositives = scored.length - truePositives
  const precision = ratio(truePositives, scored.length)
  const recall = ratio(found.size, defects.length)
  const f1 = precision === null || recall === null || precision + recall === 0 ? null : (2 * precision * recall) / (precision + recall)
  const families = FAMILY_ORDER.filter((family) => defects.some((defect) => defect.family === family) || scored.some((finding) => finding.family === family))
  const byFamily = families.map((family) => {
    const own = scored.filter((finding) => finding.family === family)
    return {
      family,
      seeded: defects.filter((defect) => defect.family === family).length,
      found: defects.filter((defect) => defect.family === family && found.has(defect.id)).length,
      findings: own.length,
      falsePositives: own.filter((finding) => matches[finding.fingerprint] === null).length,
    }
  })
  const layer = (name: 'C1' | 'C3'): LayerRecall => {
    const own = defects.filter((defect) => defect.layer === name)
    return { defects: own.length, found: own.filter((defect) => found.has(defect.id)).length }
  }
  return {
    findings: scored.length,
    truePositives,
    falsePositives,
    defects: defects.length,
    found: found.size,
    missed: defects.filter((defect) => !found.has(defect.id)),
    precision,
    recall,
    f1,
    byFamily,
    byLayer: { C1: layer('C1'), C3: layer('C3') },
    matches,
  }
}

export type TraceScore = {
  existing: number
  hits: number
  affirmed: number
  absent: number
  quiet: number
  rows: Array<{ unitId: string; exists: boolean; hit: boolean; confidence: string | null }>
}

export function scoreTrace(rows: readonly TraceRowView[], truth: readonly CotejoTraceTruth[], top = 3): TraceScore {
  const byId = new Map(rows.filter((row) => row.unitId).map((row) => [row.unitId as string, row]))
  const scoredRows = truth.map((item) => {
    const row = byId.get(item.unitId)
    const hit = item.exists && Boolean(row?.top.slice(0, top).some((entry) => item.files.some((file) => entry.path.startsWith(file))))
    return { unitId: item.unitId, exists: item.exists, hit, confidence: row?.confidence ?? null }
  })
  const existing = scoredRows.filter((row) => row.exists)
  const absent = scoredRows.filter((row) => !row.exists)
  return {
    existing: existing.length,
    hits: existing.filter((row) => row.hit).length,
    affirmed: existing.filter((row) => row.hit && row.confidence !== 'baja').length,
    absent: absent.length,
    quiet: absent.filter((row) => row.confidence === 'baja').length,
    rows: scoredRows,
  }
}

export function candidateRecall(pairs: ReadonlyArray<readonly [number | null, number | null]>, defects: readonly CotejoSeededDefect[]): { semantic: number; covered: string[] } {
  const semantic = defects.filter((defect) => defect.layer === 'C3')
  const covered = semantic.filter((defect) => pairs.some(([a, b]) => a !== null && b !== null && a !== b && defect.lines.includes(a) && defect.lines.includes(b)))
  return { semantic: semantic.length, covered: covered.map((defect) => defect.id) }
}
