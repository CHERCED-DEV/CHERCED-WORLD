import type { Locale } from '@/lib/i18n/config'

export const INTERVIEW_TRACKS = ['behavioral', 'technical', 'design'] as const

export type InterviewTrack = (typeof INTERVIEW_TRACKS)[number]

export type InterviewTrackContent = { label: string; hint: string; questions: readonly string[]; ready: boolean }

export function isInterviewTrack(value: unknown): value is InterviewTrack {
  return typeof value === 'string' && (INTERVIEW_TRACKS as readonly string[]).includes(value)
}

export const interviewTracks: Record<Locale, Record<InterviewTrack, InterviewTrackContent>> = {
  es: {
    behavioral: {
      label: 'Conductual (STAR)',
      hint: 'Situación, tarea, acción y resultado, cada parte sacada de un caso publicado.',
      ready: true,
      questions: [
        'Cuéntame de un conflicto técnico y cómo lo resolvió.',
        '¿Qué decisión de arquitectura cambiaría hoy, y por qué?',
        '¿Cuándo tuvo que convencer a otros de un cambio técnico?',
        'Cuéntame de un error en producción y qué aprendió.',
        '¿Cómo manejó un proyecto con requisitos que cambiaban?',
        'Cuéntame de una vez que mentoreó a alguien.',
        '¿De qué proyecto está más orgulloso, y por qué?',
        'Cuéntame de una vez que tuvo que aprender algo muy rápido.',
      ],
    },
    technical: {
      label: 'Técnica',
      hint: 'Frontend, arquitectura e IA aplicada: la decisión, por qué y qué se sacrificó.',
      ready: true,
      questions: [
        '¿Por qué micro-frontends en Synergos y no un monolito?',
        '¿Cómo garantiza que las reglas de arquitectura se cumplan?',
        '¿Cómo diseñó la compensación en las sagas?',
        '¿Por qué Next.js en el portafolio si su framework favorito es Angular?',
        '¿Cómo trabaja con agentes de IA sin perder calidad?',
        '¿Cómo mide un agente de IA?',
        '¿Cómo cuida la accesibilidad y el rendimiento?',
        '¿Cómo migra un sistema legado sin detener la operación?',
      ],
    },
    design: {
      label: 'Diseño de sistemas',
      hint: 'Un problema de diseño que se resuelve en vivo con un diagrama.',
      ready: false,
      questions: [],
    },
  },
  en: {
    behavioral: {
      label: 'Behavioral (STAR)',
      hint: 'Situation, task, action and result, each part taken from a published case.',
      ready: true,
      questions: [
        'Tell me about a technical conflict and how he solved it.',
        'Which architecture decision would he change today, and why?',
        'When did he have to convince others of a technical change?',
        'Tell me about a production bug and what he learned.',
        'How did he handle a project with changing requirements?',
        'Tell me about a time he mentored someone.',
        'Which project is he proudest of, and why?',
        'Tell me about a time he had to learn something very fast.',
      ],
    },
    technical: {
      label: 'Technical',
      hint: 'Frontend, architecture and applied AI: the decision, why, and what it cost.',
      ready: true,
      questions: [
        'Why micro-frontends in Synergos instead of a monolith?',
        'How does he make sure architecture rules are followed?',
        'How did he design compensation in the sagas?',
        'Why Next.js for the portfolio if his favorite framework is Angular?',
        'How does he work with AI agents without losing quality?',
        'How does he measure an AI agent?',
        'How does he take care of accessibility and performance?',
        'How does he migrate a legacy system without stopping operations?',
      ],
    },
    design: {
      label: 'System design',
      hint: 'A design problem solved live with a diagram.',
      ready: false,
      questions: [],
    },
  },
}
