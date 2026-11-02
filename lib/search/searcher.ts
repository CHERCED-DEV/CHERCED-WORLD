import MiniSearch from 'minisearch'
import { processTerm, tokenize } from './text'

export type Searchable = { id: string; title: string; text: string; keywords: string }

export type SearchHit<T> = { doc: T; score: number }

export type SearchOptions<T> = { limit?: number; filter?: (doc: T) => boolean }

export type Searcher<T> = { search: (query: string, options?: SearchOptions<T>) => SearchHit<T>[]; size: number }

export function createSearcher<T extends Searchable>(docs: readonly T[]): Searcher<T> {
  const byId = new Map(docs.map((doc) => [doc.id, doc]))
  const mini = new MiniSearch<T>({
    idField: 'id',
    fields: ['title', 'keywords', 'text'],
    storeFields: [],
    tokenize: (text) => tokenize(text),
    processTerm,
    searchOptions: {
      boost: { title: 4, keywords: 2, text: 1 },
      prefix: (term) => term.length >= 2,
      fuzzy: (term) => (term.length >= 4 ? 0.2 : false),
      maxFuzzy: 2,
      combineWith: 'OR',
    },
  })
  mini.addAll([...byId.values()])

  return {
    size: byId.size,
    search(query, options = {}) {
      if (tokenize(query).length === 0) return []
      const hits: SearchHit<T>[] = []
      for (const result of mini.search(query)) {
        const doc = byId.get(String(result.id))
        if (!doc || (options.filter && !options.filter(doc))) continue
        hits.push({ doc, score: result.score })
        if (options.limit && hits.length >= options.limit) break
      }
      return hits
    },
  }
}
