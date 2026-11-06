import type { CopyLabels } from '@/components/blog/CopyButton'
import type { AdrLabels } from '@/components/ui/AdrCards'
import { LAB_STATUSES, LAB_THEMES, type LabExperiment, type LabExperimentId, type LabStatus, type LabTheme } from '@/content/types'
import { t, type Dictionary } from '@/lib/i18n/translate'
import type { LabClearLabels, LabConsentLabels, LabTryLabels } from './types'

export const LAB_DEMO_SHARED_KEYS = ['ailab.worker.evicted', 'ailab.worker.paused', 'ailab.storage.unavailable'] as const

export function labTryLabels(dict: Dictionary, title: string): LabTryLabels {
  return {
    open: t(dict, 'ailab.try.open'),
    label: t(dict, 'ailab.try.label', { title }),
    close: t(dict, 'ailab.try.close'),
    loading: t(dict, 'ailab.try.loading'),
    failed: t(dict, 'ailab.try.failed'),
    soon: t(dict, 'ailab.try.soon'),
    declined: t(dict, 'ailab.consent.declined'),
    granted: t(dict, 'ailab.consent.granted'),
    revoke: t(dict, 'ailab.consent.revoke'),
    revoked: t(dict, 'ailab.consent.revoked'),
  }
}

export function labConsentLabels(dict: Dictionary): LabConsentLabels {
  return {
    title: t(dict, 'ailab.consent.title'),
    body: t(dict, 'ailab.consent.body'),
    engine: t(dict, 'ailab.consent.engine'),
    clearHint: t(dict, 'ailab.consent.clearHint'),
    accept: t(dict, 'ailab.consent.accept'),
    cancel: t(dict, 'ailab.consent.cancel'),
  }
}

export function labClearLabels(dict: Dictionary): LabClearLabels {
  return {
    clear: t(dict, 'ailab.clear'),
    hint: t(dict, 'ailab.clear.hint'),
    done: t(dict, 'ailab.clear.done'),
    partial: t(dict, 'ailab.clear.partial'),
  }
}

export function demoCopyPrefix(experiment: LabExperimentId): string {
  return 'ailab.' + experiment.toLowerCase() + '.'
}

export function labDemoCopy(dict: Dictionary, experiment: LabExperimentId): Record<string, string> {
  const prefix = demoCopyPrefix(experiment)
  const own = Object.entries(dict).filter(([key]) => key.startsWith(prefix))
  const shared = LAB_DEMO_SHARED_KEYS.map((key) => [key, t(dict, key)] as const)
  return Object.fromEntries([...own, ...shared])
}

export type LabCardLabels = {
  statusPrefix: string
  status: Record<LabStatus, string>
  runsIn: Record<LabExperiment['runsIn'], string>
  privacy: string
  parts: { try: string; how: string; code: string }
  how: { flow: string; decisions: string }
  adr: AdrLabels
  downloads: { title: string; none: string; item: string; engine: string; optional: string }
  noscript: string
  code: { file: string; repo: string }
  copy: CopyLabels
}

export function labCardLabels(ailab: Dictionary, site: Dictionary, blog: Dictionary): LabCardLabels {
  return {
    statusPrefix: t(ailab, 'ailab.status.label'),
    status: Object.fromEntries(LAB_STATUSES.map((status) => [status, t(ailab, `ailab.status.${status}`)])) as Record<LabStatus, string>,
    runsIn: { browser: t(ailab, 'ailab.runsIn.browser') },
    privacy: t(ailab, 'ailab.part.privacy'),
    parts: { try: t(ailab, 'ailab.part.try'), how: t(ailab, 'ailab.part.how'), code: t(ailab, 'ailab.part.code') },
    how: { flow: t(ailab, 'ailab.how.flow'), decisions: t(ailab, 'ailab.how.decisions') },
    adr: { decision: t(site, 'project.adr.decision'), why: t(site, 'project.adr.why'), tradeoff: t(site, 'project.adr.tradeoff') },
    downloads: {
      title: t(ailab, 'ailab.downloads.title'),
      none: t(ailab, 'ailab.downloads.none'),
      item: t(ailab, 'ailab.downloads.item'),
      engine: t(ailab, 'ailab.downloads.engine'),
      optional: t(ailab, 'ailab.downloads.optional'),
    },
    noscript: t(ailab, 'ailab.noscript'),
    code: { file: t(ailab, 'ailab.code.file'), repo: t(ailab, 'ailab.code.repo') },
    copy: { copy: t(blog, 'code.copy'), copied: t(blog, 'code.copied'), copyError: t(blog, 'code.copyError') },
  }
}

export type LabPageLabels = {
  title: string
  intro: string
  plugins: string
  privacy: string
  privacyMore: string
  themesLabel: string
  themes: Record<LabTheme, string>
}

export function labPageLabels(ailab: Dictionary): LabPageLabels {
  return {
    title: t(ailab, 'ailab.title'),
    intro: t(ailab, 'ailab.intro'),
    plugins: t(ailab, 'ailab.plugins'),
    privacy: t(ailab, 'ailab.privacy'),
    privacyMore: t(ailab, 'ailab.privacy.more'),
    themesLabel: t(ailab, 'ailab.themes.label'),
    themes: Object.fromEntries(LAB_THEMES.map((theme) => [theme, t(ailab, `ailab.theme.${theme}`)])) as Record<LabTheme, string>,
  }
}
