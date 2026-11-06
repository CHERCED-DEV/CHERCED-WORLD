import { afterEach, describe, expect, it } from 'vitest'
import {
  LANG_TAGS,
  MAX_CHUNK_CHARS,
  activeSpeech,
  isOnlineVoice,
  langOf,
  onVoicesChange,
  pickVoice,
  speak,
  speechEnv,
  speechSupported,
  splitSentences,
  stopSpeech,
  textChunks,
  voicesFor,
  waitForVoices,
  type SpeechSnapshot,
} from '@/lib/ailab/voice/tts'
import { VOICES, chunk, fakeSpeech } from './speech-fake'

const PAULINA = VOICES.find((voice) => voice.voiceURI === 'paulina')!
const GOOGLE = VOICES.find((voice) => voice.voiceURI === 'google-es')!

afterEach(() => stopSpeech())

describe('soporte y voces del navegador (FR-359, FR-321)', () => {
  it('sin speechSynthesis no hay motor, y speak lo dice sin romperse', async () => {
    expect(speechEnv({})).toBeNull()
    expect(speechEnv(null)).toBeNull()
    expect(speechSupported({ speechSynthesis: {} })).toBe(false)
    const session = speak('Hola.', { lang: 'es', env: null })
    expect(session.snapshot).toMatchObject({ state: 'stopped', ended: 'error', error: 'unsupported' })
    await expect(session.done).resolves.toMatchObject({ ended: 'error' })
    session.pause()
    session.resume()
    session.stop()
    expect(session.snapshot.state).toBe('stopped')
  })

  it('con speechSynthesis y SpeechSynthesisUtterance hay motor', () => {
    const { env } = fakeSpeech()
    class Utterance {
      constructor(public text: string) {}
    }
    const found = speechEnv({ speechSynthesis: env.synth, SpeechSynthesisUtterance: Utterance })
    expect(found).not.toBeNull()
    expect(found!.createUtterance('hola').text).toBe('hola')
    expect(speechSupported({ speechSynthesis: env.synth, SpeechSynthesisUtterance: Utterance })).toBe(true)
  })

  it('agrupa las voces por idioma: primero las de tu equipo, luego la región y al final las en línea', () => {
    expect(voicesFor(VOICES, 'es').map((voice) => voice.voiceURI)).toEqual(['paulina', 'sabina', 'google-es'])
    expect(voicesFor(VOICES, 'en').map((voice) => voice.voiceURI)).toEqual(['samantha', 'daniel', 'aria-online'])
    expect(voicesFor(VOICES, 'de')).toEqual([])
    expect(langOf('es_CO')).toBe('es')
    expect(langOf('EN-us')).toBe('en')
    expect(langOf(undefined)).toBe('')
  })

  it('elige la voz pedida si es del idioma; si no, la primera local', () => {
    expect(pickVoice(VOICES, 'es')?.voiceURI).toBe('paulina')
    expect(pickVoice(VOICES, 'es', 'google-es')?.voiceURI).toBe('google-es')
    expect(pickVoice(VOICES, 'es', 'samantha')?.voiceURI).toBe('paulina')
    expect(pickVoice([], 'es')).toBeNull()
  })

  it('una voz en línea es la que tiene localService en false', () => {
    expect(isOnlineVoice(GOOGLE)).toBe(true)
    expect(isOnlineVoice(PAULINA)).toBe(false)
    expect(isOnlineVoice(null)).toBe(false)
  })

  it('espera a que el navegador cargue las voces, y se rinde a tiempo', async () => {
    const fake = fakeSpeech([])
    const waiting = waitForVoices(fake.env, 5_000)
    expect(fake.listeners).toBe(1)
    fake.setVoices(VOICES)
    await expect(waiting).resolves.toHaveLength(VOICES.length)
    expect(fake.listeners).toBe(0)
    await expect(waitForVoices(fakeSpeech([]).env, 10)).resolves.toEqual([])
    await expect(waitForVoices(null)).resolves.toEqual([])
    const off = onVoicesChange(fake.env, () => {})
    expect(fake.listeners).toBe(1)
    off()
    expect(fake.listeners).toBe(0)
  })
})

