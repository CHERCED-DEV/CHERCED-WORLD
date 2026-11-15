'use client'

import { useCallback, useEffect, useState } from 'react'
import { LISTEN_VOICE_STORAGE, listenAvailable } from '@/lib/ai/listen/client'
import { DEFAULT_LISTEN_VOICE, isListenVoice, type ListenVoice } from '@/lib/ai/listen/voices'

export function useGeminiListen(enabled: boolean): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    void listenAvailable().then((value) => {
      if (alive) setAvailable(value)
    })
    return () => {
      alive = false
    }
  }, [enabled])
  return enabled ? available : false
}

function storedVoice(): ListenVoice {
  try {
    const value = window.localStorage.getItem(LISTEN_VOICE_STORAGE)
    return isListenVoice(value) ? value : DEFAULT_LISTEN_VOICE
  } catch {
    return DEFAULT_LISTEN_VOICE
  }
}

export function useListenVoice(): [ListenVoice, (voice: ListenVoice) => void] {
  const [voice, setVoice] = useState<ListenVoice>(() => (typeof window === 'undefined' ? DEFAULT_LISTEN_VOICE : storedVoice()))
  const choose = useCallback((next: ListenVoice) => {
    setVoice(next)
    try {
      window.localStorage.setItem(LISTEN_VOICE_STORAGE, next)
    } catch {}
  }, [])
  return [voice, choose]
}
