import { formatFact, synergosFacts } from '@/content/synergos'
import type { Locale } from '@/lib/i18n/config'

export type CasePitch = { caseId: string; approved: boolean; script: Record<Locale, string> }

const S = synergosFacts

export const casePitches: readonly CasePitch[] = [
  {
    caseId: '12',
    approved: true,
    script: {
      es: `Synergos es la plataforma de composición de Camilo: un solo núcleo para muchos negocios, donde el octavo vertical cuesta menos que el primero. El problema era clásico: cada negocio nuevo terminaba siendo otra aplicación que mantener. La decisión clave fue hacer las capacidades agnósticas del dominio y convertir las reglas de arquitectura en tests que rompen el build, cada uno probado fallando antes de confiar en él. Hoy tiene ${S.pieces} piezas desplegables, ${S.capabilities} capacidades y ${S.orchestrators} orquestadores, más de ${formatFact(S.testsAtLeast, 'es')} tests y más de ${S.adrsAtLeast} decisiones documentadas. El tercer y el cuarto orquestador entraron sin una sola capacidad nueva. El stack: .NET 8 y Umbraco para componer, Angular y Web Components para la interfaz, Cloudflare Workers en el borde, y Spec Kit con agentes de IA para construir. El rumbo: pasar de plataforma a fábrica.`,
      en: `Synergos is Camilo’s composition platform: a single core for many businesses, where the eighth vertical costs less than the first. The problem was a classic one: every new business ended up as yet another app to maintain. The key decision was to make capabilities domain-agnostic and to turn architecture rules into tests that break the build, each one proven failing before it is trusted. Today it has ${S.pieces} deployable pieces, ${S.capabilities} capabilities and ${S.orchestrators} orchestrators, more than ${formatFact(S.testsAtLeast, 'en')} tests and more than ${S.adrsAtLeast} documented decisions. The third and fourth orchestrators shipped without a single new capability. The stack: .NET 8 and Umbraco to compose, Angular and Web Components for the interface, Cloudflare Workers at the edge, and Spec Kit with AI agents to build it. The direction: from platform to factory.`,
    },
  },
  {
    caseId: '13',
    approved: true,
    script: {
      es: 'Director y líneas es el modelo con el que Camilo pone a varios agentes de IA a construir Synergos a la vez sin pisarse. Cada línea de trabajo tiene su worktree, su rama y su spec. Una sesión directora es la única que toca lo compartido, y todas siguen la misma constitución y el flujo de Spec Kit: especificar, aclarar, planear, dividir en tareas, analizar e implementar. Las preguntas de arquitectura llegan en lotes con una recomendación, y él decide. ¿El costo? Lo compartido avanza al ritmo del director y los conflictos se ven tarde. ¿El resultado? Cada tarea trazada a su commit y 19 lotes de decisiones resueltos entre octubre y noviembre de 2026, incluida la salida a producción.',
      en: 'Director and lines is the model Camilo uses to have several AI agents build Synergos at the same time without stepping on each other. Each line of work has its own worktree, branch and spec. A director session is the only one that touches shared code, and every line follows the same constitution and the Spec Kit flow: specify, clarify, plan, break into tasks, analyze and implement. Architecture questions arrive in batches with a recommendation, and he decides. The cost? Shared work moves at the director’s pace and conflicts show up late. The result? Every task traced to its commit and 19 batches of decisions resolved between October and November 2026, including the production launch.',
    },
  },
  {
    caseId: '2',
    approved: true,
    script: {
      es: 'Este portafolio es un caso en sí mismo. El sitio de 2023 se rehízo en 2026 sin dejar de ser lo que era: con Spec Kit, una constitución y varias líneas de agentes de IA, cada una dueña exclusiva de sus archivos, la misma idea de los micro-frontends. Corre en Next.js 16 y React 19, en español e inglés, con un AI Lab donde la IA no se cuenta: se prueba, y con Mini Cherced, un agente de voz que conoce todo el sitio. ¿Lo que se sacrifica? Los contratos se congelan por ola y no hay infraestructura nueva que operar. Y una lección: en medio del trabajo apareció un problema de privacidad en producción, y se corrigió con un hotfix antes de seguir. El juicio sigue siendo humano.',
      en: 'This portfolio is a case in itself. The 2023 site was rebuilt in 2026 without stopping being what it was: with Spec Kit, a constitution and several lines of AI agents, each one the exclusive owner of its files, the same idea as micro-frontends. It runs on Next.js 16 and React 19, in Spanish and English, with an AI Lab where AI isn’t described, it’s tried, and with Mini Cherced, a voice agent that knows the whole site. The trade-off? Contracts freeze per wave and there’s no new infrastructure to operate. And one lesson: halfway through, a privacy problem showed up in production and was fixed with a hotfix before moving on. Judgment stays human.',
    },
  },
  {
    caseId: '14',
    approved: true,
    script: {
      es: 'El espacio de trabajo legal es un arnés de agentes que asiste a una abogada sin darle a la IA autoridad sobre el expediente. La decisión central es una frontera de confianza: la persona, el agente y el modelo se tratan como no confiables y hablan por MCP con un núcleo que guarda el estado canónico, los originales y la auditoría. Nada se consolida sin revisión humana, y las reglas se prueban con mutantes. El resultado: un plugin instalable, con su banco de evaluaciones en verde y 13 decisiones de arquitectura documentadas. El stack: Claude Code, MCP, Python y evals.',
      en: 'The legal workspace is an agent harness that assists a lawyer without giving AI authority over the case file. The central decision is a trust boundary: the person, the agent and the model are all treated as untrusted and talk over MCP to a core that keeps the canonical state, the originals and the audit trail. Nothing is consolidated without human review, and the rules are tested with mutants. The result: an installable plugin, with its evaluation suite green and 13 documented architecture decisions. The stack: Claude Code, MCP, Python and evals.',
    },
  },
  {
    caseId: '15',
    approved: true,
    script: {
      es: 'El puente de eventos lleva los eventos de un contact center, llamadas, SMS y WhatsApp, de AWS a Azure. Salen de EventBridge, pasan por Redpanda Connect, que los transforma en YAML, y cruzan a Azure Service Bus, la frontera entre las dos nubes. Del otro lado los consume un microservicio .NET que escala horizontalmente. ¿Qué se sacrifica? Un servicio más que operar, transformaciones que se prueban aparte y la dependencia del formato del origen; por eso el consumidor tiene que ser idempotente. Es la clase de integración que Camilo hace en el día a día: piezas que se hablan sin acoplarse.',
      en: 'The event bridge carries contact-center events, calls, SMS and WhatsApp, from AWS to Azure. They leave EventBridge, go through Redpanda Connect, which transforms them in YAML, and cross into Azure Service Bus, the boundary between the two clouds. On the other side, a horizontally scaling .NET microservice consumes them. The trade-off? One more service to operate, transformations tested separately and a dependency on the source format, which is why the consumer has to be idempotent. It’s the kind of integration Camilo does day to day: pieces that talk without coupling.',
    },
  },
]

export function approvedPitch(caseId: string): CasePitch | undefined {
  return casePitches.find((pitch) => pitch.caseId === caseId && pitch.approved)
}

export function featuredPitches(limit = 3): CasePitch[] {
  return casePitches.filter((pitch) => pitch.approved).slice(0, limit)
}
