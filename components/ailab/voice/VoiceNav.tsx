'use client'

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { findPaletteCommand, runPaletteCommand } from '@/components/experience/palette-model'
import { Button } from '@/components/ui/Button'
import { voiceCommands, type VoiceCommand } from '@/content/ailab/voice-commands'
import { formatBytes } from '@/lib/ailab/core/format'
import { isSilent } from '@/lib/ailab/voice/audio'
import { matchVoiceCommand } from '@/lib/ailab/voice/commands'
import { decodeToMono } from '@/lib/ailab/voice/decode'
import { ONNX_RUNTIME, WHISPER_DOWNLOADS, defaultModelOf } from '@/lib/ailab/voice/models'
import { WHISPER_LANGUAGES, type WhisperLanguage } from '@/lib/ailab/voice/protocol'
import type { MicIssue } from '@/lib/ailab/voice/recorder'
import { EngineProgress, LocalNote, fill, type EngineMessages } from './parts'
import { useSessionConsent } from './use-consent'
import { useRecorder, type Recording } from './use-recorder'
import { useWhisper } from './use-whisper'
import styles from './Voice.module.scss'

export const LEAVE_DELAY_MS = 700

export const MAX_COMMAND_SECONDS = 6

export const MIN_COMMAND_SECONDS = 0.4

const CLICK_GUARD_MS = 600

type Source = 'voice' | 'text' | 'list'

type Target = 'light' | 'dark' | 'es' | 'en'

type Outcome =
  | { kind: 'run'; source: Source; heard: string; label: string; href: string | null }
  | { kind: 'already'; source: Source; heard: string; target: Target }
  | { kind: 'unknown'; source: Source; heard: string }
  | { kind: 'unavailable'; source: Source; heard: string; label: string }
  | { kind: 'notReady'; source: Source; heard: string }
  | { kind: 'empty' | 'short' | 'silent' | 'unreadable' }

