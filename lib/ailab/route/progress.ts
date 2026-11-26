export const ROUTE_PROGRESS_KEY = 'cw-route'

export const ROUTE_PROGRESS_VERSION = 1

export const ROUTE_NOTE_MAX = 500

export const ROUTE_BUDGET_MS = 10 * 60 * 1000

export const ROUTE_MARKS = ['checked', 'failed', 'untested'] as const

export type RouteMark = (typeof ROUTE_MARKS)[number]

export type RouteProgress = {
  version: typeof ROUTE_PROGRESS_VERSION
  startedAt: number | null
  endedAt: number | null
  active: string | null
  marks: Readonly<Record<string, Exclude<RouteMark, 'untested'>>>
  notes: Readonly<Record<string, string>>
  pill: boolean
}

export type RouteStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const EMPTY_PROGRESS: RouteProgress = Object.freeze({
  version: ROUTE_PROGRESS_VERSION,
  startedAt: null,
  endedAt: null,
  active: null,
  marks: Object.freeze({}),
  notes: Object.freeze({}),
  pill: true,
})

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function time(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

export function clipNote(text: string): string {
  return text.slice(0, ROUTE_NOTE_MAX)
}

export function parseProgress(raw: string | null | undefined): RouteProgress {
  if (!raw) return EMPTY_PROGRESS
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return EMPTY_PROGRESS
  }
  const data = record(value)
  if (data.version !== ROUTE_PROGRESS_VERSION) return EMPTY_PROGRESS
  const startedAt = time(data.startedAt)
  const endedAt = startedAt === null ? null : time(data.endedAt)
  const marks: Record<string, Exclude<RouteMark, 'untested'>> = {}
  for (const [id, mark] of Object.entries(record(data.marks))) if (ID.test(id) && (mark === 'checked' || mark === 'failed')) marks[id] = mark
  const notes: Record<string, string> = {}
  for (const [id, note] of Object.entries(record(data.notes))) if (ID.test(id) && typeof note === 'string' && note) notes[id] = clipNote(note)
  const active = typeof data.active === 'string' && ID.test(data.active) && startedAt !== null ? data.active : null
  return { version: ROUTE_PROGRESS_VERSION, startedAt, endedAt, active, marks, notes, pill: data.pill !== false }
}

export function serializeProgress(progress: RouteProgress): string {
  return JSON.stringify(progress)
}

export function readProgress(storage: RouteStorage | null): RouteProgress {
  if (!storage) return EMPTY_PROGRESS
  try {
    return parseProgress(storage.getItem(ROUTE_PROGRESS_KEY))
  } catch {
    return EMPTY_PROGRESS
  }
}

export function writeProgress(storage: RouteStorage | null, progress: RouteProgress): boolean {
  if (!storage) return false
  try {
    storage.setItem(ROUTE_PROGRESS_KEY, serializeProgress(progress))
    return true
  } catch {
    return false
  }
}

export function clearProgress(storage: RouteStorage | null): boolean {
  if (!storage) return false
  try {
    storage.removeItem(ROUTE_PROGRESS_KEY)
    return true
  } catch {
    return false
  }
}

export function markOf(progress: RouteProgress, id: string): RouteMark {
  return progress.marks[id] ?? 'untested'
}

export function isRouteStarted(progress: RouteProgress): boolean {
  return progress.startedAt !== null
}

export function isRouteActive(progress: RouteProgress): boolean {
  return progress.startedAt !== null && progress.endedAt === null
}

export function nextStation(order: readonly string[], marks: RouteProgress['marks'], after: string | null): string | null {
  const start = after === null ? -1 : order.indexOf(after)
  const rotated = [...order.slice(start + 1), ...order.slice(0, start + 1)]
  return rotated.find((id) => id !== after && !marks[id]) ?? null
}

export function startRoute(progress: RouteProgress, now: number, order: readonly string[]): RouteProgress {
  if (progress.startedAt !== null) return progress
  return { ...progress, startedAt: now, endedAt: null, active: nextStation(order, progress.marks, null), pill: true }
}

export function setActive(progress: RouteProgress, id: string): RouteProgress {
  if (!isRouteActive(progress) || progress.active === id) return progress
  return { ...progress, active: id }
}

export function setMark(progress: RouteProgress, id: string, mark: RouteMark, order: readonly string[]): RouteProgress {
  const { [id]: _previous, ...rest } = progress.marks
  const marks = mark === 'untested' ? rest : { ...rest, [id]: mark }
  const advance = isRouteActive(progress) && mark !== 'untested' && order.includes(id) && (progress.active === id || progress.active === null)
  return { ...progress, marks, active: advance ? nextStation(order, marks, id) : progress.active }
}

export function setNote(progress: RouteProgress, id: string, text: string): RouteProgress {
  const { [id]: _previous, ...rest } = progress.notes
  const note = clipNote(text)
  return { ...progress, notes: note ? { ...rest, [id]: note } : rest }
}

export function finishRoute(progress: RouteProgress, now: number): RouteProgress {
  if (!isRouteActive(progress)) return progress
  return { ...progress, endedAt: Math.max(now, progress.startedAt ?? now) }
}

export function setPill(progress: RouteProgress, visible: boolean): RouteProgress {
  return progress.pill === visible ? progress : { ...progress, pill: visible }
}

export function elapsedMs(progress: RouteProgress, now: number): number {
  if (progress.startedAt === null) return 0
  return Math.max(0, (progress.endedAt ?? now) - progress.startedAt)
}

export function remainingMs(progress: RouteProgress, now: number, budget = ROUTE_BUDGET_MS): number {
  return budget - elapsedMs(progress, now)
}

export function formatClock(ms: number): string {
  const seconds = ms >= 0 ? Math.ceil(ms / 1000) : Math.floor(-ms / 1000)
  const text = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  return ms < 0 && seconds > 0 ? `−${text}` : text
}

export function isRoutePath(pathname: string): boolean {
  return /^\/(es|en)\/ai-lab\/ruta\/?$/.test(pathname)
}

export function pillVisible(progress: RouteProgress, pathname: string): boolean {
  return isRouteActive(progress) && progress.pill && !isRoutePath(pathname)
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match))
}
