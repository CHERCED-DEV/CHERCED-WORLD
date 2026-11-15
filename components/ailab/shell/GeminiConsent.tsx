'use client'

import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n/config'
import styles from './GeminiConsent.module.scss'

export const GEMINI_CONSENT_KEY = 'cw-gemini-consent'

const listeners = new Set<() => void>()

function read(): boolean {
  try {
    return sessionStorage.getItem(GEMINI_CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function grantGeminiConsent(): void {
  try {
    sessionStorage.setItem(GEMINI_CONSENT_KEY, '1')
  } catch {}
  for (const listener of listeners) listener()
}

export function clearGeminiConsent(): void {
  try {
    sessionStorage.removeItem(GEMINI_CONSENT_KEY)
  } catch {}
  for (const listener of listeners) listener()
}

const COPY = {
  es: {
    title: 'Este experimento corre en Google (Gemini)',
    body: 'Lo que escribas aquí va a Google para generar la respuesta, con la API de pago, que no lo usa para entrenar. Este sitio no lo guarda. El permiso vale para esta sesión y lo retiras con «Borrar lo que el laboratorio guardó».',
    sends: 'Se envía',
    accept: 'Entiendo, continuar',
  },
  en: {
    title: 'This experiment runs on Google (Gemini)',
    body: 'What you type here goes to Google to generate the answer, through the paid API, which does not use it for training. This site doesn’t store it. The permission lasts for this session and you withdraw it with “Clear what the lab saved”.',
    sends: 'What is sent',
    accept: 'Got it, continue',
  },
} as const

export function GeminiConsent({ lang, sends, children }: { lang: Locale; sends: string; children: ReactNode }) {
  const granted = useSyncExternalStore(subscribe, read, () => false)
  const [, refresh] = useState(0)
  if (granted) return <>{children}</>
  const copy = COPY[lang]
  return (
    <div className={styles.consent} role="group" aria-labelledby="gemini-consent-title" data-cw-gemini-consent="">
      <p id="gemini-consent-title" className={styles.title}>
        {copy.title}
      </p>
      <p>{copy.body}</p>
      <p className={styles.sends}>
        <strong>{copy.sends}:</strong> {sends}
      </p>
      <Button
        variant="solid"
        onClick={() => {
          grantGeminiConsent()
          refresh((value) => value + 1)
        }}
        data-cw-gemini-accept=""
      >
        {copy.accept}
      </Button>
    </div>
  )
}
