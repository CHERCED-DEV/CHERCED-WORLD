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

export type GlassLayers = {
  edge?: boolean
  grain?: boolean
  depth?: boolean
  light?: boolean
}

export type GlassSurfaceProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> &
  GlassLayers & {
    as?: GlassTag
    variant?: GlassVariant
    className?: string
    children?: ReactNode
  }

export function glassLayerClassName({ edge, grain, depth, light }: GlassLayers = {}): string {
  return cx(grain && styles.grain, depth && styles.depth, edge && styles.edge, light && styles.light)
}

export function GlassSurface({
  as = 'div',
  variant = 'standard',
  edge = false,
  grain = false,
  depth = false,
  light = false,
  className,
  children,
  ...rest
}: GlassSurfaceProps) {
  const Tag = as as ElementType
  return (
    <Tag
      {...rest}
      data-cw-glass={variant}
      data-cw-light={light ? '' : undefined}
      className={cx(styles.surface, styles[variant], glassLayerClassName({ edge, grain, depth, light }), className)}
    >
      {children}
    </Tag>
  )
}
