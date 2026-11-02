'use client'

import { useEffect, useRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { observeReveal } from '@/lib/fx/reveal'

export type RevealTag =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'li'
  | 'ul'
  | 'ol'
  | 'p'
  | 'span'
  | 'figure'

export type RevealProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  as?: RevealTag
  delay?: number
  children?: ReactNode
}

export function Reveal({ as = 'div', delay = 0, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => observeReveal(ref.current), [])

  const Tag = as as ElementType
  const merged = delay > 0 ? ({ ...style, '--cw-reveal-delay': `${Math.round(delay)}ms` } as CSSProperties) : style

  return (
    <Tag {...rest} ref={ref} style={merged} data-cw-reveal="">
      {children}
    </Tag>
  )
}
