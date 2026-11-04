export const POST_SELECTOR = '[data-cw-post]'

export function ownPost(element: Element | null): Element | null {
  return element?.closest(POST_SELECTOR) ?? null
}

export function headerOffset(): number {
  return document.getElementById('header')?.getBoundingClientRect().bottom ?? 0
}

export function onScrollFrame(callback: () => void, observe?: Element | null): () => void {
  let frame = 0
  const run = () => {
    frame = 0
    callback()
  }
  const schedule = () => {
    if (frame === 0) frame = window.requestAnimationFrame(run)
  }
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  const resize = observe && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
  if (observe) resize?.observe(observe)
  callback()
  return () => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    resize?.disconnect()
    if (frame !== 0) window.cancelAnimationFrame(frame)
  }
}
