import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import styles from './GlassSurface.module.scss'

export type GlassVariant = 'subtle' | 'standard' | 'strong'

export type GlassTag =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'nav'
  | 'li'
  | 'ul'
  | 'ol'
  | 'form'
  | 'span'
  | 'figure'

export type GlassSurfaceProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  as?: GlassTag
  variant?: GlassVariant
  className?: string
  children?: ReactNode
}

export function GlassSurface({ as = 'div', variant = 'standard', className, children, ...rest }: GlassSurfaceProps) {
  const Tag = as as ElementType
  return (
    <Tag {...rest} data-cw-glass={variant} className={cx(styles.surface, styles[variant], className)}>
      {children}
    </Tag>
  )
}
