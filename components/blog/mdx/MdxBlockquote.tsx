import type { BlockquoteHTMLAttributes } from 'react'
import { cx } from '@/components/ui/cx'
import styles from './MdxBlockquote.module.scss'

export function MdxBlockquote({ className, children, ...rest }: BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote {...rest} className={cx(styles.quote, className)} data-cw-quote="">
      <span className={styles.mark} aria-hidden="true">
        {'“'}
      </span>
      {children}
    </blockquote>
  )
}
