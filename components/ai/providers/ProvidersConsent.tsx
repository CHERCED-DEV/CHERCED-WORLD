'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import styles from './Providers.module.scss'

export const PROVIDERS_CONSENT_KEY = 'cw-providers-consent'

export const PROVIDERS_CONSENT_VERSION = '043-v1'

const listeners = new Set<() => void>()

function read(): boolean {
  try {
    return sessionStorage.getItem(PROVIDERS_CONSENT_KEY) === PROVIDERS_CONSENT_VERSION
  } catch {
    return false
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const listener of listeners) listener()
}

export function grantProvidersConsent(): void {
  try {
    sessionStorage.setItem(PROVIDERS_CONSENT_KEY, PROVIDERS_CONSENT_VERSION)
  } catch {}
  notify()
}

export function clearProvidersConsent(): void {
  try {
    sessionStorage.removeItem(PROVIDERS_CONSENT_KEY)
  } catch {}
  notify()
}

export function useProvidersConsent(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}

export type ProvidersConsentLabels = { title: string; body: string; more: string; accept: string; cancel: string }

export type ProvidersConsentProps = {
  id: string
  labels: ProvidersConsentLabels
  privacyHref: string
  onCancel?: () => void
  onAccept?: () => void
  children?: ReactNode
}

export function ProvidersConsent({ id, labels, privacyHref, onCancel, onAccept, children }: ProvidersConsentProps) {
  const granted = useProvidersConsent()
  if (granted) return <>{children}</>
  return (
    <div className={styles.consent} role="group" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`} data-cw-providers-consent="">
      <p id={`${id}-title`} className={styles.title}>
        {labels.title}
      </p>
      <p id={`${id}-body`}>{labels.body}</p>
      <a href={privacyHref} className={styles.more}>
        {labels.more}
      </a>
      <div className={styles.actions}>
        <Button
          variant="solid"
          onClick={() => {
            grantProvidersConsent()
            onAccept?.()
          }}
          data-cw-providers-accept=""
        >
          {labels.accept}
        </Button>
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} data-cw-providers-cancel="">
            {labels.cancel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
