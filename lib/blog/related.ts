import { tagSlug } from './tags'

export const RELATED_LIMIT = 3

type Relatable = { id: string; date: string; tags: readonly string[] }

export function relatedPosts<T extends Relatable>(
  post: Pick<Relatable, 'id' | 'tags'>,
  posts: readonly T[],
  exclude: readonly string[] = [],
  limit: number = RELATED_LIMIT,
): T[] {
  const own = new Set(post.tags.map(tagSlug))
  const skip = new Set([post.id, ...exclude])
  return posts
    .filter((candidate) => !skip.has(candidate.id))
    .map((candidate) => ({ candidate, shared: [...new Set(candidate.tags.map(tagSlug))].filter((slug) => own.has(slug)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.candidate.date.localeCompare(a.candidate.date))
    .slice(0, Math.max(0, limit))
    .map(({ candidate }) => candidate)
}
