import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as core from 'cotejo-core'
import { analyze, compactSummary, CORE_VERSION, DEFAULT_RULES, reportHash, toMarkdown, toSarif, type CotejoReport } from 'cotejo-core'

const ROOT = process.cwd()
const PINNED = '0.1.0'
const RELEASE = `https://github.com/CHERCED-DEV/cotejo/releases/download/v${PINNED}`
const PACKAGES = ['cotejo-core', 'cotejo-semantic', 'cotejo-trace'] as const

const BRIEF = `# Exportar pedidos a CSV

## Problema

El equipo de soporte copia a mano los pedidos del día para cruzarlos con el banco.

## Incluye

- Exportar los pedidos de un día a CSV.

## No incluye

## Requisitos

- **R-1**: El back office DEBE exportar los pedidos de un día a un archivo CSV.
- **R-2**: El archivo DEBE incluir el número, la fecha y el valor de cada pedido.
- **R-3**: La exportación DEBE tardar 5 s o menos para 10.000 pedidos.

## Criterios

- **C-1** (cubre R-1): Dado un día con pedidos, cuando el operador exporta, entonces recibe un CSV con esos pedidos.
- **C-2** (cubre R-9): Dado un pedido anulado, cuando se exporta, entonces aparece con su estado.
- **C-3**: Dado un día sin pedidos, cuando el operador exporta, entonces recibe un CSV vacío con encabezados.

## Preguntas

- **Q-1**: ¿El separador es coma o punto y coma? Por defecto: coma.
- **Q-2**: ¿Se incluyen los pedidos de prueba?
`

const SEVERITIES = ['error', 'warning', 'note']
const FAMILIES = ['structure', 'ids', 'references', 'glossary', 'numbers', 'language', 'duplicates', 'value-conflict', 'polarity-conflict', 'coverage']

function brief(): CotejoReport {
  return analyze({ text: BRIEF, path: 'brief.md', profile: 'breve' })
}

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as Record<string, unknown>
}

describe('el sitio fija la misma versión del núcleo que prueba el repo de Cotejo (SC-4711)', () => {
  it('los tres paquetes entran por la URL del tarball del release, con versión exacta y su hash en el lock', () => {
    const deps = json('package.json').dependencies as Record<string, string>
    const lock = json('package-lock.json').packages as Record<string, { version?: string; resolved?: string; integrity?: string }>
    for (const name of PACKAGES) {
      expect(deps[name], name).toBe(`${RELEASE}/${name}-${PINNED}.tgz`)
      const entry = lock[`node_modules/${name}`]
      expect(entry?.version, name).toBe(PINNED)
      expect(entry?.resolved, name).toBe(`${RELEASE}/${name}-${PINNED}.tgz`)
      expect(entry?.integrity, name).toMatch(/^sha512-[A-Za-z0-9+/]{86}==$/)
    }
  })

  it('lo instalado es esa versión, y el núcleo dice la misma', () => {
    for (const name of PACKAGES) expect(json(`node_modules/${name}/package.json`).version, name).toBe(PINNED)
    expect(CORE_VERSION).toBe(PINNED)
  })
})

