import type { ReactionKind } from '@/lib/data/types'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { REACTION_KINDS } from '@/lib/validation'

export type ReactionLabels = {
  title: string
  count: string
  rateLimited: string
  unavailable: string
  kinds: { kind: ReactionKind; label: string }[]
}

export const REACTION_EMOJI: Record<ReactionKind, string> = { clap: '👏', idea: '💡', fire: '🔥' }

export function reactionLabels(blog: Dictionary): ReactionLabels {
  return {
    title: t(blog, 'reactions.title'),
    count: t(blog, 'reactions.count'),
    rateLimited: t(blog, 'reactions.rateLimited'),
    unavailable: t(blog, 'reactions.unavailable'),
    kinds: REACTION_KINDS.map((kind) => ({ kind, label: t(blog, `reactions.${kind}`) })),
  }
}

export function reactionName(template: string, reaction: string, count: string): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name === 'reaction' ? reaction : name === 'count' ? count : match))
}
