import type { ComponentType } from 'react'
import type { PostMeta } from '@/content/types'
import type { Locale } from '@/lib/i18n'

export type GeneratedCoverProps = { title: string; date: string; tags: string[]; lang: Locale; variant: 'card' | 'cover' }

export type GeneratedCoverComponent = ComponentType<GeneratedCoverProps>

export function usesGeneratedCover(meta: Pick<PostMeta, 'cover'>, component: GeneratedCoverComponent | undefined): component is GeneratedCoverComponent {
  return meta.cover === 'generated' && component !== undefined
}
