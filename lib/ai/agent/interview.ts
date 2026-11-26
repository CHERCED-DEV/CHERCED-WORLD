import { interviewTracks, type InterviewTrack } from '@/content/ailab/interview'
import type { Locale } from '@/lib/i18n/config'
import { diagramMermaid, type DesignDecision, type Diagram } from './design'
import { DECISION_TOOL, DIAGRAM_TOOL, OPEN_TOOL, SEARCH_TOOL, SOURCE_TOOL, type AgentSource } from './tools'
import type { Turn } from './transcript'

export function interviewBlock(track: InterviewTrack, author: string): string {
  const label = interviewTracks.es[track].label
  const lines = [
    `# Modo entrevista: ${label}`,
    `Un entrevistador te está haciendo una entrevista sobre ${author}. Responde como lo haría un candidato bien preparado, pero en tercera persona («${author} hizo…») y solo con lo publicado: el mapa del sitio y lo que devuelva ${SEARCH_TOOL}. Antes de dar un detalle concreto, búscalo.`,
    `- Cada vez que te apoyes en un caso, una decisión, un post o una página, llama a ${SOURCE_TOOL} con su ruta para que el entrevistador vea la fuente en pantalla. Solo rutas del mapa o de una búsqueda. No uses ${OPEN_TOOL} en este modo salvo que lo pidan.`,
  ]
  if (track === 'behavioral')
    lines.push(
      '- Estructura cada respuesta con el método STAR, en voz y sin rótulos: la situación, la tarea, lo que hizo y el resultado. Cada parte debe salir de un caso publicado. Si no hay un caso que la respalde, dilo con honestidad en vez de inventar.',
    )
  if (track === 'technical')
    lines.push('- Explica la decisión, por qué se tomó y qué se sacrificó, como en las tarjetas de decisiones de los casos. Si hay una limitación publicada, dila.')
  if (track === 'design')
    lines.push(
      `- Es una entrevista de diseño de sistemas: aquí resuelves tú el problema, con el criterio de ${author}. Primero haz dos o tres preguntas de alcance (usuarios, lecturas contra escrituras, consistencia, presupuesto) y espera las respuestas.`,
      `- Después dibuja la arquitectura paso a paso con ${DIAGRAM_TOOL}: manda siempre el diagrama completo, con máximo 30 nodos y 5 grupos, y explica en voz cada paso en dos o tres frases.`,
      `- Cada decisión importante va con ${DECISION_TOOL}: qué se decidió, por qué y qué se sacrifica. Si el entrevistador objeta («¿y si se cae la cola?»), ajusta el diagrama y registra la decisión nueva.`,
      `- Cuando un patrón de Synergos aplique (sagas, BFF, caché, idempotencia, micro-frontends), búscalo con ${SEARCH_TOOL} y cítalo con ${SOURCE_TOOL}.`,
    )
  lines.push(
    '- Nunca inventes cifras, fechas, empleadores, clientes ni tecnologías. Salario, disponibilidad o contrato: remite a Contacto.',
    '- En este modo puedes extenderte un poco más: hasta cinco frases por respuesta. Si te preguntan algo fuera de lugar, conserva tu humor y vuelve a la entrevista.',
  )
  return lines.join('\n')
}

export type InterviewActaInput = {
  lang: Locale
  track: InterviewTrack
  startedAt: number
  endedAt: number
  turns: readonly Turn[]
  sources: readonly AgentSource[]
  origin: string
  diagram?: Diagram | null
  decisions?: readonly DesignDecision[]
}

const ACTA_COPY = {
  es: {
    title: 'Acta de entrevista con Mini Cherced',
    date: 'Fecha',
    track: 'Pista',
    duration: 'Duración',
    qa: 'Preguntas y respuestas',
    noAnswer: '(sin respuesta)',
    sources: 'Fuentes citadas',
    noSources: 'No se citaron fuentes.',
    decisions: 'Decisiones',
    why: 'Por qué',
    tradeoff: 'Qué se sacrifica',
    diagram: 'Diagrama (Mermaid)',
    note: 'Las respuestas las dio una IA (Mini Cherced) a partir de lo publicado en el sitio. Para lo demás, escríbele a Camilo desde Contacto.',
  },
  en: {
    title: 'Interview record with Mini Cherced',
    date: 'Date',
    track: 'Track',
    duration: 'Duration',
    qa: 'Questions and answers',
    noAnswer: '(no answer)',
    sources: 'Cited sources',
    noSources: 'No sources were cited.',
    decisions: 'Decisions',
    why: 'Why',
    tradeoff: 'What it costs',
    diagram: 'Diagram (Mermaid)',
    note: 'The answers were given by an AI (Mini Cherced) based on what is published on the site. For anything else, write to Camilo from Contact.',
  },
} as const

export function clock(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function interviewExchanges(turns: readonly Turn[]): Array<{ question: string; answer: string }> {
  const exchanges: Array<{ question: string; answer: string }> = []
  for (const turn of turns) {
    if (turn.who === 'you') exchanges.push({ question: turn.text, answer: '' })
    else if (exchanges.length) {
      const last = exchanges.at(-1)!
      last.answer = last.answer ? `${last.answer} ${turn.text}` : turn.text
    }
  }
  return exchanges
}

export function interviewActa(input: InterviewActaInput): string {
  const copy = ACTA_COPY[input.lang]
  const date = new Intl.DateTimeFormat(input.lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(
    new Date(input.startedAt),
  )
  const lines = [
    `# ${copy.title}`,
    '',
    `- **${copy.date}:** ${date}`,
    `- **${copy.track}:** ${interviewTracks[input.lang][input.track].label}`,
    `- **${copy.duration}:** ${clock(input.endedAt - input.startedAt)}`,
    '',
    `## ${copy.qa}`,
  ]
  interviewExchanges(input.turns).forEach((exchange, index) => {
    lines.push('', `### ${index + 1}. ${exchange.question}`, '', exchange.answer || copy.noAnswer)
  })
  if (input.decisions?.length) {
    lines.push('', `## ${copy.decisions}`)
    input.decisions.forEach((decision, index) => {
      lines.push('', `### ${index + 1}. ${decision.decision}`, '', `- **${copy.why}:** ${decision.why}`, `- **${copy.tradeoff}:** ${decision.tradeoff}`)
    })
  }
  if (input.diagram) lines.push('', `## ${copy.diagram}`, '', '```mermaid', diagramMermaid(input.diagram), '```')
  lines.push('', `## ${copy.sources}`, '')
  const unique = [...new Map(input.sources.map((source) => [source.path, source])).values()]
  if (unique.length === 0) lines.push(copy.noSources)
  for (const source of unique) lines.push(`- [${source.title}](${input.origin}${source.path})`)
  lines.push('', `> ${copy.note}`, '')
  return lines.join('\n')
}
