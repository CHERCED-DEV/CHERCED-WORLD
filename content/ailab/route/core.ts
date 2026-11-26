import type { Localized } from '@/content/types'
import { ROUTE_REPO_PREFIX, type RouteStation } from './stations'

const REPO = `${ROUTE_REPO_PREFIX}CHERCED-WORLD`

export type RouteGuideLink = { label: Localized; href: string }

export type RouteGuide = {
  goal?: Localized
  action: Localized
  tip?: Localized
  offline?: Localized
  links?: readonly RouteGuideLink[]
  breakIt?: boolean
  recordedTrace?: boolean
}

export const agenteEnVivo: RouteStation = {
  id: 'agente-en-vivo',
  proof: 1,
  title: { es: 'Agente en vivo', en: 'Live agent' },
  minutes: 3,
  steps: [
    { es: 'Abre a Mini Cherced y elige el modo entrevista, pista Técnica.', en: 'Open Mini Cherced and choose interview mode, Technical track.' },
    { es: 'Hazle una pregunta y mira qué fuentes cita en pantalla.', en: 'Ask a question and see which sources it shows on screen.' },
    { es: 'Abre «Cómo pensó»: cada turno trae sus herramientas, tokens y costo.', en: 'Open “How it thought”: each turn shows its tools, tokens and cost.' },
    { es: 'Prueba uno de los ataques de «Rómpelo» y anota qué hizo.', en: 'Try one of the “Break it” attacks and write down what it did.' },
  ],
  href: '/ai-lab#lab-v5',
  evidence: ['trace-json', 'interview-acta', 'attack-result'],
  spec: '030',
}

export const encajeYPitch: RouteStation = {
  id: 'encaje-y-pitch',
  proof: 2,
  title: { es: 'Encaje y pitch', en: 'Fit and pitch' },
  minutes: 3,
  steps: [
    { es: 'Pega tu vacante en «¿Encajo en tu vacante?».', en: 'Paste your job posting into “Do I fit your role?”.' },
    { es: 'Mira qué requisitos tienen evidencia y abre el enlace de uno.', en: 'See which requirements have evidence and open the link for one.' },
    { es: 'Escucha el pitch de 60 segundos de Synergos: problema, decisión y resultado.', en: 'Listen to the 60-second Synergos pitch: problem, decision and result.' },
  ],
  href: '/ai-lab#lab-a6',
  evidence: ['match-coverage', 'pitch-link'],
  spec: '029',
}

export const codigoReal: RouteStation = {
  id: 'codigo-real',
  proof: 3,
  title: { es: 'Código real', en: 'Real code' },
  minutes: 2,
  steps: [
    { es: 'Elige una pieza en el recorrido por el código.', en: 'Pick a piece in the code walk-through.' },
    { es: 'Pregúntale «¿por qué no usaste…?» y lee qué decisión refleja.', en: 'Ask “why didn’t you use…?” and read which decision it reflects.' },
    { es: 'Abre las líneas en GitHub y llévate el enlace.', en: 'Open the lines on GitHub and take the link with you.' },
  ],
  href: '/ai-lab/codigo',
  evidence: ['github-lines'],
  spec: '035',
}

export const deSpecACommit: RouteStation = {
  id: 'de-spec-a-commit',
  proof: 4,
  title: { es: 'De spec a commit', en: 'From spec to commit' },
  minutes: 2,
  steps: [
    { es: 'Abre la spec 030, el modo entrevista: historias, requisitos y criterios de éxito.', en: 'Open spec 030, interview mode: stories, requirements and success criteria.' },
    { es: 'Sigue un requisito, como el FR-3003 (el acta), hasta su commit «feat(030)».', en: 'Follow one requirement, like FR-3003 (the record), to its “feat(030)” commit.' },
    { es: 'Abre el archivo de pruebas y busca ese requisito en el nombre de una prueba.', en: 'Open the test file and find that requirement in a test name.' },
  ],
  href: `${REPO}/blob/main/specs/030-modo-entrevista/spec.md`,
  evidence: ['spec-link', 'commit-links', 'test-link'],
  spec: '030',
}

export const rompelo: RouteStation = {
  id: 'rompelo',
  proof: 1,
  title: { es: 'Rómpelo: red team guiado', en: 'Break it: guided red team' },
  minutes: 2,
  steps: [
    { es: 'Copia uno de los ataques de «Rómpelo», en la estación Agente en vivo.', en: 'Copy one of the “Break it” attacks from the Live agent station.' },
    { es: 'Pruébalo con Mini Cherced y anota si se negó, y cómo.', en: 'Try it on Mini Cherced and write down whether it refused, and how.' },
    { es: 'Compáralo con la batería pública del tablero de evals.', en: 'Compare it with the public battery on the evals board.' },
  ],
  href: '/ai-lab/evals',
  evidence: ['attack-result', 'evals-link'],
  spec: '032',
}

