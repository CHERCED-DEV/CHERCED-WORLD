import { createElement, type ComponentType, type ReactNode } from 'react'
import { buildOutline, readingMinutes, type TocHeading } from '@/lib/blog'
import type { CopyLabels } from '../CopyButton'
import { CodeBlock } from './CodeBlock'
import { GlassDemo, type GlassDemoLabels } from './GlassDemo'
import { MdxH2, MdxH3 } from './Heading'

export type PostLabels = { code: CopyLabels; glassDemo: GlassDemoLabels }

export type PreparedPost = { body: ReactNode; headings: TocHeading[]; minutes: number; words: number }

export const PAGE_IDS = ['main', 'cw-post-title', 'cw-toc-title', 'cw-share-title', 'cw-comments', 'cw-comments-title'] as const

type MdxRender = (props: Record<string, never>) => ReactNode

function isFunctionComponent(Content: ComponentType): Content is ComponentType & MdxRender {
  return typeof Content === 'function' && !(Content.prototype as { isReactComponent?: unknown } | undefined)?.isReactComponent
}

export function evaluateMdx(Content: ComponentType): ReactNode {
  return isFunctionComponent(Content) ? Content({}) : createElement(Content)
}

function headingLevel(type: unknown): 2 | 3 | null {
  if (type === MdxH2) return 2
  if (type === MdxH3) return 3
  return null
}

export function preparePost(Content: ComponentType, labels: PostLabels): PreparedPost {
  const outline = buildOutline(evaluateMdx(Content), {
    headingLevel,
    isCode: (type) => type === CodeBlock,
    inject: new Map<unknown, Record<string, unknown>>([
      [CodeBlock, { labels: labels.code }],
      [GlassDemo, { labels: labels.glassDemo }],
    ]),
    reservedIds: PAGE_IDS,
  })
  return { body: outline.node, headings: outline.headings, words: outline.words, minutes: readingMinutes(outline.words) }
}
