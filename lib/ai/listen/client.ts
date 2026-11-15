import { langOf, pickVoice, readVoices, type SpeechEnv, type SynthLike, type UtteranceLike, type VoiceLike } from '@/lib/ailab/voice/tts'
import type { Locale } from '@/lib/i18n/config'
import { LISTEN_ENDPOINT, listenUrl, type ListenVoice } from './voices'

export const LISTEN_VOICE_STORAGE = 'cw-listen-voice'

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='

let availability: Promise<boolean> | null = null

export function listenAvailable(fetcher: typeof fetch = fetch): Promise<boolean> {
  availability ??= fetcher(LISTEN_ENDPOINT, { cache: 'default' })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: unknown) => Boolean(data && typeof data === 'object' && (data as { available?: unknown }).available === true))
    .catch(() => false)
  return availability
}

export function resetListenAvailability(): void {
  availability = null
}

export function geminiVoiceLike(voice: ListenVoice, lang: string): VoiceLike {
  return { name: voice, lang, voiceURI: `gemini:${voice}`, localService: false, default: true }
}

export type AudioLike = {
  src: string
  playbackRate: number
  preservesPitch?: boolean
  onended: (() => void) | null
  onerror: (() => void) | null
  play(): Promise<void>
  pause(): void
}

export type GeminiSpeechOptions = {
  source: string
  lang: Locale
  voice: ListenVoice
  fallback: SpeechEnv | null
  texts?: readonly string[]
  fetcher?: typeof fetch
  audio?: () => AudioLike
  objectUrl?: (blob: Blob) => string
  revoke?: (url: string) => void
  onFallback?: () => void
}

export type GeminiSpeechEnv = SpeechEnv & { unlock(): void; dispose(): void; readonly degraded: boolean }

function plainUtterance(text: string): UtteranceLike {
  return { text, lang: '', voice: null, rate: 1, pitch: 1, volume: 1, onstart: null, onend: null, onerror: null }
}

export function geminiSpeechEnv(options: GeminiSpeechOptions): GeminiSpeechEnv {
  const fetcher = options.fetcher ?? fetch
  const objectUrl = options.objectUrl ?? ((blob: Blob) => URL.createObjectURL(blob))
  const revoke = options.revoke ?? ((url: string) => URL.revokeObjectURL(url))
  const texts = options.texts ?? []
  const loads = new Map<string, Promise<string | null>>()
  const urls: string[] = []
  let element: AudioLike | null = null
  let generation = 0
  let degraded = false
  let disposed = false

  const audio = () => {
    element ??= options.audio ? options.audio() : (new Audio() as unknown as AudioLike)
    return element
  }

  const load = (text: string): Promise<string | null> => {
    const known = loads.get(text)
    if (known) return known
    const next = fetcher(listenUrl({ source: options.source, lang: options.lang, voice: options.voice, text }))
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!blob || blob.size <= 44 || disposed) return null
        const url = objectUrl(blob)
        urls.push(url)
        return url
      })
      .catch(() => null)
    loads.set(text, next)
    return next
  }

  const prefetchAfter = (text: string) => {
    const at = texts.indexOf(text)
    const following = at >= 0 ? texts[at + 1] : undefined
    if (following && !degraded) void load(following)
  }

  const speakFallback = (utterance: UtteranceLike) => {
    const env = options.fallback
    if (!env) {
      utterance.onerror?.({ error: 'synthesis-failed' })
      return
    }
    const spoken = env.createUtterance(utterance.text)
    const wanted = langOf(utterance.lang) || options.lang
    const voice = pickVoice(readVoices(env), wanted)
    spoken.lang = voice?.lang ?? utterance.lang
    if (voice) spoken.voice = voice
    spoken.rate = utterance.rate
    spoken.onstart = (event) => utterance.onstart?.(event)
    spoken.onend = (event) => utterance.onend?.(event)
    spoken.onerror = (event) => utterance.onerror?.(event)
    env.synth.speak(spoken)
  }

  const degrade = (utterance: UtteranceLike) => {
    if (!degraded) {
      degraded = true
      options.onFallback?.()
    }
    speakFallback(utterance)
  }

  const synth: SynthLike = {
    speak(utterance) {
      const token = ++generation
      if (degraded) {
        speakFallback(utterance)
        return
      }
      void load(utterance.text).then((url) => {
        if (token !== generation || disposed) return
        if (!url) {
          degrade(utterance)
          return
        }
        const player = audio()
        player.onended = () => {
          if (token === generation) utterance.onend?.({})
        }
        player.onerror = () => {
          if (token === generation) degrade(utterance)
        }
        player.src = url
        player.playbackRate = utterance.rate
        player.preservesPitch = true
        utterance.onstart?.({})
        player.play().catch(() => {
          if (token === generation) degrade(utterance)
        })
        prefetchAfter(utterance.text)
      })
    },
    cancel() {
      generation += 1
      if (element) {
        element.onended = null
        element.onerror = null
        element.pause()
      }
      try {
        options.fallback?.synth.cancel()
      } catch {}
    },
    getVoices() {
      return [geminiVoiceLike(options.voice, 'es-ES'), geminiVoiceLike(options.voice, 'en-US')]
    },
  }

  return {
    synth,
    createUtterance: plainUtterance,
    schedule: (run) => void setTimeout(run, 0),
    get degraded() {
      return degraded
    },
    unlock() {
      const player = audio()
      player.src = SILENT_WAV
      player.play().catch(() => undefined)
      for (const text of texts.slice(0, 2)) void load(text)
    },
    dispose() {
      disposed = true
      synth.cancel()
      for (const url of urls.splice(0)) revoke(url)
      loads.clear()
    },
  }
}
