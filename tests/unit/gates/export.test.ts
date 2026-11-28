import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as cotejo from 'cotejo-core'
import { describe, expect, it } from 'vitest'
import en from '@/content/i18n/en/gates.json'
import es from '@/content/i18n/es/gates.json'
import { actaSummary, ACTA_NOTE_MAX, appendNote, buildRevision, GATES_STATION_ID, revisionFile, specFile } from '@/lib/ai/gates/export'
import { gateRunSchema, revisionSchema, type GateDecision, type GateRun } from '@/lib/ai/gates/schema'
import { EMPTY_PROGRESS, setNote } from '@/lib/ailab/route/progress'
import { routeActa } from '@/lib/ailab/route/acta'
import type { RouteStationView } from '@/lib/ailab/route/view'

function recorded(name: string): GateRun {
  return gateRunSchema.parse(JSON.parse(readFileSync(join(process.cwd(), 'content', 'ailab', 'gates', 'recorded', `${name}.json`), 'utf8')))
}

const DECISION: GateDecision = { decision: 'pedir-cambios', comment: 'Falta el plazo del correo.', at: '2026-11-28T15:00:00.000Z' }

describe('spec.md y revision.json (FR-4616, historia 5)', () => {
  it('spec.md es la spec de la última ronda en el formato breve, y Cotejo la reconoce', () => {
    const run = recorded('citas-es')
    const markdown = specFile(run)
    expect(markdown.startsWith(`# ${run.rounds.at(-1)!.spec.title}`)).toBe(true)
    expect(cotejo.analyze({ text: markdown, path: 'spec.md', profile: 'breve', lang: 'es' }).profile).toBe('breve')
    expect(specFile(recorded('citas-en'))).toContain('## Does not include')
  })

  it('revision.json cumple su esquema y trae la decisión con su comentario, sin el sello', () => {
    const run = { ...recorded('panaderia-es'), seal: 'sello-del-servidor' }
    const revision = buildRevision(run, DECISION)
    expect(revisionSchema.parse(revision)).toEqual(revision)
    expect(revision.decision).toEqual(DECISION)
    expect(revision).not.toHaveProperty('seal')
    expect(revision).toMatchObject({ schemaVersion: 1, request: run.request, recommendation: run.recommendation, stop: run.stop, totalUsd: run.totalUsd })
    expect(revision.rounds.map((round) => round.spec)).toEqual(run.rounds.map((round) => round.spec))
    expect(JSON.parse(revisionFile(run, DECISION))).toEqual(revision)
  })

  it.each([
    ['es', es],
    ['en', en],
  ] as const)('%s: el aporte al acta lleva pedido, recomendación con su motivo, decisión, hallazgos, tumbados y costo, y cabe en la nota', (lang, dict) => {
    const run = recorded(`panaderia-${lang}`)
    const summary = actaSummary({ lang, run, decision: DECISION, template: dict['gates.download.acta.summary'], stopText: dict['gates.stop.empeoro'] })
    expect(summary.length).toBeLessThanOrEqual(ACTA_NOTE_MAX)
    expect(summary).toContain(lang === 'es' ? 'No lista' : 'Not ready')
    expect(summary).toContain(lang === 'es' ? 'pedir cambios' : 'request changes')
    expect(summary).toContain('Falta el plazo del correo.')
    expect(summary).toContain('0.0000 USD')
    expect(summary).not.toMatch(/\{\w+\}/)
  })

  it('suma la nota a la de la estación sin borrar lo que escribió quien entrevista, y llega al acta de la ruta (042)', () => {
    const run = recorded('contacto-es')
    const summary = actaSummary({ lang: 'es', run, decision: DECISION, template: es['gates.download.acta.summary'], stopText: es['gates.stop.limpia'] })
    expect(appendNote(undefined, summary)).toBe(summary)
    const mine = 'Me gustó ver el hallazgo tachado.'
    const merged = appendNote(mine, summary)
    expect(merged.startsWith(mine)).toBe(true)
    expect(merged.endsWith(summary)).toBe(true)
    expect(appendNote(merged, summary)).toBe(merged)
    const progress = setNote({ ...EMPTY_PROGRESS, startedAt: Date.parse('2026-11-28T15:00:00.000Z') }, GATES_STATION_ID, merged)
    const station: RouteStationView = {
      id: GATES_STATION_ID,
      proof: 4,
      also: [],
      core: false,
      position: null,
      title: 'Del pedido a la spec',
      minutes: 3,
      goal: 'Ver el gate de una spec',
      steps: [],
      action: { label: 'Abrir', href: '/es/ai-lab#lab-a12', external: false },
      evidence: [],
      links: [],
      spec: '046',
      tip: null,
      offline: null,
      breakIt: false,
      recordedTrace: false,
    }
    const acta = routeActa({ lang: 'es', stations: [station], proofs: [{ proof: 4, title: 'Entrega rápida con IA' }], progress, origin: 'https://ejemplo.invalid', now: Date.parse('2026-11-28T15:03:00.000Z') })
    expect(acta).toContain(summary)
  })
})
