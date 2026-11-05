import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import styles from './GlassSurface.module.scss'
import { Sweep } from './Sweep'

export type GlassVariant = 'subtle' | 'standard' | 'strong'

export type GlassFloatLevel = 1 | 2 | 3

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

export type GlassMotion = {
  sweep?: boolean
  float?: GlassFloatLevel
  blur?: boolean
}

export type GlassSurfaceProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> &
  GlassLayers &
  GlassMotion & {
    as?: GlassTag
    variant?: GlassVariant
    className?: string
    children?: ReactNode
  }

export function glassLayerClassName({ edge, grain, depth, light }: GlassLayers = {}): string {
  return cx(grain && styles.grain, depth && styles.depth, edge && styles.edge, light && styles.light)
}

export function glassMotionAttributes({ float, blur }: Omit<GlassMotion, 'sweep'> = {}): Record<string, string> {
  const attributes: Record<string, string> = {}
  if (float) attributes['data-cw-float'] = String(float)
  if (blur) attributes['data-cw-blur'] = ''
  return attributes
}

export function GlassSurface({
  as = 'div',
  variant = 'standard',
  edge = false,
  grain = false,
  depth = false,
  light = false,
  sweep = false,
  float,
  blur = false,
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
      {...glassMotionAttributes({ float, blur })}
    >
      {children}
      {sweep ? <Sweep /> : null}
    </Tag>
  )
}
