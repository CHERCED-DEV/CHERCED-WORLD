import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import { WHISPER_BASE, WHISPER_SMALL, WHISPER_TINY, labExperiment } from '@/content/ailab/catalog'
import { WHISPER_DOWNLOADS, defaultModelOf, modelOf, offeredModels } from '@/lib/ailab/voice/models'
import { WHISPER_MODEL_IDS, WHISPER_REPOS } from '@/lib/ailab/voice/protocol'

const ROOT = process.cwd()
const MB = 1_000_000

const Q8_BYTES = {
  tiny: 10_124_990 + 30_719_241,
  base: 23_201_314 + 53_693_315,
  small: 92_326_160 + 156_750_845,
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('modelos de Whisper y su consentimiento (T720, R-701, FR-310)', () => {
  it('cada modelo pide el consentimiento con la constante del catálogo, la misma que muestra la tarjeta', () => {
    expect(WHISPER_DOWNLOADS).toEqual({ tiny: WHISPER_TINY, base: WHISPER_BASE, small: WHISPER_SMALL })
    for (const id of WHISPER_MODEL_IDS) expect(WHISPER_DOWNLOADS[id].host).toBe('huggingface.co')
  })

  it('el peso declarado es el del encoder y el decoder int8 de onnx-community, redondeado a MB', () => {
    for (const id of WHISPER_MODEL_IDS) expect(Math.round(Q8_BYTES[id] / MB) * MB, id).toBe(WHISPER_DOWNLOADS[id].bytes)
  })

  it('los repos son los multilingües (español e inglés), nunca los .en', () => {
    for (const repo of Object.values(WHISPER_REPOS)) {
      expect(repo).toMatch(/^onnx-community\/whisper-(tiny|base|small)$/)
      expect(repo).not.toMatch(/\.en$/)
    }
  })

  it('V1 ofrece los tres con base por defecto; V4 usa tiny', () => {
    const v1 = labExperiment('V1').downloads
    expect(offeredModels(v1)).toEqual(['tiny', 'base', 'small'])
    expect(defaultModelOf(v1)).toBe('base')
    expect(defaultModelOf(labExperiment('V4').downloads, 'base')).toBe('tiny')
    expect(defaultModelOf([])).toBe('base')
    expect(modelOf({ resource: 'otro' })).toBeNull()
  })
})

describe('reglas de la lane de voz', () => {
  it('@huggingface/transformers solo entra por el worker de voz, y el motor no lo importa', () => {
    const voice = files(join(ROOT, 'lib', 'ailab', 'voice')).concat(files(join(ROOT, 'components', 'ailab', 'voice')))
    const importers = voice.filter((file) => readFileSync(file, 'utf8').includes('@huggingface/transformers')).map((file) => relative(ROOT, file).replace(/\\/g, '/'))
    expect(importers).toEqual(['lib/ailab/voice/whisper.worker.ts'])
  })

  it('el worker sirve el motor de ONNX Runtime desde el sitio y no desde un CDN', () => {
    const worker = readFileSync(join(ROOT, 'lib', 'ailab', 'voice', 'whisper.worker.ts'), 'utf8')
    expect(worker).toMatch(/wasmPaths = undefined/)
    expect(worker).not.toMatch(/jsdelivr|unpkg/)
  })

  it('el copy de V1 y V4 lleva los mismos marcadores en español e inglés', () => {
    const keys = Object.keys(es).filter((key) => /^ailab\.v[14]\./.test(key))
    expect(keys.length).toBeGreaterThan(80)
    for (const key of keys) {
      const marks = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
      expect(marks(en[key as keyof typeof en]), key).toEqual(marks(es[key as keyof typeof es]))
    }
  })

  it('el copy no nombra el dictador de voz del autor (P-3e) ni usa la Web Speech API para reconocer', () => {
    const corpus = Object.entries({ ...es })
      .filter(([key]) => /^ailab\.v[14]\./.test(key))
      .map(([, value]) => value)
      .join('\n')
    expect(corpus).not.toMatch(/SpeechRecognition|webkitSpeech/)
    const sources = files(join(ROOT, 'components', 'ailab', 'voice')).concat(files(join(ROOT, 'lib', 'ailab', 'voice')))
    for (const file of sources) expect(readFileSync(file, 'utf8'), file).not.toMatch(/SpeechRecognition/)
  })
})
