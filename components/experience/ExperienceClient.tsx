'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useId, useState } from 'react'
import type { CapsuleEntry } from '@/content/types'
import { cx } from '@/components/ui/cx'
import { emit, on } from '@/lib/events'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import type { SearchDoc } from '@/lib/search/types'
import styles from './ExperienceClient.module.scss'
import type { ExperienceLabels } from './labels'

const CommandPalette = dynamic(() => import('./CommandPalette').then((mod) => mod.CommandPalette), { ssr: false })
const Assistant = dynamic(() => import('./Assistant').then((mod) => mod.Assistant), { ssr: false })
const Capsule = dynamic(() => import('./Capsule').then((mod) => mod.Capsule), { ssr: false })

type Panel = 'palette' | 'assistant' | 'capsule'

export type AssistantStatus = 'idle' | 'ready' | 'unavailable'

export type ExperienceClientProps = {
  lang: Locale
  labels: ExperienceLabels
  pages: SearchDoc[]
  email: string | null
  capsule: CapsuleEntry[]
}

export function ExperienceClient({ lang, labels, pages, email, capsule }: ExperienceClientProps) {
  const [open, setOpen] = useState<Panel | null>(null)
  const [sessions, setSessions] = useState<Record<Panel, number>>({ palette: 0, assistant: 0, capsule: 0 })
  const [status, setStatus] = useState<AssistantStatus>('idle')
  const [discovered, setDiscovered] = useState(false)
  const statusId = useId()

  const show = useCallback((panel: Panel) => {
    setSessions((current) => ({ ...current, [panel]: current[panel] + 1 }))
    setOpen(panel)
  }, [])

  const closer = useCallback((panel: Panel) => () => setOpen((current) => (current === panel ? null : current)), [])

  useEffect(() => on('cw:open-palette', () => show('palette')), [show])
  useEffect(() => on('cw:open-assistant', () => show('assistant')), [show])

  const unavailable = status === 'unavailable'

  return (
    <>
      <button
        type="button"
        className={cx(styles.fab, 'cw-js-only')}
        aria-haspopup="dialog"
        aria-describedby={unavailable ? statusId : undefined}
        data-cw-glass="standard"
        data-cw-assistant-button=""
        data-status={status}
        onClick={() => emit('cw:open-assistant')}
      >
        <svg className={styles.icon} width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M4 5h16v10H9l-5 4V5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.label}>{t(labels, 'assistant.open')}</span>
        {unavailable ? (
          <span id={statusId} className={styles.status}>
            {t(labels, 'assistant.unavailableShort')}
          </span>
        ) : null}
      </button>

      {sessions.palette > 0 ? (
        <CommandPalette
          lang={lang}
          labels={labels}
          pages={pages}
          email={email}
          open={open === 'palette'}
          session={sessions.palette}
          onClose={closer('palette')}
          onOpenAssistant={() => show('assistant')}
          onOpenCapsule={() => {
            setDiscovered(true)
            show('capsule')
          }}
        />
      ) : null}

      {sessions.assistant > 0 ? (
        <Assistant
          lang={lang}
          labels={labels}
          open={open === 'assistant'}
          status={status}
          onStatus={setStatus}
          onClose={closer('assistant')}
        />
      ) : null}

      {sessions.capsule > 0 ? (
        <Capsule
          lang={lang}
          labels={labels}
          entries={capsule}
          open={open === 'capsule'}
          discovered={discovered}
          onClose={closer('capsule')}
        />
      ) : null}
    </>
  )
}
