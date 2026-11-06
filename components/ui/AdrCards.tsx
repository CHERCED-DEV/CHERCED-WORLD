import type { CSSProperties } from 'react'
import styles from './AdrCards.module.scss'
import { cx } from './cx'

export type AdrCardView = { decision: string; why: string; tradeoff: string }

export type AdrLabels = { decision: string; why: string; tradeoff: string }

export type AdrCardsProps = {
  cards: AdrCardView[]
  labels: AdrLabels
  className?: string
  cardClassName?: string
  columns?: 1 | 2
}

const FIELDS = ['decision', 'why', 'tradeoff'] as const

export function AdrCards({ cards, labels, className, cardClassName, columns = 2 }: AdrCardsProps) {
  if (cards.length === 0) return null
  return (
    <ol className={cx(styles.list, columns === 2 && styles.two, className)} data-cw-adr-cards="">
      {cards.map((card, index) => (
        <li
          key={card.decision}
          className={cx(styles.card, cardClassName)}
          data-cw-adr=""
          data-cw-light=""
          style={{ '--cw-i': index } as CSSProperties}
        >
          <span className={styles.index} aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <dl className={styles.fields}>
            {FIELDS.map((field) => (
              <div key={field} className={styles.field} data-field={field}>
                <dt className={styles.term}>{labels[field]}</dt>
                <dd className={styles.value} data-cw-adr-field={field}>
                  {card[field]}
                </dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ol>
  )
}