describe('el texto se lee por frases (FR-359)', () => {
  it('un texto corto es un solo fragmento, con los espacios normalizados', () => {
    expect(splitSentences('  Hola,\n  mundo.  ')).toEqual(['Hola, mundo.'])
    expect(splitSentences('   ')).toEqual([])
  })

  it('un texto largo se parte en frases sin pasar del máximo y sin perder palabras', () => {
    const sentence = (n: number) => `Esta es la frase número ${n}, que tiene suficientes palabras para ocupar espacio.`
    const text = Array.from({ length: 8 }, (_, index) => sentence(index + 1)).join(' ')
    const parts = splitSentences(text)
    expect(parts.length).toBeGreaterThan(2)
    for (const part of parts) expect(part.length).toBeLessThanOrEqual(MAX_CHUNK_CHARS)
    expect(parts.join(' ')).toBe(text)
  })

  it('una frase sin puntos se parte por comas y, si hace falta, por palabras', () => {
    const clauses = Array.from({ length: 6 }, (_, index) => `una cláusula larga número ${index} que sigue y sigue sin parar nunca`).join(', ')
    for (const part of splitSentences(clauses, 120)) expect(part.length).toBeLessThanOrEqual(120)
    const word = 'a'.repeat(300)
    expect(splitSentences(word, 120).map((part) => part.length)).toEqual([120, 120, 60])
  })

  it('cada párrafo de un texto escrito es al menos un fragmento', () => {
    expect(textChunks('Uno.\n\nDos.', 'es').map((item) => [item.text, item.lang])).toEqual([
      ['Uno.', 'es'],
      ['Dos.', 'es'],
    ])
  })
})

