import { formatFact, synergosFacts } from '@/content/synergos'
import type { Locale, SiteContent, SynergosFacts } from '@/content/types'

export type FigureId = 'years' | 'pieces' | 'adrs' | 'tests'

export type Figure = { id: FigureId; value: number; plus: boolean }

export type FigureFacts = Pick<SynergosFacts, 'pieces' | 'adrsAtLeast' | 'testsAtLeast'>

export function aboutFigures(about: Pick<SiteContent['about'], 'experienceYears'>, facts: FigureFacts = synergosFacts): Figure[] {
  const figures: Figure[] = []
  if (about.experienceYears && about.experienceYears > 0) figures.push({ id: 'years', value: about.experienceYears, plus: false })
  if (facts.pieces > 0) figures.push({ id: 'pieces', value: facts.pieces, plus: false })
  if (facts.adrsAtLeast > 0) figures.push({ id: 'adrs', value: facts.adrsAtLeast, plus: true })
  if (facts.testsAtLeast > 0) figures.push({ id: 'tests', value: facts.testsAtLeast, plus: true })
  return figures
}

export function figureDigits(value: number, lang: Locale): string {
  return formatFact(value, lang)
}

export function figureText(figure: Pick<Figure, 'value' | 'plus'>, lang: Locale): string {
  return `${figureDigits(figure.value, lang)}${figure.plus ? '+' : ''}`
}
