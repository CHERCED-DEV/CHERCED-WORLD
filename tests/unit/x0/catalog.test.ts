import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import { LAB_REPO_URL, defaultDownload, labCatalog, labExperiment, labRepoHref, labThemes } from '@/content/ailab/catalog'
import { LAB_EXPERIMENT_IDS, LAB_HOSTS, LAB_STATUSES, LAB_THEMES, isLabExperimentId, type Localized } from '@/content/types'

const ROOT = process.cwd()
const MB = 1_000_000

const SPEC_COPY: Record<string, Localized> = {
  'ailab.title': { es: 'AI LAB', en: 'AI LAB' },
  'ailab.intro': {
    es: 'Aquí no te cuento lo que sé hacer con IA: te dejo probarlo. Cada experimento te dice dónde corre, cómo está hecho y qué decidí. La mayoría funciona por completo en tu navegador.',
    en: "Here I don't tell you what I can do with AI: I let you try it. Each experiment tells you where it runs, how it's built and what I decided. Most of them run entirely in your browser.",
  },
  'ailab.plugins': {
    es: 'También creo plugins de IA para profesiones concretas. Para una abogada, skills que organizan el material del caso, contrastan hipótesis y generan documentos. Para un ingeniero estructural, un asistente que lee sus bitácoras, ayuda con los cálculos y arma el estimado. Las vitrinas de abajo usan solo datos inventados.',
    en: 'I also build AI plugins for specific professions. For a lawyer, skills that organize case material, test hypotheses and draft documents. For a structural engineer, an assistant that reads his logs, helps with calculations and builds the estimate. The showcases below use made-up data only.',
  },
  'ailab.privacy': {
    es: 'No guardo tu audio ni tu texto. Casi todo se procesa en tu navegador; el único experimento que envía tu voz a Google te lo pregunta antes.',
    en: "I don't store your audio or your text. Almost everything runs in your browser; the one experiment that sends your voice to Google asks you first.",
  },
  'ailab.runsIn.browser': { es: 'Corre en tu navegador', en: 'Runs in your browser' },
  'ailab.runsIn.google': { es: 'Corre en Google (Gemini)', en: 'Runs on Google (Gemini)' },
  'ailab.consent.title': { es: 'Antes de descargar', en: 'Before downloading' },
  'ailab.consent.body': {
    es: 'Este experimento descarga {resource} ({size}) desde {host}. Queda guardado en tu navegador para la próxima vez.',
    en: 'This experiment downloads {resource} ({size}) from {host}. It stays in your browser for next time.',
  },
  'ailab.consent.accept': { es: 'Descargar y probar', en: 'Download and try' },
  'ailab.consent.cancel': { es: 'Ahora no', en: 'Not now' },
  'ailab.clear': { es: 'Borrar lo que el laboratorio guardó', en: 'Clear what the lab saved' },
  'ailab.noscript': {
    es: 'Esta demo necesita JavaScript. Aquí tienes cómo funciona y su código.',
    en: "This demo needs JavaScript. Here's how it works and its code.",
  },
  'ailab.v1.title': { es: 'Transcriptor', en: 'Transcriber' },
  'ailab.v1.summary': {
    es: 'Graba o sube un audio y obtén el texto con marcas de tiempo. Usa el mismo tipo de motor del dictador de voz que me hice para escribir en español con términos técnicos en inglés.',
    en: 'Record or upload audio and get the text with timestamps. It uses the same kind of engine as the voice dictation tool I built to write in Spanish with English tech terms.',
  },
  'ailab.v4.title': { es: 'Navega hablando', en: 'Navigate by voice' },
  'ailab.v4.summary': {
    es: 'Dile al sitio a dónde quieres ir: "llévame al blog", "cambia a tema claro".',
    en: 'Tell the site where to go: "take me to the blog", "switch to light theme".',
  },
  'ailab.r1.title': { es: 'Simulador de sagas', en: 'Saga simulator' },
  'ailab.r1.summary': {
    es: 'Reserva un viaje y tumba un servicio en mitad del cobro. Mira cómo el sistema deshace lo que ya estaba hecho, y por qué deshacer una reserva no es lo mismo que soltar un apartado.',
    en: "Book a trip and take down a service in the middle of the payment. Watch the system undo what was already done, and why undoing a booking isn't the same as releasing a hold.",
  },
  'ailab.a2.title': { es: 'Anatomía de un plugin', en: 'Anatomy of a plugin' },
  'ailab.a2.summary': {
    es: 'Así se arma un plugin de Claude Code: skills, comandos, hooks y servidores MCP. Toca cada archivo para ver para qué sirve, y crea el tuyo al final.',
    en: "This is how a Claude Code plugin is built: skills, commands, hooks and MCP servers. Tap each file to see what it's for, and build your own at the end.",
  },
  'ailab.j1.title': { es: 'Peloteo contra la IA', en: 'Rally against the AI' },
  'ailab.j1.summary': {
    es: 'Juega contra un rival que empieza torpe y aprende en vivo, partida a partida. Mira su cerebro encenderse con cada decisión.',
    en: 'Play against a rival that starts clumsy and learns live, game after game. Watch its brain light up with every decision.',
  },
  'ailab.j2.title': { es: 'Juega contra tu clon', en: 'Play against your clone' },
  'ailab.j2.summary': {
    es: 'Después de unos rallies, el rival aprende tu estilo. Juega contra una IA que se mueve como tú.',
    en: 'After a few rallies, the rival learns your style. Play against an AI that moves like you.',
  },
}

function texts(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(texts)
  if (value && typeof value === 'object') return Object.values(value).flatMap(texts)
  return []
}

function lines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

