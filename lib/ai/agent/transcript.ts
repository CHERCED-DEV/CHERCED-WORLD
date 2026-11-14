export type Speaker = 'you' | 'agent'

export type Turn = { id: number; who: Speaker; text: string; done: boolean }

export const TRANSCRIPT_MAX_TURNS = 40

function joinChunk(previous: string, chunk: string): string {
  if (!previous) return chunk.trimStart()
  if (/^[\s,.;:!?)]/.test(chunk) || /[\s(¿¡]$/.test(previous)) return previous + chunk
  return `${previous} ${chunk}`.replace(/\s{2,}/g, ' ')
}

export function appendChunk(turns: readonly Turn[], who: Speaker, chunk: string, nextId: number): Turn[] {
  if (!chunk.trim()) return [...turns]
  const last = turns.at(-1)
  if (last && last.who === who && !last.done) return [...turns.slice(0, -1), { ...last, text: joinChunk(last.text, chunk) }]
  const closed = turns.map((turn) => (turn.done ? turn : { ...turn, done: true }))
  return [...closed, { id: nextId, who, text: chunk.trim(), done: false }].slice(-TRANSCRIPT_MAX_TURNS)
}

export function addTurn(turns: readonly Turn[], who: Speaker, text: string, nextId: number): Turn[] {
  const closed = turns.map((turn) => (turn.done ? turn : { ...turn, done: true }))
  return [...closed, { id: nextId, who, text: text.trim(), done: true }].slice(-TRANSCRIPT_MAX_TURNS)
}

export function closeTurns(turns: readonly Turn[]): Turn[] {
  return turns.some((turn) => !turn.done) ? turns.map((turn) => ({ ...turn, done: true })) : [...turns]
}

export function lastAgentLine(turns: readonly Turn[]): string {
  for (let index = turns.length - 1; index >= 0; index--) if (turns[index]!.who === 'agent') return turns[index]!.text
  return ''
}
