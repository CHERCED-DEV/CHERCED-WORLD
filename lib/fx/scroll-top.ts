export const MAIN_ID = 'main'

export type ScrollTopEnv = {
  matchMedia(query: string): { matches: boolean }
  scrollTo(options: ScrollToOptions): void
  document: { getElementById(id: string): { focus(options?: FocusOptions): void } | null }
}

export function scrollToTop(env: ScrollTopEnv = window): void {
  const reduce = env.matchMedia('(prefers-reduced-motion: reduce)').matches
  env.scrollTo({ top: 0, left: 0, behavior: reduce ? 'instant' : 'smooth' })
  env.document.getElementById(MAIN_ID)?.focus({ preventScroll: true })
}

export type ClickLike = {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented: boolean
}

export function isPlainClick(event: ClickLike): boolean {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