describe('copy base de la spec, palabra por palabra (FR-370)', () => {
  for (const [key, value] of Object.entries(SPEC_COPY)) {
    it(key, () => {
      expect(es[key as keyof typeof es]).toBe(value.es)
      expect(en[key as keyof typeof en]).toBe(value.en)
    })
  }
})

describe('catálogo del laboratorio (FR-302, T704)', () => {
  it('trae los 12 experimentos del alcance, una vez cada uno y en el orden de las lanes, con V5 (018) primero', () => {
    expect(labCatalog.map((item) => item.id)).toEqual([...LAB_EXPERIMENT_IDS])
    expect(LAB_EXPERIMENT_IDS).toEqual(['V5', 'V1', 'V2', 'V3', 'V4', 'A2', 'A3', 'A5', 'R1', 'A4', 'J1', 'J2'])
    expect(isLabExperimentId('V1')).toBe(true)
    expect(isLabExperimentId('A1')).toBe(false)
    expect(labExperiment('R1').title.es).toBe('Simulador de sagas')
    expect(() => labExperiment('X9' as never)).toThrow()
  })

  it('agrupa por tema en el orden de la spec: Voz, Arquitectura, Agentes y Juegos', () => {
    expect(LAB_THEMES).toEqual(['voice', 'architecture', 'agents', 'games'])
    expect(labThemes().map((group) => [group.theme, group.experiments.map((item) => item.id)])).toEqual([
      ['voice', ['V5', 'V1', 'V2', 'V3', 'V4']],
      ['architecture', ['R1']],
      ['agents', ['A2', 'A3', 'A5', 'A4']],
      ['games', ['J1', 'J2']],
    ])
  })

  it('cada experimento trae estado, dónde corre, privacidad, recorrido y decisiones en ES y EN', () => {
    for (const item of labCatalog) {
      expect(LAB_STATUSES, item.id).toContain(item.status)
      expect(item.runsIn, item.id).toBe(item.id === 'V5' ? 'google' : 'browser')
      for (const value of [item.title, item.summary, item.privacy, ...item.flow]) {
        expect(value.es.trim(), item.id).not.toBe('')
        expect(value.en.trim(), item.id).not.toBe('')
      }
      expect(item.flow.length, item.id).toBe(3)
      expect(item.adrCards.length, item.id).toBeGreaterThanOrEqual(1)
      for (const card of item.adrCards) for (const text of texts(card)) expect(text.trim(), item.id).not.toBe('')
      expect(item.title.es).toBe(es[`ailab.${item.id.toLowerCase()}.title` as keyof typeof es])
      expect(item.privacy.en).toBe(en[`ailab.${item.id.toLowerCase()}.privacy` as keyof typeof en])
    }
  })

  it('las descargas traen el peso de research §2 a §4 y un servidor permitido', () => {
    const bytes = Object.fromEntries(labCatalog.flatMap((item) => item.downloads.map((download) => [download.resource, download.bytes])))
    expect(bytes).toEqual({
      'Whisper base (int8)': 77 * MB,
      'Whisper tiny (int8)': 41 * MB,
      'Whisper small (int8)': 249 * MB,
      'multilingual-e5-small (int8)': 118 * MB,
      'Pyodide 0.29.0': 12 * MB,
      'numpy (Pyodide 0.29.0)': 3_100_000,
    })
    for (const item of labCatalog) {
      for (const download of item.downloads) {
        expect(Number.isInteger(download.bytes), download.resource).toBe(true)
        expect(LAB_HOSTS, download.resource).toContain(download.host)
      }
      expect(item.downloads.filter((download) => download.default).length, item.id).toBeLessThanOrEqual(1)
    }
    expect(labCatalog.filter((item) => defaultDownload(item)).map((item) => [item.id, defaultDownload(item)?.resource])).toEqual([
      ['V1', 'Whisper base (int8)'],
    ])
    expect(labExperiment('A4').downloads.every((download) => download.host === 'cdn.jsdelivr.net')).toBe(true)
  })

  it('el fragmento de código es real: está, tal cual, en el archivo que enlaza', () => {
    const withCode = labCatalog.filter((item) => item.code)
    expect(withCode.map((item) => item.id)).toEqual(expect.arrayContaining(['V1', 'V4', 'A5', 'J1', 'J2']))
    for (const item of withCode) {
      const code = item.code!
      expect(code.repoPath, item.id).not.toBeNull()
      const file = lines(readFileSync(join(ROOT, code.repoPath!), 'utf8'))
      const snippet = lines(code.snippet)
      const start = file.indexOf(snippet[0]!)
      expect(start, `${item.id}: ${snippet[0]}`).toBeGreaterThanOrEqual(0)
      expect(file.slice(start, start + snippet.length), item.id).toEqual(snippet)
    }
  })

  it('el enlace al repo apunta al archivo en main del repo público', () => {
    expect(labRepoHref('lib/ailab/core/consent.ts')).toBe('https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/lib/ailab/core/consent.ts')
    expect(LAB_REPO_URL).toBe('https://github.com/CHERCED-DEV/CHERCED-WORLD')
  })

  it('sin material confidencial: ni empleador, ni herramientas corporativas, ni rutas privadas (FR-372)', () => {
    const corpus = [JSON.stringify(es), JSON.stringify(en), readFileSync(join(ROOT, 'content', 'ailab', 'catalog.ts'), 'utf8')].join('\n')
    for (const pattern of [/sistecr/i, /factor[ií]a/i, /azure devops/i, /datadog/i, /fluid attacks/i, /[A-Z]:\\Users/i, /\/Users\/[A-Za-z]/, /handoff-/i]) {
      expect(corpus, String(pattern)).not.toMatch(pattern)
    }
  })
})
