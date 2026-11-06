'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { onVoicesChange, readVoices, speechEnv, type SpeechEnv, type SpeechSession, type SpeechSnapshot, type VoiceLike } from '@/lib/ailab/voice/tts'

export const VOICES_TIMEOUT_MS = 2000

export const IDLE_SPEECH: SpeechSnapshot = {
  state: 'stopped',
  index: -1,
  total: 0,
  heading: null,
  chunk: null,
  voice: null,
  ended: null,
  error: null,
}

export type SpeechVoices = { env: SpeechEnv | null; supported: boolean; voices: VoiceLike[]; loading: boolean }

export function useSpeechVoices(): SpeechVoices {
  const [env] = useState(() => speechEnv())
  const [voices, setVoices] = useState<VoiceLike[]>(() => readVoices(env))
  const [waiting, setWaiting] = useState(() => env !== null)

  useEffect(() => {
    if (!env) return
    const refresh = () => {
      const next = readVoices(env)
      setVoices(next)
      if (next.length > 0) setWaiting(false)
    }
    const off = onVoicesChange(env, refresh)
    refresh()
    const timer = window.setTimeout(() => setWaiting(false), VOICES_TIMEOUT_MS)
    return () => {
      off()
      window.clearTimeout(timer)
    }
  }, [env])

  return { env, supported: env !== null, voices, loading: waiting && voices.length === 0 }
}

export function useSpeechSession() {
  const session = useRef<SpeechSession | null>(null)
  const unsubscribe = useRef<(() => void) | null>(null)
  const [snapshot, setSnapshot] = useState<SpeechSnapshot>(IDLE_SPEECH)

  const start = useCallback((create: () => SpeechSession): SpeechSession => {
    unsubscribe.current?.()
    session.current?.stop()
    const next = create()
    session.current = next
    unsubscribe.current = next.subscribe(setSnapshot)
    setSnapshot(next.snapshot)
    return next
  }, [])

  const pause = useCallback(() => session.current?.pause(), [])
  const resume = useCallback(() => session.current?.resume(), [])
  const stop = useCallback(() => session.current?.stop(), [])

  useEffect(
    () => () => {
      unsubscribe.current?.()
      unsubscribe.current = null
      session.current?.stop()
      session.current = null
    },
    [],
  )

  return { snapshot, start, pause, resume, stop }
}
