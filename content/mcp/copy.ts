import type { Locale } from '@/lib/i18n/config'

export type ToolCopy = {
  sources: string
  kinds: Record<'page' | 'project' | 'post' | 'section' | 'skill', string>
  search: { heading: string; none: string }
  cases: { heading: string; pitch: string; hint: string }
  caseStudy: {
    summary: string
    context: string
    role: string
    decisions: string
    why: string
    tradeoff: string
    result: string
    stack: string
    links: string
    live: string
    code: string
    pitch: string
    unknown: string
  }
  decisions: { heading: string; none: string }
  career: { heading: string; pending: string; education: string; languages: string; courses: string; present: string }
  skills: { heading: string; areas: string; level: string; technologies: string }
  posts: { heading: string; none: string; tags: string }
  contact: { heading: string; page: string; email: string; socials: string; cv: string; profile: string }
  match: {
    heading: string
    noRole: string
    deterministic: string
    gemini: string
    coverage: string
    levels: Record<'strong' | 'partial' | 'none', string>
    kinds: Record<'required' | 'nice_to_have', string>
    evidence: string
    questions: string
  }
  fetch: { unknown: string }
  route: { heading: string; minutes: string; proof: string }
}

export const toolCopy: Record<Locale, ToolCopy> = {
  es: {
    sources: 'Fuentes',
    kinds: { page: 'página', project: 'caso', post: 'post', section: 'sección', skill: 'habilidad' },
    search: {
      heading: 'Resultados en el portafolio público',
      none: 'No encontré nada publicado con esa búsqueda. Puedes recorrer el portafolio o el blog.',
    },
    cases: {
      heading: 'Casos del portafolio ({count})',
      pitch: 'con pitch de 60 segundos',
      hint: 'Pide el detalle de un caso con get_case_study y su id.',
    },
    caseStudy: {
      summary: 'Resumen',
      context: 'Contexto',
      role: 'Mi rol',
      decisions: 'Decisiones',
      why: 'Por qué',
      tradeoff: 'Qué se sacrificó',
      result: 'Resultado',
      stack: 'Stack',
      links: 'Enlaces',
      live: 'En vivo',
      code: 'Código',
      pitch: 'Pitch de 60 segundos',
      unknown: 'No existe un caso con ese id. Ids válidos: {ids}.',
    },
    decisions: {
      heading: 'Decisiones de arquitectura ({count} de {total})',
      none: 'No encontré decisiones publicadas con ese filtro.',
    },
    career: {
      heading: 'Carrera',
      pending: 'La carrera todavía no está publicada en el sitio. El CV en PDF está en get_contact_options.',
      education: 'Educación',
      languages: 'Idiomas',
      courses: 'Cursos',
      present: 'hoy',
    },
    skills: {
      heading: 'Habilidades',
      areas: 'Áreas',
      level: 'nivel {level}/100, autoevaluado en el sitio',
      technologies: 'Tecnologías',
    },
    posts: {
      heading: 'Posts del blog ({count})',
      none: 'No hay posts con esa etiqueta.',
      tags: 'Etiquetas disponibles',
    },
    contact: {
      heading: 'Cómo contactar a Camilo',
      page: 'Formulario de contacto',
      email: 'Correo',
      socials: 'Perfiles públicos',
      cv: 'CV en PDF',
      profile: 'Perfil profesional',
    },
    match: {
      heading: 'Encaje con la vacante: {role}',
      noRole: 'vacante sin cargo',
      deterministic:
        'Análisis determinista, sin modelo: cada requisito se busca en la evidencia publicada del sitio con el mismo simulador de «¿Encajo en tu vacante?». No da puntaje y no guarda el texto.',
      gemini: 'El análisis con Gemini está en el AI Lab: {url}',
      coverage: '{covered} de {total} requisitos con evidencia ({requiredCovered} de {required} obligatorios).',
      levels: { strong: 'fuerte', partial: 'parcial', none: 'sin evidencia' },
      kinds: { required: 'obligatorio', nice_to_have: 'deseable' },
      evidence: 'Evidencia',
      questions: 'Preguntas para la entrevista',
    },
    fetch: { unknown: 'No existe un documento con ese id. Usa search para obtener ids válidos.' },
    route: { heading: 'Ruta de 10 minutos', minutes: '{minutes} min', proof: 'Prueba {proof}' },
  },
  en: {
    sources: 'Sources',
    kinds: { page: 'page', project: 'case study', post: 'post', section: 'section', skill: 'skill' },
    search: {
      heading: 'Results in the public portfolio',
      none: 'I found nothing published for that search. You can browse the portfolio or the blog.',
    },
    cases: {
      heading: 'Portfolio case studies ({count})',
      pitch: 'with a 60-second pitch',
      hint: 'Ask for the details of a case with get_case_study and its id.',
    },
    caseStudy: {
      summary: 'Summary',
      context: 'Context',
      role: 'My role',
      decisions: 'Decisions',
      why: 'Why',
      tradeoff: 'What it cost',
      result: 'Result',
      stack: 'Stack',
      links: 'Links',
      live: 'Live',
      code: 'Code',
      pitch: '60-second pitch',
      unknown: 'There is no case study with that id. Valid ids: {ids}.',
    },
    decisions: {
      heading: 'Architecture decisions ({count} of {total})',
      none: 'I found no published decisions for that filter.',
    },
    career: {
      heading: 'Career',
      pending: 'The career section is not published on the site yet. The PDF CV is in get_contact_options.',
      education: 'Education',
      languages: 'Languages',
      courses: 'Courses',
      present: 'present',
    },
    skills: {
      heading: 'Skills',
      areas: 'Areas',
      level: 'level {level}/100, self-assessed on the site',
      technologies: 'Technologies',
    },
    posts: {
      heading: 'Blog posts ({count})',
      none: 'There are no posts with that tag.',
      tags: 'Available tags',
    },
    contact: {
      heading: 'How to contact Camilo',
      page: 'Contact form',
      email: 'Email',
      socials: 'Public profiles',
      cv: 'PDF CV',
      profile: 'Professional profile',
    },
    match: {
      heading: 'Job description match: {role}',
      noRole: 'untitled role',
      deterministic:
        'Deterministic analysis, no model: each requirement is looked up in the evidence published on the site with the same simulator as "Do I fit your role?". It gives no score and does not store the text.',
      gemini: 'The Gemini analysis lives in the AI Lab: {url}',
      coverage: '{covered} of {total} requirements with evidence ({requiredCovered} of {required} required).',
      levels: { strong: 'strong', partial: 'partial', none: 'no evidence' },
      kinds: { required: 'required', nice_to_have: 'nice to have' },
      evidence: 'Evidence',
      questions: 'Interview questions',
    },
    fetch: { unknown: 'There is no document with that id. Use search to get valid ids.' },
    route: { heading: '10-minute route', minutes: '{minutes} min', proof: 'Proof {proof}' },
  },
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match))
}