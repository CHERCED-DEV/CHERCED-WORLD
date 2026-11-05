import { series as allSeries, type PostSeries } from '@/content/posts/series'
import type { PostSeriesRef } from '@/content/types'

type InSeries = { id: string; series?: PostSeriesRef }

export type SeriesPosition = { n: number; total: number }

export function findSeries(id: string, source: readonly PostSeries[] = allSeries): PostSeries | null {
  return source.find((entry) => entry.id === id) ?? null
}

export function partsOfSeries<T extends InSeries>(posts: readonly T[], seriesId: string): T[] {
  return posts.filter((post) => post.series?.id === seriesId).sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0))
}

export function seriesPosition(parts: readonly InSeries[], postId: string): SeriesPosition | null {
  const index = parts.findIndex((part) => part.id === postId)
  return index === -1 ? null : { n: index + 1, total: parts.length }
}
