import type { SpeechChunk, SpeechEnv, SynthLike, UtteranceLike, VoiceLike } from '@/lib/ailab/voice/tts'

export const VOICES: VoiceLike[] = [
  { name: 'Google español', lang: 'es-ES', voiceURI: 'google-es', localService: false, default: false },
  { name: 'Sabina', lang: 'es-MX', voiceURI: 'sabina', localService: true, default: false },
  { name: 'Paulina', lang: 'es-CO', voiceURI: 'paulina', localService: true, default: false },
  { name: 'Aria Online', lang: 'en-US', voiceURI: 'aria-online', localService: false, default: false },
  { name: 'Daniel', lang: 'en-GB', voiceURI: 'daniel', localService: true, default: false },
  { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', localService: true, default: true },
  { name: 'Thomas', lang: 'fr-FR', voiceURI: 'thomas', localService: true, default: false },
]

export type Spoken = { text: string; lang: string; voice: string | null; rate: number }

export function fakeSpeech(initial: VoiceLike[] = VOICES) {
  let voices = initial
  let current: UtteranceLike | null = null
  let cancels = 0
  const spoken: Spoken[] = []
  const listeners = new Set<() => void>()
  const synth: SynthLike = {
    speak(utterance) {
      spoken.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.name ?? null, rate: utterance.rate })
      current = utterance
      utterance.onstart?.({})
    },
    cancel() {
      cancels += 1
      const utterance = current
      current = null
      utterance?.onerror?.({ error: 'interrupted' })
    },
    getVoices: () => voices,
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  }
  const env: SpeechEnv = {
    synth,
    createUtterance: (text) => ({ text, lang: '', voice: null, rate: 1, pitch: 1, volume: 1, onstart: null, onend: null, onerror: null }),
    schedule: (run) => run(),
  }
  return {
    env,
    spoken,
    get cancels() {
      return cancels
    },
    get speaking() {
      return current !== null
    },
    end() {
      const utterance = current
      current = null
      utterance?.onend?.({})
    },
    fail(error: string) {
      const utterance = current
      current = null
      utterance?.onerror?.({ error })
    },
    setVoices(next: VoiceLike[]) {
      voices = next
      for (const listener of [...listeners]) listener()
    },
    get listeners() {
      return listeners.size
    },
  }
}

export function chunk(text: string, heading: string | null = null, lang: string | null = null): SpeechChunk {
  return { text, kind: 'text', heading, lang, node: null }
}