export function VoiceNav({ lang, experiment, consent, downloads, t }: LabDemoProps) {
  const model = useMemo(() => defaultModelOf(downloads, 'tiny'), [downloads])
  const download = WHISPER_DOWNLOADS[model]
  const allowed = useSessionConsent(experiment, download.resource)
  const { state, load, transcribe, cancel } = useWhisper(experiment)
  const [language, setLanguage] = useState<WhisperLanguage>(lang)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [thinking, setThinking] = useState(false)
  const [text, setText] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const started = useRef(false)
  const leaveTimer = useRef<number | null>(null)
  const lastGesture = useRef(Number.NEGATIVE_INFINITY)
  const id = useId()

  const messages: EngineMessages = {
    asking: t('ailab.v4.status.asking'),
    declined: t('ailab.v4.status.declined'),
    downloading: t('ailab.v4.status.downloading'),
    preparing: t('ailab.v4.status.preparing'),
    ready: t('ailab.v4.status.ready'),
    cancelled: t('ailab.v4.status.cancelled'),
    released: t('ailab.v4.status.released'),
    loadFailed: t('ailab.v4.status.loadFailed'),
    transcribeFailed: t('ailab.v4.status.transcribeFailed'),
    paused: t('ailab.worker.paused'),
    evicted: t('ailab.worker.evicted'),
    retry: t('ailab.v4.retry'),
    cancel: t('ailab.v4.cancel'),
  }

  const micMessages: Record<MicIssue, string> = {
    denied: t('ailab.v4.mic.denied'),
    'no-mic': t('ailab.v4.mic.noMic'),
    unsupported: t('ailab.v4.mic.unsupported'),
    busy: t('ailab.v4.mic.busy'),
    error: t('ailab.v4.mic.error'),
  }

  useEffect(() => {
    if (started.current || !(consent || allowed)) return
    started.current = true
    void load(model)
  }, [allowed, consent, load, model])

  useEffect(
    () => () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    },
    [],
  )

  const runCommand = (command: VoiceCommand, heard: string, source: Source) => {
    const label = command.label[lang]
    if (!findPaletteCommand('page:home')) {
      setOutcome({ kind: 'notReady', source, heard })
      return
    }
    const item = findPaletteCommand(command.command)
    if (!item) {
      setOutcome({ kind: 'unavailable', source, heard, label })
      return
    }
    const target = command.target
    if (target && 'theme' in target && item.command.type === 'theme' && item.command.to !== target.theme) {
      setOutcome({ kind: 'already', source, heard, target: target.theme })
      return
    }
    if (target && 'lang' in target && target.lang === lang) {
      setOutcome({ kind: 'already', source, heard, target: target.lang })
      return
    }
    const href = item.command.type === 'open' ? item.command.href : null
    setOutcome({ kind: 'run', source, heard, label, href })
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    const leaves = item.command.type === 'navigate' || item.command.type === 'lang'
    if (leaves) leaveTimer.current = window.setTimeout(() => runPaletteCommand(command.command), LEAVE_DELAY_MS)
    else runPaletteCommand(command.command)
  }

  const execute = (heard: string, source: Source) => {
    const match = matchVoiceCommand(heard)
    if (!match) {
      setOutcome({ kind: 'unknown', source, heard })
      setListOpen(true)
      return
    }
    runCommand(match.command, heard, source)
  }

  const onRecording = async ({ blob, seconds }: Recording) => {
    if (seconds < MIN_COMMAND_SECONDS) {
      setOutcome({ kind: 'short' })
      return
    }
    setThinking(true)
    try {
      let audio: Float32Array
      try {
        audio = await decodeToMono(blob)
      } catch {
        setOutcome({ kind: 'unreadable' })
        return
      }
      if (isSilent(audio)) {
        setOutcome({ kind: 'silent' })
        return
      }
      const result = await transcribe(audio, { model, language })
      if (result.status !== 'done') return
      const heard = result.transcript.text.trim()
      if (!heard) {
        setOutcome({ kind: 'silent' })
        return
      }
      execute(heard, 'voice')
    } finally {
      setThinking(false)
    }
  }

  const recorder = useRecorder({ maxSeconds: MAX_COMMAND_SECONDS, onRecording: (recording) => void onRecording(recording) })
  const listening = recorder.status !== 'idle'
  const busy = thinking || state.phase === 'working' || state.phase === 'asking'

  const begin = () => {
    if (listening || busy) return
    lastGesture.current = performance.now()
    setOutcome(null)
    void recorder.start()
  }

  const end = () => {
    lastGesture.current = performance.now()
    if (listening) recorder.stop()
  }

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    begin()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    if (!event.repeat) begin()
  }

  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    end()
  }

  const onClick = () => {
    if (performance.now() - lastGesture.current < CLICK_GUARD_MS) return
    if (listening) end()
    else begin()
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = text.trim()
    if (!value) {
      setOutcome({ kind: 'empty' })
      return
    }
    execute(value, 'text')
  }

  const prefix = (current: Extract<Outcome, { source: Source }>) => {
    if (current.source === 'voice') return `${fill(t('ailab.v4.heard'), { text: current.heard })} `
    if (current.source === 'text') return `${fill(t('ailab.v4.typed'), { text: current.heard })} `
    return ''
  }

  const outcomeText = (current: Outcome | null): string => {
    if (listening) return recorder.status === 'requesting' ? t('ailab.v4.requesting') : t('ailab.v4.listening')
    if (thinking) return t('ailab.v4.status.thinking')
    if (!current) return ''
    switch (current.kind) {
      case 'run':
        return prefix(current) + fill(t('ailab.v4.run'), { command: current.label })
      case 'already':
        return prefix(current) + t(`ailab.v4.already.${current.target}`)
      case 'unknown':
        return prefix(current) + t('ailab.v4.unknown')
      case 'unavailable':
        return prefix(current) + fill(t('ailab.v4.unavailable'), { command: current.label })
      case 'notReady':
        return t('ailab.v4.notReady')
      case 'empty':
        return t('ailab.v4.text.empty')
      case 'short':
        return t('ailab.v4.status.short')
      case 'silent':
        return t('ailab.v4.status.silent')
      case 'unreadable':
        return t('ailab.v4.status.unreadable')
    }
  }

  const activation =
    state.phase === 'asking' ? messages.asking : state.phase === 'declined' ? messages.declined : ''

  return (
    <div className={styles.demo} data-cw-voice="V4" data-cw-v4-voice={allowed ? 'on' : 'off'}>
      <LocalNote>{t('ailab.v4.local')}</LocalNote>

      {allowed ? (
        <EngineProgress state={state} messages={messages} lang={lang} onCancel={cancel} onRetry={() => void load(model)} />
      ) : !recorder.supported ? null : (
        <div className={styles.notice} data-cw-v4-activation="">
          <p id={`${id}-activate`}>
            {fill(t('ailab.v4.activate.body'), {
              model: download.resource,
              size: formatBytes(download.bytes, lang),
              host: download.host,
              runtime: formatBytes(ONNX_RUNTIME.bytes, lang),
            })}
          </p>
          <div className={styles.actions}>
            <Button
              variant="glass"
              onClick={() => {
                if (state.phase !== 'asking') void load(model)
              }}
              aria-describedby={`${id}-activate`}
              aria-disabled={state.phase === 'asking' || undefined}
              data-cw-v4-activate=""
            >
              {t('ailab.v4.activate.button')}
            </Button>
          </div>
          <p role="status" aria-live="polite" data-cw-v4-activation-status={state.phase}>
            {activation}
          </p>
        </div>
      )}

      {allowed ? (
        <fieldset className={styles.fieldset} disabled={busy || listening}>
          <legend className={styles.legend}>{t('ailab.v4.language.legend')}</legend>
          <div className={styles.inline}>
            {WHISPER_LANGUAGES.map((option) => (
              <label key={option} className={styles.option}>
                <input
                  type="radio"
                  name={`${id}-language`}
                  value={option}
                  checked={language === option}
                  onChange={() => setLanguage(option)}
                  data-cw-v4-language={option}
                />
                <span className={styles.optionText}>
                  <span className={styles.optionName}>{t(`ailab.v4.language.${option}`)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {allowed && recorder.supported ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.hold}
            aria-pressed={listening}
            aria-describedby={`${id}-hold-hint`}
            aria-disabled={busy || undefined}
            onPointerDown={onPointerDown}
            onPointerUp={end}
            onPointerCancel={end}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onClick={onClick}
            onBlur={() => {
              if (listening) end()
            }}
            onContextMenu={(event) => event.preventDefault()}
            data-cw-v4-hold={recorder.status}
          >
            {recorder.status === 'recording' ? <span className={styles.recDot} aria-hidden="true" /> : null}
            {recorder.status === 'recording' ? t('ailab.v4.release') : recorder.status === 'requesting' ? t('ailab.v4.opening') : t('ailab.v4.hold')}
          </button>
        </div>
      ) : null}
      {allowed && recorder.supported ? (
        <p id={`${id}-hold-hint`} className={styles.hint}>
          {fill(t('ailab.v4.holdHint'), { max: MAX_COMMAND_SECONDS })}
        </p>
      ) : null}

      {recorder.issue ? (
        <p className={styles.problem} role="alert" data-cw-v4-mic-issue={recorder.issue}>
          {micMessages[recorder.issue]}
        </p>
      ) : null}

      <form className={styles.form} onSubmit={onSubmit} data-cw-v4-form="">
        <label className={styles.field}>
          {t('ailab.v4.text.label')}
          <input
            className={styles.input}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('ailab.v4.text.placeholder')}
            autoComplete="off"
            enterKeyHint="go"
            data-cw-v4-text=""
          />
        </label>
        <Button type="submit" variant="glass" data-cw-v4-submit="">
          {t('ailab.v4.text.submit')}
        </Button>
      </form>

      <div className={styles.status} data-cw-v4-outcome={listening ? 'listening' : thinking ? 'thinking' : (outcome?.kind ?? 'none')}>
        <p className={styles.heard} role="status" aria-live="polite" aria-atomic="true">
          {outcomeText(outcome)}
        </p>
        {outcome?.kind === 'run' && outcome.href ? (
          <p>
            <a href={outcome.href} target="_blank" rel="noopener noreferrer" data-cw-v4-open="">
              {outcome.label}
            </a>
          </p>
        ) : null}
      </div>

      <details className={styles.commands} open={listOpen} onToggle={(event) => setListOpen(event.currentTarget.open)} data-cw-v4-commands="">
        <summary className={styles.commandsSummary}>{t('ailab.v4.commands.title')}</summary>
        <ul className={styles.commandList}>
          {voiceCommands.map((command) => (
            <li key={command.id}>
              <button type="button" className={styles.commandButton} onClick={() => runCommand(command, '', 'list')} data-cw-v4-command={command.id}>
                <span className={styles.commandName}>{command.label[lang]}</span>
                <span className={styles.commandPhrase}>{fill(t('ailab.v4.commands.say'), { phrase: command.phrases[lang][0] ?? '' })}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

export default VoiceNav
