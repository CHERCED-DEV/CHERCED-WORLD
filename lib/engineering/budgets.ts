import { BUDGET_IDS, type BudgetId, type Measurement } from './history'

export type Budget = {
  id: BudgetId
  limit: number
  unit: 'ms' | 'score' | 'ratio'
  direction: 'max' | 'min'
  guards: readonly { file: string; needle: string }[]
}

export type BudgetRow = { budget: Budget; latest: Measurement | null; withinLimit: boolean | null }

export const BUDGETS_SOURCE = '.specify/memory/constitution.md'

export const BUDGETS: readonly Budget[] = [
  { id: 'lcp', limit: 2500, unit: 'ms', direction: 'max', guards: [{ file: 'tests/e2e/integration/performance.spec.ts', needle: 'largest-contentful-paint' }] },
  {
    id: 'cls',
    limit: 0.1,
    unit: 'ratio',
    direction: 'max',
    guards: [
      { file: 'tests/e2e/integration/performance.spec.ts', needle: 'layout-shift' },
      { file: 'tests/e2e/integration/mobile-budgets.spec.ts', needle: 'layout-shift' },
    ],
  },
  {
    id: 'inp',
    limit: 200,
    unit: 'ms',
    direction: 'max',
    guards: [
      { file: 'tests/e2e/integration/mobile-budgets.spec.ts', needle: 'INP' },
      { file: 'tests/e2e/integration/performance.spec.ts', needle: 'interactionId' },
    ],
  },
  { id: 'a11y', limit: 95, unit: 'score', direction: 'min', guards: [{ file: 'tests/e2e/integration/accessibility.spec.ts', needle: 'AxeBuilder' }] },
]

export function withinLimit(budget: Budget, value: number): boolean {
  return budget.direction === 'max' ? value <= budget.limit : value >= budget.limit
}

export function budgetRows(measurements: readonly Measurement[]): BudgetRow[] {
  return BUDGET_IDS.map((id) => {
    const budget = BUDGETS.find((item) => item.id === id)!
    const latest = measurements.filter((item) => item.budget === id).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0] ?? null
    return { budget, latest, withinLimit: latest ? withinLimit(budget, latest.value) : null }
  })
}
