import type { ComponentType } from 'react'
import type { Locale, PostMeta } from '@/content/types'

export type PostModule = { default: ComponentType; meta: PostMeta }

export type PostLoader = () => Promise<PostModule>

export const postRegistry: Record<string, Partial<Record<Locale, PostLoader>>> = {
  post1: {
    es: () => import('./post1/es.mdx') as Promise<PostModule>,
    en: () => import('./post1/en.mdx') as Promise<PostModule>,
  },
}
