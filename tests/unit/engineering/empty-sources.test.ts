import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EngineeringDashboard } from '@/components/engineering/EngineeringDashboard'
import { SpecDetail } from '@/components/engineering/SpecDetail'
import { publishedEvals } from '@/content/engineering/evals'
import history from '@/content/engineering/history.json'
import en from '@/content/i18n/en/engineering.json'
import es from '@/content/i18n/es/engineering.json'
import { buildDashboard, deployInfo, type DashboardInput } from '@/lib/engineering/dashboard'
import { parseHistory, type History } from '@/lib/engineering/history'
import { listTracked, trackedReader } from '@/lib/engineering/tracked'
import type { Locale } from '@/lib/i18n/config'

const ROOT = process.cwd()
const DICTS = { es: Object.freeze({ ...es }), en: Object.freeze({ ...es, ...en }) } as const
const SPEND = { targetUsd: 10, capUsd: 25 }

const EMPTY: DashboardInput = {
  history: null,
  tracked: { source: 'tree', files: [] },
  read: () => null,
  vitest: null,
  deploy: deployInfo({}, new Date('2026-11-26T17:00:00Z')),
  evals: publishedEvals.map((entry) => ({ ...entry, results: { runs: [] } })),
}

function render(input: DashboardInput, lang: Locale): string {
  return renderToStaticMarkup(createElement(EngineeringDashboard, { lang, dict: DICTS[lang], dashboard: buildDashboard(input), spend: SPEND }))
}

describe('con todas las fuentes vacías, el tablero no inventa números (SC-4503)', () => {
  it.each(['es', 'en'] as const)('en %s dice qué falta en cada sección y no muestra valores', (lang) => {
    const html = render(EMPTY, lang)
    const dict = DICTS[lang]
    for (const key of [
      'engineering.deploy.noReport',
      'engineering.specs.noHistory',
      'engineering.delivery.noWeekly',
      'engineering.delivery.noDeploys',
      'engineering.evals.empty',
      'engineering.deploy.local',
    ] as const) {
      expect(html, key).toContain(dict[key])
    }
    expect(html.split(dict['engineering.budgets.none']).length - 1).toBe(4)
    expect(html).toContain('data-cw-eng-tests="none"')
    expect(html).toContain('data-cw-eng-history="none"')
    expect(html).toContain('data-cw-eng-spend="idle"')
    expect(html).not.toContain('data-cw-eng-measurement="yes"')
    expect(html).not.toContain('data-cw-eng-evals-state="run"')
    expect(html).not.toMatch(/p50 \d|\d+ ms ·|\d+(,\d+)? USD ·/)
    expect(html).toContain('data-cw-eng-specs="0"')
  })

  it('con historial pero sin mediciones ni despliegues, esas dos partes siguen diciendo que no hay datos', () => {
    const partial: History = { ...parseHistory(history)!, deployments: null, measurements: [] }
    const html = render({ ...EMPTY, history: partial }, 'es')
    expect(html).toContain(DICTS.es['engineering.delivery.noDeploys'])
    expect(html.split(DICTS.es['engineering.budgets.none']).length - 1).toBe(4)
    expect(html).toContain('data-cw-eng-weekly="')
  })
})

describe('las páginas reales no publican datos privados (SC-4504)', () => {
  const tracked = listTracked(ROOT)
  const dashboard = buildDashboard({ ...EMPTY, history: parseHistory(history), tracked, read: trackedReader(ROOT, tracked), evals: publishedEvals })

  function clean(html: string): void {
    expect(html).not.toMatch(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)
    expect(html).not.toMatch(/vercel\.app/i)
    expect(html).not.toMatch(/privado\//i)
  }

  it.each(['es', 'en'] as const)('el tablero en %s: sin correos, URLs de vista previa ni rutas de privado/, y con un enlace al detalle de cada spec', (lang) => {
    const html = renderToStaticMarkup(createElement(EngineeringDashboard, { lang, dict: DICTS[lang], dashboard, spend: SPEND }))
    clean(html)
    for (const spec of dashboard.specs) expect(html).toContain(`href="/${lang}/ingenieria/${spec.number}"`)
  })

  it('cada detalle de spec, también', () => {
    for (const spec of dashboard.specs) clean(renderToStaticMarkup(createElement(SpecDetail, { lang: 'es', dict: DICTS.es, spec, dashboard })))
  })

  it('el detalle de la 030 trae sus commits con enlace, sus requisitos por archivo de prueba y 1 día hasta su primer feat', () => {
    const spec = dashboard.specs.find((item) => item.number === '030')!
    const html = renderToStaticMarkup(createElement(SpecDetail, { lang: 'es', dict: DICTS.es, spec, dashboard }))
    expect(html).toContain('data-cw-eng-days="1"')
    expect(html).toContain('1 día de la spec a su primer feat.')
    expect(html).toMatch(/href="https:\/\/github\.com\/CHERCED-DEV\/CHERCED-WORLD\/commit\/[0-9a-f]{7}"/)
    expect(html).toContain('data-cw-eng-tested')
    expect(html).toContain('href="/es/ingenieria"')
  })

  it('una spec sin commits que la nombren lo dice y no inventa un tiempo', () => {
    const spec = dashboard.specs.find((item) => item.commits.length === 0)!
    const html = renderToStaticMarkup(createElement(SpecDetail, { lang: 'es', dict: DICTS.es, spec, dashboard }))
    expect(html).toContain(DICTS.es['engineering.detail.noCommits'])
    expect(html).toContain('data-cw-eng-days=""')
  })
})
