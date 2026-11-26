import { miniChercedIdentity } from '@/content/mini-cherced/identity'
import { formatFact, synergosFacts } from '@/content/synergos'
import type { Locale } from '@/lib/i18n/config'
import type { AssistantFacts } from '@/lib/search/types'
import type { PageContext } from './page-context'
import type { AgentSearchHit } from './tools'
import { ANONYMOUS_VIEWER, type AgentViewer } from './viewer'

const NAVIGATE: Record<Locale, RegExp> = {
  es: /\b(ll[eé]vame|mu[eé]strame|abre|abrir|ir a|quiero ver|ens[eé]ñame|ver el|ver la|ver los|ver las)\b/i,
  en: /\b(take me|show me|open|go to|i want to see|navigate)\b/i,
}

export type SimulatorIntent = 'page' | 'whoami' | 'greeting' | 'name' | 'camilo' | 'identity' | 'work' | 'contact' | 'projects' | 'best' | 'search'

const INTENTS: Array<[Exclude<SimulatorIntent, 'search'>, RegExp]> = [
  ['page', /(esta p[aá]gina|d[oó]nde estoy|qu[eé] hay (aqu[ií]|ac[aá])|this page|where am i|what'?s (on )?here)/i],
  [
    'whoami',
    /(qui[eé]n soy|adivina qui[eé]n|sabes qui[eé]n (soy|te habla)|qui[eé]n te habla|me reconoces|me conoces|who am i|guess who|do you know me|do you recognize me)/i,
  ],
  [
    'name',
    /(significa cherced|cherced significa|qu[eé] es cherced(?![-\s]?world)|por qu[eé] (se llama )?cherced|origen del nombre|de d[oó]nde (sale|viene) (el nombre|cherced)|cherced mean|meaning of cherced|why (is it called )?cherced|what is cherced(?![-\s]?world))/i,
  ],
  ['camilo', /(qui[eé]n es camilo|qui[eé]n es el autor|who is camilo|who's camilo|who is the author)/i],
  ['identity', /(qui[eé]n eres|qu[eé] eres|c[oó]mo te llamas|who are you|what are you|your name)/i],
  ['work', /(qu[eé] haces|a qu[eé] te dedicas|qu[eé] hace camilo|en qu[eé] trabaja|what do you do|what does camilo do)/i],
  ['contact', /(contact|contrat|escrib|correo|email|hire|whatsapp|hablar con camilo)/i],
  ['best', /(lo mejor|destacad|m[aá]s importante|best|favorite|favorito|highlight)/i],
  ['projects', /(proyectos|portafolio|portfolio|projects|casos)/i],
  ['greeting', /^\s*(hola|buenas|hey|hi|hello|qu[eé] m[aá]s|saludos)\b/i],
]

const COPY = {
  es: {
    greeting: (pa: string, self: string) =>
      `${pa} Soy Mini Cherced, ${self}, en modo simulador: aquí no hay Gemini, solo el buscador del sitio. Escríbeme qué quieres ver.`,
    greetAuthor: (pa: string, hype: string) =>
      `${pa} ¡Llegó el jefe! ${hype} ¡Añañayyyy! Camilo, estoy en modo simulador: aquí no hay Gemini, solo el buscador del sitio. ¿Qué revisamos?`,
    greetGuest: (pa: string, name: string) =>
      `${pa} A ver, a ver, a ver… ¿${name}? ¿La mismísima ${name}? ¡Bienvenida, visita VIP! Estoy en modo simulador: la sorpresa completa está con Gemini.`,
    greetAccount: (pa: string, name: string, self: string) =>
      `${pa} ${name}, soy Mini Cherced, ${self}, en modo simulador: aquí no hay Gemini, solo el buscador del sitio. ¿Qué quieres ver?`,
    whoamiAuthor: 'Uy, quieto: eres Camilo, mi creador. El sitio me confirmó tu sesión. ¿Qué construimos hoy, jefe?',
    whoamiAccount: (name: string) => `Eres ${name}: entraste con tu cuenta de Google y el sitio me lo cuenta. Mucho gusto.`,
    whoamiAnonymous:
      'No tengo ni idea, y eso que tengo visor. No iniciaste sesión: si entras con Google te saludo por tu nombre. Y si eres Camilo, el sitio me lo tiene que confirmar primero.',
    hello: (pa: string) => `${pa} Pregúntame por Camilo, los proyectos, Synergos, el blog o el AI Lab, o dime "llévame a" y te llevo.`,
    identity: (author: string, self: string) =>
      `Soy Mini Cherced, ${self}: un personaje digital, una IA, no ${author} en persona. En este simulador solo busco en el sitio; con Gemini converso de verdad.`,
    work: (about: string, services: string) => `${about} Ofrece ${services}.`,
    contact: 'Para hablar con Camilo, lo mejor es la página de Contacto: ahí le escribes directo.',
    projects: (titles: string) => `Algunos proyectos: ${titles}. En el portafolio están todos.`,
    best: (pieces: string, tests: string) => `Lo más grande es Synergos: una plataforma de ${pieces} piezas con más de ${tests} tests. ¿Te llevo?`,
    nothing: 'Uy, eso no lo encuentro en el sitio. Prueba con otras palabras o escríbele a Camilo desde Contacto.',
    found: (title: string, more: number) =>
      more > 0 ? `Encontré "${title}" y ${more} ${more === 1 ? 'cosa más' : 'cosas más'}.` : `Encontré "${title}".`,
    going: (title: string) => `Te llevo a "${title}".`,
    page: (title: string, labels: string, first: string) => `Estás en "${title}". Aquí hay ${labels}. Te señalo "${first}".`,
    pageEmpty: (title: string) => `Estás en "${title}". Esta página no tiene secciones para señalar, pero pregúntame lo que quieras de ella.`,
    pageUnknown: 'Desde aquí no alcanzo a ver la página. Ábreme desde el chibi del pie de página y te la recorro.',
    and: 'y',
  },
  en: {
    greeting: (pa: string, self: string) =>
      `${pa} I'm Mini Cherced, ${self}, in simulator mode: there's no Gemini here, just the site search. Type what you want to see.`,
    greetAuthor: (pa: string, hype: string) =>
      `${pa} The boss is here! ${hype} ¡Añañayyyy! Camilo, I'm in simulator mode: no Gemini here, just the site search. What are we checking?`,
    greetGuest: (pa: string, name: string) =>
      `${pa} Wait, wait, wait… ${name}? THE ${name}? Welcome, VIP guest! I'm in simulator mode: the full surprise lives with Gemini.`,
    greetAccount: (pa: string, name: string, self: string) =>
      `${pa} ${name}, I'm Mini Cherced, ${self}, in simulator mode: there's no Gemini here, just the site search. What do you want to see?`,
    whoamiAuthor: "Whoa, freeze: you're Camilo, my creator. The site confirmed your session. What are we building today, boss?",
    whoamiAccount: (name: string) => `You're ${name}: you signed in with Google and the site tells me so. Nice to meet you.`,
    whoamiAnonymous:
      "No clue, and I even have a visor. You haven't signed in: sign in with Google and I'll greet you by name. And if you're Camilo, the site has to confirm it first.",
    hello: (pa: string) => `${pa} Ask me about Camilo, the projects, Synergos, the blog or the AI Lab, or say "take me to" and I will.`,
    identity: (author: string, self: string) =>
      `I'm Mini Cherced, ${self}: a digital character, an AI, not ${author} himself. In this simulator I only search the site; with Gemini I really talk.`,
    work: (about: string, services: string) => `${about} He offers ${services}.`,
    contact: 'To talk to Camilo, the Contact page is the way: you write to him directly there.',
    projects: (titles: string) => `Some projects: ${titles}. The portfolio has all of them.`,
    best: (pieces: string, tests: string) => `The biggest one is Synergos: a ${pieces}-piece platform with more than ${tests} tests. Want me to take you there?`,
    nothing: "Oops, I can't find that on the site. Try other words or write to Camilo from Contact.",
    found: (title: string, more: number) => (more > 0 ? `I found "${title}" and ${more} more.` : `I found "${title}".`),
    going: (title: string) => `Taking you to "${title}".`,
    page: (title: string, labels: string, first: string) => `You're on "${title}". Here you have ${labels}. Let me point at "${first}".`,
    pageEmpty: (title: string) => `You're on "${title}". This page has no sections to point at, but ask me anything about it.`,
    pageUnknown: "I can't see the page from here. Open me from the chibi in the footer and I'll walk you through it.",
    and: 'and',
  },
} as const

export function simulatorGreeting(lang: Locale, viewer: AgentViewer = ANONYMOUS_VIEWER): string {
  const identity = miniChercedIdentity[lang]
  const pa = identity.catchphrases.greet.phrase
  if (viewer.kind === 'author') {
    const hype = identity.hype.slice(1)
    return COPY[lang].greetAuthor(pa, hype[Math.floor(Math.random() * hype.length)] ?? '')
  }
  if (viewer.kind === 'guest') return COPY[lang].greetGuest(pa, viewer.name)
  if (viewer.kind === 'account') return COPY[lang].greetAccount(pa, viewer.name, identity.self)
  return COPY[lang].greeting(pa, identity.self)
}

export function whoAmI(lang: Locale, viewer: AgentViewer): string {
  if (viewer.kind === 'author') return COPY[lang].whoamiAuthor
  if (viewer.kind === 'account' || viewer.kind === 'guest') return COPY[lang].whoamiAccount(viewer.name)
  return COPY[lang].whoamiAnonymous
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

export function pageTitle(title: string): string {
  return title.split(' · ')[0]?.trim() || title
}

export function greetFrom(page: Pick<PageContext, 'path' | 'title'>): string {
  const inLab = /\/ai-lab(\/|$)/.test(page.path)
  return inLab
    ? `Dato de contexto: te abrieron desde el AI Lab (${page.path}).`
    : `Dato de contexto: te abrieron desde la página «${pageTitle(page.title)}» (${page.path}), no desde el AI Lab.`
}

export function simulatorPageReply(lang: Locale, page: PageContext): string {
  const copy = COPY[lang]
  const title = pageTitle(page.title)
  const first = page.sections[0]
  if (!first) return copy.pageEmpty(title)
  const labels = list(page.sections.slice(0, 3).map((section) => `"${section.label}"`), lang)
  return copy.page(title, labels, first.label)
}

export function simulatorReply(
  lang: Locale,
  question: string,
  hits: readonly AgentSearchHit[],
  facts?: Pick<AssistantFacts, 'author' | 'about' | 'services' | 'projects' | 'pages'>,
  viewer: AgentViewer = ANONYMOUS_VIEWER,
): SimulatorReply {
  const copy = COPY[lang]
  const identity = miniChercedIdentity[lang]
  const navigate = wantsToNavigate(lang, question)
  const intent = facts ? intentOf(question) : 'search'
  if (facts && intent !== 'search') {
    if (intent === 'page') return { text: copy.pageUnknown, open: null }
    if (intent === 'whoami') return { text: whoAmI(lang, viewer), open: null }
    if (intent === 'greeting') return { text: copy.hello(identity.catchphrases.greet.phrase), open: null }
    if (intent === 'name') return { text: identity.examples.cherced.answer, open: null }
    if (intent === 'camilo') return { text: identity.examples['who-is-camilo'].answer, open: null }
    if (intent === 'identity') return { text: copy.identity(facts.author, identity.self), open: null }
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
