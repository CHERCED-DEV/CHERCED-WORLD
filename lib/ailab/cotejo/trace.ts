import { DEFAULT_RULES, ingest, unitBody, type Finding, type Lang } from 'cotejo-core'
import { possiblyImplemented, traceFindings, type GlossaryBridge, type LoadedIndex, type TraceOptions, type TraceResult, type TraceUnit } from 'cotejo-trace'
import { TRACE_VARIANTS, type TraceRowView, type TraceVariant, type TraceView } from './protocol'

export const TRACE_TEXT_CHARS = 240

export function traceUnitsOf(text: string, path: string, lang: Lang): { units: TraceUnit[]; glossary: GlossaryBridge } {
  const other: Lang = lang === 'es' ? 'en' : 'es'
  const doc = ingest(text, path, [DEFAULT_RULES.dictionaries[lang], DEFAULT_RULES.dictionaries[other]])
  const inRequirements = (start: number | null): boolean => {
    let current = start
    while (current !== null) {
      const section = doc.sections[current]
      if (!section) return false
      if (section.key === 'requirements' || section.key === 'functionalRequirements' || section.key === 'nonFunctionalRequirements') return true
      current = section.parent
    }
    return false
  }
  const units = doc.units
    .filter((unit) => unit.label !== null && (unit.kind === 'requirement' || inRequirements(unit.section)))
    .map((unit) => ({ id: unit.label, key: unit.key, text: unitBody(unit), line: unit.line }))
  return { units, glossary: doc.glossary.map((entry) => ({ term: entry.term, codeNames: entry.codeNames })) }
}

export function traceOptions(variant: TraceVariant, glossary: GlossaryBridge): TraceOptions {
  if (variant === 'none') return { lexicon: null, glossary: [] }
  if (variant === 'lexicon') return { glossary: [] }
  return { glossary }
}

function view(result: TraceResult): TraceRowView {
  return {
    unitId: result.unitId,
    line: result.line,
    text: result.text.length > TRACE_TEXT_CHARS ? `${result.text.slice(0, TRACE_TEXT_CHARS - 1)}…` : result.text,
    bridged: result.query.bridged,
    confidence: result.confidence,
    top: result.top.map((hit) => ({ ...hit, terms: hit.terms.slice(0, 8) })),
  }
}

export type TraceRun = { findings: Finding[]; view: TraceView }

export function runTrace(text: string, path: string, lang: Lang, loaded: LoadedIndex, now: () => number = () => performance.now()): TraceRun {
  const started = now()
  const { units, glossary } = traceUnitsOf(text, path, lang)
  const results = Object.fromEntries(TRACE_VARIANTS.map((variant) => [variant, possiblyImplemented(units, loaded, traceOptions(variant, glossary))])) as Record<TraceVariant, TraceResult[]>
  const findings = traceFindings(results.glossary, path, DEFAULT_RULES)
  const ms = now() - started
  return {
    findings,
    view: {
      generatedAt: loaded.index.generatedAt,
      files: loaded.index.files.length,
      magnets: loaded.index.files.filter((file) => file.magnet).length,
      ms,
      variants: Object.fromEntries(TRACE_VARIANTS.map((variant) => [variant, results[variant].map(view)])) as Record<TraceVariant, TraceRowView[]>,
    },
  }
}
