'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { AgentInterviewCopy } from '@/content/ailab/agent'
import { INTERVIEW_TRACKS, interviewTracks, type InterviewTrack } from '@/content/ailab/interview'
import type { DesignDecision, Diagram } from '@/lib/ai/agent/design'
import type { AgentSource } from '@/lib/ai/agent/tools'
import { DesignBoard } from './DesignBoard'
import type { Locale } from '@/lib/i18n/config'
import styles from './Agent.module.scss'

type Props = {
  lang: Locale
  copy: AgentInterviewCopy
  track: InterviewTrack | null
  onTrack: (track: InterviewTrack | null) => void
  live: boolean
  startedAt: number
  asked: readonly string[]
  sources: readonly AgentSource[]
  onAsk: (question: string) => void
  onFinish: () => void
  diagram?: Diagram | null
  decisions?: readonly DesignDecision[]
}

function clock(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function Elapsed({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return <time className={styles.interviewClock}>{clock(now - since)}</time>
}

export function InterviewPanel({ lang, copy, track, onTrack, live, startedAt, asked, sources, onAsk, onFinish, diagram = null, decisions = [] }: Props) {
  const tracks = interviewTracks[lang]
  if (!live) {
    return (
      <fieldset className={styles.interviewPick} data-cw-agent-interview-pick="">
        <legend className={styles.label}>{copy.pick}</legend>
        <label className={styles.interviewOption}>
          <input type="radio" name="agent-interview" checked={track === null} onChange={() => onTrack(null)} />
          <span>
            <strong>{copy.free}</strong>
            <small>{copy.freeHint}</small>
          </span>
        </label>
        {INTERVIEW_TRACKS.map((id) => (
          <label key={id} className={styles.interviewOption} data-disabled={tracks[id].ready ? undefined : ''}>
            <input type="radio" name="agent-interview" checked={track === id} disabled={!tracks[id].ready} onChange={() => onTrack(id)} />
            <span>
              <strong>
                {tracks[id].label}
                {tracks[id].ready ? null : ` · ${copy.soon}`}
              </strong>
              <small>{tracks[id].hint}</small>
            </span>
          </label>
        ))}
      </fieldset>
    )
  }
  if (!track) return null
  const pending = tracks[track].questions.filter((question) => !asked.includes(question))
  return (
    <section className={styles.interview} aria-label={copy.title} data-cw-agent-interview={track}>
      <div className={styles.interviewHead}>
        <strong>
          {copy.title} · {tracks[track].label}
        </strong>
        <Elapsed since={startedAt} />
      </div>
      {pending.length ? (
        <div>
          <p className={styles.label}>{copy.suggested}</p>
          <div className={styles.interviewChips}>
            {pending.map((question) => (
              <button key={question} type="button" className={styles.interviewChip} onClick={() => onAsk(question)} data-cw-agent-interview-question="">
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {track === 'design' ? <DesignBoard diagram={diagram} decisions={decisions} copy={copy.design} /> : null}
      <div>
        <p className={styles.label}>{copy.sources}</p>
        {sources.length ? (
          <ul className={styles.interviewSources} data-cw-agent-sources="">
            {sources.map((source) => (
              <li key={source.path}>
                <Link href={source.path} target="_blank" rel="noopener">
                  {source.title}
                </Link>
                <small>{source.path}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>{copy.noSources}</p>
        )}
      </div>
      <div className={styles.row}>
        <Button variant="glass" onClick={onFinish} data-cw-agent-interview-finish="">
          {copy.finish}
        </Button>
      </div>
    </section>
  )
}
