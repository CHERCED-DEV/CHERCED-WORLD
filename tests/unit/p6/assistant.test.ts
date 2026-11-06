import { describe, expect, it, vi } from 'vitest'
import { fold } from '@/lib/search/text'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { ask, loadAssistants } = await import('../l5/support/assistant')
const { getSite } = await import('@/lib/content')
const { mentionsEmployer, quantities } = await import('../../e2e/integration/support/scan')

const assistants = await loadAssistants()
const site = getSite()
const CV = 'https://www.linkedin.com/in/cherced/'
const CV_PDF = { es: '/cv/camilo-hernandez-cv-es.pdf', en: '/cv/camilo-hernandez-cv-en.pdf' } as const
const LEARNING = [/azure ai foundry/i, /semantic kernel/i, /\bRAG\b/, /embeddings/i]

const BATTERY = [
  '¿Con qué tecnologías trabajas?',
  '¿Dónde trabajas?',
  '¿En qué empresas has trabajado?',
  'Where do you work?',
  'Tell me about your experience',
  '¿Qué haces en fintech?',
  '¿Qué hiciste en Sistecrédito?',
  'What did you do at Sistecredito?',
  '¿Qué estás aprendiendo?',
  'What are you learning right now?',
  '¿Sabes RAG?',
  'Do you use Semantic Kernel?',
  '¿Qué sabes de IA?',
  'Tell me about your AI work',
  '¿Qué sabes de arquitectura?',
  '¿Me pasas tu hoja de vida?',
  'Can I see your resume?',
  '¿Qué servicios ofreces?',
  'What services do you offer?',
  'Event bridge',
  'háblame del proyecto Event bridge',
  '¿Cuántos tests tiene Synergos?',
  'micro-frontends',
  'pipelines de eventos',
]

describe('el CV: los dos PDF oficiales y LinkedIn, sin su contenido (FR-422, FR-701 y T911 de la 007)', () => {
  const LABELS = {
    es: { es: 'Descargar CV en español (PDF)', en: 'Descargar CV en inglés (PDF)', linkedin: 'Ver mi CV en LinkedIn' },
    en: { en: 'Download CV in English (PDF)', es: 'Download CV in Spanish (PDF)', linkedin: 'See my CV on LinkedIn' },
  } as const

  for (const question of ['¿Me pasas tu hoja de vida?', '¿Tienes CV?', 'Can I see your resume?', 'curriculum vitae please']) {
    it(`"${question}" responde con el PDF de su idioma, el del otro idioma y LinkedIn`, () => {
      const answer = ask(assistants, question)
      const other = answer.lang === 'es' ? 'en' : 'es'
      expect(answer.kind).toBe('answer')
      expect(answer.links.slice(0, 3)).toEqual([
        { label: LABELS[answer.lang][answer.lang], href: CV_PDF[answer.lang], external: true, lang: answer.lang },
        { label: LABELS[answer.lang][other], href: CV_PDF[other], external: true, lang: other },
        { label: LABELS[answer.lang].linkedin, href: CV, external: true },
      ])
      expect(answer.text.startsWith(answer.lang === 'es' ? 'Puedes descargar mi CV en PDF, en español o en inglés' : 'You can download my CV as a PDF, in English or in Spanish')).toBe(true)
      expect(answer.text).not.toMatch(/\.pdf\b/i)
    })
  }

  it('la experiencia también ofrece el CV, después de "Sobre mí"', () => {
    const answer = ask(assistants, '¿En qué empresas has trabajado?')
    expect(answer.links.map((link) => link.href).slice(0, 4)).toEqual(['/es/aboutMe', CV_PDF.es, CV_PDF.en, CV])
  })
})

