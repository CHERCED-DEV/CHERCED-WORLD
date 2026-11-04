import type { MDXComponents } from 'mdx/types'
import { CodeBlock } from './CodeBlock'
import { GlassDemo } from './GlassDemo'
import { MdxH2, MdxH3 } from './Heading'
import { MdxBlockquote } from './MdxBlockquote'
import { MdxImage } from './MdxImage'
import { MdxLink } from './MdxLink'

export const mdxComponents = {
  a: MdxLink,
  blockquote: MdxBlockquote,
  h2: MdxH2,
  h3: MdxH3,
  pre: CodeBlock,
  img: MdxImage,
  GlassDemo,
} satisfies MDXComponents

export const INTERACTIVE_CATALOG = ['GlassDemo'] as const

export { CodeBlock, readCodeBlock, type ParsedCodeBlock } from './CodeBlock'
export { GlassDemo, type GlassDemoLabels } from './GlassDemo'
export { MdxH2, MdxH3 } from './Heading'
export { MdxBlockquote } from './MdxBlockquote'
export { MdxImage } from './MdxImage'
export { MdxLink } from './MdxLink'
