export const POLL_INTERVAL_MS = 5000

export const MAX_BACKOFF_MS = 30_000

export const UPDATES_ENDPOINT = '/api/admin/updates'

export type PollStatus = 'live' | 'reconnecting' | 'ended'

export type Counts = { unread: number; pending: number }

export type PollResponse = { status: number; body: unknown }

export type PollerDeps = {
  fetchUpdates: (since: string, signal: AbortSignal) => Promise<PollResponse>
  isVisible: () => boolean
  setTimer: (run: () => void, ms: number) => unknown
  clearTimer: (handle: unknown) => void
  onStatus: (status: PollStatus) => void
  onChange: (counts: Counts, previous: Counts) => void
  onEnded: () => void
}

export type Poller = {
  start: () => void
  stop: () => void
  visibilityChanged: () => void
  pollNow: () => void
}

type Snapshot = Counts & { now: string; keys: string[] }

export function hasNewArrivals(counts: Counts, previous: Counts): boolean {
  return counts.unread > previous.unread || counts.pending > previous.pending
}

export function backoffDelay(failures: number): number {
  if (failures <= 0) return POLL_INTERVAL_MS
  return Math.min(POLL_INTERVAL_MS * 2 ** (failures - 1), MAX_BACKOFF_MS)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function changeKeys(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const keys: string[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return null
    const { id, updatedAt } = item as { id?: unknown; updatedAt?: unknown }
    if (typeof id !== 'string' || typeof updatedAt !== 'string') return null
    keys.push(`${id}:${updatedAt}`)
  }
  return keys
}

export function readSnapshot(body: unknown): Snapshot | null {
  if (typeof body !== 'object' || body === null) return null
  const { now, unread, pending, messages, comments } = body as Record<string, unknown>
  if (typeof now !== 'string' || Number.isNaN(new Date(now).getTime())) return null
  if (!isCount(unread) || !isCount(pending)) return null
  const messageKeys = changeKeys(messages)
  const commentKeys = changeKeys(comments)
  if (!messageKeys || !commentKeys) return null
  return { now, unread, pending, keys: [...messageKeys.map((key) => `m:${key}`), ...commentKeys.map((key) => `c:${key}`)] }
}

export function createPoller(deps: PollerDeps, initial: Counts & { since: string }): Poller {
  let since = initial.since
  let counts: Counts = { unread: initial.unread, pending: initial.pending }
  let failures = 0
  let status: PollStatus = 'live'
  let timer: unknown = null
  let controller: AbortController | null = null
  let stopped = true
  const seen = new Set<string>()

  const setStatus = (next: PollStatus) => {
    if (next === status) return
    status = next
    deps.onStatus(next)
  }

  const clear = () => {
    if (timer !== null) deps.clearTimer(timer)
    timer = null
  }

  const schedule = (ms: number) => {
    clear()
    if (!stopped && deps.isVisible()) timer = deps.setTimer(() => void poll(), ms)
  }

  const fail = () => {
    failures += 1
    setStatus('reconnecting')
    schedule(backoffDelay(failures))
  }

  async function poll(): Promise<void> {
    if (stopped) return
    clear()
    controller?.abort()
    const current = new AbortController()
    controller = current
    let response: PollResponse
    try {
      response = await deps.fetchUpdates(since, current.signal)
    } catch {
      if (current.signal.aborted || stopped) return
      fail()
      return
    }
    if (current.signal.aborted || stopped) return
    if (response.status === 401) {
      stopped = true
      clear()
      setStatus('ended')
      deps.onEnded()
      return
    }
    const snapshot = response.status === 200 ? readSnapshot(response.body) : null
    if (!snapshot) {
      fail()
      return
    }
    since = snapshot.now
    const fresh = snapshot.keys.filter((key) => !seen.has(key))
    for (const key of fresh) seen.add(key)
    const previous = counts
    counts = { unread: snapshot.unread, pending: snapshot.pending }
    const countsChanged = counts.unread !== previous.unread || counts.pending !== previous.pending
    failures = 0
    setStatus('live')
    if (fresh.length > 0 || countsChanged) deps.onChange(counts, previous)
    schedule(POLL_INTERVAL_MS)
  }

  return {
    start() {
      if (!stopped || status === 'ended') return
      stopped = false
      schedule(POLL_INTERVAL_MS)
    },
    stop() {
      stopped = true
      clear()
      controller?.abort()
      controller = null
    },
    visibilityChanged() {
      if (stopped) return
      if (deps.isVisible()) {
        void poll()
      } else {
        clear()
        controller?.abort()
        controller = null
      }
    },
    pollNow() {
      if (stopped || !deps.isVisible()) return
      void poll()
    },
  }
}
