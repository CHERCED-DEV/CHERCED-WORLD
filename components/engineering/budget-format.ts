import type { Budget } from '@/lib/engineering/budgets'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { decimal } from './format'

export function budgetValue(budget: Budget, value: number, lang: Locale): string {
  if (budget.unit === 'ms') return value >= 1000 ? `${decimal(value / 1000, lang, 2)} s` : `${decimal(value, lang, 0)} ms`
  return decimal(value, lang, 3)
}

export function budgetLimit(budget: Budget, lang: Locale, dict: Dictionary): string {
  const limit = `${budget.direction === 'max' ? '≤' : '≥'} ${budgetValue(budget, budget.limit, lang)}`
  return budget.id === 'a11y' ? `${limit} ${t(dict, 'engineering.budgets.a11yLimit')}` : limit
}
