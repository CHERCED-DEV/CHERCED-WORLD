'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GeminiConsent } from '@/components/ailab/shell/GeminiConsent'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { openLiveSession, type LiveSession } from '@/lib/ai/agent/live'
import { startMic, type MicHandle } from '@/lib/ai/agent/mic'
import { createPlayer, type AudioPlayer } from '@/lib/ai/agent/player'
import {
  addOriginal,
  addTranslation,
  captionsSrt,
  closeCaption,
  sampleCaptions,
  SUBTITLES_ENDPOINT,
  type Caption,
  type SubtitleDirection,
} from '@/lib/ai/subtitles/model'
import { downloadText, exportFileName } from '@/lib/ailab/voice/export'
import styles from './Subtitles.module.scss'

const COPY = {
  es: {
    sends: 'tu voz mientras dura la sesión',
    direction: 'Dirección',
    directions: { 'es-en': 'Español → inglés', 'en-es': 'Inglés → español' },
    voice: 'Escuchar la traducción en voz',
    start: 'Empezar a hablar',
    stop: 'Terminar',
    connecting: 'Conectando…',
    live: 'Te escucho. Habla con frases cortas y haz una pausa al final de cada una.',
    left: (seconds: number) => `Quedan ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    empty: 'Aquí aparecen los subtítulos: arriba lo que dices y abajo la traducción.',
    original: 'Original',
    translation: 'Traducción',
    history: 'Lo que va de la sesión',
    srt: 'Subtítulos traducidos (.srt)',
    bilingual: 'Bilingües (.srt)',
    simulated: 'Simulador local: sin la clave de Gemini, te muestro un ejemplo grabado.',
    ended: 'Sesión terminada.',
    mic: 'No pude abrir el micrófono. Revisa el permiso del navegador.',
    errors: {
      failed: 'No pude conectar. Prueba otra vez en un rato.',
      rate_limited: 'Llegaste al límite de sesiones de hoy.',
      daily_cap: 'El laboratorio llegó a su límite de hoy.',
      unavailable: 'Gemini no está disponible ahora.',
      off: 'Este experimento todavía no está activo.',
      expired: 'Se acabaron los 3 minutos de la sesión.',
    },
  },
  en: {
    sends: 'your voice while the session lasts',
    direction: 'Direction',
    directions: { 'es-en': 'Spanish → English', 'en-es': 'English → Spanish' },
    voice: 'Hear the translation out loud',
    start: 'Start talking',
    stop: 'Finish',
    connecting: 'Connecting…',
    live: 'I’m listening. Speak in short sentences and pause at the end of each one.',
    left: (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} left`,
    empty: 'Subtitles show up here: what you say on top and the translation below.',
    original: 'Original',
    translation: 'Translation',
    history: 'The session so far',
    srt: 'Translated subtitles (.srt)',
    bilingual: 'Bilingual (.srt)',
    simulated: 'Local simulator: without the Gemini key, I show you a recorded example.',
    ended: 'Session ended.',
    mic: 'I couldn’t open the microphone. Check the browser permission.',
    errors: {
      failed: 'I couldn’t connect. Try again in a while.',
      rate_limited: 'You reached today’s session limit.',
      daily_cap: 'The lab reached today’s limit.',
      unavailable: 'Gemini is not available right now.',
      off: 'This experiment isn’t active yet.',
      expired: 'The 3-minute session is over.',
    },
  },
} as const

type ErrorKey = keyof (typeof COPY)['es']['errors']

type Phase = 'idle' | 'connecting' | 'live' | 'ended'

