'use client'

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button, buttonClassName } from '@/components/ui/Button'
import { formatBytes } from '@/lib/ailab/core/format'
import { MAX_AUDIO_SECONDS, durationOf } from '@/lib/ailab/voice/audio'
import { MAX_FILE_BYTES, decodeToMono, probeDuration } from '@/lib/ailab/voice/decode'
import { clock, downloadText, exportFileName, plainText, toSrt, toTxt, type ExportFormat } from '@/lib/ailab/voice/export'
import { MODEL_CDN, ONNX_RUNTIME, WHISPER_DOWNLOADS, defaultModelOf, offeredModels } from '@/lib/ailab/voice/models'
import { WHISPER_LANGUAGES, type WhisperLanguage, type WhisperModelId, type WhisperSegment, type WhisperTranscript } from '@/lib/ailab/voice/protocol'
import type { MicIssue } from '@/lib/ailab/voice/recorder'
import { DEVICE_NAMES, EngineProgress, LocalNote, fill, formatSeconds, modelName, rescueFocus, type EngineMessages } from './parts'
import { useRecorder } from './use-recorder'
import { useWhisper } from './use-whisper'
import styles from './Voice.module.scss'

type Pending = { blob: Blob; name: string; duration: number }

type Problem = { kind: 'unreadable' | 'tooBig' | 'empty'; name: string; size: number }

const MAX_MINUTES = MAX_AUDIO_SECONDS / 60

const ACCEPT = 'audio/*,video/mp4,video/webm,.m4a,.mp3,.wav,.ogg,.oga,.opus,.webm,.flac'

