'use client'

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react'
import { cx } from '@/components/ui/cx'
import { toggleReaction } from '@/lib/actions/reactions'
import type { ReactionCounts, ReactionKind } from '@/lib/data/types'
import type { Locale } from '@/lib/i18n'
import { REACTION_EMOJI, reactionName, type ReactionLabels } from './labels'
import styles from './Reactions.module.scss'
import { parseMarked, readMarkedRaw, saveMarked, subscribeMarked, toggled } from './storage'

export type ReactionsProps = { postId: string; lang: Locale; labels: ReactionLabels }

type Load = 'loading' | 'ready' | 'unavailable'

type Notice = 'rateLimited' | 'unavailable' | null

function isCounts(value: unknown): value is ReactionCounts {
  if (!value || typeof value !== 'object') return false
  const counts = value as Record<string, unknown>
  return ['clap', 'idea', 'fire'].every((kind) => Number.isSafeInteger(counts[kind]) && (counts[kind] as number) >= 0)
}

export function Reactions({ postId, lang, labels }: ReactionsProps) {
  const titleId = useId()
  const [counts, setCounts] = useState<ReactionCounts | null>(null)
  const [load, setLoad] = useState<Load>('loading')
  const [notice, setNotice] = useState<Notice>(null)
  const [pending, setPending] = useState<ReactionKind | null>(null)
  const raw = useSyncExternalStore(subscribeMarked, () => readMarkedRaw(postId), () => '')
  const marked = useMemo(() => parseMarked(raw), [raw])
  const format = useMemo(() => new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US'), [lang])

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/reactions/${encodeURIComponent(postId)}`, { cache: 'no-cache', signal: controller.signal })
      .then(async (response) => {
        const body: unknown = response.ok ? await response.json() : null
        if (!isCounts(body)) throw new Error('unavailable')
        setCounts(body)
        setLoad('ready')
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setLoad('unavailable')
        setNotice('unavailable')
      })
    return () => controller.abort()
  }, [postId])

  async function react(kind: ReactionKind) {
    if (pending || load !== 'ready') return
    const current = parseMarked(readMarkedRaw(postId))
    const op = current.has(kind) ? 'remove' : 'add'
    setPending(kind)
    try {
      const result = await toggleReaction(postId, kind, op)
      if (result.ok) {
        setCounts(result.data.counts)
        saveMarked(postId, toggled(current, kind))
        setNotice(null)
      } else if (result.error === 'rate_limited') {
        setNotice('rateLimited')
      } else {
        setNotice('unavailable')
        if (result.error === 'unavailable') setLoad('unavailable')
      }
    } catch {
      setNotice('unavailable')
    } finally {
      setPending(null)
    }
  }

  const disabled = load !== 'ready'

  return (
    <div className={cx('cw-js-only', styles.reactions)} role="group" aria-labelledby={titleId} aria-busy={load === 'loading' || pending !== null} data-cw-reactions={load}>
      <p id={titleId} className={styles.title}>
        {labels.title}
      </p>
      <ul className={styles.list}>
        {labels.kinds.map(({ kind, label }) => {
          const count = counts ? format.format(counts[kind]) : '–'
          const pressed = marked.has(kind)
          return (
            <li key={kind}>
              <button
                type="button"
                className={cx(styles.button, pressed && styles.pressed)}
                aria-pressed={pressed}
                aria-label={reactionName(labels.count, label, count)}
                disabled={disabled}
                aria-disabled={pending !== null ? true : undefined}
                onClick={() => react(kind)}
                data-cw-reaction={kind}
              >
                <span aria-hidden="true" className={styles.emoji}>
                  {REACTION_EMOJI[kind]}
                </span>
                <span aria-hidden="true" className={styles.count} data-cw-reaction-count="">
                  {count}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p role="status" className={styles.notice} data-cw-reactions-notice={notice ?? ''}>
        {notice === 'rateLimited' ? labels.rateLimited : notice === 'unavailable' ? labels.unavailable : null}
      </p>
    </div>
  )
}
