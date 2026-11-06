'use client'

import { Component, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { LabDownload, LabExperimentId } from '@/content/types'
import { Button, buttonClassName } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { consentedResources, onConsentChange, requestDownload, toDownloadRequest, withdrawConsent } from '@/lib/ailab/core/consent'
import { onLabCleared } from '@/lib/ailab/core/store'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import { LabDemoLoadingContext } from './demo-loader'
import { labDemos } from './demos'
import styles from './LabCard.module.scss'
import type { LabDemoComponent, LabTryLabels } from './types'

type Phase = 'idle' | 'asking' | 'declined' | 'open'

export type LabTryProps = {
  lang: Locale
  experiment: LabExperimentId
  downloads: LabDownload[]
  labels: LabTryLabels
  copy: Record<string, string>
  describedBy?: string
  demo?: LabDemoComponent | null
}

type BoundaryProps = { fallback: (retry: () => void) => ReactNode; children: ReactNode }

class DemoBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  retry = () => this.setState({ failed: false })

  render() {
    return this.state.failed ? this.props.fallback(this.retry) : this.props.children
  }
}

const NO_RESOURCES: string[] = []

function useConsentedResources(experiment: LabExperimentId): string[] {
  const cache = useRef<{ key: string; value: string[] }>({ key: '', value: NO_RESOURCES })
  const read = useCallback(() => {
    const value = consentedResources(experiment)
    const key = value.join('\n')
    if (key !== cache.current.key) cache.current = { key, value }
    return cache.current.value
  }, [experiment])
  return useSyncExternalStore(onConsentChange, read, () => NO_RESOURCES)
}

export function LabTry({ lang, experiment, downloads, labels, copy, describedBy, demo }: LabTryProps) {
  const toast = useToast()
  const [phase, setPhase] = useState<Phase>('idle')
  const [consent, setConsent] = useState(false)
  const openRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const focusStage = useRef(false)
  const restoreFocus = useRef(false)
  const granted = useConsentedResources(experiment)
  const Demo = demo === undefined ? (labDemos[experiment] ?? null) : demo
  const main = downloads.find((download) => download.default) ?? null
  const translate = useMemo(() => (key: string, vars?: Record<string, string | number>) => t(copy, key, vars), [copy])

  useEffect(() => onLabCleared(() => setPhase('idle')), [])

  useEffect(() => {
    if (phase === 'open' && focusStage.current) {
      focusStage.current = false
      stageRef.current?.focus()
    }
    if (phase !== 'open' && restoreFocus.current) {
      restoreFocus.current = false
      openRef.current?.focus()
    }
  }, [phase])

  const open = async () => {
    if (phase === 'asking') return
    if (main) {
      setPhase('asking')
      const accepted = await requestDownload(toDownloadRequest(experiment, main))
      if (!accepted) {
        setPhase('declined')
        return
      }
    }
    setConsent(Boolean(main))
    focusStage.current = true
    setPhase('open')
  }

  const close = () => {
    restoreFocus.current = true
    setPhase('idle')
  }

  const revoke = () => {
    withdrawConsent(experiment)
    if (phase === 'open' && main) close()
    toast.success(labels.revoked)
  }

  return (
    <div className={styles.try} data-cw-lab-try={experiment} data-phase={phase}>
      {phase === 'open' ? (
        <div ref={stageRef} className={styles.stage} tabIndex={-1} aria-label={labels.label} role="region" data-cw-lab-stage="">
          <LabDemoLoadingContext value={labels.loading}>
            {Demo ? (
              <DemoBoundary
                fallback={(retry) => (
                  <p className={styles.note} role="alert" data-cw-lab-failed="">
                    {labels.failed}{' '}
                    <button type="button" className={styles.inlineAction} onClick={retry}>
                      {labels.open}
                    </button>
                  </p>
                )}
              >
                <Demo lang={lang} experiment={experiment} consent={consent} downloads={downloads} t={translate} />
              </DemoBoundary>
            ) : (
              <p className={styles.note} data-cw-lab-soon="">
                {labels.soon}
              </p>
            )}
          </LabDemoLoadingContext>
          <div className={styles.stageBar}>
            <Button variant="ghost" size="sm" onClick={close} data-cw-lab-close="">
              {labels.close}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.tryRow}>
          <button
            ref={openRef}
            type="button"
            className={buttonClassName({ variant: 'solid' })}
            onClick={open}
            aria-label={labels.label}
            aria-describedby={describedBy}
            aria-busy={phase === 'asking' || undefined}
            data-cw-lab-open=""
          >
            {labels.open}
          </button>
        </div>
      )}
      {phase === 'declined' ? (
        <p className={styles.note} role="status" data-cw-lab-declined="">
          {labels.declined}
        </p>
      ) : null}
      {granted.length > 0 ? (
        <p className={styles.granted} data-cw-lab-granted="">
          <span>{t({ granted: labels.granted }, 'granted', { resource: granted.join(', ') })}</span>
          <button type="button" className={styles.inlineAction} onClick={revoke} data-cw-lab-revoke="">
            {labels.revoke}
          </button>
        </p>
      ) : null}
    </div>
  )
}
