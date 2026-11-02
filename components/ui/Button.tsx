import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'
import styles from './Button.module.scss'

export type ButtonVariant = 'glass' | 'solid' | 'ghost'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function buttonClassName({
  variant = 'glass',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cx(styles.button, styles[variant], styles[size], className)
}

export function Button({ variant = 'glass', size = 'md', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} {...rest} className={buttonClassName({ variant, size, className })} />
}
