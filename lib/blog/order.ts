export type Datable = { id: string; date: string }

export type Adjacent<T> = { previous: T | null; next: T | null }

export function orderPosts<T extends Datable>(posts: readonly T[], registryOrder: readonly string[]): T[] {
  const rank = new Map(registryOrder.map((id, index) => [id, index]))
  const position = (id: string) => rank.get(id) ?? -1
  return [...posts].sort((a, b) => b.date.localeCompare(a.date) || position(b.id) - position(a.id))
}

export function adjacentPosts<T extends Datable>(ordered: readonly T[], id: string): Adjacent<T> {
  const index = ordered.findIndex((post) => post.id === id)
  if (index === -1) return { previous: null, next: null }
  return { previous: ordered[index + 1] ?? null, next: ordered[index - 1] ?? null }
}
