import { t, type Dictionary, type Locale } from '@/lib/i18n'
import type { CalloutLabels } from '../mdx/Callout'

export function calloutLabels(blog: Dictionary, lang: Locale): CalloutLabels {
  return { decision: t(blog, 'callout.decision'), tradeoff: t(blog, 'callout.tradeoff'), learned: t(blog, 'callout.learned'), lang }
}
