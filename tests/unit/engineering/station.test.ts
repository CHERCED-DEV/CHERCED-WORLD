import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { engineeringStation } from '@/content/engineering/station'
import history from '@/content/engineering/history.json'
import { buildDashboard, deployInfo } from '@/lib/engineering/dashboard'
import { parseHistory } from '@/lib/engineering/history'
import { listTracked, trackedReader } from '@/lib/engineering/tracked'

const ROOT = process.cwd()

describe('estación «tablero-en-numeros» para la ruta de la 042 (FR-4512)', () => {
  it('cumple el contrato RouteStation: prueba 4 que también demuestra la 3, dos minutos y pasos en los dos idiomas', () => {
    const station = engineeringStation
    expect(station.id).toBe('tablero-en-numeros')
    expect(station.proof).toBe(4)
    expect(station.alsoProves).toEqual([3])
    expect(station.alsoProves).not.toContain(station.proof)
    expect(station.minutes).toBe(2)
    expect(station.steps.length).toBeGreaterThanOrEqual(2)
    expect(station.steps.length).toBeLessThanOrEqual(4)
    for (const text of [station.title, ...station.steps]) {
      expect(text.es.trim()).not.toBe('')
      expect(text.en.trim()).not.toBe('')
    }
    expect(station.evidence).toEqual(['metrics-link'])
    expect(readdirSync(join(ROOT, 'specs')).some((folder) => folder.startsWith(`${station.spec}-`))).toBe(true)
  })

  it('su enlace es interno, sin idioma, y lleva al detalle de la 030 que el tablero genera', () => {
    expect(engineeringStation.href).toBe('/ingenieria/030')
    expect(existsSync(join(ROOT, 'app', '[lang]', 'ingenieria', 'page.tsx'))).toBe(true)
    expect(existsSync(join(ROOT, 'app', '[lang]', 'ingenieria', '[spec]', 'page.tsx'))).toBe(true)
    const tracked = listTracked(ROOT)
    const dashboard = buildDashboard({ history: parseHistory(history), tracked, read: trackedReader(ROOT, tracked), vitest: null, deploy: deployInfo({}, new Date()), evals: [] })
    const spec = dashboard.specs.find((item) => item.number === '030')
    expect(spec?.commits.length).toBeGreaterThan(0)
    expect(spec?.days).toBe(1)
  })
})
