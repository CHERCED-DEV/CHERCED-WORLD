import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RunView, StepList } from '@/components/ailab/gates/GatesStage'
import en from '@/content/i18n/en/gates.json'
import es from '@/content/i18n/es/gates.json'
import { gateRunSchema, type GateRun } from '@/lib/ai/gates/schema'
import { replayMs } from '@/lib/ai/gates/view'

const COPY = { es, en } as const

function recorded(name: string): GateRun {
  return gateRunSchema.parse(JSON.parse(readFileSync(join(process.cwd(), 'content', 'ailab', 'gates', 'recorded', `${name}.json`), 'utf8')))
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

function view(run: GateRun, shown = run.steps.length) {
  return renderToStaticMarkup(createElement(RunView, { lang: run.request.lang, run, shown, pending: false, decision: null, onDecide: () => {}, requestChanges: null, onRun: () => {} }))
}

describe('textos de la tarjeta A12 (FR-4618)', () => {
  it('español e inglés tienen las mismas claves y ninguna vacía', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
    for (const dict of [es, en]) for (const [key, value] of Object.entries(dict)) expect(value.trim(), key).not.toBe('')
  })
})

describe('la tarjeta con una corrida grabada (FR-4611 a FR-4613, FR-4618, SC-4601)', () => {
  it.each(['es', 'en'] as const)('%s: los pasos son una lista con estado, la gravedad va en texto y lo tumbado queda tachado', (lang) => {
    const run = recorded(`panaderia-${lang}`)
    const text = COPY[lang]
    const html = view(run)
    expect(html).toContain('<ol')
    expect(html.match(/data-cw-gates-step="/g)).toHaveLength(run.steps.length)
    expect(html).toContain(`>${text['gates.step.status.done']}<`)
    expect(html).toContain(text['gates.gravity.bloqueante'])
    expect(html).toContain(text['gates.gravity.menor'])
    expect(html).toContain('data-struck=""')
    expect(html).toMatch(/<s>[^<]+<\/s>/)
    expect(html).toContain(text['gates.verify.knockedShort'])
    expect(html).toContain(escape(text['gates.findings.rule']))
    expect(html).toContain(`data-cw-gates-recommendation="${run.recommendation}"`)
    expect(html).toContain(escape(text['gates.stop.empeoro']))
    expect(html).toContain(escape(text['gates.recommendation.note']))
    for (const kind of ['aprobar', 'pedir-cambios', 'rechazar']) expect(html).toContain(`data-cw-gates-decide="${kind}"`)
    expect(html).toContain('data-cw-gates-total=""')
  })

  it('cada paso dice proveedor, modelo, tokens, tiempo y costo, y lo simulado dice a quién representa', () => {
    const run = recorded('contacto-es')
    const html = view(run)
    expect(html).toContain('data-cw-provider="simulator"')
    expect(html).toContain('en el papel de Gemini')
    expect(html).toContain('en el papel de Claude')
    expect(html).toContain('en el papel de OpenAI')
    expect(html).toContain('Chequeo determinista')
    expect(html).toContain('cotejo-core')
    expect(html).toContain('0 USD: corre en el servidor, sin modelo')
    expect(html.match(/data-cw-gates-trace="/g)).toHaveLength(run.steps.length)
  })

  it('a mitad de la reproducción solo se ve lo que ya pasó, y la decisión espera al final', () => {
    const run = recorded('citas-es')
    const html = view(run, 2)
    expect(html.match(/data-state="done"/g)).toHaveLength(2)
    expect(html).toContain('data-state="current"')
    expect(html).not.toContain('data-cw-gates-decision')
    expect(html).not.toContain('data-cw-gates-recommendation')
  })

  it('SC-4601: cada corrida grabada se reproduce en 90 s o menos', () => {
    for (const name of ['contacto-es', 'contacto-en', 'citas-es', 'citas-en', 'panaderia-es', 'panaderia-en']) expect(replayMs(recorded(name)), name).toBeLessThanOrEqual(90_000)
  })

  it('la lista de pasos suma recomendar y decidir al final', () => {
    const run = recorded('contacto-en')
    const html = renderToStaticMarkup(createElement(StepList, { lang: 'en', run, shown: run.steps.length, pending: false, decided: false }))
    expect(html).toContain('data-kind="recomendar"')
    expect(html).toContain('data-kind="decidir"')
    expect(html).toContain('Recommend')
    expect(html).toContain('Decide')
  })
})

describe('lo que la tarjeta dice de las evals (historia 6)', () => {
  it('sin corridas lo dice, y si una inyección logró «Lista para aprobar» muestra el aviso', async () => {
    const { GatesEvals } = await import('@/components/ailab/gates/GatesEvals')
    const empty = renderToStaticMarkup(createElement(GatesEvals, { lang: 'es' }))
    expect(empty).toContain('data-cw-gates-evals="ninguna"')
    expect(empty).toContain('npm run evals:gates')
    const latest = {
      id: 'x',
      at: '2026-11-28T16:00:00.000Z',
      battery: '046-b1',
      rubricVersion: '046-v1',
      simulated: false,
      providers: ['gemini', 'claude'] as Array<'gemini' | 'claude'>,
      pricesCheckedAt: { gemini: '2026-11-27', claude: '2026-11-27', openai: '2026-11-27' },
      seeded: { defects: 30, found: 24, rate: 0.8, missed: [] },
      clean: { specs: 5, falseBlockers: 0, byCase: [] },
      falseFindings: { planted: 10, knockedDown: 7, rate: 0.7, standing: [] },
      injection: { cases: 6, failed: 1, failures: ['inyeccion-pedido-es'] },
      notSoftware: { cases: 2, passed: 2, failures: [] },
      pass: false,
      costUsd: 0.41,
      costCop: 1352,
    }
    const html = renderToStaticMarkup(createElement(GatesEvals, { lang: 'en', latest }))
    expect(html).toContain('data-cw-gates-injection=""')
    expect(html).toContain('1 of 6 injection cases')
    expect(html).toContain('24 of 30')
  })
})
