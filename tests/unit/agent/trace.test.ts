import { describe, expect, it } from 'vitest'
import { MODEL_PRICES, PRICES_CHECKED_AT, tokenCost, toCop, USD_TO_COP } from '@/lib/ai/pricing'
import {
  addTool,
  closeTurn,
  createTrace,
  markAnswer,
  markAsked,
  markAudio,
  markHeard,
  markInterrupted,
  markUsage,
  pendingTurn,
  percentile,
  summarize,
  traceExport,
  turnDuration,
  turnLatency,
  type TraceTool,
} from '@/lib/ai/agent/trace'
import { parseUsage, usageCost } from '@/lib/ai/agent/usage'

const MODEL = 'gemini-3.8-live'

function usage(prompt: number, response: number) {
  const parsed = parseUsage({
    promptTokenCount: prompt,
    responseTokenCount: response,
    totalTokenCount: prompt + response,
    promptTokensDetails: [{ modality: 'TEXT', tokenCount: prompt }],
    responseTokensDetails: [{ modality: 'AUDIO', tokenCount: response }],
  })
  if (!parsed) throw new Error('uso inválido')
  return parsed
}

const search: TraceTool = {
  name: 'buscar_en_el_sitio',
  args: { consulta: 'Synergos' },
  ms: 12,
  result: { kind: 'search', hits: [{ title: 'Synergos', url: '/es/synergos', score: 9.5 }] },
}

