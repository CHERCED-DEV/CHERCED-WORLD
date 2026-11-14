import { formatFact, synergosFacts } from '@/content/synergos'
import type { Locale } from '@/lib/i18n/config'
import type { AssistantFacts } from '@/lib/search/types'
import type { AgentSearchHit } from './tools'

const NAVIGATE: Record<Locale, RegExp> = {
  es: /\b(ll[eé]vame|mu[eé]strame|abre|abrir|ir a|quiero ver|ens[eé]ñame|ver el|ver la|ver los|ver las)\b/i,
  en: /\b(take me|show me|open|go to|i want to see|navigate)\b/i,
}

export type SimulatorIntent = 'greeting' | 'identity' | 'work' | 'contact' | 'projects' | 'best' | 'search'

const INTENTS: Array<[Exclude<SimulatorIntent, 'search'>, RegExp]> = [
  ['identity', /(qui[eé]n eres|qu[eé] eres|c[oó]mo te llamas|who are you|what are you|your name)/i],
  ['work', /(qu[eé] haces|a qu[eé] te dedicas|qu[eé] hace camilo|en qu[eé] trabaja|qui[eé]n es camilo|what do you do|what does camilo do|who is camilo)/i],
  ['contact', /(contact|contrat|escrib|correo|email|hire|whatsapp|hablar con camilo)/i],
  ['best', /(lo mejor|destacad|m[aá]s importante|best|favorite|favorito|highlight)/i],
  ['projects', /(proyectos|portafolio|portfolio|projects|casos)/i],
  ['greeting', /^\s*(hola|buenas|hey|hi|hello|qu[eé] m[aá]s|saludos)\b/i],
]

const COPY = {
  es: {
    greeting:
      '¡Hola! Soy Mini Cherced, en modo simulador: aquí no hay Gemini, solo el buscador del sitio. Escríbeme qué quieres ver.',
    hello: '¡Hola, hola! Pregúntame por los proyectos, Synergos, el blog o el AI Lab, o dime "llévame a" y te llevo.',
    identity: (author: string) =>
      `Soy Mini Cherced, la versión pixel art de ${author} y una IA, no él. En este simulador solo busco en el sitio; con Gemini converso de verdad.`,
    work: (about: string, services: string) => `${about} Ofrece ${services}.`,
    contact: 'Para hablar con Camilo, lo mejor es la página de Contacto: ahí le escribes directo.',
    projects: (titles: string) => `Algunos proyectos: ${titles}. En el portafolio están todos.`,
    best: (pieces: string, tests: string) => `Lo más grande es Synergos: una plataforma de ${pieces} piezas con más de ${tests} tests. ¿Te llevo?`,
    nothing: 'Uy, eso no lo encuentro en el sitio. Prueba con otras palabras o escríbele a Camilo desde Contacto.',
    found: (title: string, more: number) =>
      more > 0 ? `Encontré "${title}" y ${more} ${more === 1 ? 'cosa más' : 'cosas más'}.` : `Encontré "${title}".`,
    going: (title: string) => `Te llevo a "${title}".`,
    and: 'y',
  },
  en: {
    greeting: "Hi! I'm Mini Cherced, in simulator mode: there's no Gemini here, just the site search. Type what you want to see.",
    hello: 'Hey there! Ask me about the projects, Synergos, the blog or the AI Lab, or say "take me to" and I will.',
    identity: (author: string) =>
      `I'm Mini Cherced, the pixel art version of ${author} and an AI, not him. In this simulator I only search the site; with Gemini I really talk.`,
    work: (about: string, services: string) => `${about} He offers ${services}.`,
    contact: 'To talk to Camilo, the Contact page is the way: you write to him directly there.',
    projects: (titles: string) => `Some projects: ${titles}. The portfolio has all of them.`,
    best: (pieces: string, tests: string) => `The biggest one is Synergos: a ${pieces}-piece platform with more than ${tests} tests. Want me to take you there?`,
    nothing: "Oops, I can't find that on the site. Try other words or write to Camilo from Contact.",
    found: (title: string, more: number) => (more > 0 ? `I found "${title}" and ${more} more.` : `I found "${title}".`),
    going: (title: string) => `Taking you to "${title}".`,
    and: 'and',
  },
} as const

export function simulatorGreeting(lang: Locale): string {
  return COPY[lang].greeting
}

export function wantsToNavigate(lang: Locale, text: string): boolean {
  return NAVIGATE[lang].test(text) || NAVIGATE[lang === 'es' ? 'en' : 'es'].test(text)
}

export function intentOf(text: string): SimulatorIntent {
  for (const [intent, pattern] of INTENTS) if (pattern.test(text)) return intent
  return 'search'
}

export function firstSentence(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  const end = clean.search(/[.!?](\s|$)/)
  const sentence = end > 0 ? clean.slice(0, end + 1) : clean
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence
}

function list(items: readonly string[], lang: Locale): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} ${COPY[lang].and} ${items.at(-1)}`
}

export type SimulatorReply = { text: string; open: string | null }

export function simulatorReply(
  lang: Locale,
  question: string,
  hits: readonly AgentSearchHit[],
  facts?: Pick<AssistantFacts, 'author' | 'about' | 'services' | 'projects' | 'pages'>,
): SimulatorReply {
  const copy = COPY[lang]
  const navigate = wantsToNavigate(lang, question)
  const intent = facts ? intentOf(question) : 'search'
  if (facts && intent !== 'search') {
    if (intent === 'greeting') return { text: copy.hello, open: null }
    if (intent === 'identity') return { text: copy.identity(facts.author), open: null }
    if (intent === 'work') {
      const services = list(facts.services.items.slice(0, 3).map((item) => item.title.toLowerCase()), lang)
      return { text: copy.work(firstSentence(facts.about), services), open: null }
    }
    if (intent === 'contact') return { text: copy.contact, open: navigate ? facts.pages.contact.url : null }
    if (intent === 'projects') {
      const titles = list(facts.projects.slice(0, 3).map((project) => project.title), lang)
      return { text: copy.projects(titles), open: navigate ? facts.pages.portfolio.url : null }
    }
    if (intent === 'best') {
      const text = copy.best(formatFact(synergosFacts.pieces, lang), formatFact(synergosFacts.testsAtLeast, lang))
      return { text, open: navigate ? `/${lang}/synergos` : null }
    }
  }
  const top = hits[0]
  if (!top) return { text: copy.nothing, open: null }
  const intro = copy.found(top.titulo, hits.length - 1)
  const detail = firstSentence(top.texto)
  if (navigate && top.ruta.startsWith('/')) return { text: `${intro} ${copy.going(top.titulo)}`, open: top.ruta }
  return { text: detail ? `${intro} ${detail}` : intro, open: null }
}
