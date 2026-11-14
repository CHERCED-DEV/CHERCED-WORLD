import type { Locale } from '@/lib/i18n/config'
import type { MatchError, MatchKind, MatchLevel } from '@/lib/ai/match/config'

export type MatchCopy = {
  stageLabel: string
  label: string
  placeholder: string
  counter: string
  analyze: string
  analyzing: string
  sample: string
  again: string
  sentTo: string
  sentToLocal: string
  checking: string
  heading: string
  coverage: string
  caption: string
  columns: { requirement: string; kind: string; level: string; evidence: string }
  kinds: Record<MatchKind, string>
  levels: Record<MatchLevel, string>
  noEvidence: string
  questions: string
  disclaimer: string
  dropped: string
  cost: string
  simulator: string
  print: string
  contact: string
  site: string
  errors: Record<Exclude<MatchError, 'forbidden'>, string>
  sampleVacancy: string
}

export const matchCopy: Record<Locale, MatchCopy> = {
  es: {
    stageLabel: '¿Encajo en tu vacante?',
    label: 'Descripción de la vacante',
    placeholder: 'Pega aquí la vacante: el cargo, los requisitos y lo deseable…',
    counter: '{count} de {max} caracteres (mínimo {min})',
    analyze: 'Analizar vacante',
    analyzing: 'Analizando…',
    sample: 'Usar una vacante de ejemplo',
    again: 'Analizar otra',
    sentTo: 'El texto de la vacante va a Google (Gemini) solo para este análisis. El sitio no lo guarda.',
    sentToLocal: 'Simulador local: compara la vacante con el buscador del sitio, sin Google.',
    checking: 'Revisando si el análisis está activo…',
    heading: 'Camilo × {role}',
    coverage: '{covered} de {total} requisitos con evidencia; {requiredCovered} de {required} obligatorios.',
    caption: 'Requisito por requisito, con la evidencia publicada en el sitio',
    columns: { requirement: 'Requisito', kind: 'Tipo', level: 'Nivel', evidence: 'Evidencia' },
    kinds: { obligatorio: 'Obligatorio', deseable: 'Deseable' },
    levels: { fuerte: 'Fuerte', parcial: 'Parcial', sin_evidencia: 'Sin evidencia' },
    noEvidence: 'Nada publicado',
    questions: 'Pregúntale esto en la entrevista',
    disclaimer: 'Es un análisis automático sobre lo que está publicado en este sitio. No reemplaza la entrevista.',
    dropped: 'Descarté {count} referencias que Gemini citó y no existen en el sitio.',
    cost: 'Este análisis costó {usd} ({cop}) con {model}.',
    simulator: 'Hecho con el simulador local: sin Google y sin costo.',
    print: 'Resumen en PDF',
    contact: 'Escríbele a Camilo sobre este rol',
    site: 'Análisis hecho en {url} el {date}.',
    errors: {
      off: 'El análisis con Gemini todavía no está activo en este sitio.',
      invalid: 'Pega una vacante un poco más completa: al menos {min} caracteres.',
      too_long: 'La vacante es muy larga: el máximo es {max} caracteres.',
      rate_limited: 'Ya analizaste 5 vacantes hoy. Vuelve mañana, o escríbele a Camilo desde Contacto.',
      daily_cap: 'Por hoy se acabaron los análisis del sitio. Vuelve mañana, o escríbele a Camilo desde Contacto.',
      unavailable: 'Gemini no está disponible en este momento. Vuelve más tarde.',
      failed: 'No pude completar el análisis. Intenta de nuevo en un momento.',
    },
    sampleVacancy: [
      'Ingeniero de software senior (IA aplicada)',
      '',
      'Requisitos:',
      '- 5 años o más construyendo aplicaciones web con React, Next.js y TypeScript',
      '- Arquitecturas orientadas a eventos y microservicios en Azure o AWS',
      '- Integración de modelos de lenguaje en productos: agentes y herramientas',
      '- Pruebas automatizadas de punta a punta con Playwright',
      '- Experiencia con Kubernetes en producción',
      '',
      'Deseable:',
      '- CMS headless como Umbraco',
      '- Inglés para reuniones técnicas',
    ].join('\n'),
  },
  en: {
    stageLabel: 'Do I fit your role?',
    label: 'Job description',
    placeholder: 'Paste the job posting here: the title, the requirements and the nice-to-haves…',
    counter: '{count} of {max} characters (at least {min})',
    analyze: 'Analyze the role',
    analyzing: 'Analyzing…',
    sample: 'Use a sample job posting',
    again: 'Analyze another one',
    sentTo: 'The job posting text goes to Google (Gemini) only for this analysis. The site does not store it.',
    sentToLocal: 'Local simulator: it compares the posting with the site search, without Google.',
    checking: 'Checking whether the analysis is active…',
    heading: 'Camilo × {role}',
    coverage: '{covered} of {total} requirements with evidence; {requiredCovered} of {required} required ones.',
    caption: 'Requirement by requirement, with the evidence published on the site',
    columns: { requirement: 'Requirement', kind: 'Type', level: 'Level', evidence: 'Evidence' },
    kinds: { obligatorio: 'Required', deseable: 'Nice to have' },
    levels: { fuerte: 'Strong', parcial: 'Partial', sin_evidencia: 'No evidence' },
    noEvidence: 'Nothing published',
    questions: 'Ask this in the interview',
    disclaimer: 'This is an automatic analysis of what is published on this site. It does not replace the interview.',
    dropped: 'I discarded {count} references Gemini cited that do not exist on the site.',
    cost: 'This analysis cost {usd} ({cop}) with {model}.',
    simulator: 'Made with the local simulator: no Google and no cost.',
    print: 'PDF summary',
    contact: 'Write to Camilo about this role',
    site: 'Analysis made on {url} on {date}.',
    errors: {
      off: 'The Gemini analysis is not active on this site yet.',
      invalid: 'Paste a slightly more complete posting: at least {min} characters.',
      too_long: 'The posting is too long: the maximum is {max} characters.',
      rate_limited: 'You already analyzed 5 postings today. Come back tomorrow, or write to Camilo from Contact.',
      daily_cap: 'The site ran out of analyses for today. Come back tomorrow, or write to Camilo from Contact.',
      unavailable: 'Gemini is not available right now. Come back later.',
      failed: 'I could not finish the analysis. Try again in a moment.',
    },
    sampleVacancy: [
      'Senior Software Engineer (Applied AI)',
      '',
      'Requirements:',
      '- 5+ years building web apps with React, Next.js and TypeScript',
      '- Event-driven architectures and microservices on Azure or AWS',
      '- Shipping language models in products: agents and tools',
      '- End-to-end test automation with Playwright',
      '- Kubernetes in production',
      '',
      'Nice to have:',
      '- Headless CMS such as Umbraco',
      '- Spanish for technical meetings',
    ].join('\n'),
  },
}
