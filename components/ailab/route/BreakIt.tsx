'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { breakItPage, BREAK_IT_SIZE, type BreakItAttack } from '@/lib/ailab/route/break-it'
import { fill } from '@/lib/ailab/route/progress'
import type { BreakItLabels } from './labels'
import { useHydrated } from './use-route-progress'
import styles from './BreakIt.module.scss'

type Props = { attacks: readonly BreakItAttack[]; summary: string; boardHref: string; labels: BreakItLabels }

async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function BreakIt({ attacks, summary, boardHref, labels }: Props) {
  const titleId = useId()
  const ready = useHydrated()
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const shown = breakItPage(attacks, page)

  const copy = async (attack: BreakItAttack) => {
    const ok = await copyText(attack.question)
    const text = ok ? labels.copied : labels.copyFailed
    setStatus((previous) => (previous === text ? `${text} ` : text))
  }

  return (
    <section className={styles.breakIt} aria-labelledby={titleId} data-cw-route-breakit="">
      <h4 id={titleId} className={styles.title}>
        {labels.title}
      </h4>
      <p className={styles.intro}>{labels.intro}</p>
      <ol className={styles.attacks} data-cw-route-attacks={page}>
        {shown.map((attack) => (
          <li key={attack.id} className={styles.attack} data-cw-route-attack={attack.id}>
            <q lang={attack.lang} className={styles.question}>
              {attack.question}
            </q>
            <Button
              variant="ghost"
              size="sm"
              className={styles.copy}
              onClick={() => void copy(attack)}
              disabled={!ready}
              aria-label={fill(labels.copyLabel, { question: attack.question })}
              data-cw-route-copy={attack.id}
            >
              {labels.copy}
            </Button>
          </li>
        ))}
      </ol>
      <p className="cw-visually-hidden" role="status" aria-live="polite" data-cw-route-copy-status="">
        {status}
      </p>
      {attacks.length > BREAK_IT_SIZE ? (
        <Button variant="glass" size="sm" className={styles.more} onClick={() => setPage((value) => value + 1)} disabled={!ready} data-cw-route-more-attacks="">
          {labels.more}
        </Button>
      ) : null}
      <p className={styles.result} data-cw-route-evals="">
        {summary}{' '}
        <Link href={boardHref} prefetch={false} className={styles.board}>
          {labels.board}
        </Link>
      </p>
    </section>
  )
}
