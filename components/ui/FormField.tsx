'use client'

import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'
import { cx } from './cx'
import styles from './FormField.module.scss'
import { Icon } from './Icon'

type ControlProps = {
  id?: string
  placeholder?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}

export type FormFieldProps = {
  label: ReactNode
  error?: string
  hint?: string
  id?: string
  inline?: boolean
  floating?: boolean
  className?: string
  children: ReactElement<ControlProps>
}

const TEXT_CONTROLS = new Set(['input', 'textarea'])

export function FormField({ label, error, hint, id, inline = false, floating = false, className, children }: FormFieldProps) {
  const generated = useId()
  const fieldId = id ?? children.props.id ?? `field${generated.replace(/:/g, '')}`
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [children.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined
  const float = floating && !inline
  const needsPlaceholder = float && typeof children.type === 'string' && TEXT_CONTROLS.has(children.type) && !children.props.placeholder

  const control = cloneElement(children, {
    id: fieldId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    ...(needsPlaceholder ? { placeholder: ' ' } : {}),
  })

  const labelNode = (
    <label htmlFor={fieldId} className={styles.label}>
      {label}
    </label>
  )

  return (
    <div
      className={cx(styles.field, inline && styles.inline, float && styles.floating, error && styles.invalid, className)}
      data-cw-floating={float ? '' : undefined}
    >
      {inline ? (
        <div className={styles.inlineRow}>
          {control}
          {labelNode}
        </div>
      ) : (
        <>
          {labelNode}
          {control}
        </>
      )}
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error}>
          <Icon name="alert" size={16} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
