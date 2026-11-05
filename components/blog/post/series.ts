import type { PostSeries } from '@/content/posts/series'
import type { PostSeriesRef } from '@/content/types'
import { findSeries, seriesPosition, type SeriesPosition } from '@/lib/blog/series'
import type { Locale } from '@/lib/i18n'

export type SeriesPart = { id: string; title: string; lang: Locale; series?: PostSeriesRef }

export type SeriesNavData = { id: string; name: string; position: SeriesPosition; parts: SeriesPart[]; current: string }

export function seriesNavData(
  postId: string,
  ref: PostSeriesRef | undefined,
  parts: readonly SeriesPart[],
  lang: Locale,
  source?: readonly PostSeries[],
): SeriesNavData | null {
  if (!ref) return null
  const found = findSeries(ref.id, source)
  const position = seriesPosition(parts, postId)
  if (!found || !position) return null
  return { id: found.id, name: found.name[lang], position, parts: [...parts], current: postId }
}
