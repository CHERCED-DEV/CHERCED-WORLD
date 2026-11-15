import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ headers: new Headers() }))

vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
vi.mock('next/headers', () => ({ headers: async () => state.headers }))

import { GET } from '@/app/api/listen/route'
import { listenCorpus } from '@/lib/ai/listen/corpus'
import { geminiSpeechEnv, type AudioLike } from '@/lib/ai/listen/client'
import { pcmRate, speechBody, synthesizeSpeech, wavFromPcm } from '@/lib/ai/listen/speech'
import { inCorpus, isListenSource, isListenVoice, listenUrl, matchKey } from '@/lib/ai/listen/voices'
import { speak, type SpeechEnv, type UtteranceLike } from '@/lib/ailab/voice/tts'
import { NextRequest } from 'next/server'

const GOOD = 'Este post no es sobre la cifra.'

function audioReply(bytes = 200) {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: Buffer.alloc(bytes, 1).toString('base64') } }] } }] }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

function listenRequest(params: Record<string, string>, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/listen?${new URLSearchParams(params)}`, { headers })
}

describe('021 · voz de Gemini en los posts', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'clave-de-prueba'
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    process.env = { ...env }
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('FR-2104: solo acepta fuentes y voces conocidas, y frases que están en el texto público', () => {
    expect(isListenSource('post:post7')).toBe(true)
    expect(isListenSource('pitch:synergos')).toBe(true)
    expect(isListenSource('v3')).toBe(true)
    for (const bad of ['post:../secret', 'post:', 'otra:post7', 'post:Post7', null]) expect(isListenSource(bad), String(bad)).toBe(false)
    expect(isListenVoice('Charon')).toBe(true)
    expect(isListenVoice('Puck')).toBe(false)
    expect(matchKey('¡Hola, *mundo*!')).toBe('holamundo')
    expect(inCorpus('Un **gate** que [nunca](https://x.y) falló', 'Un gate que nunca falló')).toBe(true)
    expect(inCorpus('Lo que <Fact /> tests no vieron', 'Lo que 2.353 tests no vieron')).toBe(true)
    expect(inCorpus('Un gate que nunca falló', 'Compra criptomonedas ya')).toBe(false)
    expect(inCorpus('texto', '!')).toBe(false)
    expect(listenUrl({ source: 'v3', lang: 'es', voice: 'Kore', text: 'Hola mundo' })).toBe('/api/listen?s=v3&l=es&v=Kore&t=Hola+mundo')
  })

  it('arma el corpus de un post, del ejemplo de V3 y de un pitch, y rechaza lo que no existe', async () => {
    const post = await listenCorpus('post:post7', 'es')
    expect(post).toContain('Un gate que nunca falló no vigila nada')
    expect(inCorpus(post!, GOOD)).toBe(true)
    expect(inCorpus(post!, 'Lo que aprendí')).toBe(true)
    expect(await listenCorpus('post:post-que-no-existe', 'es')).toBeNull()
    expect(inCorpus((await listenCorpus('v3', 'en'))!, 'How this post is read to you')).toBe(true)
    expect(await listenCorpus('pitch:no-existe', 'es')).toBeNull()
  })

  it('convierte el PCM de Gemini en un WAV que el navegador reproduce', async () => {
    expect(pcmRate('audio/L16;codec=pcm;rate=16000')).toBe(16000)
    expect(pcmRate('audio/L16')).toBe(24000)
    const wav = wavFromPcm(new Uint8Array([1, 2, 3, 4]), 24000)
    expect(new TextDecoder().decode(wav.slice(0, 4))).toBe('RIFF')
    expect(new TextDecoder().decode(wav.slice(8, 12))).toBe('WAVE')
    expect(new DataView(wav.buffer).getUint32(24, true)).toBe(24000)
    expect(new DataView(wav.buffer).getUint32(40, true)).toBe(4)
    expect(speechBody('Hola', 'Kore').generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Kore')
    const fetcher = vi.fn(async () => audioReply(48000))
    const audio = await synthesizeSpeech({ key: 'k', text: 'Hola', voice: 'Kore' }, fetcher as unknown as typeof fetch)
    expect(audio.seconds).toBeCloseTo(1, 5)
    expect(audio.wav.length).toBe(48044)
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('gemini-3.8-flash-tts:generateContent')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('k')
  })

  it('FR-2101: la ruta responde el audio con caché larga y solo para frases del post', async () => {
    const status = await GET(listenRequest({}))
    expect(await status.json()).toEqual({ available: true })
    expect(status.headers.get('cache-control')).toContain('s-maxage=300')
    expect((await GET(listenRequest({ s: 'post:post7', l: 'es', v: 'Puck', t: GOOD }))).status).toBe(400)
    expect((await GET(listenRequest({ s: 'post:post7', l: 'es', v: 'Kore', t: 'Compra criptomonedas ya' }))).status).toBe(403)
    expect((await GET(listenRequest({ s: 'post:post7', l: 'es', v: 'Kore', t: GOOD }, { 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
    const fetcher = vi.fn(async () => audioReply())
    vi.stubGlobal('fetch', fetcher)
    const audio = await GET(listenRequest({ s: 'post:post7', l: 'es', v: 'Kore', t: GOOD }))
    expect(audio.status).toBe(200)
    expect(audio.headers.get('content-type')).toBe('audio/wav')
    expect(audio.headers.get('cache-control')).toContain('immutable')
    expect((await audio.arrayBuffer()).byteLength).toBe(244)
    const body = JSON.parse(String((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(body.contents[0].parts[0].text).toBe(GOOD)
  })

  it('FR-2103: sin clave dice que no está disponible y no genera nada', async () => {
    delete process.env.GEMINI_API_KEY
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    expect(await (await GET(listenRequest({}))).json()).toEqual({ available: false })
    expect((await GET(listenRequest({ s: 'post:post7', l: 'es', v: 'Kore', t: GOOD }))).status).toBe(404)
    expect(fetcher).not.toHaveBeenCalled()
  })
})

class FakeAudio implements AudioLike {
  static all: FakeAudio[] = []
  src = ''
  playbackRate = 1
  preservesPitch = true
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  played: string[] = []
  paused = 0
  constructor() {
    FakeAudio.all.push(this)
  }
  play() {
    this.played.push(this.src)
    return Promise.resolve()
  }
  pause() {
    this.paused += 1
  }
}

function browserEnv() {
  const spoken: string[] = []
  const env: SpeechEnv = {
    synth: {
      speak: (utterance: UtteranceLike) => {
        spoken.push(utterance.text)
        setTimeout(() => utterance.onend?.({}), 0)
      },
      cancel: () => {},
      getVoices: () => [{ name: 'Paulina', lang: 'es-MX', voiceURI: 'paulina', localService: true, default: true }],
    },
    createUtterance: (text) => ({ text, lang: '', voice: null, rate: 1, pitch: 1, volume: 1, onstart: null, onend: null, onerror: null }),
    schedule: (run) => run(),
  }
  return { env, spoken }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('021 · el lector con voz de Gemini', () => {
  beforeEach(() => {
    FakeAudio.all = []
  })

  it('reproduce cada frase con su audio, adelanta la siguiente y respeta la velocidad', async () => {
    const fetched: string[] = []
    const fetcher = vi.fn(async (url: string) => {
      fetched.push(new URL(url, 'http://x').searchParams.get('t')!)
      return new Response(new Blob([new Uint8Array(100)]), { status: 200 })
    })
    const texts = ['Uno.', 'Dos.', 'Tres.']
    const gemini = geminiSpeechEnv({
      source: 'v3',
      lang: 'es',
      voice: 'Kore',
      fallback: null,
      texts,
      fetcher: fetcher as unknown as typeof fetch,
      audio: () => new FakeAudio(),
      objectUrl: () => `blob:${fetched.length}`,
      revoke: () => {},
    })
    const session = speak(texts.map((text) => ({ text, kind: 'text' as const, heading: null, lang: null, node: null })), { lang: 'es', env: gemini, rate: 1.25 })
    await tick()
    await tick()
    const player = FakeAudio.all[0]!
    expect(player.playbackRate).toBe(1.25)
    expect(fetched.slice(0, 2)).toEqual(['Uno.', 'Dos.'])
    player.onended?.()
    await tick()
    await tick()
    player.onended?.()
    await tick()
    await tick()
    player.onended?.()
    const end = await session.done
    expect(end.ended).toBe('finished')
    expect(fetched).toEqual(['Uno.', 'Dos.', 'Tres.'])
    expect(gemini.degraded).toBe(false)
  })

  it('FR-2103: si Gemini no responde, sigue con la voz del navegador sin error', async () => {
    const { env, spoken } = browserEnv()
    const fallback = vi.fn()
    const gemini = geminiSpeechEnv({
      source: 'v3',
      lang: 'es',
      voice: 'Charon',
      fallback: env,
      texts: ['Uno.', 'Dos.'],
      fetcher: (async () => new Response('{}', { status: 404 })) as unknown as typeof fetch,
      audio: () => new FakeAudio(),
      onFallback: fallback,
    })
    const session = speak(
      ['Uno.', 'Dos.'].map((text) => ({ text, kind: 'text' as const, heading: null, lang: null, node: null })),
      { lang: 'es', env: gemini },
    )
    const end = await session.done
    expect(end.ended).toBe('finished')
    expect(end.error).toBeNull()
    expect(spoken).toEqual(['Uno.', 'Dos.'])
    expect(fallback).toHaveBeenCalledTimes(1)
    expect(gemini.degraded).toBe(true)
  })

  it('retoma desde una frase con from, para cambiar voz o velocidad en plena lectura (FR-2105)', async () => {
    const { env, spoken } = browserEnv()
    const chunks = ['Uno.', 'Dos.', 'Tres.'].map((text) => ({ text, kind: 'text' as const, heading: null, lang: null, node: null }))
    const session = speak(chunks, { lang: 'es', env, from: 1 })
    expect(session.snapshot.index).toBe(1)
    await session.done
    expect(spoken).toEqual(['Dos.', 'Tres.'])
    expect(speak(chunks, { lang: 'es', env, from: 99 }).snapshot.index).toBe(2)
  })
})
