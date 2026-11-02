import type { ReactNode } from 'react'
import { cx } from '@/components/ui/cx'
import styles from './SectionTitle.module.scss'

export type SectionTitleProps = {
  as?: 'h1' | 'h2' | 'h3'
  id?: string
  size?: 'md' | 'lg'
  className?: string
  children: ReactNode
}

export function SectionTitle({ as: Tag = 'h2', id, size = 'md', className, children }: SectionTitleProps) {
  return (
    <Tag id={id} className={cx(styles.frame, styles[size], className)} data-cw-glass="strong">
      {children}
    </Tag>
  )
}
