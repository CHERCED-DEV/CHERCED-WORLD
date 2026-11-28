import { DEFAULT_RULES, ingest, unitBody, type CotejoReport, type Finding, type Lang } from 'cotejo-core'
import { nliRank, semanticCandidates, semanticFindings, type Candidate, type Embedder, type NliModel, type NliRanking, type NliScores, type RankedPair, type SemanticUnit } from 'cotejo-semantic'
import type { CandidateView, PairUnitView, RankedView, SemanticDevice, SemanticView } from './protocol'

export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small'

export const SEMANTIC_DTYPE = 'q8'

export const NLI_MODELS: Readonly<Record<Lang, string>> = {
  es: 'Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7',
  en: 'Xenova/nli-deberta-v3-xsmall',
}

export const SEMANTIC_RESOURCES = {
  embeddings: 'multilingual-e5-small (int8)',
  nli: { es: 'mDeBERTa-v3-base-xnli (int8)', en: 'nli-deberta-v3-xsmall (int8)' },
} as const

export const SEMANTIC_VIEW_LIMIT = 25

export const UNKNOWN_SHA256 = 'desconocido'

const RESOLVED_RULES = new Set(['duplicates.exact', 'duplicates.near-exact', 'conflict.value', 'conflict.polarity'])

export function semanticUnits(text: string, path: string, lang: Lang): SemanticUnit[] {
  const other: Lang = lang === 'es' ? 'en' : 'es'
  const doc = ingest(text, path, [DEFAULT_RULES.dictionaries[lang], DEFAULT_RULES.dictionaries[other]])
  return doc.units
    .filter((unit) => unit.kind === 'requirement' || unit.kind === 'criterion' || unit.kind === 'story')
    .map((unit) => ({ id: unit.unitId, key: unit.key, text: unitBody(unit), line: unit.line }))
    .filter((unit) => unit.text.split(/\s+/).length >= 4)
}

export function resolvedPairs(report: CotejoReport, units: readonly SemanticUnit[]): Set<string> {
  const byId = new Map<string, string>()
  for (const unit of units) if (unit.id && !byId.has(unit.id)) byId.set(unit.id, unit.key)
  const out = new Set<string>()
  for (const finding of report.findings) {
    if (!RESOLVED_RULES.has(finding.rule)) continue
    const keys = finding.evidence.map((item) => (item.unitId ? byId.get(item.unitId) : undefined)).filter((key): key is string => Boolean(key))
    for (let i = 0; i < keys.length; i += 1) for (let j = i + 1; j < keys.length; j += 1) out.add([keys[i], keys[j]].sort().join('|'))
  }
  return out
}

function unitView(unit: SemanticUnit): PairUnitView {
  return { id: unit.id, line: unit.line ?? null, text: unit.text }
}

function candidateView(candidate: Candidate): CandidateView {
  return { a: unitView(candidate.a), b: unitView(candidate.b), cosine: candidate.cosine }
}

function rankedView(pair: RankedPair): RankedView {
  return { ...candidateView(pair), contradiction: pair.contradiction, entailment: pair.entailment }
}

export type SemanticModels = { embedder: Embedder; nli: NliModel | null; device: SemanticDevice; onnxRuntime: string | null }

export type SemanticRun = {
  findings: Finding[]
  models: Array<{ id: string; sha256: string }>
  onnxRuntime: string | null
  ms: { C2: number; C3: number | null }
  view: SemanticView
}

export async function runSemantic(
  text: string,
  path: string,
  report: CotejoReport,
  models: SemanticModels,
  cache: Map<string, NliScores> = new Map(),
  now: () => number = () => performance.now(),
): Promise<SemanticRun> {
  const started = now()
  const units = semanticUnits(text, path, report.lang)
  const candidates = await semanticCandidates(units, { model: models.embedder, exclude: resolvedPairs(report, units) })
  const c2 = now() - started
  let ranking: NliRanking | null = null
  let c3: number | null = null
  if (models.nli) {
    const nliStarted = now()
    ranking = await nliRank(candidates, { model: models.nli, cuts: { cache } })
    c3 = now() - nliStarted
  }
  const findings = ranking ? semanticFindings(ranking, path, DEFAULT_RULES) : []
  const used = [models.embedder, ...(models.nli ? [models.nli] : [])]
  return {
    findings,
    models: used.map((model) => ({ id: model.id, sha256: model.sha256 ?? UNKNOWN_SHA256 })),
    onnxRuntime: models.onnxRuntime,
    ms: { C2: c2, C3: c3 },
    view: {
      units: units.length,
      total: candidates.length,
      pairs: candidates.map((candidate) => [candidate.a.line ?? null, candidate.b.line ?? null]),
      candidates: candidates.slice(0, SEMANTIC_VIEW_LIMIT).map(candidateView),
      ranking: ranking
        ? {
            contradictions: ranking.contradictions.slice(0, SEMANTIC_VIEW_LIMIT).map(rankedView),
            nearDuplicates: ranking.nearDuplicates.slice(0, SEMANTIC_VIEW_LIMIT).map(rankedView),
            stats: ranking.stats,
          }
        : null,
      ms: { C2: c2, C3: c3 },
      device: models.device,
    },
  }
}
