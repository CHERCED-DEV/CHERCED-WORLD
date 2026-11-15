'use client'

import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { useSpeechSession, useSpeechVoices } from '@/components/ailab/voice/use-speech'
import { useHydrated } from '@/components/contact/useHydrated'
import { registerPaletteCommand } from '@/components/experience/palette-model'
import { Button } from '@/components/ui/Button'
import { ChoiceChips } from '@/components/ui/ChoiceChips'
import { geminiSpeechEnv, geminiVoiceLike, type GeminiSpeechEnv } from '@/lib/ai/listen/client'
import { LISTEN_VOICE_LABELS, LISTEN_VOICES } from '@/lib/ai/listen/voices'
import { extractPost, LANG_TAGS, pickVoice, speak, type ReadableNode } from '@/lib/ailab/voice/tts'
import type { Locale } from '@/lib/i18n'
import styles from './ListenPlayer.module.scss'
import { useGeminiListen, useListenVoice } from './use-gemini-listen'

export type ListenLabels = { play: string; pause: string; resume: string; stop: string; status: string }

export const LISTEN_COMMAND_ID = 'listen'

const READING = 'data-cw-listen-reading'

const VOICE_LEGEND: Record<Locale, string> = { es: 'Voz de Gemini', en: 'Gemini voice' }

export function ListenPlayer({
  lang,
  title,
  target,
  labels,
  source,
}: {
  lang: Locale
  title: string
  target: string
  labels: ListenLabels
  source?: string
}) {
  const mounted = useHydrated()
  const { env, supported, voices } = useSpeechVoices()
  const { snapshot, start, pause, resume, stop } = useSpeechSession()
  const gemini = useGeminiListen(Boolean(source)) === true
  const [geminiVoice, setGeminiVoice] = useListenVoice()
  const geminiEnv = useRef<GeminiSpeechEnv | null>(null)
  const marked = useRef<Element | null>(null)
  const voice = useMemo(() => pickVoice(voices, lang, null), [voices, lang])
  const active = snapshot.state === 'playing' || snapshot.state === 'paused'
  const ready = mounted && (gemini || (supported && voice !== null))
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && active) {
      event.preventDefault()
      stop()
    }
  }

  const play = useCallback(() => {
    const body = document.getElementById(target)
    if (!body) return
    const reading = extractPost<ReadableNode>(body, { lang, title })
    if (reading.chunks.length === 0) return
    geminiEnv.current?.dispose()
    geminiEnv.current = null
    if (gemini && source) {
      const next = geminiSpeechEnv({ source, lang, voice: geminiVoice, fallback: supported ? env : null, texts: reading.chunks.map((chunk) => chunk.text) })
      geminiEnv.current = next
      next.unlock()
      start(() => speak(reading.chunks, { lang, voice: geminiVoiceLike(geminiVoice, LANG_TAGS[lang]), rate: 1, env: next }))
      return
    }
    if (!voice) return
    start(() => speak(reading.chunks, { lang, voice, rate: 1, env }))
  }, [env, gemini, geminiVoice, lang, source, start, supported, target, title, voice])

  useEffect(() => {
    if (!ready) return
    return registerPaletteCommand({ id: LISTEN_COMMAND_ID, labelKey: 'palette.action.listen', keywords: 'escuchar leer voz listen read audio', run: play })
  }, [play, ready])

  useEffect(() => {
    const node = active ? snapshot.chunk?.node : null
    if (marked.current && marked.current !== node) marked.current.removeAttribute(READING)
    marked.current = null
    if (node instanceof Element && document.getElementById(target)?.contains(node)) {
      node.setAttribute(READING, '')
      marked.current = node
    }
  }, [active, snapshot.chunk, target])

  useEffect(
    () => () => {
      marked.current?.removeAttribute(READING)
      geminiEnv.current?.dispose()
    },
    [],
  )

  if (!ready) return null

  const paused = snapshot.state === 'paused'
  const status = active && snapshot.heading ? labels.status.replace('{heading}', snapshot.heading) : ''

  return (
    <div className={styles.player} role="group" aria-label={labels.play} onKeyDown={onKeyDown} data-cw-listen={snapshot.state} data-cw-listen-engine={gemini ? 'gemini' : 'browser'}>
      {active ? (
        <>
          <Button variant="solid" size="sm" onClick={paused ? resume : pause} data-cw-listen-toggle={paused ? 'resume' : 'pause'}>
            <span className={styles.wave} aria-hidden="true" data-playing={paused ? undefined : ''}>
              <span />
              <span />
              <span />
            </span>
            {paused ? labels.resume : labels.pause}
          </Button>
          <Button variant="ghost" size="sm" onClick={stop} aria-keyshortcuts="Escape" data-cw-listen-stop="">
            {labels.stop}
          </Button>
        </>
      ) : (
        <>
          <Button variant="glass" size="sm" onClick={play} data-cw-listen-play="">
            <span className={styles.wave} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            {labels.play}
          </Button>
          {gemini ? (
            <ChoiceChips
              kind="listen-voice"
              legend={VOICE_LEGEND[lang]}
              hideLegend
              options={LISTEN_VOICES.map((id) => ({ value: id, label: LISTEN_VOICE_LABELS[lang][id] }))}
              value={geminiVoice}
              onChange={setGeminiVoice}
            />
          ) : null}
        </>
      )}
      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true" data-cw-listen-status="">
        {status}
      </p>
    </div>
  )
}
