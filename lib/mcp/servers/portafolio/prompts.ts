import type { Locale } from '@/lib/i18n/config'
import type { McpPrompt } from '@/lib/mcp/core/types'

function promptLang(value: string | undefined): Locale {
  return value === 'es' ? 'es' : 'en'
}

const LANG_ARGUMENT = { name: 'lang', description: 'Language for the questions and the answers: "es" or "en". Default: "en".', required: false }

const INTERVIEW: Record<Locale, { intro: string; questions: string[]; rules: string }> = {
  es: {
    intro: 'Vas a entrevistar a Camilo Hernández para un rol de AI Engineer o full-stack senior usando solo su portafolio público, con las herramientas de este servidor MCP. Responde estas cinco preguntas, una por una:',
    questions: [
      '¿Qué decisiones de arquitectura tomó en Synergos y qué sacrificó en cada una? (get_case_study con id "12" y get_decisions)',
      '¿Qué problema de negocio resolvió con IA y qué evidencia publicada lo respalda? (search_portfolio)',
      '¿Cómo prueba y verifica la calidad de lo que entrega? (search_portfolio con "pruebas" o "evals")',
      '¿Qué experiencia demostrable tiene con agentes, MCP y evals? (search_portfolio y list_posts)',
      '¿Cómo trabaja con especificaciones y agentes, de la idea al código? (search_portfolio con "spec")',
    ],
    rules: 'Cita cada afirmación con su enlace del sitio. Si una herramienta no trae evidencia, dilo en vez de suponer. Termina con un resumen de fortalezas y de preguntas abiertas.',
  },
  en: {
    intro: "You are interviewing Camilo Hernández for an AI Engineer or senior full-stack role using only his public portfolio, through this MCP server's tools. Answer these five questions, one by one:",
    questions: [
      'Which architecture decisions did he make in Synergos, and what did each one cost? (get_case_study with id "12" and get_decisions)',
      'Which business problem did he solve with AI, and what published evidence backs it? (search_portfolio)',
      'How does he test and verify the quality of what he ships? (search_portfolio with "tests" or "evals")',
      'What provable experience does he have with agents, MCP and evals? (search_portfolio and list_posts)',
      'How does he work with specs and agents, from idea to code? (search_portfolio with "spec")',
    ],
    rules: 'Cite every claim with its link to the site. If a tool returns no evidence, say so instead of guessing. Finish with a summary of strengths and open questions.',
  },
}

const FIT: Record<Locale, (job: string) => string> = {
  es: (job) =>
    `Llama a match_job_description con la vacante de abajo (lang "es"). Luego resume, requisito por requisito, qué evidencia publicada hay, con sus enlaces; señala los vacíos sin inventar nada y propone tres preguntas para la entrevista. Aclara que es el análisis determinista del sitio, sin modelo.\n\nVacante:\n${job}`,
  en: (job) =>
    `Call match_job_description with the job description below (lang "en"). Then summarize, requirement by requirement, the published evidence with its links; point out the gaps without making anything up and suggest three interview questions. Make clear that this is the site's deterministic analysis, with no model.\n\nJob description:\n${job}`,
}

export const interviewPrompt: McpPrompt = {
  name: 'interview_camilo',
  title: 'Interview Camilo',
  description: 'Five technical interview questions that your agent answers with the tools of this server, citing the site.',
  arguments: [LANG_ARGUMENT],
  render(args) {
    const copy = INTERVIEW[promptLang(args.lang)]
    return [{ role: 'user', text: [copy.intro, ...copy.questions.map((question, position) => `${position + 1}. ${question}`), copy.rules].join('\n\n') }]
  },
}

export const fitPrompt: McpPrompt = {
  name: 'fit_for_role',
  title: 'Fit for a role',
  description: 'Asks for a job description and checks it against the published evidence with match_job_description.',
  arguments: [{ name: 'job_description', description: 'The full text of the job description.', required: true }, LANG_ARGUMENT],
  render(args) {
    return [{ role: 'user', text: FIT[promptLang(args.lang)](args.job_description?.trim() ?? '') }]
  },
}

export const portfolioPrompts: readonly McpPrompt[] = [interviewPrompt, fitPrompt]