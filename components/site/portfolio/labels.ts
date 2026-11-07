import { PROJECT_ERAS, type ProjectEra } from '@/content/types'
import { t, type Dictionary } from '@/lib/i18n'
import type { AdrLabels } from '@/components/ui/AdrCards'
import type { CaseStudyExtraLabels } from './CaseStudy'
import { STACK_LAYERS, type StackLayer } from './stack'

export const EMBED_KEYS = {
  heading: 'embed.heading',
  intro: 'embed.intro',
  load: 'embed.load',
  open: 'embed.open',
  loading: 'embed.loading',
  ready: 'embed.ready',
  reload: 'embed.reload',
  openLive: 'embed.openLive',
  expand: 'embed.expand',
  collapse: 'embed.collapse',
  view: 'embed.view',
  desktop: 'embed.desktop',
  mobile: 'embed.mobile',
  frame: 'embed.frame',
  slowTitle: 'embed.slowTitle',
  slowBody: 'embed.slowBody',
  retry: 'embed.retry',
  close: 'embed.close',
  noScript: 'embed.noScript',
} as const

export const GALLERY_KEYS = {
  zoom: 'gallery.zoom',
  close: 'gallery.close',
  prev: 'gallery.prev',
  next: 'gallery.next',
  counter: 'gallery.counter',
  thumb: 'gallery.thumb',
} as const

export const CASE_KEYS = {
  eyebrow: 'case.eyebrow',
  highlights: 'case.highlights',
  seeLive: 'case.seeLive',
  stackIntro: 'case.stackIntro',
  usage: 'case.usage',
  usageOne: 'case.usageOne',
  pager: 'case.pager',
  prev: 'case.prev',
  next: 'case.next',
  all: 'case.all',
  relatedPost: 'case.related.post',
  relatedServices: 'case.related.services',
} as const

function pickAll<K extends string>(dict: Dictionary, keys: Record<K, string>): Record<K, string> {
  return Object.fromEntries(Object.entries<string>(keys).map(([name, key]) => [name, t(dict, key)])) as Record<K, string>
}

export type CasePageLabels = CaseStudyExtraLabels & Record<'relatedPost' | 'relatedServices', string>

export function caseStudyExtraLabels(dict: Dictionary): CasePageLabels {
  return {
    ...pickAll(dict, CASE_KEYS),
    layers: Object.fromEntries(STACK_LAYERS.map((layer) => [layer, t(dict, `case.layer.${layer}`)])) as Record<StackLayer, string>,
    gallery: pickAll(dict, GALLERY_KEYS),
    embed: pickAll(dict, EMBED_KEYS),
  }
}

export type EraLabels = Record<ProjectEra, string>

export type CaseEvidenceLabels = {
  era: string
  eras: EraLabels
  adr: AdrLabels
  diagram: { title: string; hint: string }
}

export const EVIDENCE_KEYS = {
  era: 'portfolio.era',
  decision: 'project.adr.decision',
  why: 'project.adr.why',
  tradeoff: 'project.adr.tradeoff',
  diagramTitle: 'case.diagram.title',
  diagramHint: 'case.diagram.hint',
} as const

export function eraLabels(dict: Dictionary): EraLabels {
  return Object.fromEntries(PROJECT_ERAS.map((era) => [era, t(dict, `portfolio.era.${era}`)])) as EraLabels
}

export function caseEvidenceLabels(dict: Dictionary): CaseEvidenceLabels {
  const text = pickAll(dict, EVIDENCE_KEYS)
  return {
    era: text.era,
    eras: eraLabels(dict),
    adr: { decision: text.decision, why: text.why, tradeoff: text.tradeoff },
    diagram: { title: text.diagramTitle, hint: text.diagramHint },
  }
}

export function evidenceKeys(): string[] {
  return [...Object.values(EVIDENCE_KEYS), ...PROJECT_ERAS.map((era) => `portfolio.era.${era}`)]
}

export function portfolioKeys(): string[] {
  return [
    ...Object.values(CASE_KEYS),
    ...STACK_LAYERS.map((layer) => `case.layer.${layer}`),
    ...Object.values(GALLERY_KEYS),
    ...Object.values(EMBED_KEYS),
  ]
}
