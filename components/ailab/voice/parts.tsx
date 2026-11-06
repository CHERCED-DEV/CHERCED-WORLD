'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { formatBytes } from '@/lib/ailab/core/format'
import type { Locale } from '@/lib/i18n/config'
import { WHISPER_DOWNLOADS } from '@/lib/ailab/voice/models'
import type { WhisperDevice, WhisperModelId } from '@/lib/ailab/voice/protocol'
import type { EngineState } from './use-whisper'
import styles from './Voice.module.scss'

const LOCALE_TAG: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

export const DEVICE_NAMES: Readonly<Record<WhisperDevice, string>> = { webgpu: 'WebGPU', wasm: 'WASM' }

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match))
}

export function formatSeconds(seconds: number, lang: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[lang], {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'short',
    maximumFractionDigits: seconds < 10 ? 1 : 0,
  }).format(Math.max(0, seconds))
}

export function modelName(model: WhisperModelId): string {
  return WHISPER_DOWNLOADS[model].resource
}

export function LocalNote({ children }: { children: ReactNode }) {
  return (
    <p className={styles.local} data-cw-voice-local="">
      <svg className={styles.localIcon} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

export function rescueFocus(root: HTMLElement | null): void {
  if (!root || document.activeElement !== document.body) return
  root.querySelector<HTMLElement>('[data-cw-voice-engine-status]')?.focus({ preventScroll: true })
}

export type EngineMessages = {
  asking: string
  declined: string
  downloading: string
  preparing: string
  ready: string
  cancelled: string
  released: string
  loadFailed: string
  transcribeFailed: string
  paused: string
  evicted: string
  retry: string
  cancel: string
}

export function engineText(state: EngineState, messages: EngineMessages, lang: Locale): string | null {
  const model = state.model ? modelName(state.model) : ''
  const device = state.device ? DEVICE_NAMES[state.device] : ''
  switch (state.phase) {
    case 'asking':
      return messages.asking
    case 'declined':
      return messages.declined
    case 'loading': {
      if (state.preparing) return fill(messages.preparing, { model, device })
      const loaded = state.download?.loaded ?? 0
      const total = Math.max(1, state.download?.total ?? 1)
      return fill(messages.downloading, {
        model,
        loaded: formatBytes(loaded, lang),
        total: formatBytes(total, lang),
        percent: Math.min(100, Math.floor((loaded / total) * 100)),
      })
    }
    case 'ready':
    case 'working':
      return fill(messages.ready, { model, device })
    case 'error':
      return state.failed === 'transcribe' ? messages.transcribeFailed : messages.loadFailed
    default:
      if (state.notice === 'cancelled') return messages.cancelled
      if (state.notice === 'released') return messages.released
      if (state.notice === 'evicted') return messages.evicted
      return null
  }
}

export function EngineProgress({
  state,
  messages,
  lang,
  onCancel,
  onRetry,
}: {
  state: EngineState
  messages: EngineMessages
  lang: Locale
  onCancel: () => void
  onRetry: () => void
}) {
  const text = engineText(state, messages, lang)
  const loading = state.phase === 'loading'
  const failed = state.phase === 'error' && state.failed === 'load'
  const retry = failed || state.notice === 'cancelled' || state.notice === 'evicted' || state.phase === 'declined'
  return (
    <div className={styles.status} data-cw-voice-engine={state.phase}>
      <p role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} data-cw-voice-engine-status="">
        {text}
        {state.paused ? ` ${messages.paused}` : ''}
      </p>
      {loading ? (
        <progress
          className={styles.progress}
          max={state.preparing ? undefined : Math.max(1, state.download?.total ?? 1)}
          value={state.preparing ? undefined : (state.download?.loaded ?? 0)}
          aria-label={text ?? undefined}
          data-cw-voice-progress=""
        />
      ) : null}
      {loading || retry ? (
        <div className={styles.actions}>
          {loading ? (
            <Button variant="ghost" onClick={onCancel} data-cw-voice-cancel-load="">
              {messages.cancel}
            </Button>
          ) : null}
          {retry && !loading ? (
            <Button variant="glass" onClick={onRetry} data-cw-voice-retry="">
              {messages.retry}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
