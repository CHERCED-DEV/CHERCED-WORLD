import type { MDXComponents } from 'mdx/types'
import { mdxComponents } from '@/components/blog/mdx'

const components: MDXComponents = mdxComponents

export function useMDXComponents(): MDXComponents {
  return components
}
