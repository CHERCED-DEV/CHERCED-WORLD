'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@/lib/i18n/config'
import styles from './GlobalAgent.module.scss'
import { OPEN_MINI_CHERCED, type AgentRequest } from './open-global'

const AgentStage = dynamic(() => import('./AgentStage'), { ssr: false })

const COPY = {
  es: { title: 'Mini Cherced', close: 'Cerrar a Mini Cherced', minimize: 'Minimizar', restore: 'Mini Cherced' },
  en: { title: 'Mini Cherced', close: 'Close Mini Cherced', minimize: 'Minimize', restore: 'Mini Cherced' },
} as const

export function GlobalAgent({ lang }: { lang: Locale }) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [request, setRequest] = useState<AgentRequest | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const copy = COPY[lang]

  useEffect(() => {
    const show = (event: Event) => {
      setOpen(true)
      setMinimized(false)
      const ask = (event as CustomEvent<{ ask?: unknown } | null>).detail?.ask
      if (typeof ask === 'string' && ask.trim()) setRequest({ id: Date.now(), text: ask.trim().slice(0, 300) })
    }
    window.addEventListener(OPEN_MINI_CHERCED, show)
    return () => window.removeEventListener(OPEN_MINI_CHERCED, show)
  }, [])

  useEffect(() => {
    if (!open || minimized) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) setMinimized(true)
    }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, minimized])

  if (!open) return null

  return (
    <>
      <section
        ref={panelRef}
        tabIndex={-1}
        className={styles.panel}
        hidden={minimized}
        aria-label={copy.title}
        data-cw-global-agent=""
      >
        <header className={styles.head}>
          <strong>{copy.title}</strong>
          <div className={styles.actions}>
            <button type="button" className={styles.icon} onClick={() => setMinimized(true)} aria-label={copy.minimize} data-cw-global-agent-minimize="">
              –
            </button>
            <button type="button" className={styles.icon} onClick={() => setOpen(false)} aria-label={copy.close} data-cw-global-agent-close="">
              ×
            </button>
          </div>
        </header>
        <div className={styles.body}>
          <AgentStage lang={lang} experiment="V5" consent downloads={[]} t={(key) => key} persistent request={request} />
        </div>
      </section>
      {minimized ? (
        <button type="button" className={styles.restore} onClick={() => setMinimized(false)} data-cw-global-agent-restore="">
          {copy.restore}
        </button>
      ) : null}
    </>
  )
}
