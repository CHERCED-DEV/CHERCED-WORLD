import type { EvalKind } from './battery'
import type { Locale } from '@/lib/i18n/config'

export type EvalsCopy = {
  title: string
  description: string
  intro: string
  how: string
  empty: string
  emptyHow: string
  latest: string
  model: string
  score: string
  latency: string
  cost: string
  stale: string
  failures: string
  noFailures: string
  reasons: string
  answer: string
  history: string
  date: string
  battery: string
  question: string
  kinds: Record<EvalKind, string>
  back: string
}

export const evalsCopy: Record<Locale, EvalsCopy> = {
  es: {
    title: 'Cómo mido a Mini Cherced',
    description: 'Evals públicas y red team del agente de voz: hechos, citas, navegación, rechazos, tono e identidad, con latencia y costo por corrida.',
    intro: 'No solo hice un agente: lo mido. Esta es una batería de preguntas que le hago a Mini Cherced con la misma instrucción y las mismas herramientas que usa contigo, calificada con reglas.',
    how: 'La corro a mano contra Gemini en modo texto (unos 0,05 USD por corrida). Si falla un rechazo del red team, los cambios a su instrucción no se pueden subir.',
    empty: 'Todavía no hay corridas publicadas.',
    emptyHow: 'La primera aparece aquí en cuanto la corra.',
    latest: 'Última corrida',
    model: 'Modelo',
    score: 'Aprobadas',
    latency: 'Latencia',
    cost: 'Costo de la corrida',
    stale: 'Las instrucciones de Mini Cherced cambiaron después de esta corrida: el resultado puede no reflejar la versión actual.',
    failures: 'Lo que falló',
    noFailures: 'Nada falló en esta corrida.',
    reasons: 'Por qué',
    answer: 'Respuesta (recortada)',
    history: 'Historial',
    date: 'Fecha',
    battery: 'La batería completa',
    question: 'Pregunta',
    kinds: {
      fact: 'Hechos',
      citation: 'Citas',
      navigation: 'Navegación',
      refusal: 'Rechazos (red team)',
      tone: 'Tono',
      identity: 'Identidad',
    },
    back: 'Volver al AI Lab',
  },
  en: {
    title: 'How I measure Mini Cherced',
    description: 'Public evals and red team for the voice agent: facts, citations, navigation, refusals, tone and identity, with latency and cost per run.',
    intro: 'I didn’t just build an agent: I measure it. This is a battery of questions I ask Mini Cherced with the same instruction and the same tools it uses with you, graded with rules.',
    how: 'I run it by hand against Gemini in text mode (about 0.05 USD per run). If a red-team refusal fails, changes to its instruction can’t be shipped.',
    empty: 'No runs published yet.',
    emptyHow: 'The first one shows up here as soon as I run it.',
    latest: 'Latest run',
    model: 'Model',
    score: 'Passed',
    latency: 'Latency',
    cost: 'Run cost',
    stale: 'Mini Cherced’s instructions changed after this run: the result may not reflect the current version.',
    failures: 'What failed',
    noFailures: 'Nothing failed in this run.',
    reasons: 'Why',
    answer: 'Answer (clipped)',
    history: 'History',
    date: 'Date',
    battery: 'The full battery',
    question: 'Question',
    kinds: {
      fact: 'Facts',
      citation: 'Citations',
      navigation: 'Navigation',
      refusal: 'Refusals (red team)',
      tone: 'Tone',
      identity: 'Identity',
    },
    back: 'Back to the AI Lab',
  },
}
