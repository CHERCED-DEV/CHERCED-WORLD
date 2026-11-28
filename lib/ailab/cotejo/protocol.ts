import type { CotejoReport, Lang, Profile } from 'cotejo-core'
import type { NliStats } from 'cotejo-semantic'
import type { Confidence, FileKind } from 'cotejo-trace'

export const COTEJO_MAX_LINES = 3000

export const COTEJO_MAX_CHARS = 500_000

export type CotejoInput = { text: string; path: string; lang?: Lang; profile?: Profile }

export type SemanticDevice = 'webgpu' | 'wasm'

export type SemanticModelKind = 'embeddings' | 'nli'

export type TraceVariant = 'none' | 'lexicon' | 'glossary'

export const TRACE_VARIANTS: readonly TraceVariant[] = ['none', 'lexicon', 'glossary']

export type TraceHitView = {
  path: string
  kind: FileKind
  magnet: boolean
  score: number
  scores: { bm25: number; bridge: number; idLiteral: number }
  terms: string[]
  pathTerms: string[]
}

export type TraceRowView = {
  unitId: string | null
  line: number | null
  text: string
  bridged: string[]
  confidence: Confidence
  top: TraceHitView[]
}

export type TraceView = {
  generatedAt: string | null
  files: number
  magnets: number
  ms: number
  variants: Record<TraceVariant, TraceRowView[]>
}

export type PairUnitView = { id: string | null; line: number | null; text: string }

export type CandidateView = { a: PairUnitView; b: PairUnitView; cosine: number }

export type RankedView = CandidateView & { contradiction: number; entailment: number }

export type SemanticView = {
  units: number
  total: number
  pairs: Array<[number | null, number | null]>
  candidates: CandidateView[]
  ranking: { contradictions: RankedView[]; nearDuplicates: RankedView[]; stats: NliStats } | null
  ms: { C2: number; C3: number | null }
  device: SemanticDevice
}

export type CotejoExports = { json: string; sarif: string; markdown: string; summary: string; hash: string }

export type CotejoRequest =
  | { type: 'ping' }
  | { type: 'analyze'; input: CotejoInput }
  | { type: 'trace' }
  | { type: 'load'; model: SemanticModelKind; device: SemanticDevice }
  | { type: 'semantic'; nli: boolean }
  | { type: 'export' }
  | { type: 'unload' }

export type CotejoResult =
  | { type: 'ready'; core: string }
  | { type: 'analyzed'; report: CotejoReport; lines: number; ms: number }
  | { type: 'traced'; report: CotejoReport; trace: TraceView }
  | { type: 'loaded'; model: SemanticModelKind; device: SemanticDevice; ms: number }
  | { type: 'semantic'; report: CotejoReport; semantic: SemanticView }
  | { type: 'exported'; exports: CotejoExports }
  | { type: 'unloaded' }

export type CotejoProgress = { stage: 'download'; model: SemanticModelKind; loaded: number; total: number } | { stage: 'index' }
