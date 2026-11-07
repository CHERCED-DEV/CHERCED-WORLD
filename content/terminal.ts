import { now } from './now'
import { projects } from './projects'
import { site } from './site'
import { formatFloor, synergosFacts } from './synergos'
import type { Locale, Localized, Project, TerminalCommand } from './types'

export const TERMINAL_MAX_INPUT = 80

export const terminalCommands: TerminalCommand[] = [
  {
    name: 'help',
    output: {
      es: 'Comandos: whoami · cat principles.md · cat lemas.md · ls projects/ · ls synergos/ · git log --oneline -1 · cat <lóbulo>.lobe · clear',
      en: 'Commands: whoami · cat principles.md · cat lemas.md · ls projects/ · ls synergos/ · git log --oneline -1 · cat <lobe>.lobe · clear',
    },
  },
  {
    name: 'whoami',
    output: {
      es: `arquitecto · padre adoptivo de ${synergosFacts.capabilities} capacidades · sobrino del tío Bob`,
      en: `architect · foster parent of ${synergosFacts.capabilities} capabilities · Uncle Bob's nephew`,
    },
  },
  { name: 'cat principles.md', generated: 'principles' },
  { name: 'cat lemas.md', generated: 'mottos' },
  { name: 'ls projects/', generated: 'projects' },
  { name: 'ls synergos/', generated: 'synergos' },
  {
    name: 'git log --oneline -1',
    output: {
      es: 'feat(arquitecto): decidió salir a producción desde el celular',
      en: 'feat(architect): decided to ship to production from his phone',
    },
  },
  { name: 'clear', generated: 'clear' },
]

export const terminalNotFound: Localized = {
  es: 'comando no encontrado: {cmd}. Prueba con help',
  en: 'command not found: {cmd}. Try help',
}

export const projectSlugs: Record<string, string> = {
  '12': 'synergos',
  '13': 'director-and-lines',
  '2': 'cherced-world-2026',
  '14': 'legal-workspace',
  '15': 'event-bridge',
  '1': 'quantic-theatrum',
  '3': 'airline',
  '4': 'newman-club',
  '5': 'centribal',
  '6': 'my-website',
  '7': 'e-shop',
  '8': 'get-it-done',
  '9': 'studio-ghibli-tracking-system',
  '10': 'studio-ghibli-backoffice',
  '11': 'bookingui-system',
}

export type TerminalLine = { text: string; lang?: 'la'; href?: string }

export type TerminalResult = { kind: 'output'; lines: TerminalLine[] } | { kind: 'clear' } | { kind: 'unknown'; lines: TerminalLine[] }

export function normalizeTerminalInput(input: string): string {
  return input.slice(0, TERMINAL_MAX_INPUT).trim().replace(/\s+/g, ' ').toLowerCase()
}

export function findTerminalCommand(input: string): TerminalCommand | null {
  const name = normalizeTerminalInput(input)
  return terminalCommands.find((command) => command.name.toLowerCase() === name) ?? null
}

function orderedProjects(list: readonly Project[]): Project[] {
  return [...list].sort((a, b) => a.order - b.order)
}

export function terminalLines(command: TerminalCommand, lang: Locale): TerminalLine[] | 'clear' {
  if ('output' in command) {
    return command.output[lang].split('\n').map((text) => (command.lang ? { text, lang: command.lang } : { text }))
  }
  switch (command.generated) {
    case 'clear':
      return 'clear'
    case 'help':
      return terminalCommands.filter((item) => item.name !== 'help').map((item) => ({ text: item.name }))
    case 'principles':
      return (site.about.principles ?? []).map((principle, index) => ({ text: `${index + 1}. ${principle.full[lang]}` }))
    case 'mottos':
      return now.mottos.map((motto, index) =>
        motto.lang ? { text: `${index + 1}. ${motto[lang]}`, lang: motto.lang } : { text: `${index + 1}. ${motto[lang]}` },
      )
    case 'projects':
      return orderedProjects(projects).map((project) => ({
        text: `${projectSlugs[project.id] ?? project.id}/`,
        href: `/${lang}/portfolio/${project.id}`,
      }))
    case 'synergos':
      return [
        {
          text: [
            'cms/',
            `capabilities/ (${synergosFacts.capabilities})`,
            `orchestrators/ (${synergosFacts.orchestrators})`,
            'proxy/',
            `design-system/ (${formatFloor(synergosFacts.designSystemAtLeast, lang)})`,
            `adr/ (${formatFloor(synergosFacts.adrsAtLeast, lang)})`,
          ].join('  '),
        },
      ]
  }
}

export function runTerminal(input: string, lang: Locale): TerminalResult {
  const command = findTerminalCommand(input)
  if (!command) {
    const cmd = input.slice(0, TERMINAL_MAX_INPUT).trim()
    return { kind: 'unknown', lines: [{ text: terminalNotFound[lang].replace('{cmd}', cmd) }] }
  }
  const lines = terminalLines(command, lang)
  return lines === 'clear' ? { kind: 'clear' } : { kind: 'output', lines }
}

export function completeTerminalInput(input: string): string | null {
  const prefix = normalizeTerminalInput(input)
  if (prefix === '') return null
  const matches = terminalCommands.filter((command) => command.name.toLowerCase().startsWith(prefix))
  return matches.length === 1 ? matches[0]!.name : null
}
