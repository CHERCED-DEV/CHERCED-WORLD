'use client'

import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { locales, type Locale } from '@/lib/i18n/config'
import { isOnlineVoice, pickVoice, speak, voicesFor } from '@/lib/ailab/voice/tts'
import { LocalNote, fill } from './parts'
import { RateSelect, SpeechControls, VoiceSelect, isActive, stopOnEscape } from './speech-parts'
import { useSpeechSession, useSpeechVoices } from './use-speech'
import styles from './Voice.module.scss'

export const MAX_TEXT_CHARS = 2000

export function TextToVoice({ lang, t }: LabDemoProps) {
  const { env, supported, voices, loading } = useSpeechVoices()
  const { snapshot, start, pause, resume, stop } = useSpeechSession()
  const [language, setLanguage] = useState<Locale>(lang)
  const [chosen, setChosen] = useState<Partial<Record<Locale, string>>>({})
  const [rate, setRate] = useState(1)
  const [text, setText] = useState(() => t('ailab.v2.text.sample'))
  const [empty, setEmpty] = useState(false)
  const id = useId()

  const options = useMemo(() => voicesFor(voices, language), [voices, language])
  const voice = useMemo(() => pickVoice(voices, language, chosen[language]), [voices, language, chosen])
  const online = isOnlineVoice(voice)
  const active = isActive(snapshot)

  if (!supported) {
    return (
      <div className={styles.demo} data-cw-voice="V2">
        <LocalNote>{t('ailab.v2.local')}</LocalNote>
        <p className={styles.problem} role="alert" data-cw-speech-unsupported="">
          {t('ailab.v2.unsupported')}
        </p>
      </div>
    )
  }

  const play = () => {
    const value = text.trim()
    if (!value) {
      setEmpty(true)
      return
    }
    setEmpty(false)
    start(() => speak(value, { lang: language, voice, rate, env }))
  }

  const onTextKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return
    event.preventDefault()
    if (voice) play()
  }

  const statusText = (): string => {
    if (snapshot.state === 'playing') return fill(t('ailab.v2.status.playing'), { voice: snapshot.voice ?? voice?.name ?? '' })
    if (snapshot.state === 'paused') return t('ailab.v2.status.paused')
    if (empty) return t('ailab.v2.text.empty')
    if (snapshot.ended === 'finished') return t('ailab.v2.status.finished')
    if (snapshot.ended === 'cancelled') return t('ailab.v2.status.stopped')
    if (snapshot.ended === 'error') return fill(t('ailab.v2.status.error'), { error: snapshot.error ?? '' })
    return ''
  }

  return (
    <div className={styles.demo} data-cw-voice="V2" onKeyDown={stopOnEscape(snapshot, stop)}>
      <LocalNote>{t('ailab.v2.local')}</LocalNote>

      <label className={styles.field}>
        {t('ailab.v2.text.label')}
        <textarea
          className={styles.textarea}
          value={text}
          maxLength={MAX_TEXT_CHARS}
          rows={4}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onTextKey}
          aria-describedby={`${id}-text-hint`}
          aria-keyshortcuts="Control+Enter"
          data-cw-v2-text=""
        />
      </label>
      <p id={`${id}-text-hint`} className={styles.hint}>
        {fill(t('ailab.v2.text.hint'), { max: MAX_TEXT_CHARS })}
      </p>

      <fieldset className={styles.fieldset} disabled={active}>
        <legend className={styles.legend}>{t('ailab.v2.language.legend')}</legend>
        <div className={styles.inline}>
          {locales.map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                name={`${id}-language`}
                value={option}
                checked={language === option}
                onChange={() => setLanguage(option)}
                data-cw-v2-language={option}
              />
              <span className={styles.optionText}>
                <span className={styles.optionName}>{t(`ailab.v2.language.${option}`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {loading ? (
        <p className={styles.hint} role="status" data-cw-speech-voices="loading">
          {t('ailab.v2.voices.loading')}
        </p>
      ) : options.length === 0 ? (
        <p className={styles.problem} role="status" data-cw-speech-voices="none">
          {t('ailab.v2.voices.none')}
        </p>
      ) : (
        <div className={styles.form}>
          <VoiceSelect
            label={t('ailab.v2.voice.label')}
            voices={options}
            value={voice?.voiceURI ?? ''}
            onChange={(voiceURI) => setChosen((current) => ({ ...current, [language]: voiceURI }))}
            onlineMark={t('ailab.v2.voice.online')}
            disabled={active}
          />
          <RateSelect label={t('ailab.v2.rate.label')} lang={lang} value={rate} onChange={setRate} disabled={active} />
        </div>
      )}

      {online && voice ? (
        <p id={`${id}-online`} className={styles.notice} role="status" data-cw-speech-online="">
          {fill(t('ailab.v2.online.warning'), { voice: voice.name })}
        </p>
      ) : null}

      <SpeechControls
        snapshot={snapshot}
        labels={{
          group: t('ailab.v2.controls'),
          play: t('ailab.v2.play'),
          pause: t('ailab.v2.pause'),
          resume: t('ailab.v2.resume'),
          stop: t('ailab.v2.stop'),
        }}
        onPlay={play}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        canPlay={voice !== null}
        describedBy={online ? `${id}-online` : undefined}
        playShortcut="Control+Enter"
      />

      <div className={styles.status} data-cw-speech-status={snapshot.state === 'stopped' ? (snapshot.ended ?? 'idle') : snapshot.state}>
        <p role="status" aria-live="polite" aria-atomic="true">
          {statusText()}
        </p>
      </div>
    </div>
  )
}

export default TextToVoice
