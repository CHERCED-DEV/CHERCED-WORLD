import type { ComponentType } from 'react'
import type { LabDownload, LabExperimentId } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export type LabTranslate = (key: string, vars?: Record<string, string | number>) => string

export type LabDemoProps = {
  lang: Locale
  experiment: LabExperimentId
  consent: boolean
  downloads: LabDownload[]
  t: LabTranslate
}

export type LabDemoComponent = ComponentType<LabDemoProps>

export type LabDemoModule = LabDemoComponent | { default: LabDemoComponent }

export type LabDemoRegistry = Partial<Record<LabExperimentId, LabDemoComponent>>

export type LabTryLabels = {
  open: string
  label: string
  close: string
  loading: string
  failed: string
  soon: string
  declined: string
  granted: string
  revoke: string
  revoked: string
}

export type LabConsentLabels = {
  title: string
  body: string
  engine: string
  clearHint: string
  accept: string
  cancel: string
}

export type LabClearLabels = {
  clear: string
  hint: string
  done: string
  partial: string
}
