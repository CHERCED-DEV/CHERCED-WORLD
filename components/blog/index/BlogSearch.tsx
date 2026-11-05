'use client'

import { useCallback, useEffect, useId, useRef, type ChangeEvent, type KeyboardEvent } from 'react'
import { Icon } from '@/components/ui/Icon'
import { t } from '@/lib/i18n/translate'
import { useBlogFilter } from './BlogFilter'
import type * as SearchModule from './search'
import type { BlogSearchDoc } from './search'
import styles from './BlogSearch.module.scss'

export type BlogSearchLabels = {
  search: string
  clear: string
  noResults: string
  result: string
  results: string
}

type Engine = Pick<typeof SearchModule, 'blogSearcher' | 'matchPosts'>

type Runner = (query: string) => Set<string> | null

export function searchStatus(labels: BlogSearchLabels, query: string, visible: ReadonlySet<string> | null): string {
  if (visible === null) return ''
  if (visible.size === 0) return t({ noResults: labels.noResults }, 'noResults', { query: query.trim() })
  return visible.size === 1 ? labels.result : t({ results: labels.results }, 'results', { count: visible.size })
}

export function BlogSearch({ docs, labels, controls }: { docs: readonly BlogSearchDoc[]; labels: BlogSearchLabels; controls: string }) {
  const { text, query, visible, type, show, clear, inputRef } = useBlogFilter()
  const id = useId()
  const latest = useRef('')
  const engine = useRef<Promise<Runner> | null>(null)

  const load = useCallback(() => {
    engine.current ??= import('./search').then(({ blogSearcher, matchPosts }: Engine) => {
      const searcher = blogSearcher(docs)
      return (value: string) => matchPosts(searcher, value)
    })
    return engine.current
  }, [docs])

  useEffect(() => {
    latest.current = text
  }, [text])

  const search = useCallback(
    async (value: string) => {
      latest.current = value
      if (value.trim() === '') {
        show('', null)
        return
      }
      try {
        const run = await load()
        if (latest.current !== value) return
        show(value, run(value))
      } catch {
        engine.current = null
      }
    },
    [load, show],
  )

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    type(event.target.value)
    void search(event.target.value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape' || text === '') return
    event.preventDefault()
    latest.current = ''
    clear()
  }

  const onClear = () => {
    latest.current = ''
    clear()
  }

  const status = searchStatus(labels, query, visible)
  const empty = visible !== null && visible.size === 0

  return (
    <div role="search" className={styles.search} data-cw-blog-search="">
      <label htmlFor={id} className="cw-visually-hidden">
        {labels.search}
      </label>
      <span className={styles.field}>
        <Icon name="search" size={18} className={styles.icon} />
        <input
          ref={inputRef}
          id={id}
          type="search"
          className={styles.input}
          value={text}
          placeholder={labels.search}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-controls={controls}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => void load().catch(() => null)}
          data-cw-blog-search-input=""
        />
        {text !== '' ? (
          <button type="button" className={styles.clear} onClick={onClear} aria-label={labels.clear} data-cw-blog-search-clear="">
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </span>
      <p role="status" className={empty ? 'cw-visually-hidden' : styles.status} data-cw-blog-search-status="">
        {status}
      </p>
    </div>
  )
}

export function SearchEmpty({ labels }: { labels: Pick<BlogSearchLabels, 'noResults' | 'clear'> }) {
  const { query, visible, clear } = useBlogFilter()
  if (visible === null || visible.size > 0) return null
  return (
    <div className={styles.empty} data-cw-search-empty="">
      <p className={styles.emptyText}>{t({ noResults: labels.noResults }, 'noResults', { query: query.trim() })}</p>
      <button type="button" className={styles.emptyClear} onClick={clear} data-cw-search-empty-clear="">
        {labels.clear}
      </button>
    </div>
  )
}
