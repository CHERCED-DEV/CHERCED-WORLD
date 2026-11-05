import type { ReactionKind } from '@/lib/data/types'
import { isReactionKind, REACTION_KINDS } from '@/lib/validation'

export const REACTIONS_STORAGE_PREFIX = 'cw-reactions:'

export function reactionsStorageKey(postId: string): string {
  return `${REACTIONS_STORAGE_PREFIX}${postId}`
}

export function parseMarked(raw: string | null | undefined): ReadonlySet<ReactionKind> {
  if (!raw) return new Set()
  return new Set(raw.split(',').map((value) => value.trim()).filter(isReactionKind))
}

export function serializeMarked(marked: ReadonlySet<ReactionKind>): string {
  return REACTION_KINDS.filter((kind) => marked.has(kind)).join(',')
}

export function toggled(marked: ReadonlySet<ReactionKind>, kind: ReactionKind): ReadonlySet<ReactionKind> {
  const next = new Set(marked)
  if (next.has(kind)) next.delete(kind)
  else next.add(kind)
  return next
}

const listeners = new Set<() => void>()

export function subscribeMarked(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export function readMarkedRaw(postId: string): string {
  try {
    return window.localStorage.getItem(reactionsStorageKey(postId)) ?? ''
  } catch {
    return ''
  }
}

export function saveMarked(postId: string, marked: ReadonlySet<ReactionKind>): void {
  const value = serializeMarked(marked)
  try {
    if (value) window.localStorage.setItem(reactionsStorageKey(postId), value)
    else window.localStorage.removeItem(reactionsStorageKey(postId))
  } catch {}
  for (const listener of listeners) listener()
}
