import { statSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CotejoView } from '@/components/ailab/cotejo/CotejoStage'
import { CotejoMetrics } from '@/components/ailab/cotejo/CotejoMetrics'
import { COTEJO_DOWNLOADS, downloadFileName } from '@/components/ailab/cotejo/CotejoDownloads'
import { FindingDetail } from '@/components/ailab/cotejo/FindingDetail'
import { TRACE_INDEX_BYTES } from '@/components/ailab/cotejo/TracePanel'
import { labExperiment } from '@/content/ailab/catalog'
import en from '@/content/i18n/en/cotejo.json'
import es from '@/content/i18n/es/cotejo.json'
import samples from '@/content/ailab/cotejo/samples.json'
import { COTEJO_DEFECTS } from '@/content/ailab/cotejo/truth'
import { runDeterministic } from '@/lib/ailab/cotejo/engine'
import { sourceLines } from '@/lib/ailab/cotejo/input'
import { matchDefect, scoreFindings } from '@/lib/ailab/cotejo/metrics'

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort()
}

describe('textos de la demo en ES y EN (T4740, FR-4719)', () => {
  it('las dos versiones tienen las mismas claves y los mismos marcadores', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
    for (const key of Object.keys(es) as Array<keyof typeof es>) {
      expect(es[key].trim(), key).not.toBe('')
      expect(en[key].trim(), key).not.toBe('')
      expect(placeholders(en[key]), key).toEqual(placeholders(es[key]))
    }
  })

  it('sin material confidencial ni rutas locales', () => {
    const corpus = JSON.stringify(es) + JSON.stringify(en)
    for (const pattern of [/sistecr/i, /factor[ií]a/i, /azure devops/i, /datadog/i, /fluid attacks/i, /[A-Z]:\\Users/i]) expect(corpus).not.toMatch(pattern)
  })
})

describe('la tarjeta antes de analizar (T4719)', () => {
  it.each(['es', 'en'] as const)('%s: elige la muestra del idioma de la página, y el botón y los enlaces se leen sin JavaScript del worker', (lang) => {
    const html = renderToStaticMarkup(createElement(CotejoView, { lang, experiment: 'A11', downloads: labExperiment('A11').downloads }))
    const copy = lang === 'es' ? es : en
    expect(html).toContain('data-cw-cotejo=""')
    expect(html).toContain(`data-cw-cotejo-source="sample-${lang}"`)
    expect(html).toMatch(new RegExp(`value="sample-${lang}"[^>]*checked=""|checked=""[^>]*value="sample-${lang}"`))
    expect(html).toContain(copy['cotejo.run.sample'])
    expect(html).toContain('href="https://github.com/CHERCED-DEV/cotejo"')
    expect(html).toContain('role="status"')
    expect(html).not.toContain('data-cw-cotejo-metrics')
  })
})

describe('la caja de cristal (T4719, T4740)', () => {
  const { report } = runDeterministic({ text: samples.es, path: 'muestra.es.md', lang: 'es' })
  const lines = sourceLines(samples.es)

  it('desglosa el puntaje, dice por qué y cómo refutarlo, y resalta la línea sin depender del color', () => {
    const finding = report.findings.find((item) => item.rule === 'conflict.value' && item.evidence.some((e) => e.line === 264))!
    const html = renderToStaticMarkup(createElement(FindingDetail, { id: 'd', lang: 'es', finding, lines, defect: matchDefect(finding, COTEJO_DEFECTS) }))
    expect(html).toContain('conflict.value')
    expect(html).toContain('Frase con los números enmascarados')
    expect(html).toContain(finding.why.es)
    expect(html).toContain(finding.howToRefute.es)
    expect(html).toContain('data-cw-cotejo-line="264"')
    expect(html).toMatch(/data-cw-cotejo-line="264" data-marked="">.*▶/)
    expect(html).toContain('Línea señalada:')
    expect(html).toContain('<mark')
    expect(html).toContain('data-cw-cotejo-truth="S08"')
    expect(html).toContain('0,95')
  })

  it('un hallazgo que no está en la verdad lo dice', () => {
    const en = runDeterministic({ text: samples.en, path: 'sample.en.md', lang: 'en' }).report
    const finding = en.findings.find((item) => item.rule === 'language.vague-quantifier' && item.components.term === 'many')!
    const html = renderToStaticMarkup(createElement(FindingDetail, { id: 'd', lang: 'en', finding, lines: sourceLines(samples.en), defect: matchDefect(finding, COTEJO_DEFECTS) }))
    expect(html).toContain('data-cw-cotejo-truth="none"')
    expect(html).toContain('it counts as a false positive')
  })

  it('las métricas muestran precisión, recall y lo que C1 no ve', () => {
    const html = renderToStaticMarkup(createElement(CotejoMetrics, { lang: 'es', score: scoreFindings(report.findings, COTEJO_DEFECTS), semanticOn: false }))
    expect(html).toContain('data-cw-cotejo-precision="1"')
    expect(html).toContain('1,00')
    expect(html).toContain('0,91')
    expect(html).toContain('31 de 34 defectos sembrados')
    expect(html).toContain('Lo que C1 no ve: 3 defectos')
  })
})

describe('descargas (T4720)', () => {
  it('JSON, SARIF, Markdown y el resumen, con nombre y tipo', () => {
    expect(COTEJO_DOWNLOADS.map((item) => item.kind)).toEqual(['json', 'sarif', 'markdown', 'summary'])
    expect(downloadFileName('cotejo-muestra-es', 'sarif', 'es')).toBe('cotejo-muestra-es.sarif')
    expect(downloadFileName('cotejo-sample-en', 'summary', 'en')).toBe('cotejo-sample-en-summary.txt')
    expect(downloadFileName('cotejo-muestra-es', 'markdown', 'es')).toBe('cotejo-muestra-es.md')
  })

  it('el peso del índice que anuncia la pantalla es el del archivo versionado', () => {
    const size = statSync(join(process.cwd(), 'content', 'ailab', 'cotejo', 'repo-index.json')).size
    expect(Math.abs(size - TRACE_INDEX_BYTES) / size).toBeLessThan(0.05)
  })
})
