import type { Locale } from '@/lib/i18n/config'

export const CODE_TOUR_REPO = 'CHERCED-DEV/CHERCED-WORLD'

export const CODE_TOUR_REF = 'dev'

export type CodePiece = { id: string; path: string; title: Record<Locale, string>; hint: Record<Locale, string> }

export const CODE_PIECES: readonly CodePiece[] = [
  {
    id: 'live',
    path: 'lib/ai/agent/live.ts',
    title: { es: 'El cliente de Gemini Live', en: 'The Gemini Live client' },
    hint: { es: 'Cómo habla Mini Cherced: WebSocket, audio, transcripción y herramientas.', en: 'How Mini Cherced talks: WebSocket, audio, transcription and tools.' },
  },
  {
    id: 'glassbox',
    path: 'lib/ailab/search/glassbox.ts',
    title: { es: 'El motor de la caja de cristal', en: 'The glass-box engine' },
    hint: { es: 'Búsqueda BM25 que muestra cada puntaje en vez de esconderlo.', en: 'BM25 search that shows every score instead of hiding it.' },
  },
  {
    id: 'saga',
    path: 'lib/ailab/saga/engine.ts',
    title: { es: 'El simulador de sagas', en: 'The saga simulator' },
    hint: { es: 'Compensación en orden inverso y el cobro al final.', en: 'Compensation in reverse order and the charge at the end.' },
  },
  {
    id: 'session',
    path: 'lib/auth/session.ts',
    title: { es: 'Las guardas de sesión', en: 'The session guards' },
    hint: { es: 'Tokens, hash y vencimientos de las sesiones del panel y las cuentas.', en: 'Tokens, hashing and expiry for panel and account sessions.' },
  },
  {
    id: 'evals',
    path: 'lib/ai/evals/grade.ts',
    title: { es: 'El calificador de las evals', en: 'The evals grader' },
    hint: { es: 'Reglas que califican al agente y bloquean si falla un rechazo.', en: 'Rules that grade the agent and block when a refusal fails.' },
  },
  {
    id: 'design',
    path: 'lib/ai/agent/design.ts',
    title: { es: 'La pizarra de diseño', en: 'The design whiteboard' },
    hint: { es: 'Valida el diagrama del modelo y lo acomoda por capas sin ejecutar nada.', en: 'Validates the model’s diagram and lays it out in layers without running anything.' },
  },
]

export function codePiece(id: unknown): CodePiece | undefined {
  return typeof id === 'string' ? CODE_PIECES.find((piece) => piece.id === id) : undefined
}

export function codeRawUrl(piece: CodePiece): string {
  return `https://raw.githubusercontent.com/${CODE_TOUR_REPO}/${CODE_TOUR_REF}/${piece.path}`
}

export function codeBlobUrl(piece: CodePiece, from?: number, to?: number): string {
  const lines = from ? `#L${from}${to && to !== from ? `-L${to}` : ''}` : ''
  return `https://github.com/${CODE_TOUR_REPO}/blob/${CODE_TOUR_REF}/${piece.path}${lines}`
}
