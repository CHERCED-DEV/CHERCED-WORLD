import { runTerminal, terminalCommands, terminalNotFound, TERMINAL_MAX_INPUT } from '@/content/terminal'
import type { Locale } from '@/lib/i18n'
import type { TerminalTable } from './terminalInput'

export function terminalTable(lang: Locale): TerminalTable {
  return {
    commands: terminalCommands.map((command) => ({ name: command.name, result: runTerminal(command.name, lang) })),
    notFound: terminalNotFound[lang],
    maxInput: TERMINAL_MAX_INPUT,
  }
}
