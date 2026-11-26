import type { Commit } from './history'

export type { Commit }

export type WeekCount = { start: string; end: string; count: number }

const SCOPE = /^([a-z]+)(?:\(([^)]*)\))?!?:/i

const RANGE = /(?<!\d)(\d{3})\s*[-–]\s*(\d{3})(?!\d)/g

const NUMBER = /(?<!\d)(\d{3})(?!\d)/g

const MAX_RANGE = 50

const DAY_MS = 24 * 60 * 60 * 1000

const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000

function pad(value: number): string {
  return String(value).padStart(3, '0')
}

export function commitType(subject: string): string | null {
  return SCOPE.exec(subject.trim())?.[1]?.toLowerCase() ?? null
}

export function specsInSubject(subject: string): string[] {
  const scope = SCOPE.exec(subject.trim())?.[2]
  if (!scope) return []
  const found = new Set<string>()
  for (const match of scope.matchAll(RANGE)) {
    const from = Number(match[1])
    const to = Number(match[2])
    if (to > from && to - from <= MAX_RANGE) for (let value = from; value <= to; value += 1) found.add(pad(value))
  }
  for (const match of scope.matchAll(NUMBER)) found.add(match[1]!)
  return [...found].sort()
}

export function commitsBySpec(commits: readonly Commit[], known?: ReadonlySet<string>): Map<string, Commit[]> {
  const bySpec = new Map<string, Commit[]>()
  for (const commit of commits) {
    for (const spec of specsInSubject(commit.subject)) {
      if (known && !known.has(spec)) continue
      const list = bySpec.get(spec) ?? []
      list.push(commit)
      bySpec.set(spec, list)
    }
  }
  for (const list of bySpec.values()) list.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  return bySpec
}

export function firstFeat(commits: readonly Commit[]): Commit | null {
  let first: Commit | null = null
  for (const commit of commits) {
    if (commitType(commit.subject) !== 'feat') continue
    if (!first || Date.parse(commit.date) < Date.parse(first.date)) first = commit
  }
  return first
}

export function bogotaDay(iso: string): number {
  return Math.floor((Date.parse(iso) + BOGOTA_OFFSET_MS) / DAY_MS)
}

export function bogotaDate(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

export function daysBetween(from: string | null, to: string | null): number | null {
  if (!from || !to || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return null
  const days = bogotaDay(to) - bogotaDay(from)
  return days >= 0 ? days : null
}

export function weeklyCounts(commits: readonly Commit[], until: string, weeks = 8): WeekCount[] {
  const today = bogotaDay(until)
  const weekday = (((today + 3) % 7) + 7) % 7
  const lastMonday = today - weekday
  const firstMonday = lastMonday - (weeks - 1) * 7
  const counts = Array.from({ length: weeks }, () => 0)
  for (const commit of commits) {
    const day = bogotaDay(commit.date)
    if (Number.isNaN(day) || day < firstMonday || day > today) continue
    const index = Math.floor((day - firstMonday) / 7)
    counts[index] = (counts[index] ?? 0) + 1
  }
  return counts.map((count, index) => ({
    start: bogotaDate(firstMonday + index * 7),
    end: bogotaDate(Math.min(firstMonday + index * 7 + 6, today)),
    count,
  }))
}
