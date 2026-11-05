import type { PostMeta } from '@/content/types'

export type TestPost = PostMeta & { fallback: boolean }

export function post(id: string, overrides: Partial<TestPost> = {}): TestPost {
  return {
    id,
    lang: 'es',
    originalLang: 'es',
    title: `Título de ${id}`,
    description: `Descripción de ${id}`,
    date: '2026-01-01',
    tags: [],
    image: { src: '/assets/imgs/posts/test.webp', alt: 'Portada', width: 1200, height: 630 },
    author: 'Camilo Hernandez',
    fallback: false,
    ...overrides,
  }
}

export const ids = (posts: readonly { id: string }[]): string[] => posts.map((item) => item.id)