describe('reproducir, pausar y detener (FR-359)', () => {
  it('lee los fragmentos en orden, con la voz y el encabezado de cada uno, y avisa al terminar', async () => {
    const fake = fakeSpeech()
    const seen: SpeechSnapshot[] = []
    const session = speak([chunk('Primera.', 'A'), chunk('Segunda.', 'B')], { lang: 'es', voice: PAULINA, env: fake.env })
    session.subscribe((snapshot) => seen.push(snapshot))
    expect(session.snapshot).toMatchObject({ state: 'playing', index: 0, total: 2, heading: 'A', voice: 'Paulina', ended: null })
    expect(fake.spoken).toEqual([{ text: 'Primera.', lang: 'es-CO', voice: 'Paulina', rate: 1 }])
    fake.end()
    expect(session.snapshot).toMatchObject({ state: 'playing', index: 1, heading: 'B' })
    expect(fake.spoken.map((item) => item.text)).toEqual(['Primera.', 'Segunda.'])
    fake.end()
    expect(session.snapshot).toMatchObject({ state: 'stopped', ended: 'finished', error: null })
    await expect(session.done).resolves.toMatchObject({ ended: 'finished' })
    expect(seen.map((snapshot) => snapshot.state).at(-1)).toBe('stopped')
    expect(activeSpeech()).toBeNull()
  })

  it('pausar corta la frase y seguir la retoma desde su comienzo', () => {
    const fake = fakeSpeech()
    const session = speak([chunk('Primera.'), chunk('Segunda.')], { lang: 'es', voice: PAULINA, env: fake.env })
    const before = fake.cancels
    session.pause()
    expect(session.snapshot.state).toBe('paused')
    expect(fake.cancels).toBe(before + 1)
    expect(fake.spoken).toHaveLength(1)
    session.pause()
    expect(fake.cancels).toBe(before + 1)
    session.resume()
    expect(session.snapshot.state).toBe('playing')
    expect(fake.spoken.map((item) => item.text)).toEqual(['Primera.', 'Primera.'])
    session.toggle()
    expect(session.snapshot.state).toBe('paused')
    session.toggle()
    expect(session.snapshot.state).toBe('playing')
    fake.end()
    expect(session.snapshot.index).toBe(1)
  })

  it('detener termina la sesión, y lo que llegue después del navegador no cuenta', async () => {
    const fake = fakeSpeech()
    const session = speak([chunk('Primera.'), chunk('Segunda.')], { lang: 'es', env: fake.env })
    session.stop()
    expect(session.snapshot).toMatchObject({ state: 'stopped', ended: 'cancelled' })
    fake.end()
    expect(fake.spoken).toHaveLength(1)
    session.resume()
    expect(session.snapshot.state).toBe('stopped')
    await expect(session.done).resolves.toMatchObject({ ended: 'cancelled' })
  })

  it('un error del navegador termina con su código; una interrupción ajena cuenta como detenido', () => {
    const fake = fakeSpeech()
    const failed = speak('Hola.', { lang: 'es', env: fake.env })
    fake.fail('synthesis-failed')
    expect(failed.snapshot).toMatchObject({ state: 'stopped', ended: 'error', error: 'synthesis-failed' })
    const interrupted = speak('Hola.', { lang: 'es', env: fake.env })
    fake.fail('interrupted')
    expect(interrupted.snapshot).toMatchObject({ state: 'stopped', ended: 'cancelled', error: null })
  })

  it('una sola voz a la vez: una sesión nueva detiene la anterior', () => {
    const fake = fakeSpeech()
    const first = speak('Uno.', { lang: 'es', env: fake.env })
    const second = speak('Dos.', { lang: 'es', env: fake.env })
    expect(first.snapshot).toMatchObject({ state: 'stopped', ended: 'cancelled' })
    expect(second.snapshot.state).toBe('playing')
    expect(activeSpeech()).toBe(second)
    first.resume()
    expect(activeSpeech()).toBe(second)
    stopSpeech()
    expect(second.snapshot.ended).toBe('cancelled')
  })

  it('se cancela con un AbortSignal, también si ya venía cancelado', () => {
    const fake = fakeSpeech()
    const controller = new AbortController()
    const session = speak('Uno.', { lang: 'es', env: fake.env, signal: controller.signal })
    controller.abort()
    expect(session.snapshot).toMatchObject({ state: 'stopped', ended: 'cancelled' })
    const spoken = fake.spoken.length
    const late = speak('Dos.', { lang: 'es', env: fake.env, signal: controller.signal })
    expect(late.snapshot.ended).toBe('cancelled')
    expect(fake.spoken).toHaveLength(spoken)
  })

  it('la velocidad queda entre 0,5 y 2; sin voces se usa la etiqueta del idioma', () => {
    const fake = fakeSpeech([])
    speak('Rápido.', { lang: 'es', env: fake.env, rate: 5 })
    speak('Lento.', { lang: 'en', env: fake.env, rate: 0.1 })
    expect(fake.spoken).toEqual([
      { text: 'Rápido.', lang: LANG_TAGS.es, voice: null, rate: 2 },
      { text: 'Lento.', lang: LANG_TAGS.en, voice: null, rate: 0.5 },
    ])
  })

  it('un fragmento en otro idioma se lee con una voz de ese idioma', () => {
    const fake = fakeSpeech()
    const session = speak([chunk('Hola.', null, 'es'), chunk('Undo what was done.', null, 'en')], { lang: 'es', voice: PAULINA, env: fake.env })
    fake.end()
    expect(fake.spoken.map((item) => item.voice)).toEqual(['Paulina', 'Samantha'])
    expect(session.snapshot.voice).toBe('Samantha')
  })

  it('nada que leer termina enseguida, sin hablar', async () => {
    const fake = fakeSpeech()
    const session = speak('   ', { lang: 'es', env: fake.env })
    expect(session.snapshot).toMatchObject({ state: 'stopped', ended: 'finished', total: 0 })
    expect(fake.spoken).toEqual([])
    await expect(session.done).resolves.toMatchObject({ ended: 'finished' })
  })
})
