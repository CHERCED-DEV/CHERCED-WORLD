import type { TerminalLine, TerminalResult } from '@/content/terminal'

export type TerminalTable = {
  commands: ReadonlyArray<{ name: string; result: TerminalResult }>
  notFound: string
  maxInput: number
}

export type BrainCommand =
  | { kind: 'empty' }
  | { kind: 'lobe'; id: string }
  | { kind: 'clear' }
  | { kind: 'output'; lines: TerminalLine[] }
  | { kind: 'unknown'; lines: TerminalLine[] }

export const TERMINAL_HISTORY = 20

export function lobeCommand(id: string): string {
  return `cat ${id}.lobe`
}

export function normalizeBrainInput(input: string, max: number): string {
  return input.slice(0, max).trim().replace(/\s+/g, ' ').toLowerCase()
}

export function resolveBrainCommand(input: string, table: TerminalTable, lobeIds: readonly string[]): BrainCommand {
  const name = normalizeBrainInput(input, table.maxInput)
  if (name === '') return { kind: 'empty' }
  const lobe = lobeIds.find((id) => lobeCommand(id).toLowerCase() === name)
  if (lobe) return { kind: 'lobe', id: lobe }
  const command = table.commands.find((item) => item.name.toLowerCase() === name)
  if (command) return command.result
  const cmd = input.slice(0, table.maxInput).trim()
  return { kind: 'unknown', lines: [{ text: table.notFound.replace('{cmd}', cmd) }] }
}

export function terminalNames(table: TerminalTable, lobeIds: readonly string[]): string[] {
  return [...table.commands.map((command) => command.name), ...lobeIds.map(lobeCommand)]
}

export function completeBrainInput(input: string, names: readonly string[], max: number): string | null {
  const prefix = normalizeBrainInput(input, max)
  if (prefix === '') return null
  const matches = names.filter((name) => name.toLowerCase().startsWith(prefix))
  return matches.length === 1 ? matches[0]! : null
}
