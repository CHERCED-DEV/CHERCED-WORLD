import type { analyze as cotejoAnalyze, Finding as CotejoFinding } from 'cotejo-core'
import { placeAt, specMarkdown } from './markdown'
import type { DeterministicFinding } from './merge'
import { WHERE, type GateLang, type Gravity, type RubricCriterion, type SpecBreve } from './schema'

export type CotejoCore = { analyze: typeof cotejoAnalyze; CORE_VERSION: string }

export const CHECKS_PROFILE = 'breve'

export const OWN_RULES = ['criterio-sin-requisito', 'rendimiento-sin-unidad'] as const

export type OwnRule = (typeof OWN_RULES)[number]

export type CheckResult = {
  findings: DeterministicFinding[]
  failures: DeterministicFinding[]
  warnings: DeterministicFinding[]
  ms: number
  model: string
}

const FAMILY_CRITERION: Readonly<Record<string, RubricCriterion>> = {
  coverage: 'verificable',
  numbers: 'verificable',
  structure: 'acotada',
  ids: 'clara',
  references: 'clara',
  glossary: 'clara',
  language: 'clara',
  duplicates: 'clara',
  'value-conflict': 'clara',
  'polarity-conflict': 'clara',
}

const RULE_CRITERION: Readonly<Record<string, RubricCriterion>> = {
  'structure.question-without-default': 'honesta',
  'structure.pending-marker': 'honesta',
  'structure.needs-clarification': 'honesta',
}

const OWN_TEXT: Readonly<Record<OwnRule, Record<GateLang, { problem: (detail: string) => string; fix: string }>>> = {
  'criterio-sin-requisito': {
    es: { problem: (id) => `El criterio ${id} no cubre ningún requisito que exista.`, fix: 'Haz que el criterio cubra un R-n de la spec, o agrega el requisito que verifica.' },
    en: { problem: (id) => `Criterion ${id} covers no requirement that exists.`, fix: 'Make the criterion cover an R-n of the spec, or add the requirement it verifies.' },
  },
  'rendimiento-sin-unidad': {
    es: { problem: (numbers) => `Habla de tiempo o rendimiento con números sin unidad: ${numbers}.`, fix: 'Pon la unidad junto a cada número: ms, s, min, MB, % o por segundo.' },
    en: { problem: (numbers) => `It talks about time or performance with unitless numbers: ${numbers}.`, fix: 'Put the unit next to every number: ms, s, min, MB, % or per second.' },
  },
}

export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase()
}

const PERFORMANCE =
  /\b(?:(?:tiempo|latenc|rendimiento|respond|respuest|demor|velocidad|rapidez|concurren|simultane|percentil|timeout|throughput|performance|speed|load|wait|time|aguant|handle)[a-z]*|carga|cargar|cargan|carguen|tarda|tardar|tardan|takes|within|under|en menos de|in less than)(?![a-z])/

const NUMBER = /(^|[^a-z0-9\-.,:/])(\d+(?:[.,]\d+)?)(?![a-z0-9:/])/g

const UNIT =
  /^\s*(ms|milisegundos?|milliseconds?|s|seg|segs|segundos?|seconds?|sec|secs|min|mins|minutos?|minutes?|h|hrs?|horas?|hours?|dias?|days?|semanas?|weeks?|meses|months?|%|por ciento|percent|kb|mb|gb|tb|kib|mib|gib|req\/s|rps|qps|fps|peticiones|solicitudes|requests|usuarios|users|personas|people|conexiones|connections|veces|times|x|pedidos|orders|mensajes|messages|adjuntos|attachments|archivos|files|caracteres|characters|registros|records|elementos|items|citas|appointments|correos|emails|pacientes|patients|usd|cop|dolares|dollars|pesos)(?![a-z])/

export function unitlessPerformanceNumbers(text: string): string[] {
  const folded = fold(text)
  if (!PERFORMANCE.test(folded)) return []
  const found: string[] = []
  for (const match of folded.matchAll(NUMBER)) {
    const start = (match.index ?? 0) + match[1]!.length + match[2]!.length
    if (!UNIT.test(folded.slice(start))) found.push(match[2]!)
  }
  return found
}

function ownFindings(spec: SpecBreve, lang: GateLang): DeterministicFinding[] {
  const out: DeterministicFinding[] = []
  const requirements = new Set(spec.requirements.map((item) => item.id))
  for (const criterion of spec.criteria) {
    if (!criterion.covers.some((id) => requirements.has(id))) {
      const text = OWN_TEXT['criterio-sin-requisito'][lang]
      out.push({ rule: 'criterio-sin-requisito', criterion: 'verificable', gravity: 'bloqueante', where: criterion.id, problem: text.problem(criterion.id), fix: text.fix })
    }
  }
  const items: Array<{ id: string; text: string }> = [
    ...spec.requirements.map((item) => ({ id: item.id, text: item.text })),
    ...spec.criteria.map((item) => ({ id: item.id, text: `${item.given}. ${item.when}. ${item.then}` })),
  ]
  for (const item of items) {
    const numbers = unitlessPerformanceNumbers(item.text)
    if (!numbers.length) continue
    const text = OWN_TEXT['rendimiento-sin-unidad'][lang]
    out.push({ rule: 'rendimiento-sin-unidad', criterion: 'verificable', gravity: 'bloqueante', where: item.id, problem: text.problem(numbers.join(', ')), fix: text.fix })
  }
  return out
}

function gravityOf(finding: CotejoFinding): Gravity | null {
  if (finding.severity === 'error') return 'bloqueante'
  if (finding.severity === 'warning') return 'menor'
  return null
}

function criterionOf(finding: CotejoFinding): RubricCriterion {
  return RULE_CRITERION[finding.rule] ?? FAMILY_CRITERION[finding.family] ?? 'clara'
}

export function runChecks(spec: SpecBreve, lang: GateLang, core: CotejoCore, clock: () => number = () => performance.now()): CheckResult {
  const started = clock()
  const markdown = specMarkdown(spec, lang)
  const report = core.analyze({ text: markdown.text, path: 'spec.md', profile: CHECKS_PROFILE, lang })
  const findings: DeterministicFinding[] = []
  for (const item of report.findings) {
    const gravity = gravityOf(item)
    if (!gravity) continue
    const evidence = item.evidence[0]
    const unit = evidence?.unitId && WHERE.test(evidence.unitId) ? evidence.unitId : null
    const where = unit ?? (evidence ? placeAt(markdown, evidence.line) : null) ?? 'title'
    findings.push({ rule: item.rule, criterion: criterionOf(item), gravity, where, problem: item.why[lang], fix: item.howToRefute[lang] })
  }
  findings.push(...ownFindings(spec, lang))
  const ms = Math.max(0, Math.round((clock() - started) * 100) / 100)
  return {
    findings,
    failures: findings.filter((item) => item.gravity === 'bloqueante'),
    warnings: findings.filter((item) => item.gravity !== 'bloqueante'),
    ms,
    model: `cotejo-core ${core.CORE_VERSION} · ${CHECKS_PROFILE}`,
  }
}

export function checkLines(items: readonly DeterministicFinding[]): string[] {
  return items.map((item) => `${item.where}: ${item.problem} (${item.rule})`)
}
