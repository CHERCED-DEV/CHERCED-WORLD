import { site } from '@/content/site'
import type { Locale } from '@/lib/i18n/config'
import styles from './AvailabilityChip.module.scss'
import { cx } from './cx'
import { sharedText } from './sharedText'

export type AvailabilityChipProps = { lang: Locale; className?: string }

export type AvailabilityText = { prefix: string; visible: string; label: string }

export function availabilityText(lang: Locale): AvailabilityText | null {
  const availability = site.profile?.availability
  if (!availability) return null
  const vars = {
    location: availability.location[lang],
    timezone: availability.timezone,
    relocation: availability.relocation[lang],
  }
  const template = sharedText(lang, 'common', 'profile.availability.label')
  const start = Math.max(0, template.indexOf('{location}'))
  const fill = (text: string) => text.replace(/\{(\w+)\}/g, (match, name: string) => vars[name as keyof typeof vars] ?? match)
  return { prefix: template.slice(0, start), visible: fill(template.slice(start)), label: fill(template) }
}

export function AvailabilityChip({ lang, className }: AvailabilityChipProps) {
  const text = availabilityText(lang)
  if (!text) return null
  return (
    <p className={cx(styles.chip, className)} data-cw-availability="">
      <span className={styles.dot} aria-hidden="true" />
      <span>
        {text.prefix ? <span className="cw-visually-hidden">{text.prefix}</span> : null}
        {text.visible}
      </span>
    </p>
  )
}
