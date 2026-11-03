import type { Locale } from '@/lib/i18n'
import { periodParts } from '../format'

export type PeriodProps = { start: string; end: string | null; lang: Locale; presentLabel: string; className?: string }

export function Period({ start, end, lang, presentLabel, className }: PeriodProps) {
  const parts = periodParts(start, end, lang)
  return (
    <span className={className} data-cw-period="">
      <time dateTime={parts.start.dateTime}>{parts.start.label}</time>
      {' – '}
      {parts.end ? <time dateTime={parts.end.dateTime}>{parts.end.label}</time> : <span>{presentLabel}</span>}
    </span>
  )
}
