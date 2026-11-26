import type { LabExperimentId } from '@/content/types'
import type { LabEventType } from '@/lib/data/types'
import { LAB_EVENT_DETAIL, LAB_EVENTS_BATCH, LAB_EVENTS_ENDPOINT, type LabEventInput } from './events'

const FLUSH_MS = 4000

const queue: LabEventInput[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let listening = false
let blocked = false

function signedIn(): boolean {
  return typeof document !== 'undefined' && document.cookie.split(';').some((part) => part.trim() === 'cw-reader=1')
}

export function flushLabEvents(beacon = false): void {
  if (timer) clearTimeout(timer)
  timer = null
  while (queue.length) {
    const body = JSON.stringify({ events: queue.splice(0, LAB_EVENTS_BATCH) })
    if (beacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(LAB_EVENTS_ENDPOINT, new Blob([body], { type: 'application/json' }))
    } else {
      void fetch(LAB_EVENTS_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
        .then((response) => {
          if (response.status === 401 || response.status === 403) {
            blocked = true
            queue.length = 0
          }
        })
        .catch(() => undefined)
    }
  }
}

export function labEvent(experiment: LabExperimentId, type: LabEventType, lang: 'es' | 'en', detail?: string | null): void {
  if (blocked || !signedIn()) return
  queue.push({ experiment, type, lang, at: Date.now(), ...(detail && LAB_EVENT_DETAIL.test(detail) ? { detail } : {}) })
  if (!listening && typeof window !== 'undefined') {
    listening = true
    window.addEventListener('pagehide', () => flushLabEvents(true))
  }
  if (queue.length >= LAB_EVENTS_BATCH) flushLabEvents()
  else timer ??= setTimeout(() => flushLabEvents(), FLUSH_MS)
}

export function pendingLabEvents(): readonly LabEventInput[] {
  return queue
}
