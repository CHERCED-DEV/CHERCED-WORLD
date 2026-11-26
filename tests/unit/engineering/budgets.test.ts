import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { budgetLimit, budgetValue } from '@/components/engineering/budget-format'
import { BUDGETS, BUDGETS_SOURCE, budgetRows } from '@/lib/engineering/budgets'
import { BUDGET_IDS, type Measurement } from '@/lib/engineering/history'
import { listTracked } from '@/lib/engineering/tracked'

const ROOT = process.cwd()

function measurement(budget: Measurement['budget'], value: number, date: string): Measurement {
  return { budget, page: '/es/ingenieria', value, date, source: 'tests/e2e/integration/performance.spec.ts' }
}

describe('presupuestos del principio V que vigila una prueba (FR-4510)', () => {
  it('son los cuatro de la constitución, con los mismos límites', () => {
    expect(BUDGETS.map((budget) => budget.id)).toEqual([...BUDGET_IDS])
    const constitution = readFileSync(join(ROOT, BUDGETS_SOURCE), 'utf8')
    for (const text of ['Largest Contentful Paint ≤ 2,5 s', 'Cumulative Layout Shift ≤ 0,1', 'Interaction to Next Paint ≤ 200 ms', 'accesibilidad automatizado ≥ 95']) {
      expect(constitution, text).toContain(text)
    }
    const dict = { 'engineering.budgets.a11yLimit': 'y cero violaciones críticas' }
    expect(BUDGETS.map((budget) => budgetLimit(budget, 'es', dict))).toEqual(['≤ 2,5 s', '≤ 0,1', '≤ 200 ms', '≥ 95 y cero violaciones críticas'])
  })

  it('cada prueba que lo vigila existe, está versionada y de verdad mide ese presupuesto', () => {
    const tracked = new Set(listTracked(ROOT, ['tests']).files)
    for (const budget of BUDGETS) {
      expect(budget.guards.length, budget.id).toBeGreaterThan(0)
      for (const guard of budget.guards) {
        expect(tracked.has(guard.file), guard.file).toBe(true)
        expect(readFileSync(join(ROOT, guard.file), 'utf8'), `${guard.file} mide ${budget.id}`).toContain(guard.needle)
      }
    }
  })

  it('sin mediciones guardadas no muestra ningún valor', () => {
    const rows = budgetRows([])
    expect(rows.map((row) => row.latest)).toEqual([null, null, null, null])
    expect(rows.map((row) => row.withinLimit)).toEqual([null, null, null, null])
  })

  it('con mediciones usa la más reciente de cada presupuesto y dice si cumple', () => {
    const rows = budgetRows([
      measurement('lcp', 2900, '2026-11-20T10:00:00-05:00'),
      measurement('lcp', 1830, '2026-11-26T10:00:00-05:00'),
      measurement('cls', 0.18, '2026-11-26T10:00:00-05:00'),
    ])
    expect(rows[0]?.latest?.value).toBe(1830)
    expect(rows[0]?.withinLimit).toBe(true)
    expect(rows[1]?.withinLimit).toBe(false)
    expect(rows[2]?.latest).toBeNull()
    expect(budgetValue(BUDGETS[0]!, 1830, 'es')).toBe('1,83 s')
    expect(budgetValue(BUDGETS[2]!, 140, 'en')).toBe('140 ms')
  })
})