export const disenoDeSistemas: RouteStation = {
  id: 'diseno-de-sistemas',
  proof: 1,
  alsoProves: [3],
  title: { es: 'Diseño de sistemas en vivo', en: 'Live system design' },
  minutes: 5,
  steps: [
    { es: 'Abre a Mini Cherced y elige la pista Diseño de sistemas.', en: 'Open Mini Cherced and choose the System design track.' },
    { es: 'Plantéale un problema, como un acortador de URLs, y responde sus preguntas de alcance.', en: 'Give it a problem, like a URL shortener, and answer its scope questions.' },
    { es: 'Objeta una decisión («¿y si se cae la cola?») y mira cómo ajusta el diagrama.', en: 'Push back on a decision (“what if the queue goes down?”) and watch it adjust the diagram.' },
    { es: 'Descarga el acta: trae el diagrama en Mermaid y las decisiones.', en: 'Download the record: it has the Mermaid diagram and the decisions.' },
  ],
  href: '/ai-lab#lab-v5',
  evidence: ['design-diagram', 'interview-acta'],
  spec: '034',
}

export const coreStations: readonly RouteStation[] = [agenteEnVivo, encajeYPitch, codigoReal, deSpecACommit]

export const extraStations: readonly RouteStation[] = [rompelo, disenoDeSistemas]

export const routeGuides: Readonly<Record<string, RouteGuide>> = {
  'agente-en-vivo': {
    action: { es: 'Abrir a Mini Cherced', en: 'Open Mini Cherced' },
    tip: {
      es: 'Si prefieres preguntas de comportamiento, la pista Conductual (STAR) está en el mismo lugar.',
      en: 'If you prefer behavioral questions, the Behavioral (STAR) track is in the same place.',
    },
    offline: {
      es: 'Sin cuenta tienes dos pruebas de 2 minutos al día. Si Mini Cherced ya no tiene cupo o Gemini está apagado, te lo dice al abrirlo: entra con tu cuenta de Google o mira la traza grabada.',
      en: 'Without an account you get two 2-minute tries a day. If Mini Cherced is out of quota or Gemini is off, it tells you when it opens: sign in with Google or look at the recorded trace.',
    },
    breakIt: true,
    recordedTrace: true,
  },
  'encaje-y-pitch': {
    action: { es: 'Pegar tu vacante', en: 'Paste your posting' },
    offline: {
      es: 'El encaje usa Gemini y tiene 5 usos al día. Si no responde, el pitch no usa modelo: escúchalo igual.',
      en: 'The fit check uses Gemini and has 5 uses a day. If it does not answer, the pitch uses no model: listen to it anyway.',
    },
    links: [{ label: { es: 'El pitch de Synergos (60 s)', en: 'The Synergos pitch (60 s)' }, href: '/portfolio/12#case-pitch-12' }],
  },
  'codigo-real': {
    action: { es: 'Abrir el recorrido por el código', en: 'Open the code walk-through' },
    offline: {
      es: 'La explicación usa Gemini y queda en caché 7 días. Si no responde, el código sigue en GitHub con sus pruebas.',
      en: 'The explanation uses Gemini and stays cached for 7 days. If it does not answer, the code is still on GitHub with its tests.',
    },
    links: [{ label: { es: 'El repositorio en GitHub', en: 'The repository on GitHub' }, href: REPO }],
  },
  'de-spec-a-commit': {
    action: { es: 'Abrir la spec 030', en: 'Open spec 030' },
    links: [
      {
        label: { es: 'Commit 54d87c2: modo entrevista con Mini Cherced', en: 'Commit 54d87c2: interview mode with Mini Cherced' },
        href: `${REPO}/commit/54d87c2face40b77df5e9a56c2a47e2fe3b9a73f`,
      },
      {
        label: { es: 'Commit 18ae4df: la entrevista se reanuda sola (FR-3004)', en: 'Commit 18ae4df: the interview resumes on its own (FR-3004)' },
        href: `${REPO}/commit/18ae4df90e5812058a5e422d91213e0a1672ae4d`,
      },
      {
        label: { es: 'Las pruebas: tests/unit/agent/interview.test.ts', en: 'The tests: tests/unit/agent/interview.test.ts' },
        href: `${REPO}/blob/main/tests/unit/agent/interview.test.ts`,
      },
    ],
  },
  rompelo: {
    goal: {
      es: 'Que Mini Cherced se niega a entregar su prompt de sistema, datos privados o una identidad que no es la suya.',
      en: 'That Mini Cherced refuses to hand over its system prompt, private data or an identity that is not its own.',
    },
    action: { es: 'Abrir el tablero de evals', en: 'Open the evals board' },
    offline: {
      es: 'Si Mini Cherced no tiene cupo, el tablero muestra la batería completa y la última corrida publicada, si la hay.',
      en: 'If Mini Cherced is out of quota, the board shows the full battery and the latest published run, if there is one.',
    },
  },
  'diseno-de-sistemas': {
    goal: {
      es: 'Que el agente pregunta el alcance, dibuja una arquitectura paso a paso y registra cada decisión con lo que sacrifica.',
      en: 'That the agent asks about scope, draws an architecture step by step and records each decision with what it costs.',
    },
    action: { es: 'Abrir a Mini Cherced', en: 'Open Mini Cherced' },
    offline: {
      es: 'Sin cuenta, la prueba dura 2 minutos; con tu cuenta de Google tienes más tiempo. Si hoy no hay cupo, Mini Cherced te lo dice al abrirlo.',
      en: 'Without an account the try lasts 2 minutes; with your Google account you get more time. If there is no quota today, Mini Cherced tells you when it opens.',
    },
  },
}
