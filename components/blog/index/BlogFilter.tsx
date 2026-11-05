'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Reveal } from '@/components/ui/Reveal'

export type BlogFilterState = {
  text: string
  query: string
  visible: ReadonlySet<string> | null
}

type BlogFilterValue = BlogFilterState & {
  type: (text: string) => void
  show: (query: string, visible: ReadonlySet<string> | null) => void
  clear: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

const EMPTY: BlogFilterState = { text: '', query: '', visible: null }

const BlogFilterContext = createContext<BlogFilterValue | null>(null)

export function isShown(state: Pick<BlogFilterState, 'visible'>, id: string): boolean {
  return state.visible === null || state.visible.has(id)
}

export function anyShown(state: Pick<BlogFilterState, 'visible'>, ids: readonly string[]): boolean {
  return state.visible === null || ids.some((id) => state.visible?.has(id))
}

export function BlogFilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BlogFilterState>(EMPTY)
  const inputRef = useRef<HTMLInputElement>(null)

  const type = useCallback((text: string) => setState((current) => ({ ...current, text })), [])

  const show = useCallback(
    (query: string, visible: ReadonlySet<string> | null) => setState((current) => ({ ...current, query, visible })),
    [],
  )

  const clear = useCallback(() => {
    setState(EMPTY)
    inputRef.current?.focus()
  }, [])

  const value = useMemo(() => ({ ...state, type, show, clear, inputRef }), [state, type, show, clear])

  return <BlogFilterContext.Provider value={value}>{children}</BlogFilterContext.Provider>
}

export function useBlogFilter(): BlogFilterValue {
  const value = useContext(BlogFilterContext)
  if (!value) throw new Error('useBlogFilter necesita BlogFilterProvider')
  return value
}

function useVisible(): Pick<BlogFilterState, 'visible'> {
  return useContext(BlogFilterContext) ?? EMPTY
}

export function FilterItem({ id, delay, className, children }: { id: string; delay?: number; className?: string; children: ReactNode }) {
  const state = useVisible()
  return (
    <Reveal as="li" className={className} delay={delay} hidden={!isShown(state, id)} data-cw-filter-item={id}>
      {children}
    </Reveal>
  )
}

export function FilterGroup({
  ids,
  group,
  className,
  labelledBy,
  children,
}: {
  ids: readonly string[]
  group: string
  className?: string
  labelledBy: string
  children: ReactNode
}) {
  const state = useVisible()
  return (
    <section className={className} aria-labelledby={labelledBy} hidden={!anyShown(state, ids)} data-cw-year-group={group}>
      {children}
    </section>
  )
}
