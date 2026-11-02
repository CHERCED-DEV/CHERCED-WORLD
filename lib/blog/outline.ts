import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { countWords } from './reading-time'
import { createSlugger } from './slug'

export type HeadingLevel = 2 | 3

export type TocHeading = { id: string; text: string; level: HeadingLevel }

export type OutlineOptions = {
  headingLevel?: (type: unknown) => HeadingLevel | null
  isCode?: (type: unknown) => boolean
  inject?: ReadonlyMap<unknown, Readonly<Record<string, unknown>>>
  reservedIds?: Iterable<string>
}

export type Outline = { node: ReactNode; headings: TocHeading[]; words: number }

export const TOC_MIN_HEADINGS = 3

type ElementProps = Record<string, unknown> & { children?: ReactNode }

export function textContent(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') return String(node)
  if (Array.isArray(node)) return node.map((child: ReactNode) => textContent(child)).join('')
  if (isValidElement<ElementProps>(node)) return textContent(node.props.children)
  return ''
}

export function shouldShowToc(headings: readonly TocHeading[]): boolean {
  return headings.length >= TOC_MIN_HEADINGS
}

export function buildOutline(node: ReactNode, options: OutlineOptions = {}): Outline {
  const headings: TocHeading[] = []
  const slugger = createSlugger(options.reservedIds)
  let words = 0

  const visitList = (list: readonly ReactNode[], inCode: boolean): readonly ReactNode[] => {
    let changed = false
    const next = list.map((child) => {
      const visited = visit(child, inCode)
      if (visited !== child) changed = true
      return visited
    })
    return changed ? next : list
  }

  const visit = (current: ReactNode, inCode: boolean): ReactNode => {
    if (typeof current === 'string') {
      if (!inCode) words += countWords(current)
      return current
    }
    if (Array.isArray(current)) return visitList(current, inCode) as ReactNode
    if (!isValidElement<ElementProps>(current)) return current

    const element = current as ReactElement<ElementProps>
    const extra: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(options.inject?.get(element.type) ?? {})) {
      if (element.props[key] === undefined) extra[key] = value
    }

    const level = options.headingLevel?.(element.type) ?? null
    if (level !== null) {
      const text = textContent(element.props.children).replace(/\s+/g, ' ').trim()
      const explicit = typeof element.props.id === 'string' && element.props.id !== '' ? element.props.id : null
      if (explicit) slugger.reserve(explicit)
      const id = explicit ?? slugger.slug(text)
      headings.push({ id, text, level })
      if (!explicit) extra.id = id
    }

    const codeContext = inCode || (options.isCode?.(element.type) ?? false)
    const children = element.props.children
    const nextChildren = children === undefined ? children : visit(children, codeContext)
    const hasExtra = Object.keys(extra).length > 0

    if (nextChildren === children && !hasExtra) return element
    if (Array.isArray(nextChildren)) return cloneElement(element, extra, ...(nextChildren as ReactNode[]))
    if (nextChildren === children) return cloneElement(element, extra)
    return cloneElement(element, { ...extra, children: nextChildren })
  }

  const result = visit(node, false)
  return { node: result, headings, words }
}
