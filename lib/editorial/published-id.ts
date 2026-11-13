export const PUBLISHED_PREFIX = 'p-'

export const PUBLISHED_HEADER = 'x-cw-published-id'

export const PUBLISHED_ROUTE = 'publicado'

export const PUBLISHED_SLUG_MAX = 60

export const PUBLISHED_ID_PATTERN = /^p-[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isPublishedId(id: string): boolean {
  return id.length <= PUBLISHED_PREFIX.length + PUBLISHED_SLUG_MAX && PUBLISHED_ID_PATTERN.test(id)
}