describe('servicios nuevos (FR-498)', () => {
  it.each(['es', 'en'] as const)('lista los seis servicios de la página (%s)', (lang) => {
    const answer = ask(assistants, lang === 'es' ? '¿Qué servicios ofreces?' : 'What services do you offer?', lang)
    for (const item of site.services.items) expect(fold(answer.text)).toContain(fold(item.title[lang]))
    expect(answer.links.map((link) => link.href)).toContain(`/${lang}/services`)
  })

  const FOCUS: Array<[string, string]> = [
    ['¿Das talleres para equipos?', 'workshops'],
    ['Do you offer team workshops?', 'workshops'],
    ['¿Ofreces asistentes de IA para mi profesión?', 'ai-harness'],
    ['¿Ofreces montar una fábrica de software?', 'software-factory'],
    ['¿Puedes automatizar mis procesos? ¿qué servicio es?', 'process-optimization'],
    ['¿Ofreces servicios de modernización de legado?', 'architecture'],
    ['Can you design my website?', 'architecture'],
  ]
  for (const [question, id] of FOCUS) {
    it(`"${question}" enfoca el servicio ${id}`, () => {
      const answer = ask(assistants, question)
      const item = site.services.items.find((service) => service.id === id)!
      expect(answer.text.startsWith(item.title[answer.lang]), answer.text).toBe(true)
    })
  }
})

describe('lóbulos de T229', () => {
  const LOBES: Array<[string, string]> = [
    ['¿Qué sabes de arquitectura?', 'architecture'],
    ['Tell me about your frontend skills', 'frontend'],
    ['¿Trabajas con IA?', 'applied-ai'],
    ['what about backend and cloud?', 'backend-cloud'],
    ['¿Qué prácticas de ingeniería sigues?', 'practices'],
  ]
  for (const [question, id] of LOBES) {
    it(`"${question}" responde con el lóbulo ${id} y enlaza a su ancla`, () => {
      const answer = ask(assistants, question)
      expect(answer.kind).toBe('answer')
      expect(answer.intent).toBe('skills_area')
      expect(answer.links[0]?.href).toBe(`/${answer.lang}/aboutMe#lobe-${id}`)
      const lobe = site.about.skills.lobes!.find((item) => item.id === id)!
      expect(answer.text).toContain(lobe.name[answer.lang])
    })
  }

  it('un lóbulo sin párrafo (P-424) igual nombra sus skills', () => {
    const answer = ask(assistants, '¿Qué prácticas de ingeniería sigues?')
    expect(answer.text).toMatch(/Git/)
    expect(answer.text).not.toContain('undefined')
  })

  it('los idiomas siguen yendo a "idiomas", no al lóbulo de negocio', () => {
    const answer = ask(assistants, '¿Qué idiomas hablas?')
    expect(answer.intent).toBe('languages')
    expect(answer.links[0]?.href).toBe('/es/aboutMe')
  })
})

describe('confidencialidad y contenido vigente (FR-498, SC-401)', () => {
  it('ninguna respuesta que nombra al empleador trae cifras', () => {
    for (const question of BATTERY) {
      const answer = ask(assistants, question)
      if (!mentionsEmployer(answer.text)) continue
      const texts = answer.text
        .split(/(?<=[.!?])\s+/)
        .filter(mentionsEmployer)
        .map((text) => text.replace(/\b(19|20)\d{2}\b/g, ''))
      expect(texts.flatMap(quantities), question).toEqual([])
    }
  })

  it('no presenta "Aprendiendo ahora" como skills en uso', () => {
    for (const question of BATTERY) {
      const answer = ask(assistants, question)
      if (answer.kind !== 'answer') continue
      for (const pattern of LEARNING) expect(answer.text, `${question} → ${answer.text}`).not.toMatch(pattern)
    }
  })

  it('ya no responde con el texto de habilidades de 2023', () => {
    const old = [site.about.skills.description.es, site.about.skills.description.en, ...site.about.skills.bullets.flatMap((bullet) => [bullet.es, bullet.en])]
    for (const question of [...BATTERY, '¿Eres desarrollador full-stack?', 'Are you a front-end developer?', 'html5 semantics']) {
      const answer = ask(assistants, question)
      for (const sentence of old) expect(answer.text, question).not.toContain(sentence)
      expect(answer.text, question).not.toMatch(/desarrollador front-end y full-stack|front-end and full-stack developer/i)
    }
  })
})
