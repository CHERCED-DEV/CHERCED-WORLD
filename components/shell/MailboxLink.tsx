'use client'

import { useEffect, useState } from 'react'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n/config'
import controls from './controls.module.scss'
import { badgeText, MAILBOX_ENDPOINT, MAILBOX_INTERVAL_MS, mailboxLabel, parseUnread, startVisiblePolling } from './mailbox'
import { SelfLink } from './SelfLink'

export type MailboxLabels = { name: string; one: string; many: string }

export function MailboxLink({ lang, labels }: { lang: Locale; labels: MailboxLabels }) {
  const [unread, setUnread] = useState<number | null>(null)

  useEffect(() => {
    let controller: AbortController | null = null

    const run = () => {
      controller?.abort()
      const current = new AbortController()
      controller = current
      fetch(MAILBOX_ENDPOINT, { signal: current.signal, headers: { accept: 'application/json' } })
        .then((response) => (response.ok ? response.json() : null))
        .then((body: unknown) => {
          const value = parseUnread(body)
          if (value !== null && !current.signal.aborted) setUnread(value)
        })
        .catch(() => {})
    }

    const stop = startVisiblePolling({
      run,
      interval: MAILBOX_INTERVAL_MS,
      doc: document,
      setTimer: (callback, ms) => window.setTimeout(callback, ms),
      clearTimer: (handle) => window.clearTimeout(handle as number),
    })

    return () => {
      stop()
      controller?.abort()
    }
  }, [])

  return (
    <SelfLink
      href={`/${lang}/contactMe`}
      prefetch={false}
      className={cx(controls.iconButton, controls.mailbox)}
      aria-label={mailboxLabel(unread, labels)}
      title={labels.name}
      data-cw-mailbox=""
    >
      <Icon name="inbox" />
      {unread ? (
        <span className={controls.badge} aria-hidden="true" data-cw-mailbox-badge="">
          {badgeText(unread)}
        </span>
      ) : null}
    </SelfLink>
  )
}