export default function SubtitlesStage({ lang }: LabDemoProps) {
  const copy = COPY[lang]
  const [direction, setDirection] = useState<SubtitleDirection>(lang === 'es' ? 'es-en' : 'en-es')
  const [voice, setVoice] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [captions, setCaptions] = useState<Caption[]>([])
  const [simulated, setSimulated] = useState(false)
  const [error, setError] = useState<ErrorKey | 'mic' | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const voiceRef = useRef(false)
  const startedAt = useRef(0)
  const session = useRef<LiveSession | null>(null)
  const mic = useRef<MicHandle | null>(null)
  const player = useRef<AudioPlayer | null>(null)
  const timers = useRef<number[]>([])

  const elapsed = () => (Date.now() - startedAt.current) / 1000

  const teardown = useCallback(() => {
    for (const timer of timers.current.splice(0)) window.clearTimeout(timer)
    mic.current?.stop()
    mic.current = null
    const open = session.current
    session.current = null
    open?.close()
    player.current?.close()
    player.current = null
    setExpiresAt(null)
  }, [])

  useEffect(() => () => teardown(), [teardown])

  useEffect(() => {
    if (expiresAt === null) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [expiresAt])

  const toggleVoice = (on: boolean) => {
    voiceRef.current = on
    setVoice(on)
    if (!on) player.current?.flush()
  }

  const playSample = () => {
    setSimulated(true)
    setPhase('live')
    startedAt.current = Date.now()
    const sample = sampleCaptions(direction)
    sample.forEach((caption, index) => {
      timers.current.push(window.setTimeout(() => setCaptions((list) => [...list, { ...caption, translation: '' }]), index * 2600))
      timers.current.push(
        window.setTimeout(() => setCaptions((list) => list.map((item) => (item.id === caption.id ? caption : item))), index * 2600 + 1200),
      )
    })
    timers.current.push(window.setTimeout(() => setPhase('ended'), sample.length * 2600))
  }

  const start = async () => {
    teardown()
    setError(null)
    setCaptions([])
    setSimulated(false)
    setPhase('connecting')
    const audio = createPlayer()
    player.current = audio
    await audio.resume().catch(() => undefined)
    let grant: { mode?: string; token?: string; model?: string; expiresAt?: string; error?: string }
    try {
      const response = await fetch(SUBTITLES_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lang, direction }) })
      grant = (await response.json()) as typeof grant
      if (!response.ok) throw new Error(grant.error ?? 'failed')
    } catch (cause) {
      teardown()
      setPhase('idle')
      setError(cause instanceof Error && cause.message in copy.errors ? (cause.message as ErrorKey) : 'failed')
      return
    }
    if (grant.mode === 'local' || !grant.token || !grant.model) {
      teardown()
      playSample()
      return
    }
    setExpiresAt(grant.expiresAt ? Date.parse(grant.expiresAt) : null)
    const live = openLiveSession({
      token: grant.token,
      model: grant.model,
      events: {
        onOpen: () => {
          startedAt.current = Date.now()
          setPhase('live')
          void startMic({ onChunk: (pcm) => live.sendAudio(pcm) })
            .then((handle) => {
              mic.current = handle
            })
            .catch(() => {
              setError('mic')
              teardown()
              setPhase('ended')
            })
        },
        onAudio: (pcm) => {
          if (voiceRef.current) player.current?.enqueue(pcm)
        },
        onInputTranscript: (text) => setCaptions((list) => addOriginal(list, text, elapsed())),
        onOutputTranscript: (text) => setCaptions((list) => addTranslation(list, text, elapsed())),
        onTurnComplete: () => setCaptions((list) => closeCaption(list, elapsed())),
        onClose: (reason) => {
          if (session.current !== live) return
          setCaptions((list) => closeCaption(list, elapsed()))
          teardown()
          setPhase('ended')
          if (reason === 'expired') setError('expired')
          else if (reason === 'error') setError('failed')
        },
      },
    })
    session.current = live
  }

  const stop = () => {
    setCaptions((list) => closeCaption(list, elapsed()))
    teardown()
    setPhase('ended')
  }

  const save = (bilingual: boolean) => {
    const content = captionsSrt(captions, bilingual)
    if (content) downloadText(exportFileName(bilingual ? 'subtitulos-bilingues' : 'subtitulos', 'srt'), content, 'srt')
  }

  const current = captions.at(-1)
  const busy = phase === 'connecting' || phase === 'live'
  const seconds = expiresAt === null ? null : Math.max(0, Math.round((expiresAt - now) / 1000))

  return (
    <GeminiConsent lang={lang} sends={copy.sends}>
      <div className={styles.stage} data-cw-subtitles-stage="" data-state={phase}>
        <ChoiceChips
          kind="v6-direction"
          legend={copy.direction}
          options={[
            { value: 'es-en', label: copy.directions['es-en'] },
            { value: 'en-es', label: copy.directions['en-es'] },
          ]}
          value={direction}
          onChange={setDirection}
          disabled={busy}
        />
        <label className={styles.toggle}>
          <input type="checkbox" checked={voice} onChange={(event) => toggleVoice(event.target.checked)} data-cw-subtitles-voice="" />
          {copy.voice}
        </label>
        <div className={styles.row}>
          {busy ? (
            <Button variant="solid" onClick={stop} data-cw-subtitles-stop="">
              {copy.stop}
            </Button>
          ) : (
            <Button variant="solid" onClick={() => void start()} data-cw-subtitles-start="">
              {copy.start}
            </Button>
          )}
          {seconds !== null ? <span className={styles.timer}>{copy.left(seconds)}</span> : null}
        </div>
        <p role="status" aria-live="polite" className={styles.state}>
          {phase === 'connecting' ? copy.connecting : phase === 'live' && !simulated ? copy.live : phase === 'ended' ? copy.ended : ''}
        </p>
        {simulated ? <p className={styles.note}>{copy.simulated}</p> : null}
        {error ? <p role="alert">{error === 'mic' ? copy.mic : copy.errors[error]}</p> : null}

        <div className={styles.screen} data-cw-subtitles-screen="">
          {current ? (
            <>
              <p className={styles.original} lang={direction.slice(0, 2)}>
                <span className="cw-visually-hidden">{copy.original}: </span>
                {current.original || '…'}
              </p>
              <p className={styles.translation} lang={direction.slice(3)} aria-live="polite" data-cw-subtitles-translation="">
                <span className="cw-visually-hidden">{copy.translation}: </span>
                {current.translation || '…'}
              </p>
            </>
          ) : (
            <p className={styles.empty}>{copy.empty}</p>
          )}
        </div>

        {captions.length > 1 ? (
          <details className={styles.history}>
            <summary>{copy.history}</summary>
            <ol>
              {captions.map((caption) => (
                <li key={caption.id}>
                  <span lang={direction.slice(0, 2)}>{caption.original}</span>
                  <strong lang={direction.slice(3)}>{caption.translation}</strong>
                </li>
              ))}
            </ol>
          </details>
        ) : null}

        {captions.some((caption) => caption.translation) && !busy ? (
          <div className={styles.row}>
            <Button variant="ghost" size="sm" onClick={() => save(false)} data-cw-subtitles-srt="">
              {copy.srt}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => save(true)} data-cw-subtitles-bilingual="">
              {copy.bilingual}
            </Button>
          </div>
        ) : null}
      </div>
    </GeminiConsent>
  )
}
