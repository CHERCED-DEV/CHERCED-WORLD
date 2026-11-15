import { describe, expect, it } from 'vitest'
import { liveTokenRequest } from '@/lib/ai/agent/session'
import {
  addOriginal,
  addTranslation,
  captionsSrt,
  closeCaption,
  interpreterInstruction,
  isSubtitleDirection,
  sampleCaptions,
  subtitlesSetup,
  SUBTITLES_MINUTES,
  type Caption,
} from '@/lib/ai/subtitles/model'
import { RATE_LIMITS } from '@/lib/security/rate-limit'

describe('subtítulos en vivo (023, V6)', () => {
  it('FR-2301: dos direcciones y una instrucción que solo deja traducir', () => {
    expect(isSubtitleDirection('es-en')).toBe(true)
    expect(isSubtitleDirection('fr-es')).toBe(false)
    expect(interpreterInstruction('es-en')).toMatch(/de español a inglés/)
    expect(interpreterInstruction('en-es')).toMatch(/de inglés a español/)
    expect(interpreterInstruction('es-en')).toMatch(/Nunca respondes/)
  })

  it('el token de Live va sin herramientas, con transcripciones y 3 minutos', () => {
    const setup = subtitlesSetup('traduce', 'gemini-3.8-live')
    expect(setup.tools).toBeUndefined()
    expect(setup.inputAudioTranscription).toEqual({})
    expect(setup.outputAudioTranscription).toEqual({})
    const now = new Date('2026-11-15T12:00:00Z')
    const body = liveTokenRequest('traduce', now, SUBTITLES_MINUTES, setup)
    expect(body.bidiGenerateContentSetup).toBe(setup)
    expect(body.expireTime).toBe('2026-11-15T12:03:00.000Z')
    expect(liveTokenRequest('x', now).bidiGenerateContentSetup.tools).toBeDefined()
    expect(RATE_LIMITS.subtitles.limit).toBe(3)
  })

  it('FR-2302: arma cada subtítulo con el original arriba y la traducción abajo', () => {
    let list: Caption[] = []
    list = addOriginal(list, 'Hola, ', 0.2)
    list = addOriginal(list, 'soy Camilo.', 0.6)
    list = addTranslation(list, 'Hi, ', 1.1)
    list = addTranslation(list, 'I’m Camilo.', 1.4)
    list = closeCaption(list, 2)
    list = addOriginal(list, 'Gracias.', 3)
    list = closeCaption(list, 3.1)
    expect(list.map((caption) => [caption.original, caption.translation, caption.start, caption.end])).toEqual([
      ['Hola, soy Camilo.', 'Hi, I’m Camilo.', 0.2, 2],
      ['Gracias.', '', 3, 3.5],
    ])
  })

  it('FR-2304: exporta .srt traducido o bilingüe', () => {
    const sample = sampleCaptions('es-en')
    const translated = captionsSrt(sample, false)
    expect(translated).toMatch(/^1\n00:00:00,000 --> 00:00:03,500\nHi, I’m Camilo/)
    expect(translated).not.toContain('Hola')
    const bilingual = captionsSrt(sample, true)
    expect(bilingual).toContain('Hola, soy Camilo y construyo plataformas con agentes de IA.\nHi, I’m Camilo')
  })
})
