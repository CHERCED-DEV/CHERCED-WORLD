export const MAILBOX_ENDPOINT = '/api/inbox-count'

export const MAILBOX_INTERVAL_MS = 60_000

export const MAILBOX_MAX_BADGE = 99

export function parseUnread(body: unknown): number | null {
  if (typeof body !== 'object' || body === null) return null
  const value = (body as { unread?: unknown }).unread
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
}

export function badgeText(unread: number): string {
  return unread > MAILBOX_MAX_BADGE ? `${MAILBOX_MAX_BADGE}+` : String(unread)
}

export function mailboxLabel(unread: number | null, labels: { name: string; one: string; many: string }): string {
  if (!unread) return labels.name
  const count = unread === 1 ? labels.one : labels.many.replace('{count}', String(unread))
  return `${labels.name}, ${count}`
}

type VisibilityDoc = {
  visibilityState: DocumentVisibilityState
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}

export type VisiblePollerOptions = {
  run: () => void
  interval: number
  doc: VisibilityDoc
  setTimer: (callback: () => void, ms: number) => unknown
  clearTimer: (handle: unknown) => void
}

export function startVisiblePolling({ run, interval, doc, setTimer, clearTimer }: VisiblePollerOptions): () => void {
  let timer: unknown = null
  let stopped = false

  const visible = () => doc.visibilityState === 'visible'

  const schedule = () => {
    timer = setTimer(tick, interval)
  }

  function tick() {
    timer = null
    if (stopped || !visible()) return
    run()
    schedule()
  }

  const onVisibility = () => {
    if (stopped || timer !== null || !visible()) return
    run()
    schedule()
  }

  if (visible()) {
    run()
    schedule()
  }
  doc.addEventListener('visibilitychange', onVisibility)

  return () => {
    stopped = true
    if (timer !== null) clearTimer(timer)
    timer = null
    doc.removeEventListener('visibilitychange', onVisibility)
  }
}
