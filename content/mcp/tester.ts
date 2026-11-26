import type { Locale } from '@/lib/i18n/config'

export const TESTER_DEFAULT_TOOL = 'get_case_study'

const VACANCY: Record<Locale, string> = {
  es: [
    'Vacante ficticia: AI Engineer senior',
    '',
    'Requisitos:',
    '- Agentes con herramientas y servidores MCP',
    '- Evals y pruebas automatizadas',
    '- TypeScript, React y Next.js',
    '',
    'Deseable:',
    '- Arquitectura orientada a eventos',
  ].join('\n'),
  en: [
    'Fictional job description: Senior AI Engineer',
    '',
    'Requirements:',
    '- Agents with tools and MCP servers',
    '- Evals and automated tests',
    '- TypeScript, React and Next.js',
    '',
    'Nice to have:',
    '- Event-driven architecture',
  ].join('\n'),
}

export function testerExample(tool: string, lang: Locale): Record<string, unknown> {
  switch (tool) {
    case 'search_portfolio':
      return { query: 'sagas', lang }
    case 'get_case_study':
      return { id: '12', lang }
    case 'get_decisions':
      return { caseId: '12', lang }
    case 'list_posts':
      return { lang }
    case 'match_job_description':
      return { text: VACANCY[lang], lang }
    case 'search':
      return { query: 'Synergos' }
    case 'fetch':
      return { id: `${lang}:project:12` }
    default:
      return { lang }
  }
}