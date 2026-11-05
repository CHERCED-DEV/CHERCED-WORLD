import { createSearcher, type Searcher } from '@/lib/search/searcher'
import { tokenize } from '@/lib/search/text'

export type BlogSearchDoc = { id: string; title: string; text: string; keywords: string }

export type BlogSearchPost = { id: string; title: string; description: string; tags: readonly string[]; fallback: boolean }

export function toSearchDocs(posts: readonly BlogSearchPost[]): BlogSearchDoc[] {
  return posts
    .filter((post) => !post.fallback)
    .map((post) => ({ id: post.id, title: post.title, text: post.description, keywords: post.tags.join(' ') }))
}

export function blogSearcher(docs: readonly BlogSearchDoc[]): Searcher<BlogSearchDoc> {
  return createSearcher(docs)
}

export function isBlankQuery(query: string): boolean {
  return tokenize(query).length === 0
}

export function matchPosts(searcher: Searcher<BlogSearchDoc>, query: string): Set<string> | null {
  if (isBlankQuery(query)) return null
  return new Set(searcher.search(query).map((hit) => hit.doc.id))
}