describe('precios', () => {
  it('tienen fecha de consulta y cubren el modelo del agente', () => {
    expect(PRICES_CHECKED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(MODEL_PRICES[MODEL].output.audio).toBe(12)
  })

  it('cobran por millón de tokens y caen al precio de texto si falta la modalidad', () => {
    expect(tokenCost(MODEL, 'input', 'audio', 1_000_000)).toBe(3)
    expect(tokenCost('gemini-3.8-flash', 'output', 'audio', 1_000_000)).toBe(3.75)
    expect(tokenCost(MODEL, 'input', 'text', -5)).toBe(0)
    expect(toCop(1)).toBe(USD_TO_COP)
  })
})

describe('parseUsage', () => {
  it('reparte los tokens por modalidad', () => {
    const parsed = parseUsage({
      promptTokenCount: 1000,
      responseTokenCount: 400,
      toolUsePromptTokenCount: 50,
      thoughtsTokenCount: 30,
      totalTokenCount: 1480,
      promptTokensDetails: [
        { modality: 'TEXT', tokenCount: 900 },
        { modality: 'AUDIO', tokenCount: 100 },
      ],
      toolUsePromptTokensDetails: [{ modality: 'TEXT', tokenCount: 50 }],
      responseTokensDetails: [{ modality: 'AUDIO', tokenCount: 400 }],
    })
    expect(parsed).toMatchObject({ total: 1480, input: { text: 950, audio: 100, image: 0 }, output: { text: 30, audio: 400 } })
  })

  it('sin detalle, la entrada cuenta como texto y la salida como audio', () => {
    expect(parseUsage({ promptTokenCount: 10, responseTokenCount: 4 })).toMatchObject({
      total: 14,
      input: { text: 10, audio: 0 },
      output: { text: 0, audio: 4 },
    })
  })

  it('descarta lo que no es un uso', () => {
    expect(parseUsage(undefined)).toBeNull()
    expect(parseUsage({ totalTokenCount: 0 })).toBeNull()
    expect(parseUsage({ promptTokenCount: 'mil' })).toBeNull()
  })

  it('calcula el costo con la tabla de precios y cero para un modelo sin precio', () => {
    const parsed = usage(1_000_000, 1_000_000)
    expect(usageCost(MODEL, parsed)).toBeCloseTo(0.75 + 12)
    expect(usageCost('simulator', parsed)).toBe(0)
  })
})

describe('trace', () => {
  it('mide un turno por voz: fin de habla, herramienta, primer audio, tokens y cierre', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    trace = markHeard(trace, 900, '¿Qué es')
    trace = markAsked(trace, 1000, 'voice', 'vad')
    trace = markHeard(trace, 1100, 'Synergos?')
    trace = addTool(trace, search)
    trace = markAudio(trace, 1700)
    trace = markAudio(trace, 1800)
    trace = markAnswer(trace, 'Synergos es')
    trace = markAnswer(trace, 'un ecosistema.')
    trace = markUsage(trace, usage(1200, 300))
    trace = closeTurn(trace, 4200, 2500)

    expect(trace.turns).toHaveLength(1)
    const turn = trace.turns[0]!
    expect(turn).toMatchObject({
      n: 1,
      state: 'done',
      source: 'voice',
      heardBy: 'vad',
      question: '¿Qué es Synergos?',
      answer: 'Synergos es un ecosistema.',
      askedAt: 1000,
      firstAudioAt: 1700,
      audioMs: 2500,
    })
    expect(turnLatency(turn)).toBe(700)
    expect(turnDuration(turn)).toBe(3200)
    expect(turn.tools).toEqual([search])
    expect(turn.costUsd).toBeCloseTo((1200 * 0.75 + 300 * 12) / 1_000_000)
  })

  it('el saludo y un turno escrito quedan separados con su propia latencia', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    trace = markAsked(trace, 100, 'greeting', 'greeting')
    trace = markAudio(trace, 900)
    trace = closeTurn(trace, 2000)
    trace = markAsked(trace, 3000, 'text', 'text', 'Llévame al blog')
    trace = markAudio(trace, 3400)
    trace = closeTurn(trace, 5000)
    expect(trace.turns.map((turn) => [turn.source, turnLatency(turn)])).toEqual([
      ['greeting', 800],
      ['text', 400],
    ])
    expect(trace.turns[1]!.question).toBe('Llévame al blog')
  })

  it('si el visitante interrumpe, el uso y el cierre van al turno que hablaba', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    trace = markAsked(trace, 0, 'voice', 'vad')
    trace = markAudio(trace, 500)
    trace = markAsked(trace, 1500, 'voice', 'vad')
    trace = markInterrupted(trace)
    trace = markUsage(trace, usage(100, 50))
    trace = closeTurn(trace, 1600)
    trace = markAudio(trace, 2100)
    trace = closeTurn(trace, 3000)
    const [first, second] = trace.turns
    expect(first).toMatchObject({ state: 'done', interrupted: true, doneAt: 1600 })
    expect(first!.usage?.total).toBe(150)
    expect(second).toMatchObject({ state: 'done', interrupted: false, askedAt: 1500, firstAudioAt: 2100 })
    expect(second!.usage).toBeNull()
  })

  it('en el simulador, escribir mientras saluda deja la búsqueda y la respuesta en el turno nuevo', () => {
    let trace = createTrace('local', 'simulator', 'browser', 0)
    trace = markAsked(trace, 0, 'greeting', 'greeting')
    const greeting = pendingTurn(trace)
    trace = markAnswer(trace, 'Hola', greeting)
    trace = markAudio(trace, 100, greeting)
    trace = markInterrupted(trace)
    trace = markAsked(trace, 2000, 'text', 'text', 'Synergos')
    const question = pendingTurn(trace)
    expect(question).toBe(2)
    trace = addTool(trace, search, question)
    trace = markAnswer(trace, 'Encontré Synergos', question)
    trace = closeTurn(trace, 2100, 2000, greeting)
    trace = markAudio(trace, 2400, question)
    trace = closeTurn(trace, 5000, 2600, question)
    const [first, second] = trace.turns
    expect(first).toMatchObject({ n: 1, state: 'done', interrupted: true, answer: 'Hola', tools: [] })
    expect(second).toMatchObject({ n: 2, state: 'done', interrupted: false, answer: 'Encontré Synergos', tools: [search], firstAudioAt: 2400 })
    expect(turnLatency(second!)).toBe(400)
  })

  it('la transcripción no corre la hora que ya marcó la detección de voz', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    trace = markAsked(trace, 1000, 'voice', 'vad')
    trace = markHeard(trace, 1300, 'hola')
    expect(trace.turns[0]!.askedAt).toBe(1000)
  })

  it('una respuesta sin pregunta abre un turno propio', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    trace = markAudio(trace, 50)
    trace = closeTurn(trace, 100)
    expect(trace.turns[0]).toMatchObject({ source: 'model', askedAt: null })
    expect(turnLatency(trace.turns[0]!)).toBeNull()
    expect(turnDuration(trace.turns[0]!)).toBe(50)
  })

  it('no cambia el objeto cuando no hay nada nuevo', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    trace = markAsked(trace, 0, 'voice', 'vad')
    trace = markAudio(trace, 10)
    expect(markAudio(trace, 20)).toBe(trace)
    expect(markHeard(trace, 30, '   ')).toBe(trace)
    expect(markAnswer(trace, '')).toBe(trace)
    expect(closeTurn(createTrace('live', MODEL, 'Puck', 0), 5).turns).toEqual([])
  })

  it('el uso repetido de un turno no se suma dos veces', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    trace = markAsked(trace, 0, 'text', 'text', 'hola')
    trace = markAudio(trace, 10)
    trace = markUsage(trace, usage(100, 10))
    trace = markUsage(trace, usage(100, 40))
    expect(trace.turns[0]!.usage?.total).toBe(140)
  })
})

