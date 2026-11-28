import { labDownloadPlan } from '@/content/ailab/catalog'
import type { LabActivity, LabExperiment, LabInput, LabLimitPeriod } from '@/content/types'
import { formatUsd, typicalCostUsd } from '@/lib/ai/models'
import { formatBytes } from '@/lib/ailab/core/format'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import type { LabIconName } from './LabIcon'

export const LAB_FACT_KEYS = ['uses', 'time', 'downloads', 'engine', 'cost'] as const

export type LabFactKey = (typeof LAB_FACT_KEYS)[number]

export type LabFactLabels = {
  terms: Record<LabFactKey, string>
  inputs: Record<LabInput, string>
  activities: Record<LabActivity, string>
  session: { typical: string; capped: string }
  cost: { free: string; paid: string } & Record<LabLimitPeriod, string>
  plan: { none: string; upfront: string; onDemand: string }
}

export type LabFact = { key: LabFactKey; term: string; text: string; icon: LabIconName; plan?: string }

export type LabFactSheet = { brief: LabFact[]; more: LabFact[] }

const LIST_LOCALE: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

function sentence(text: string, lang: Locale): string {
  return text.charAt(0).toLocaleUpperCase(LIST_LOCALE[lang]) + text.slice(1)
}

export function labInputsText(inputs: readonly LabInput[], labels: LabFactLabels, lang: Locale): string {
  const list = new Intl.ListFormat(LIST_LOCALE[lang], { type: 'disjunction' }).format(inputs.map((input) => labels.inputs[input]))
  return sentence(list, lang)
}

export function labFacts(experiment: LabExperiment, labels: LabFactLabels, lang: Locale): LabFactSheet {
  const { session, limit } = experiment
  const plan = labDownloadPlan(experiment)
  const vars = { minutes: session.minutes, activity: labels.activities[session.activity] }
  const time = t({ session: session.capped ? labels.session.capped : labels.session.typical }, 'session', vars)
  const downloads = plan.kind === 'none' ? labels.plan.none : t({ plan: labels.plan[plan.kind] }, 'plan', { size: formatBytes(plan.bytes, lang) })
  const usd = experiment.runsIn === 'browser' ? null : typicalCostUsd(experiment.id)
  const base = limit ? t({ cost: labels.cost[limit.per] }, 'cost', { uses: limit.uses }) : labels.cost.free
  const cost = usd === null ? base : `${base} · ${t({ paid: labels.cost.paid }, 'paid', { usd: formatUsd(usd, lang) })}`
  return {
    brief: [
      { key: 'uses', term: labels.terms.uses, text: labInputsText(experiment.inputs, labels, lang), icon: experiment.inputs[0] ?? 'text' },
      { key: 'time', term: labels.terms.time, text: time, icon: 'clock' },
      { key: 'downloads', term: labels.terms.downloads, text: downloads, icon: 'download', plan: plan.kind },
    ],
    more: [
      { key: 'engine', term: labels.terms.engine, text: experiment.poweredBy[lang], icon: 'engine' },
      { key: 'cost', term: labels.terms.cost, text: cost, icon: 'cost' },
    ],
  }
}
