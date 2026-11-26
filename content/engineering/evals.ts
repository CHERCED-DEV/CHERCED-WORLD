import miniCherced from '@/content/ailab/evals/results.json'
import type { Localized } from '@/content/types'
import type { EvalResults } from '@/lib/ai/evals/grade'

export type PublishedEvals = {
  id: string
  spec: string
  title: Localized
  results: EvalResults
  resultsFile: string
  command: string
  costPerRun: Localized
  href: string
}

export const publishedEvals: readonly PublishedEvals[] = [
  {
    id: 'mini-cherced',
    spec: '032',
    title: { es: 'Mini Cherced: hechos, citas, navegación, rechazos, tono e identidad', en: 'Mini Cherced: facts, citations, navigation, refusals, tone and identity' },
    results: miniCherced as EvalResults,
    resultsFile: 'content/ailab/evals/results.json',
    command: 'npm run evals:agent',
    costPerRun: { es: 'unos 0,05 USD por corrida (spec 032)', en: 'about 0.05 USD per run (spec 032)' },
    href: '/ai-lab/evals',
  },
]
