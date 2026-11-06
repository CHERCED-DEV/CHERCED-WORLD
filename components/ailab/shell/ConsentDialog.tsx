'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { setConsentPresenter, type DownloadRequest } from '@/lib/ailab/core/consent'
import { formatBytes } from '@/lib/ailab/core/format'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import styles from './LabCard.module.scss'
import type { LabConsentLabels } from './types'

export type ConsentDialogProps = { lang: Locale; labels: LabConsentLabels }

export function consentBody(labels: Pick<LabConsentLabels, 'body' | 'engine'>, request: DownloadRequest, lang: Locale): string {
  const body = t({ body: labels.body }, 'body', { resource: request.resource, size: formatBytes(request.bytes, lang), host: request.host })
  if (!request.engine) return body
  return `${body} ${t({ engine: labels.engine }, 'engine', { resource: request.engine.resource, size: formatBytes(request.engine.bytes, lang) })}`
}

export function ConsentDialog({ lang, labels }: ConsentDialogProps) {
  const titleId = useId()
  const bodyId = useId()
  const [request, setRequest] = useState<DownloadRequest | null>(null)
  const [open, setOpen] = useState(false)
  const resolver = useRef<((accepted: boolean) => void) | null>(null)

  useEffect(
    () =>
      setConsentPresenter(
        (next) =>
          new Promise<boolean>((resolve) => {
            resolver.current?.(false)
            resolver.current = resolve
            setRequest(next)
            setOpen(true)
          }),
      ),
    [],
  )

  useEffect(
    () => () => {
      resolver.current?.(false)
      resolver.current = null
    },
    [],
  )

  const settle = (accepted: boolean) => {
    const resolve = resolver.current
    resolver.current = null
    setOpen(false)
    resolve?.(accepted)
  }

  return (
    <Dialog open={open} onClose={() => settle(false)} labelledBy={titleId} describedBy={bodyId} className={styles.consent} mobileSheet>
      <div className={styles.consentBody} data-cw-lab-consent={request ? `${request.experiment}:${request.resource}` : ''}>
        <h2 id={titleId} className={styles.consentTitle}>
          {labels.title}
        </h2>
        <p id={bodyId} className={styles.consentText} data-cw-lab-consent-text="">
          {request ? consentBody(labels, request, lang) : null}
        </p>
        <p className={styles.consentHint}>{labels.clearHint}</p>
        <div className={styles.consentActions}>
          <Button variant="ghost" onClick={() => settle(false)} data-cw-lab-consent-cancel="">
            {labels.cancel}
          </Button>
          <Button variant="solid" onClick={() => settle(true)} data-cw-lab-consent-accept="">
            {labels.accept}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
