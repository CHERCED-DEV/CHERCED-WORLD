import { useMemo, useSyncExternalStore } from 'react'
import { parseProgress, ROUTE_PROGRESS_KEY, serializeProgress, writeProgress, type RouteProgress, type RouteStorage } from '@/lib/ailab/route/progress'

const EVENT = 'cw-route-progress'

let memory: string | null = null

let resolved: RouteStorage | null | undefined

function browserStorage(): RouteStorage | null {
  if (resolved !== undefined) return resolved
  try {
    const storage = window.sessionStorage
    const probe = `${ROUTE_PROGRESS_KEY}-probe`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    resolved = storage
  } catch {
    resolved = null
  }
  return resolved
}

function readRaw(): string | null {
  const storage = browserStorage()
  if (!storage) return memory
  try {
    return storage.getItem(ROUTE_PROGRESS_KEY) ?? memory
  } catch {
    return memory
  }
}

function subscribe(listener: () => void): () => void {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

const noSubscription = () => () => {}

export function currentRouteProgress(): RouteProgress {
  return parseProgress(readRaw())
}

export function saveRouteProgress(progress: RouteProgress): boolean {
  memory = serializeProgress(progress)
  const saved = writeProgress(browserStorage(), progress)
  window.dispatchEvent(new Event(EVENT))
  return saved
}

export function updateRouteProgress(change: (progress: RouteProgress) => RouteProgress): RouteProgress {
  const current = currentRouteProgress()
  const next = change(current)
  if (next !== current) saveRouteProgress(next)
  return next
}

export function useRouteProgress(): RouteProgress {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  return useMemo(() => parseProgress(raw), [raw])
}

export function useRouteStorageOk(): boolean {
  return useSyncExternalStore(noSubscription, () => browserStorage() !== null, () => true)
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  )
}
