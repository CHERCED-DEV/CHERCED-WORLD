import type { Localized } from '@/content/types'
import { GRAVITIES, RUBRIC_CRITERIA, type Gravity, type RubricCriterion } from '@/lib/ai/gates/schema'

export const RUBRIC_VERSION = '046-v1'

export type RubricEntry = {
  id: RubricCriterion
  name: Localized
  definition: Localized
  yes: Localized
  no: Localized
}

export const RUBRIC: readonly RubricEntry[] = [
  {
    id: 'verificable',
    name: { es: 'Verificable', en: 'Verifiable' },
    definition: {
      es: 'Cada criterio se puede comprobar con un paso concreto y un resultado esperado.',
      en: 'Every criterion can be checked with a concrete step and an expected result.',
    },
    yes: {
      es: '«Dado un adjunto de 6 MB, cuando se envía, entonces el formulario lo rechaza y dice que el máximo es 5 MB.»',
      en: '“Given a 6 MB attachment, when it is sent, then the form rejects it and says the maximum is 5 MB.”',
    },
    no: {
      es: '«Entonces el formulario funciona bien.» No dice qué mirar ni qué esperar.',
      en: '“Then the form works well.” It does not say what to look at or what to expect.',
    },
  },
  {
    id: 'acotada',
    name: { es: 'Acotada', en: 'Scoped' },
    definition: {
      es: 'Dice lo que no incluye, y no promete más de lo que pidió el pedido.',
      en: 'It says what it does not include, and it promises no more than the request asked for.',
    },
    yes: {
      es: 'El pedido es un formulario y «No incluye» deja fuera el chat en vivo y el panel de respuestas.',
      en: 'The request is a form and “Does not include” leaves out live chat and the reply dashboard.',
    },
    no: {
      es: 'El pedido es un formulario y la spec suma un CRM, notificaciones por SMS y una app móvil.',
      en: 'The request is a form and the spec adds a CRM, SMS notifications and a mobile app.',
    },
  },
  {
    id: 'completa',
    name: { es: 'Completa frente al pedido', en: 'Complete against the request' },
    definition: {
      es: 'Cubre lo que el pedido pide y nada importante queda fuera.',
      en: 'It covers what the request asks for and nothing important is left out.',
    },
    yes: {
      es: 'El pedido habla de adjuntos y la spec tiene un requisito con su criterio para el tamaño y los formatos.',
      en: 'The request mentions attachments and the spec has a requirement with its criterion for size and formats.',
    },
    no: {
      es: 'El pedido pide recordatorios por correo y ningún requisito dice cuándo ni a quién se mandan.',
      en: 'The request asks for email reminders and no requirement says when or to whom they are sent.',
    },
  },
  {
    id: 'clara',
    name: { es: 'Clara', en: 'Clear' },
    definition: {
      es: 'Sin palabras vagas, sin dos lecturas posibles y con términos consistentes.',
      en: 'No vague words, no two possible readings and consistent terms.',
    },
    yes: {
      es: '«El pedido pasa a “listo” cuando la panadería marca que lo empacó.» Un solo término y un solo momento.',
      en: '“The order moves to ‘ready’ when the bakery marks it as packed.” One term and one moment.',
    },
    no: {
      es: '«El sistema responde rápido y de forma adecuada», o llamar al mismo pedido «orden», «compra» y «ticket».',
      en: '“The system responds quickly and appropriately”, or calling the same order “order”, “purchase” and “ticket”.',
    },
  },
  {
    id: 'honesta',
    name: { es: 'Honesta', en: 'Honest' },
    definition: {
      es: 'No inventa datos, cifras ni dependencias, y lo incierto va como pregunta abierta.',
      en: 'It does not invent data, figures or dependencies, and what is uncertain goes as an open question.',
    },
    yes: {
      es: '«Q-1: ¿Qué tamaño máximo tiene un adjunto? Por defecto: 5 MB.» La cifra queda como supuesto a la vista.',
      en: '“Q-1: What is the maximum attachment size? Default: 5 MB.” The figure stays as a visible assumption.',
    },
    no: {
      es: '«El 87 % de los clientes prefiere el correo» o «se integra con el CRM de la empresa», sin que el pedido lo diga.',
      en: '“87% of customers prefer email” or “it integrates with the company CRM”, without the request saying so.',
    },
  },
]

export const GRAVITY_TEXT: Readonly<Record<Gravity, Localized>> = {
  bloqueante: {
    es: 'Bloqueante: con esto la spec no se puede implementar o se implementaría algo distinto.',
    en: 'Blocking: with this the spec cannot be implemented, or something different would be built.',
  },
  importante: {
    es: 'Importante: se puede implementar, pero alguien tendría que adivinar o volver a preguntar.',
    en: 'Important: it can be implemented, but someone would have to guess or ask again.',
  },
  menor: {
    es: 'Menor: de forma o de redacción; se lista y no se corrige.',
    en: 'Minor: form or wording; it is listed and not fixed.',
  },
}

export function rubricEntry(id: RubricCriterion): RubricEntry {
  const entry = RUBRIC.find((item) => item.id === id)
  if (!entry) throw new Error(`La rúbrica no tiene ${id}`)
  return entry
}

export function rubricText(lang: 'es' | 'en'): string {
  const lines = RUBRIC.map((entry, index) =>
    [
      `${index + 1}. ${entry.id} (${entry.name[lang]}): ${entry.definition[lang]}`,
      `   ${lang === 'es' ? 'Sí' : 'Yes'}: ${entry.yes[lang]}`,
      `   ${lang === 'es' ? 'No' : 'No'}: ${entry.no[lang]}`,
    ].join('\n'),
  )
  const gravities = GRAVITIES.map((gravity) => `- ${gravity}: ${GRAVITY_TEXT[gravity][lang]}`)
  return [...lines, '', ...gravities].join('\n')
}

export const RUBRIC_IDS: readonly RubricCriterion[] = RUBRIC_CRITERIA
