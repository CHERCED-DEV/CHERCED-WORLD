'use client'

import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n/config'
import { SPEECH_RATES, isOnlineVoice, type SpeechSnapshot, type VoiceLike } from '@/lib/ailab/voice/tts'
import styles from './Voice.module.scss'

const LOCALE_TAG: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

export function voiceOptionLabel(voice: VoiceLike, onlineMark: string): string {
  return `${voice.name} (${voice.lang})${isOnlineVoice(voice) ? ` · ${onlineMark}` : ''}`
}

export function rateLabel(rate: number, lang: Locale): string {
  return `${new Intl.NumberFormat(LOCALE_TAG[lang], { maximumFractionDigits: 2 }).format(rate)}×`
}

export function isActive(snapshot: SpeechSnapshot): boolean {
  return snapshot.state === 'playing' || snapshot.state === 'paused'
}

export function stopOnEscape(snapshot: SpeechSnapshot, stop: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !isActive(snapshot)) return
    event.preventDefault()
    event.stopPropagation()
    stop()
  }
}

export function VoiceSelect({
  label,
  voices,
  value,
  onChange,
  onlineMark,
  disabled,
}: {
  label: string
  voices: readonly VoiceLike[]
  value: string
  onChange: (voiceURI: string) => void
  onlineMark: string
  disabled?: boolean
}) {
  return (
    <label className={styles.field}>
      {label}
      <select className={styles.input} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} data-cw-speech-voice="">
        {voices.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI} data-online={isOnlineVoice(voice) ? '' : undefined}>
            {voiceOptionLabel(voice, onlineMark)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function RateSelect({ label, lang, value, onChange, disabled }: { label: string; lang: Locale; value: number; onChange: (rate: number) => void; disabled?: boolean }) {
  return (
    <label className={styles.field}>
      {label}
      <select className={styles.input} value={String(value)} onChange={(event) => onChange(Number(event.target.value))} disabled={disabled} data-cw-speech-rate="">
        {SPEECH_RATES.map((rate) => (
          <option key={rate} value={String(rate)}>
            {rateLabel(rate, lang)}
          </option>
        ))}
      </select>
    </label>
  )
}

export type SpeechControlLabels = { group: string; play: string; pause: string; resume: string; stop: string }

export function SpeechControls({
  snapshot,
  labels,
  onPlay,
  onPause,
  onResume,
  onStop,
  canPlay,
  describedBy,
  playShortcut,
}: {
  snapshot: SpeechSnapshot
  labels: SpeechControlLabels
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  canPlay: boolean
  describedBy?: string
  playShortcut?: string
}) {
  const playing = snapshot.state === 'playing'
  const paused = snapshot.state === 'paused'
  const active = playing || paused
  return (
    <div className={styles.actions} role="group" aria-label={labels.group}>
      <Button
        variant="solid"
        onClick={() => {
          if (canPlay) onPlay()
        }}
        aria-disabled={!canPlay || undefined}
        aria-describedby={describedBy}
        aria-keyshortcuts={playShortcut}
        data-cw-speech-play=""
      >
        {labels.play}
      </Button>
      <Button
        variant="glass"
        onClick={() => {
          if (playing) onPause()
          else if (paused) onResume()
        }}
        aria-disabled={!active || undefined}
        data-cw-speech-pause={playing ? 'pause' : paused ? 'resume' : 'idle'}
      >
        {paused ? labels.resume : labels.pause}
      </Button>
      <Button
        variant="ghost"
        onClick={() => {
          if (active) onStop()
        }}
        aria-disabled={!active || undefined}
        aria-keyshortcuts="Escape"
        data-cw-speech-stop=""
      >
        {labels.stop}
      </Button>
    </div>
  )
}