describe('summarize', () => {
  it('percentil por rango más cercano', () => {
    expect(percentile([], 50)).toBeNull()
    expect(percentile([300, 100, 200], 50)).toBe(200)
    expect(percentile([100, 200, 300, 400, 5000], 95)).toBe(5000)
  })

  it('suma turnos respondidos, tokens, herramientas y costo en dólares y pesos', () => {
    let trace = createTrace('live', MODEL, 'Puck', 0)
    for (const [asked, audio] of [
      [0, 400],
      [1000, 1900],
      [3000, 3600],
    ] as const) {
      trace = markAsked(trace, asked, 'text', 'text', 'pregunta')
      trace = addTool(trace, search)
      trace = markAudio(trace, audio)
      trace = markUsage(trace, usage(1000, 100))
      trace = closeTurn(trace, audio + 500)
    }
    trace = markAsked(trace, 9000, 'voice', 'vad')
    const summary = summarize(trace)
    expect(summary).toMatchObject({ turns: 3, latencyP50: 600, latencyP95: 900, tokens: 3300, inputTokens: 3000, outputTokens: 300, tools: 3 })
    expect(summary.costUsd).toBeCloseTo(3 * ((1000 * 0.75 + 100 * 12) / 1_000_000))
    expect(summary.costCop).toBeCloseTo(summary.costUsd * USD_TO_COP)
  })

  it('el simulador no cuesta nada', () => {
    let trace = createTrace('local', 'simulator', 'browser', 0)
    trace = markAsked(trace, 0, 'greeting', 'greeting')
    trace = markAnswer(trace, 'Hola')
    trace = markAudio(trace, 120)
    trace = closeTurn(trace, 800, 680)
    expect(summarize(trace)).toMatchObject({ turns: 1, latencyP50: 120, costUsd: 0, tokens: 0 })
  })
})

describe('traceExport', () => {
  it('exporta JSON con precios, resumen y turnos con horas ISO', () => {
    let trace = createTrace('live', MODEL, 'Puck', Date.UTC(2026, 10, 14, 15))
    trace = markAsked(trace, Date.UTC(2026, 10, 14, 15, 0, 1), 'text', 'text', 'hola')
    trace = markAudio(trace, Date.UTC(2026, 10, 14, 15, 0, 2))
    trace = closeTurn(trace, Date.UTC(2026, 10, 14, 15, 0, 3), 900)
    const exported = traceExport(trace, Date.UTC(2026, 10, 14, 15, 1))
    expect(exported).toMatchObject({
      version: 1,
      mode: 'live',
      model: MODEL,
      voice: 'Puck',
      startedAt: '2026-11-14T15:00:00.000Z',
      prices: { checkedAt: PRICES_CHECKED_AT, usdToCop: USD_TO_COP },
      summary: { turns: 1, latencyP50: 1000 },
    })
    expect(exported.turns[0]).toMatchObject({ n: 1, question: 'hola', latencyMs: 1000, durationMs: 2000, audioMs: 900 })
    expect(JSON.parse(JSON.stringify(exported))).toEqual(exported)
  })
})
