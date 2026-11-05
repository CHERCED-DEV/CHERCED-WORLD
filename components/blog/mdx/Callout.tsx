import { useId, type ReactNode } from 'react'
import blogEs from '@/content/i18n/es/blog.json'
import type { Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import styles from './Callout.module.scss'

export const CALLOUT_TYPES = ['decision', 'tradeoff', 'learned'] as const

export type CalloutType = (typeof CALLOUT_TYPES)[number]

export type CalloutLabels = Record<CalloutType, string> & { lang?: Locale }

export const DEFAULT_CALLOUT_LABELS: CalloutLabels = {
  decision: blogEs['callout.decision'],
  tradeoff: blogEs['callout.tradeoff'],
  learned: blogEs['callout.learned'],
}

export function isCalloutType(value: unknown): value is CalloutType {
  return typeof value === 'string' && (CALLOUT_TYPES as readonly string[]).includes(value)
}

const ICONS: Record<CalloutType, ReactNode> = {
  decision: (
    <>
      <path d="M12 3v18" />
      <path d="M12 5h6l2 2.5-2 2.5h-6" />
      <path d="M12 12H6l-2 2.5L6 17h6" />
    </>
  ),
  tradeoff: (
    <>
      <path d="M12 4v16M7 20h10" />
      <path d="M5 8h14" />
      <path d="M5 8l-2.5 6a3 3 0 0 0 5 0L5 8zM19 8l-2.5 6a3 3 0 0 0 5 0L19 8z" />
    </>
  ),
  learned: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
    </>
  ),
}

export type CalloutProps = { type?: string; labels?: CalloutLabels; children?: ReactNode }

export function Callout({ type, labels = DEFAULT_CALLOUT_LABELS, children }: CalloutProps) {
  const id = useId()
  const kind: CalloutType = isCalloutType(type) ? type : 'decision'

  return (
    <aside className={cx(styles.callout, styles[kind])} aria-labelledby={id} data-cw-callout={kind}>
      <p id={id} className={styles.label} lang={labels.lang}>
        <svg
          className={styles.icon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          {ICONS[kind]}
        </svg>
        <span>{labels[kind]}</span>
      </p>
      <div className={styles.content}>{children}</div>
    </aside>
  )
}