describe('contrato de cotejo-core, el mismo del repo de Cotejo', () => {
  it('exporta la API estable del plan', () => {
    for (const name of ['analyze', 'toSarif', 'toMarkdown', 'compactSummary', 'reportHash']) expect(typeof (core as Record<string, unknown>)[name]).toBe('function')
    expect(typeof CORE_VERSION).toBe('string')
    expect(CORE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    expect(DEFAULT_RULES.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(DEFAULT_RULES.rules.length).toBeGreaterThan(20)
    expect(Object.keys(DEFAULT_RULES.dictionaries).sort()).toEqual(['en', 'es'])
  })

  it('devuelve un reporte con la forma y el schemaVersion del contrato', () => {
    const r = brief()
    expect(Object.keys(r).sort()).toEqual(['counts', 'findings', 'lang', 'profile', 'reproducibility', 'schemaVersion', 'timingsMs', 'tool', 'units'])
    expect(r.schemaVersion).toBe(1)
    expect(r.tool).toEqual({ name: 'cotejo', version: CORE_VERSION })
    expect(r.profile).toBe('breve')
    expect(r.lang).toBe('es')
    expect(r.units).toBeGreaterThan(5)
    expect(Object.keys(r.counts).sort()).toEqual(['error', 'note', 'warning'])
    expect(r.counts.error + r.counts.warning + r.counts.note).toBe(r.findings.length)
    expect(Object.keys(r.reproducibility).sort()).toEqual(['configHash', 'inputHash', 'models', 'onnxRuntime'])
    expect(r.reproducibility.inputHash).toMatch(/^[0-9a-f]{64}$/)
    expect(r.reproducibility.configHash).toMatch(/^[0-9a-f]{64}$/)
    expect(r.reproducibility.models).toEqual([])
    expect(r.reproducibility.onnxRuntime).toBeNull()
    expect(Object.keys(r.timingsMs).sort()).toEqual(['C1', 'C2', 'C3', 'C4'])
    expect(typeof r.timingsMs.C1).toBe('number')
    expect([r.timingsMs.C2, r.timingsMs.C3, r.timingsMs.C4]).toEqual([null, null, null])
  })

  it('cada hallazgo trae id, regla, capa, severidad SARIF, puntaje con componentes, evidencia, textos ES/EN y huella', () => {
    const r = brief()
    expect(r.findings.length).toBeGreaterThan(0)
    r.findings.forEach((f, i) => {
      expect(Object.keys(f).sort()).toEqual(['components', 'evidence', 'family', 'fingerprint', 'howToRefute', 'id', 'layers', 'rule', 'score', 'severity', 'why'])
      expect(f.id).toBe(`CT-${String(i + 1).padStart(4, '0')}`)
      expect(SEVERITIES).toContain(f.severity)
      expect(FAMILIES).toContain(f.family)
      expect(f.layers).toEqual(['C1'])
      expect(f.score).toBeGreaterThan(0)
      expect(f.score).toBeLessThanOrEqual(1)
      expect(['fact', 'signal']).toContain(f.components.basis)
      if (f.components.basis === 'fact') expect(f.score).toBe(1)
      expect(f.evidence.length).toBeGreaterThan(0)
      for (const e of f.evidence) {
        expect(e.file).toBe('brief.md')
        expect(e.line).toBeGreaterThan(0)
        expect(e.column).toBeGreaterThan(0)
        expect(typeof e.fragment).toBe('string')
      }
      expect(f.why.es.length).toBeGreaterThan(5)
      expect(f.why.en.length).toBeGreaterThan(5)
      expect(f.howToRefute.es.length).toBeGreaterThan(5)
      expect(f.howToRefute.en.length).toBeGreaterThan(5)
      expect(f.why.es).not.toMatch(/\{[a-zA-Z]+\}/)
      expect(f.fingerprint).toMatch(/^[0-9a-f]{64}$/)
    })
    const rank = { error: 0, warning: 1, note: 2 }
    for (let i = 1; i < r.findings.length; i++) expect(rank[r.findings[i - 1]!.severity]).toBeLessThanOrEqual(rank[r.findings[i]!.severity])
  })

  it('el perfil breve marca en error el criterio que no cubre ningún requisito, en su línea', () => {
    const r = brief()
    const line = BRIEF.split('\n').findIndex((l) => l.includes('**C-3**')) + 1
    const f = r.findings.find((x) => x.rule === 'coverage.criterion-without-requirement')
    expect(f?.severity).toBe('error')
    expect(f?.family).toBe('coverage')
    expect(f?.evidence[0]?.line).toBe(line)
    expect(f?.evidence[0]?.unitId).toBe('C-3')
  })

  it('el perfil breve marca el criterio que cubre un requisito inexistente, el requisito sin criterio y «No incluye» vacío', () => {
    const r = brief()
    const byRule = (rule: string) => r.findings.filter((f) => f.rule === rule)
    expect(byRule('coverage.unknown-requirement').map((f) => f.components.ref)).toEqual(['R-9'])
    expect(byRule('coverage.unknown-requirement')[0]?.severity).toBe('error')
    expect(byRule('coverage.requirement-without-criterion').map((f) => f.components.id).sort()).toEqual(['R-2', 'R-3'])
    const excludes = byRule('structure.empty-excludes')
    expect(excludes).toHaveLength(1)
    expect(excludes[0]?.family).toBe('structure')
    expect(excludes[0]?.severity).toBe('error')
    expect(byRule('structure.question-without-default').map((f) => f.components.question)).toEqual(['Q-2'])
    expect(byRule('references.unknown-id')).toEqual([])
  })

  it('el mismo texto da el mismo sha256 del JSON, y el hash ignora los tiempos', () => {
    const a = brief()
    const b = brief()
    expect(reportHash(a)).toBe(reportHash(b))
    expect(reportHash({ ...a, timingsMs: { C1: 99999, C2: 1, C3: 2, C4: 3 } })).toBe(reportHash(a))
    const { timingsMs: _ta, ...restA } = a
    const { timingsMs: _tb, ...restB } = b
    expect(JSON.stringify(restA)).toBe(JSON.stringify(restB))
    const changed = analyze({ text: BRIEF.replace('5 s', '6 s'), path: 'brief.md', profile: 'breve' })
    expect(reportHash(changed)).not.toBe(reportHash(a))
  })

  it('la línea base oculta los hallazgos aceptados por su huella', () => {
    const r = brief()
    const accepted = r.findings.filter((f) => f.severity === 'error').map((f) => f.fingerprint)
    const next = analyze({ text: BRIEF, path: 'brief.md', profile: 'breve' }, { baseline: accepted })
    expect(next.findings.some((f) => accepted.includes(f.fingerprint))).toBe(false)
    expect(next.counts.error).toBe(0)
    expect(next.findings.length).toBe(r.findings.length - accepted.length)
  })

  it('analiza sin perfil y lo reporta como null', () => {
    const r = analyze({ text: '# Notas\n\nUn párrafo sin plantilla.\n' })
    expect(r.profile).toBeNull()
    expect(r.findings.filter((f) => f.rule === 'structure.missing-section')).toEqual([])
  })

  it('produce SARIF 2.1.0, Markdown y el resumen compacto del mismo resultado', () => {
    const r = brief()
    const sarif = toSarif(r)
    expect(sarif.version).toBe('2.1.0')
    expect(sarif.runs[0]?.tool.driver.name).toBe('cotejo')
    expect(sarif.runs[0]?.results.length).toBeGreaterThanOrEqual(r.findings.length)
    expect(sarif.runs[0]?.results[0]?.level).toBe('error')
    const md = toMarkdown(r, 'es')
    expect(md).toContain('# Cotejo: reporte de brief.md')
    expect(md).toContain('CT-0001')
    expect(toMarkdown(r, 'en')).toContain('# Cotejo: report for brief.md')
    const compact = compactSummary(r, 'es').trimEnd().split('\n')
    expect(compact[0]).toContain(`cotejo ${CORE_VERSION}`)
    const errorsAndWarnings = r.findings.filter((f) => f.severity !== 'note').length
    expect(compact.filter((l) => /^[EW] CT-\d{4} /.test(l))).toHaveLength(errorsAndWarnings)
  })
})
