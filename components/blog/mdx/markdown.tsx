import { createElement, Fragment, type ComponentType, type ReactNode } from 'react'
import { CodeBlock } from './CodeBlock'
import { MdxH2, MdxH3 } from './Heading'
import { MdxBlockquote } from './MdxBlockquote'
import { MdxLink } from './MdxLink'

const FENCE_OPEN = /^```([\w#+.-]*)\s*$/
const FENCE_CLOSE = /^```\s*$/
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/
const RULE = /^(?:-{3,}|\*{3,}|_{3,})\s*$/
const BULLET = /^\s*[-*+]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/
const QUOTE = /^>\s?(.*)$/
const INLINE =
  /(`+)([^`]+?)\1|\[([^\]\n]+)\]\(([^()\s]+)\)|\*\*(?=\S)([^*]+?)\*\*|__(?=\S)([^_]+?)__|(?<![\w*])\*(?=\S)([^*\n]+?)\*(?![\w*])|(?<![\w_])_(?=\S)([^_\n]+?)_(?![\w_])/g

export function safeHref(href: string): string | null {
  const value = href.trim()
  if (/^https?:\/\/[^\s]+$/i.test(value)) return value
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(value)) return value
  if (/^\/(?!\/)[^\s]*$/.test(value)) return value
  if (/^#[\w-]+$/.test(value)) return value
  return null
}

export function inlineMarkdown(text: string, key = 'i'): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let n = 0
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0
    if (index > last) nodes.push(text.slice(last, index))
    const id = `${key}-${n++}`
    const [, , code, label, href, strong, strongAlt, em, emAlt] = match
    if (code !== undefined) nodes.push(createElement('code', { key: id }, code))
    else if (label !== undefined && href !== undefined) {
      const safe = safeHref(href)
      nodes.push(safe ? createElement(MdxLink, { key: id, href: safe }, ...inlineMarkdown(label, id)) : label)
    } else if ((strong ?? strongAlt) !== undefined) nodes.push(createElement('strong', { key: id }, ...inlineMarkdown((strong ?? strongAlt)!, id)))
    else if ((em ?? emAlt) !== undefined) nodes.push(createElement('em', { key: id }, ...inlineMarkdown((em ?? emAlt)!, id)))
    last = index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

type Block =
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'rule' }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'quote'; lines: string[] }
  | { kind: 'paragraph'; lines: string[] }

export function markdownBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    if (!line.trim()) {
      i++
      continue
    }
    const fence = FENCE_OPEN.exec(line)
    if (fence) {
      const text: string[] = []
      i++
      while (i < lines.length && !FENCE_CLOSE.test(lines[i]!)) text.push(lines[i++]!)
      i++
      blocks.push({ kind: 'code', lang: fence[1] ?? '', text: text.join('\n') })
      continue
    }
    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1]!.length <= 2 ? 2 : 3, text: heading[2]! })
      i++
      continue
    }
    if (RULE.test(line)) {
      blocks.push({ kind: 'rule' })
      i++
      continue
    }
    const bullet = BULLET.test(line)
    if (bullet || NUMBERED.test(line)) {
      const pattern = bullet ? BULLET : NUMBERED
      const items: string[] = []
      while (i < lines.length && pattern.test(lines[i]!)) items.push(pattern.exec(lines[i++]!)![1]!)
      blocks.push({ kind: 'list', ordered: !bullet, items })
      continue
    }
    if (QUOTE.test(line)) {
      const quoted: string[] = []
      while (i < lines.length && QUOTE.test(lines[i]!)) quoted.push(QUOTE.exec(lines[i++]!)![1]!)
      blocks.push({ kind: 'quote', lines: quoted })
      continue
    }
    const paragraph: string[] = []
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !FENCE_OPEN.test(lines[i]!) &&
      !HEADING.test(lines[i]!) &&
      !RULE.test(lines[i]!) &&
      !BULLET.test(lines[i]!) &&
      !NUMBERED.test(lines[i]!) &&
      !QUOTE.test(lines[i]!)
    )
      paragraph.push(lines[i++]!.trim())
    blocks.push({ kind: 'paragraph', lines: paragraph })
  }
  return blocks
}

function paragraphs(lines: readonly string[], key: string): ReactNode[] {
  const groups: string[][] = [[]]
  for (const line of lines) {
    if (line.trim()) groups[groups.length - 1]!.push(line.trim())
    else if (groups[groups.length - 1]!.length > 0) groups.push([])
  }
  return groups.filter((group) => group.length > 0).map((group, index) => createElement('p', { key: `${key}-${index}` }, ...inlineMarkdown(group.join(' '), `${key}-${index}`)))
}

function renderBlock(block: Block, index: number): ReactNode {
  const key = `b${index}`
  switch (block.kind) {
    case 'code':
      return createElement(CodeBlock, { key }, createElement('code', block.lang ? { className: `language-${block.lang}` } : {}, block.text))
    case 'heading':
      return createElement(block.level === 2 ? MdxH2 : MdxH3, { key }, ...inlineMarkdown(block.text, key))
    case 'rule':
      return createElement('hr', { key })
    case 'list':
      return createElement(
        block.ordered ? 'ol' : 'ul',
        { key },
        ...block.items.map((item, n) => createElement('li', { key: `${key}-${n}` }, ...inlineMarkdown(item, `${key}-${n}`))),
      )
    case 'quote':
      return createElement(MdxBlockquote, { key }, ...paragraphs(block.lines, key))
    case 'paragraph':
      return createElement('p', { key }, ...inlineMarkdown(block.lines.join(' '), key))
  }
}

export function renderMarkdown(body: string): ReactNode {
  return markdownBlocks(body).map(renderBlock)
}

export function markdownContent(body: string): ComponentType {
  const tree = renderMarkdown(body)
  return function PublishedContent() {
    return createElement(Fragment, null, tree)
  }
}
