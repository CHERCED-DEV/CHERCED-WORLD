'use client'

import { useId } from 'react'
import { cx } from './cx'
import styles from './ChoiceChips.module.scss'

export type ChoiceOption<V extends string> = { value: V; label: string }

export function ChoiceChips<V extends string>({
  legend,
  options,
  value,
  onChange,
  disabled,
  hideLegend,
  className,
  kind,
}: {
  legend: string
  options: readonly ChoiceOption<V>[]
  value: V
  onChange: (value: V) => void
  disabled?: boolean
  hideLegend?: boolean
  className?: string
  kind: string
}) {
  const name = useId()
  return (
    <fieldset className={cx(styles.group, className)} disabled={disabled} data-cw-choice={kind}>
      <legend className={hideLegend ? 'cw-visually-hidden' : styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.chip}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              data-cw-choice-value={option.value}
            />
            <span className={styles.face}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
