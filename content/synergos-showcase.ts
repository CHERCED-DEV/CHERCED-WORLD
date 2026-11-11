import type { Localized } from './types'
import { synergosFacts } from './synergos'

export type ShowcaseLineState = 'active' | 'closed' | 'paused'

export type ShowcaseLineKind = 'platform' | 'vertical'

export type ShowcaseLine = {
  id: string
  name: Localized
  does: Localized
  state: ShowcaseLineState
  kind: ShowcaseLineKind
  done: number
  total: number
}

export type ShowcaseMilestoneState = 'done' | 'doing' | 'todo'

export type ShowcaseMilestone = {
  id: string
  text: Localized
  detail?: Localized
  state: ShowcaseMilestoneState
}

export const SYNERGOS_PATH = '/synergos'

export const SYNERGOS_CASE_ID = '12'

export const SYNERGOS_BUILD_CASE_ID = '13'

export const SYNERGOS_HARNESS_REPO = 'Synergos.Fabrica'

const lines: ShowcaseLine[] = [
  {
    id: '001',
    name: { es: 'Núcleo', en: 'Core' },
    does: {
      es: 'La maquinaria genérica que usan todos los verticales: saga, puerta del CMS, pasos y contratos',
      en: 'The generic machinery every vertical uses: saga, CMS gate, steps and contracts',
    },
    state: 'active',
    kind: 'platform',
    done: 102,
    total: 104,
  },
  {
    id: '002',
    name: { es: 'Producción', en: 'Production' },
    does: {
      es: 'Que la app salga a producción y se pueda volver a desplegar sin consola, con ensayo',
      en: 'Getting the app to production and redeploying it without a console, with a dry run',
    },
    state: 'active',
    kind: 'platform',
    done: 59,
    total: 59,
  },
  {
    id: '003',
    name: { es: 'Salud', en: 'Health' },
    does: {
      es: 'La cita médica y después el módulo de salud entero, en 8 incrementos',
      en: 'The medical appointment, then the whole health module, in 8 increments',
    },
    state: 'active',
    kind: 'vertical',
    done: 58,
    total: 66,
  },
  {
    id: '012',
    name: { es: 'Blogs/Social', en: 'Blogs/Social' },
    does: {
      es: 'Una red de publicaciones con comentarios y moderación, compuesta por páginas desde Umbraco',
      en: 'A network of posts with comments and moderation, composed page by page from Umbraco',
    },
    state: 'active',
    kind: 'vertical',
    done: 18,
    total: 37,
  },
  {
    id: '004',
    name: { es: 'Tienda', en: 'Store' },
    does: { es: 'La compra con devolución', en: 'Purchase with returns' },
    state: 'closed',
    kind: 'vertical',
    done: 49,
    total: 58,
  },
  {
    id: '005',
    name: { es: 'Alquiler', en: 'Rentals' },
    does: { es: 'Renta de equipos con garantía retenida', en: 'Equipment rental with a held deposit' },
    state: 'closed',
    kind: 'vertical',
    done: 49,
    total: 49,
  },
  {
    id: '006',
    name: { es: 'Viajes y Hoteles', en: 'Travel & Hotels' },
    does: {
      es: 'Estadía, vuelo y auto en una sola reserva, con reembolso',
      en: 'Stay, flight and car in a single booking, with refunds',
    },
    state: 'closed',
    kind: 'vertical',
    done: 43,
    total: 44,
  },
  {
    id: '008',
    name: { es: 'Propiedades', en: 'Properties' },
    does: { es: 'La visita con franjas reales', en: 'The viewing, with real time slots' },
    state: 'closed',
    kind: 'vertical',
    done: 36,
    total: 41,
  },
  {
    id: '009',
    name: { es: 'Gobierno', en: 'Government' },
    does: { es: 'El trámite: radicar, revisar, decidir y notificar', en: 'The procedure: file, review, decide and notify' },
    state: 'closed',
    kind: 'vertical',
    done: 41,
    total: 50,
  },
  {
    id: '010',
    name: { es: 'Educación', en: 'Education' },
    does: { es: 'La matrícula a un curso con pago y devolución', en: 'Enrolling in a course, with payment and refund' },
    state: 'closed',
    kind: 'vertical',
    done: 38,
    total: 38,
  },
  {
    id: '011',
    name: { es: 'Booking', en: 'Booking' },
    does: { es: 'La reserva de un servicio por franja, con cobro', en: 'Booking a service by time slot, with payment' },
    state: 'closed',
    kind: 'vertical',
    done: 41,
    total: 44,
  },
  {
    id: '013',
    name: { es: 'Seller', en: 'Seller' },
    does: {
      es: 'La consola del personal de la tienda: pedidos, despacho y devoluciones',
      en: 'The store staff console: orders, shipping and returns',
    },
    state: 'closed',
    kind: 'vertical',
    done: 30,
    total: 38,
  },
  {
    id: '014',
    name: { es: 'Piloto Lego', en: 'Lego pilot' },
    does: {
      es: 'Partir la tienda en capas y componerla por páginas desde Umbraco',
      en: 'Splitting the store into layers and composing it page by page from Umbraco',
    },
    state: 'closed',
    kind: 'platform',
    done: 22,
    total: 22,
  },
  {
    id: '007',
    name: { es: 'Eventos', en: 'Events' },
    does: { es: 'La puerta del recinto y la transferencia', en: 'The venue gate and the transfer' },
    state: 'paused',
    kind: 'vertical',
    done: 1,
    total: 59,
  },
]

