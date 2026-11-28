import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import { LAB_REPO_URL, defaultDownload, labCatalog, labDownloadPlan, labExperiment, labRepoHref, labThemes } from '@/content/ailab/catalog'
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
    es: "Dos clases de experimentos. Los de tu navegador procesan todo en tu equipo: tu audio, tu texto y tus archivos no salen de ahí. Los de «Con Gemini» envían a Google solo lo que tú escribes o dices en ese experimento, te lo preguntan antes y yo no lo guardo sin tu permiso.",
    en: "Two kinds of experiments. The ones in your browser process everything on your device: your audio, your text and your files never leave it. The ones in «With Gemini» send Google only what you type or say in that experiment, ask you first, and I don't store it without your permission.",
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
  it('trae los 21 experimentos, una vez cada uno, con los de Gemini primero (020), Cotejo en Arquitectura (047), y la arena (043) y del pedido a la spec (046) en Agentes', () => {
    expect([...labCatalog.map((item) => item.id)].sort()).toEqual([...LAB_EXPERIMENT_IDS].sort())
    expect(labCatalog.map((item) => item.id)).toEqual(['V5', 'V6', 'A6', 'A9', 'A7', 'A8', 'P1', 'V1', 'V2', 'V3', 'V4', 'A2', 'A3', 'A5', 'R1', 'A4', 'A10', 'J1', 'J2', 'A11', 'A12'])
    expect(isLabExperimentId('V1')).toBe(true)
    expect(isLabExperimentId('A1')).toBe(false)
    expect(labExperiment('R1').title.es).toBe('Simulador de sagas')
    expect(() => labExperiment('X9' as never)).toThrow()
  })

  it('agrupa por tema: Con Gemini primero (020, P-2002), luego Voz, Arquitectura, Agentes y Juegos', () => {
    expect(LAB_THEMES).toEqual(['gemini', 'voice', 'architecture', 'agents', 'games'])
    expect(labThemes().map((group) => [group.theme, group.experiments.map((item) => item.id)])).toEqual([
      ['gemini', ['V5', 'V6', 'A6', 'A9', 'A7', 'A8', 'P1']],
      ['voice', ['V1', 'V2', 'V3', 'V4']],
      ['architecture', ['R1', 'A11']],
      ['agents', ['A2', 'A3', 'A5', 'A4', 'A10', 'A12']],
      ['games', ['J1', 'J2']],
    ])
    for (const item of labThemes()[0]!.experiments) expect(item.runsIn).toBe('google')
  })

  it('cada experimento trae estado, dónde corre, privacidad, recorrido y decisiones en ES y EN', () => {
    for (const item of labCatalog) {
      expect(LAB_STATUSES, item.id).toContain(item.status)
      expect(item.runsIn, item.id).toBe(item.theme === 'gemini' ? 'google' : item.id === 'A10' || item.id === 'A12' ? 'providers' : 'browser')
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
      'mDeBERTa-v3-base-xnli (int8)': 339 * MB,
      'nli-deberta-v3-xsmall (int8)': 87 * MB,
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
    expect(labExperiment('A11').downloads.map((download) => download.resource)).toEqual(['multilingual-e5-small (int8)', 'mDeBERTa-v3-base-xnli (int8)', 'nli-deberta-v3-xsmall (int8)'])
    expect(labExperiment('A11').downloads[0]).toBe(labExperiment('A5').downloads[0])
  })

  it('las descargas que se excluyen entre sí suman solo la mayor de su grupo (los NLI de la A11, uno por idioma)', () => {
    const [e5, nliEs, nliEn] = labExperiment('A11').downloads
    expect(nliEs!.choice).toBe('nli')
    expect(nliEn!.choice).toBe('nli')
    const engine = nliEs!.engine!.bytes
    expect(labDownloadPlan(labExperiment('A11'))).toEqual({ kind: 'onDemand', bytes: e5!.bytes + nliEs!.bytes + engine })
    expect(labDownloadPlan({ downloads: [nliEn!] })).toEqual({ kind: 'onDemand', bytes: nliEn!.bytes + engine })
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

describe('la ficha rápida de cada tarjeta', () => {
  it('todos los experimentos dicen qué usan, cuánto duran y con qué corren', () => {
    for (const experiment of labCatalog) {
      expect(experiment.inputs.length, experiment.id).toBeGreaterThan(0)
      expect(experiment.session.minutes, experiment.id).toBeGreaterThan(0)
      expect(experiment.poweredBy.es.trim(), experiment.id).not.toBe('')
      expect(experiment.poweredBy.en.trim(), experiment.id).not.toBe('')
    }
  })

  it('los límites de la ficha son los mismos que aplica el servidor', async () => {
    const { RATE_LIMITS } = await import('@/lib/security/rate-limit')
    const { AGENT_SESSION_MINUTES } = await import('@/lib/ai/agent/config')
    const hour = 60 * 60 * 1000
    const v5 = labExperiment('V5')
    expect(v5.session.minutes).toBe(AGENT_SESSION_MINUTES)
    expect(v5.limit).toEqual({ uses: RATE_LIMITS.agent.limit, per: RATE_LIMITS.agent.windowMs === hour ? 'hour' : 'day' })
    const a6 = labExperiment('A6')
    expect(a6.limit).toEqual({ uses: RATE_LIMITS.match.limit, per: RATE_LIMITS.match.windowMs === hour ? 'hour' : 'day' })
    expect(labExperiment('A10').limit).toEqual({ uses: RATE_LIMITS.arena.limit, per: RATE_LIMITS.arena.windowMs === hour ? 'hour' : 'day' })
    expect(labExperiment('A12').limit).toEqual({ uses: RATE_LIMITS.gates.limit, per: RATE_LIMITS.gates.windowMs === hour ? 'hour' : 'day' })
    for (const experiment of labCatalog) if (experiment.runsIn === 'browser') expect(experiment.limit, experiment.id).toBeNull()
  })
})
