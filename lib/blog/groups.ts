export type YearLabel = 'now' | 'archive'

export type YearGroup<T> = { year: number; label: YearLabel; posts: T[] }

type Dated = { id: string; date: string }

export function postYear(date: string): number {
  return Number.parseInt(date.slice(0, 4), 10)
}

function newestFirst<T extends { date: string }>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

export function groupByYear<T extends Dated>(posts: readonly T[], exclude: readonly string[] = []): YearGroup<T>[] {
  const years = [...new Set(posts.map((post) => postYear(post.date)))].sort((a, b) => b - a)
  const newest = years[0]
  const skip = new Set(exclude)
  const visible = newestFirst(posts).filter((post) => !skip.has(post.id))
  return years
    .map((year): YearGroup<T> => ({
      year,
      label: year === newest ? 'now' : 'archive',
      posts: visible.filter((post) => postYear(post.date) === year),
    }))
    .filter((group) => group.posts.length > 0)
}

export function featuredPost<T extends { date: string; featured?: true }>(posts: readonly T[]): T | null {
  const marked = posts.filter((post) => post.featured === true)
  return newestFirst(marked.length > 0 ? marked : posts)[0] ?? null
}