const milestones: ShowcaseMilestone[] = [
  {
    id: 'core',
    text: {
      es: 'Núcleo genérico: saga, puerta del CMS, consentimiento, auditoría, firma, documentos y notificaciones',
      en: 'Generic core: saga, CMS gate, consent, audit, signature, documents and notifications',
    },
    state: 'done',
  },
  {
    id: 'lego',
    text: { es: 'Tienda compuesta por piezas desde Umbraco', en: 'Store composed from pieces in Umbraco' },
    detail: { es: 'Piloto del modelo Lego terminado', en: 'Lego model pilot finished' },
    state: 'done',
  },
  {
    id: 'verticals',
    text: { es: 'Siete verticales con su flujo medido', en: 'Seven verticals with their flow measured' },
    detail: {
      es: 'Alquiler, Viajes, Gobierno, Educación, Booking, Propiedades y Seller',
      en: 'Rentals, Travel, Government, Education, Booking, Properties and Seller',
    },
    state: 'done',
  },
  {
    id: 'deploy',
    text: { es: 'Despliegue sin consola, con ensayo', en: 'Console-free deployment, with a dry run' },
    state: 'done',
  },
  {
    id: 'health-i1',
    text: { es: 'Salud I1: la cita real de punta a punta', en: 'Health I1: the real appointment, end to end' },
    state: 'done',
  },
  {
    id: 'health-i2',
    text: { es: 'Salud I2: la historia clínica', en: 'Health I2: the medical record' },
    state: 'doing',
  },
  {
    id: 'blogs-i3',
    text: { es: 'Blogs I3: Umbraco compone la red por páginas', en: 'Blogs I3: Umbraco composes the network page by page' },
    state: 'doing',
  },
  {
    id: 'rest',
    text: { es: 'Salud I3 a I8 y Blogs I4 a I6', en: 'Health I3 to I8 and Blogs I4 to I6' },
    state: 'todo',
  },
  {
    id: 'release',
    text: { es: 'Release único con etiqueta', en: 'Single tagged release' },
    state: 'todo',
  },
]