export function Transcriber({ lang, experiment, consent, downloads, t }: LabDemoProps) {
  const models = useMemo(() => offeredModels(downloads), [downloads])
  const preferred = useMemo(() => defaultModelOf(downloads), [downloads])
  const [model, setModel] = useState<WhisperModelId>(preferred)
  const [language, setLanguage] = useState<WhisperLanguage>(lang)
  const { state, load, transcribe, cancel } = useWhisper(experiment)
  const [segments, setSegments] = useState<WhisperSegment[]>([])
  const [result, setResult] = useState<WhisperTranscript | null>(null)
  const [decoding, setDecoding] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [autoStopped, setAutoStopped] = useState(false)
  const [copied, setCopied] = useState<'ok' | 'failed' | null>(null)
  const id = useId()
  const started = useRef(false)
  const root = useRef<HTMLDivElement>(null)

  const messages: EngineMessages = {
    asking: t('ailab.v1.status.asking'),
    declined: t('ailab.v1.status.declined'),
    downloading: t('ailab.v1.status.downloading'),
    preparing: t('ailab.v1.status.preparing'),
    ready: t('ailab.v1.status.ready'),
    cancelled: t('ailab.v1.status.cancelled'),
    released: t('ailab.v1.status.released'),
    loadFailed: t('ailab.v1.status.loadFailed'),
    transcribeFailed: t('ailab.v1.status.transcribeFailed'),
    paused: t('ailab.worker.paused'),
    evicted: t('ailab.worker.evicted'),
    retry: t('ailab.v1.retry'),
    cancel: t('ailab.v1.cancel'),
  }

  const micMessages: Record<MicIssue, string> = {
    denied: t('ailab.v1.mic.denied'),
    'no-mic': t('ailab.v1.mic.noMic'),
    unsupported: t('ailab.v1.mic.unsupported'),
    busy: t('ailab.v1.mic.busy'),
    error: t('ailab.v1.mic.error'),
  }

  useEffect(() => {
    if (started.current || !consent) return
    started.current = true
    void load(preferred)
  }, [consent, load, preferred])

  useEffect(() => rescueFocus(root.current), [state.phase])

  const run = async (audio: Float32Array) => {
    setSegments([])
    setResult(null)
    const outcome = await transcribe(audio, {
      model,
      language,
      onSegments: (fresh) => setSegments((current) => [...current, ...fresh]),
    })
    if (outcome.status !== 'done') return
    setSegments(outcome.transcript.segments)
    setResult(outcome.transcript)
    if (outcome.transcript.segments.length === 0) setProblem({ kind: 'empty', name: '', size: 0 })
  }

  const decodeAndRun = async (blob: Blob, name: string, confirmed: boolean) => {
    setDecoding(true)
    let audio: Float32Array
    try {
      audio = await decodeToMono(blob)
    } catch {
      setDecoding(false)
      setProblem({ kind: 'unreadable', name, size: blob.size })
      return
    }
    setDecoding(false)
    if (audio.length === 0) {
      setProblem({ kind: 'unreadable', name, size: blob.size })
      return
    }
    const duration = durationOf(audio)
    if (!confirmed && duration > MAX_AUDIO_SECONDS) {
      setPending({ blob, name, duration })
      return
    }
    await run(audio)
  }

  const accept = async (blob: Blob, name: string, knownSeconds?: number) => {
    setProblem(null)
    setPending(null)
    setCopied(null)
    if (blob.size > MAX_FILE_BYTES) {
      setProblem({ kind: 'tooBig', name, size: blob.size })
      return
    }
    const seconds = knownSeconds ?? (await probeDuration(blob))
    if (seconds !== null && seconds > MAX_AUDIO_SECONDS) {
      setPending({ blob, name, duration: seconds })
      return
    }
    await decodeAndRun(blob, name, false)
  }

  const recorder = useRecorder({
    maxSeconds: MAX_AUDIO_SECONDS,
    onRecording: ({ blob, seconds }) => void accept(blob, t('ailab.v1.source.recording'), seconds),
    onAutoStop: () => setAutoStopped(true),
  })

  const recording = recorder.status !== 'idle'
  const working = state.phase === 'working'
  const busy = decoding || working || state.phase === 'asking'
  const needsLoad = state.model !== model || state.phase === 'idle' || state.phase === 'declined' || state.phase === 'error'

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void accept(file, file.name)
  }

  const toggleRecording = () => {
    if (busy || recorder.status === 'requesting') return
    if (recording) {
      recorder.stop()
      return
    }
    setAutoStopped(false)
    setProblem(null)
    setPending(null)
    void recorder.start()
  }

  const exportAs = (format: ExportFormat) => {
    const content = format === 'srt' ? toSrt(segments) : toTxt(segments)
    downloadText(exportFileName(t('ailab.v1.export.file'), format), content, format)
  }

  const copy = () => {
    navigator.clipboard.writeText(plainText(segments)).then(
      () => setCopied('ok'),
      () => setCopied('failed'),
    )
  }

  const problemText = (current: Problem): string => {
    if (current.kind === 'tooBig') {
      return fill(t('ailab.v1.file.tooBig'), { name: current.name, size: formatBytes(current.size, lang), max: formatBytes(MAX_FILE_BYTES, lang) })
    }
    if (current.kind === 'empty') return t('ailab.v1.status.empty')
    return fill(t('ailab.v1.file.unreadable'), { name: current.name })
  }

  const inputStatus = recording
    ? recorder.status === 'requesting'
      ? t('ailab.v1.requesting')
      : t('ailab.v1.recording')
    : decoding
      ? t('ailab.v1.status.decoding')
      : working
        ? state.work && state.work.total > 0
          ? fill(t('ailab.v1.status.working'), { done: Math.min(state.work.total, state.work.done + 1), total: state.work.total })
          : t('ailab.v1.status.workingStart')
        : result && segments.length > 0
          ? t('ailab.v1.status.done')
          : ''

  return (
    <div ref={root} className={styles.demo} data-cw-voice="V1">
      <LocalNote>{t('ailab.v1.local')}</LocalNote>
      <p className={styles.engineNote} data-cw-v1-engine="">
        {fill(t('ailab.v1.engine'), { size: formatBytes(ONNX_RUNTIME.bytes, lang), cdn: MODEL_CDN })}
      </p>

      <fieldset className={styles.fieldset} disabled={decoding || working || recording}>
        <legend className={styles.legend}>{t('ailab.v1.model.legend')}</legend>
        <div className={styles.options}>
          {models.map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                name={`${id}-model`}
                value={option}
                checked={model === option}
                onChange={() => setModel(option)}
                data-cw-v1-model={option}
              />
              <span className={styles.optionText}>
                <span className={styles.optionName}>{t(`ailab.v1.model.${option}`)}</span>
                <span className={styles.optionMeta}>
                  {modelName(option)} · {formatBytes(WHISPER_DOWNLOADS[option].bytes, lang)} · {WHISPER_DOWNLOADS[option].host}
                </span>
              </span>
            </label>
          ))}
        </div>
        {needsLoad ? (
          <div className={styles.actions}>
            <Button
              variant="glass"
              onClick={() => {
                if (state.phase !== 'asking') void load(model)
              }}
              aria-disabled={state.phase === 'asking' || undefined}
              data-cw-v1-load={model}
            >
              {fill(t('ailab.v1.model.load'), { model: modelName(model) })}
            </Button>
          </div>
        ) : null}
      </fieldset>

      <EngineProgress state={state} messages={messages} lang={lang} onCancel={cancel} onRetry={() => void load(model)} />

      {state.phase === 'ready' && state.device === 'wasm' && model !== 'tiny' && models.includes('tiny') ? (
        <p className={styles.hint} data-cw-v1-device-hint="">
          {fill(t('ailab.v1.device.slow'), { size: formatBytes(WHISPER_DOWNLOADS.tiny.bytes, lang) })}
        </p>
      ) : null}

      <fieldset className={styles.fieldset} disabled={busy || recording}>
        <legend className={styles.legend}>{t('ailab.v1.language.legend')}</legend>
        <div className={styles.inline}>
          {WHISPER_LANGUAGES.map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                name={`${id}-language`}
                value={option}
                checked={language === option}
                onChange={() => setLanguage(option)}
                data-cw-v1-language={option}
              />
              <span className={styles.optionText}>
                <span className={styles.optionName}>{t(`ailab.v1.language.${option}`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.actions}>
        {recorder.supported ? (
          <Button
            variant={recording ? 'solid' : 'glass'}
            onClick={toggleRecording}
            aria-disabled={busy || recorder.status === 'requesting' || undefined}
            data-cw-v1-record={recorder.status}
          >
            {recorder.status === 'recording' ? <span className={styles.recDot} aria-hidden="true" /> : null}
            {recorder.status === 'recording'
              ? fill(t('ailab.v1.recordStop'), { elapsed: clock(recorder.seconds) })
              : recorder.status === 'requesting'
                ? t('ailab.v1.opening')
                : t('ailab.v1.record')}
          </Button>
        ) : null}
        <input
          id={`${id}-file`}
          className={styles.fileInput}
          type="file"
          accept={ACCEPT}
          onChange={onFile}
          onClick={(event) => {
            if (busy || recording) event.preventDefault()
          }}
          aria-disabled={busy || recording || undefined}
          aria-describedby={`${id}-file-hint`}
          data-cw-v1-upload=""
        />
        <label htmlFor={`${id}-file`} className={buttonClassName({ variant: 'glass', className: styles.fileLabel })}>
          {t('ailab.v1.upload')}
        </label>
        {working || decoding ? (
          <Button variant="ghost" onClick={cancel} disabled={decoding} data-cw-v1-cancel="">
            {t('ailab.v1.cancel')}
          </Button>
        ) : null}
      </div>
      <p id={`${id}-file-hint`} className={styles.hint}>
        {fill(t('ailab.v1.uploadHint'), { max: MAX_MINUTES })}
      </p>

      {recorder.issue ? (
        <p className={styles.problem} role="alert" data-cw-v1-mic-issue={recorder.issue}>
          {micMessages[recorder.issue]}
        </p>
      ) : null}

      {autoStopped ? (
        <p className={styles.notice} role="status" data-cw-v1-autostop="">
          {fill(t('ailab.v1.autoStop'), { max: MAX_MINUTES })}
        </p>
      ) : null}

      <div className={styles.status} data-cw-v1-work={working ? 'working' : decoding ? 'decoding' : 'idle'}>
        <p role="status" aria-live="polite">
          {inputStatus}
        </p>
        {working && state.work && state.work.total > 0 ? (
          <progress className={styles.progress} max={state.work.total} value={state.work.done} aria-label={inputStatus} />
        ) : null}
      </div>

      {pending ? (
        <div className={styles.notice} role="alert" data-cw-v1-long="">
          <p>{fill(t('ailab.v1.long.body'), { name: pending.name, duration: clock(pending.duration), max: MAX_MINUTES })}</p>
          <div className={styles.actions}>
            <Button
              variant="glass"
              onClick={() => {
                const current = pending
                setPending(null)
                void decodeAndRun(current.blob, current.name, true)
              }}
              data-cw-v1-long-continue=""
            >
              {t('ailab.v1.long.continue')}
            </Button>
            <Button variant="ghost" onClick={() => setPending(null)} data-cw-v1-long-cancel="">
              {t('ailab.v1.long.cancel')}
            </Button>
          </div>
        </div>
      ) : null}

      {problem ? (
        <p className={styles.problem} role="alert" data-cw-v1-problem={problem.kind}>
          {problemText(problem)}
        </p>
      ) : null}

      {segments.length > 0 ? (
        <section className={styles.transcript} aria-labelledby={`${id}-transcript`} data-cw-v1-transcript="">
          <h5 id={`${id}-transcript`} className={styles.transcriptTitle}>
            {t('ailab.v1.transcript.title')}
          </h5>
          <ol className={styles.segments} aria-live="polite" aria-relevant="additions" aria-labelledby={`${id}-transcript`} tabIndex={0}>
            {segments.map((segment, index) => (
              <li key={`${segment.start}-${index}`} className={styles.segment} data-cw-v1-segment="">
                <span className={styles.time}>
                  <time dateTime={`PT${segment.start.toFixed(1)}S`}>{clock(segment.start)}</time>
                </span>
                <span>{segment.text}</span>
              </li>
            ))}
          </ol>
          {result ? (
            <p className={styles.timing} data-cw-v1-timing="">
              {fill(t('ailab.v1.result.timing'), {
                elapsed: formatSeconds(result.ms / 1000, lang),
                duration: clock(result.seconds),
                model: modelName(result.model),
                device: DEVICE_NAMES[result.device],
              })}
            </p>
          ) : null}
          {result ? (
            <div className={styles.actions}>
              <Button variant="glass" onClick={() => exportAs('txt')} data-cw-v1-export="txt">
                {t('ailab.v1.export.txt')}
              </Button>
              <Button variant="glass" onClick={() => exportAs('srt')} data-cw-v1-export="srt">
                {t('ailab.v1.export.srt')}
              </Button>
              <Button variant="ghost" onClick={copy} data-cw-v1-copy="">
                {t('ailab.v1.export.copy')}
              </Button>
            </div>
          ) : null}
          <p role="status" className={styles.hint}>
            {copied === 'ok' ? t('ailab.v1.export.copied') : copied === 'failed' ? t('ailab.v1.export.copyFailed') : ''}
          </p>
        </section>
      ) : null}
    </div>
  )
}

export default Transcriber
