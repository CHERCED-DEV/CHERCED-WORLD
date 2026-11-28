import { COTEJO_MAX_CHARS, COTEJO_MAX_LINES } from './protocol'

export type InputCheck = { ok: true; lines: number } | { ok: false; reason: 'empty' | 'lines' | 'chars'; lines: number }

export function countLines(text: string): number {
  if (text === '') return 0
  const lines = text.split(/\r\n|\n|\r/)
  return lines[lines.length - 1] === '' ? lines.length - 1 : lines.length
}

export function checkInput(text: string): InputCheck {
  const lines = countLines(text)
  if (text.trim() === '') return { ok: false, reason: 'empty', lines }
  if (lines > COTEJO_MAX_LINES) return { ok: false, reason: 'lines', lines }
  if (text.length > COTEJO_MAX_CHARS) return { ok: false, reason: 'chars', lines }
  return { ok: true, lines }
}

export function sourceLines(text: string): string[] {
  return text.split(/\r\n|\n|\r/)
}