export const synergosShowcase = {
  countedAt: '2026-11-05',
  lines,
  milestones,
  gates: 92,
  testsCounted: 6675,
  backend: { api: synergosFacts.capabilities, bff: synergosFacts.orchestrators },
  copy: {
    title: { es: 'Synergos, mi proyecto insignia', en: 'Synergos, my flagship project' },
    description: {
      es: 'Mi proyecto insignia: una plataforma de composición donde el octavo vertical de negocio cuesta menos que el primero, construida con agentes de IA en paralelo.',
      en: 'My flagship project: a composition platform where the eighth business vertical costs less than the first, built by AI agents working in parallel.',
    },
    cta: { es: 'Conoce Synergos', en: 'Explore Synergos' },
    hero: {
      eyebrow: { es: 'Mi proyecto insignia', en: 'My flagship project' },
      catalog: { es: 'Ver el catálogo en vivo', en: 'See the live catalog' },
      caseStudy: { es: 'Leer el caso de estudio', en: 'Read the case study' },
      links: { es: 'Enlaces de Synergos', en: 'Synergos links' },
      code: { es: 'El código público', en: 'The public code' },
    },
    what: {
      title: { es: 'Qué es', en: 'What it is' },
      lead: {
        es: 'Un solo núcleo para todos los negocios. La interfaz se compone en tres capas, y lo que cruza la frontera es DOM, no framework.',
        en: 'One core for every business. The interface is composed in three layers, and what crosses the boundary is DOM, not a framework.',
      },
      backend: {
        es: 'Detrás de la composición, un backend .NET con {api} capacidades y {bff} orquestadores.',
        en: 'Behind the composition, a .NET backend with {api} capabilities and {bff} orchestrators.',
      },
    },
    verticals: {
      title: { es: 'Los verticales', en: 'The verticals' },
      lead: {
        es: 'Un solo núcleo sirve a cada negocio sin ramificarse. Así va cada vertical.',
        en: 'One core serves every business without branching. This is where each vertical stands.',
      },
      tasks: { es: '{done} de {total} tareas', en: '{done} of {total} tasks' },
    },
    line: {
      eyebrow: { es: 'Hacia el MVP', en: 'Toward the MVP' },
      title: { es: 'La línea de ensamblaje', en: 'The assembly line' },
      lead: {
        es: 'Synergos se construye con agentes de IA en paralelo: un director integra y {count} líneas trabajan cada una en su propio worktree, con su spec y sus pruebas. Todas convergen en un único release.',
        en: 'Synergos is built by AI agents working in parallel: a director integrates and {count} lines each work in their own worktree, with their own spec and tests. They all converge on a single release.',
      },
      diagram: {
        es: '{count} líneas convergen en el director y luego en el release',
        en: '{count} lines converge on the director, then on the release',
      },
      summary: {
        es: 'Activas: {active}. En pausa: {paused}.',
        en: 'Active: {active}. Paused: {paused}.',
      },
      list: { es: 'Ver las {count} líneas como lista', en: 'See the {count} lines as a list' },
      legend: { es: 'Leyenda', en: 'Legend' },
      director: { es: 'DIRECTOR', en: 'DIRECTOR' },
      release: { es: 'RELEASE', en: 'RELEASE' },
      scope: { es: 'SALUD + BLOGS', en: 'HEALTH + BLOGS' },
    },
    states: {
      active: { es: 'activa', en: 'active' },
      paused: { es: 'en pausa', en: 'paused' },
    },
    mvp: {
      title: { es: 'Hitos del MVP y cifras', en: 'MVP milestones and numbers' },
      milestones: { es: 'Hitos del MVP', en: 'MVP milestones' },
      lead: {
        es: 'Un único release con todo completo: Salud con su módulo entero y Blogs con su plan, más las piezas del núcleo que piden. Hasta entonces nada se despliega, y producción solo sale con una etiqueta de release que pone el director.',
        en: 'A single release with everything complete: Health with its whole module and Blogs with its plan, plus the core pieces they need. Until then nothing is deployed, and production only ships with a release tag set by the director.',
      },
      noDate: { es: 'No hay fecha publicada.', en: 'There is no published date.' },
      states: {
        done: { es: 'hecho', en: 'done' },
        doing: { es: 'en curso', en: 'in progress' },
        todo: { es: 'pendiente', en: 'pending' },
      },
    },
    figures: {
      title: { es: 'En cifras', en: 'By the numbers' },
      counted: { es: 'Conteo del {date}, sobre las specs y el backend.', en: 'Counted on {date}, across the specs and the backend.' },
      lines: { es: 'líneas con su spec', en: 'lines, each with its spec' },
      tasks: { es: 'tareas cerradas', en: 'tasks closed' },
      tasksNote: {
        es: 'Subestima lo pendiente: Salud I3 a I8 y parte de Blogs aún no tienen tareas escritas.',
        en: 'It understates what is left: Health I3 to I8 and part of Blogs have no tasks written yet.',
      },
      tests: { es: 'tests automáticos en el backend', en: 'automated backend tests' },
      testsNote: { es: '{count} en tres suites', en: '{count} across three suites' },
      gates: { es: 'gates de arquitectura', en: 'architecture gates' },
      adrs: { es: 'ADR escritas', en: 'ADRs written' },
    },
    build: {
      title: { es: 'Cómo se construye', en: 'How it is built' },
      caseLink: { es: 'Leer este caso', en: 'Read this case' },
      harness: { es: 'El arnés público del modelo director y líneas.', en: 'The public harness behind the director-and-lines model.' },
      harnessLink: { es: 'Ver el arnés: {repo}', en: 'See the harness: {repo}' },
    },
  },
} as const

export function showcaseTasks(list: readonly ShowcaseLine[] = synergosShowcase.lines): { done: number; total: number } {
  return list.reduce((sum, line) => ({ done: sum.done + line.done, total: sum.total + line.total }), { done: 0, total: 0 })
}

export function showcaseVerticals(list: readonly ShowcaseLine[] = synergosShowcase.lines): ShowcaseLine[] {
  return list.filter((line) => line.kind === 'vertical')
}
