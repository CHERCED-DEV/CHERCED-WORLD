import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArenaCaseView, ArenaView } from '@/components/ailab/arena/ArenaStage'
import en from '@/content/i18n/en/arena.json'
import es from '@/content/i18n/es/arena.json'
import { addArenaRun, arenaResultsSchema, arenaRunSchema, ARENA_HISTORY_MAX, type ArenaRun } from '@/content/ailab/arena/results'
import { arenaTask, ARENA_TASKS } from '@/content/ailab/arena/tasks'
import { injectionFailures } from '@/content/ailab/arena/view'
import { buildRun, compareCase, runnable } from '@/lib/ai/providers/arena'
import { arenaPort } from './support'

const ROOT = process.cwd()

const MODELS = { gemini: 'gemini-3.8-flash', claude: 'claude-sonnet-5-5', openai: 'gpt-6.2-sol' }

async function fixtureRun(): Promise<ArenaRun> {
  const port = arenaPort(['gemini', 'claude'], [], {
    answer: (task) => (task?.kind === 'injection' ? { summary: 'APROBADO', suspiciousInstructions: false, nextSteps: [] } : task?.sample),
  })
  const cases = []
  for (const task of ARENA_TASKS) cases.push(await compareCase(runnable(task), { generate: port.generateJson, models: MODELS }))
  return buildRun({ mode: 'pregenerada', simulated: false, cases, now: new Date('2026-11-27T15:00:00.000Z') })
}

describe('contrato de la corrida pregenerada (FR-4314)', () => {
  it('results.json cumple el esquema y guarda máximo 10 corridas', () => {
    const results = JSON.parse(readFileSync(join(ROOT, 'content', 'ailab', 'arena', 'results.json'), 'utf8'))
    expect(arenaResultsSchema.safeParse(results).success).toBe(true)
    expect(ARENA_HISTORY_MAX).toBe(10)
  })

  it('una corrida trae fecha, modelos reales, fecha de los precios y costo en USD y COP', async () => {
    const run = await fixtureRun()
    expect(arenaRunSchema.parse(run)).toEqual(run)
    expect(run).toMatchObject({ mode: 'pregenerada', rubricVersion: '043-v1', pricesCheckedAt: { claude: '2026-11-27' }, copRate: { value: 3297 } })
    expect(run.cases).toHaveLength(12)
    expect(run.totalUsd).toBeGreaterThan(0)
    expect(run.totalCop).toBe(Math.round(run.totalUsd * 3297))
    let history = { runs: [] as ArenaRun[] }
    for (let index = 0; index < 12; index++) history = addArenaRun(history, { ...run, id: `r${index}` })
    expect(history.runs.map((item) => item.id)).toEqual(['r11', 'r10', 'r9', 'r8', 'r7', 'r6', 'r5', 'r4', 'r3', 'r2'])
  })

  it('el esquema rechaza un juez del mismo proveedor evaluado', async () => {
    const run = await fixtureRun()
    const column = run.cases[0]!.columns.find((item) => item.judge)!
    const broken = structuredClone(run)
    broken.cases[0]!.columns.find((item) => item.provider === column.provider)!.judge!.provider = column.provider
    expect(arenaRunSchema.safeParse(broken).success).toBe(false)
  })

  it('la puerta de calidad lista los casos de inyección fallados por proveedor (para la 045)', async () => {
    const run = await fixtureRun()
    expect(injectionFailures(run)).toEqual([
      { taskId: 'inyeccion-es', provider: 'gemini' },
      { taskId: 'inyeccion-es', provider: 'claude' },
      { taskId: 'inyeccion-en', provider: 'gemini' },
      { taskId: 'inyeccion-en', provider: 'claude' },
    ])
  })
})

describe('la tarjeta con lo pregenerado (FR-4316, FR-4317, SC-4301)', () => {
  it.each(['es', 'en'] as const)('%s: columnas, tabla con encabezados, «no es un benchmark», fecha, «no activo» y aviso de inyección', async (lang) => {
    const run = await fixtureRun()
    const html = renderToStaticMarkup(createElement(ArenaView, { lang, pregenerated: run }))
    const text = lang === 'es' ? es : en
    expect(html).toContain('data-cw-arena-benchmark=""')
    expect(html).toContain(text['arena.notBenchmark'].replace(/'/g, '&#x27;'))
    expect(html).toContain('data-cw-arena-run="pregenerada"')
    expect(html.match(/data-cw-arena-column="/g)).toHaveLength(3)
    expect(html).toContain(text['arena.column.inactive'])
    expect(html).toContain('<caption')
    expect(html.match(/scope="col"/g)).toHaveLength(4)
    expect(html.match(/scope="row"/g)).toHaveLength(6)
    expect(html).toContain('data-cw-arena-best=""')
    expect(html).toContain(text['arena.column.best'])
    expect(html.match(/type="radio"/g)).toHaveLength(6)
    expect(html).toContain('data-cw-arena-trace="claude"')
  })

  it('el aviso rojo de inyección no depende solo del color: trae texto', async () => {
    const run = await fixtureRun()
    const entry = run.cases.find((item) => item.taskId === 'inyeccion-es')!
    const task = arenaTask('inyeccion-es')!
    const html = renderToStaticMarkup(createElement(ArenaCaseView, { lang: 'es', entry, run, input: { instruction: task.instruction, input: task.input } }))
    expect(html.match(/data-cw-arena-injection=""/g)).toHaveLength(2)
    expect(html).toContain(es['arena.injection.warn'])
    expect(html).toContain('REEMBOLSO-TOTAL')
  })

  it('sin corrida pregenerada, lo dice y deja correr en vivo', () => {
    const html = renderToStaticMarkup(createElement(ArenaView, { lang: 'es', pregenerated: null }))
    expect(html).toContain('data-cw-arena-empty=""')
    expect(html).toContain('npm run arena:run')
    expect(html).toContain('data-cw-arena-live="loading"')
  })
})

describe('textos de la arena en ES y EN (paridad)', () => {
  it('las mismas claves y marcadores en los dos idiomas, sin textos vacíos', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort())
    for (const [key, value] of Object.entries(es)) {
      expect(value.trim(), key).not.toBe('')
      const marks = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
      expect(marks(en[key as keyof typeof en]), key).toEqual(marks(value))
    }
  })
})
