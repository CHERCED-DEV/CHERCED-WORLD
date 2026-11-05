import { describe, expect, it } from 'vitest'
import { completeBrainInput, lobeCommand, resolveBrainCommand, terminalNames, type TerminalTable } from '@/components/site/about/terminalInput'
import { terminalTable } from '@/components/site/about/terminalTable'
import { now } from '@/content/now'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { formatFloor, synergosFacts } from '@/content/synergos'
import { completeTerminalInput, runTerminal, terminalCommands, TERMINAL_MAX_INPUT } from '@/content/terminal'
import type { Locale } from '@/content/types'

const LANGS: Locale[] = ['es', 'en']
const LOBES = (site.about.skills.lobes ?? []).map((lobe) => lobe.id)
const tables: Record<Locale, TerminalTable> = { es: terminalTable('es'), en: terminalTable('en') }

describe('tabla del terminal armada en el servidor con la API de P0 (FR-461)', () => {
  it.each(LANGS)('%s: un resultado por comando de content/terminal.ts, en su orden', (lang) => {
    const table = tables[lang]
    expect(table.commands.map((command) => command.name)).toEqual(terminalCommands.map((command) => command.name))
    for (const command of table.commands) expect(command.result).toEqual(runTerminal(command.name, lang))
    expect(table.maxInput).toBe(TERMINAL_MAX_INPUT)
  })

  it('la tabla solo lleva texto y enlaces internos: nada de HTML ni datos privados', () => {
    const json = JSON.stringify(tables)
    expect(json).not.toMatch(/<(script|img|a|iframe|svg)\b|\bon\w+=/i)
    expect(json).not.toMatch(/mailto:|@gmail|\+57|https?:\/\//)
    for (const lang of LANGS) {
      for (const command of tables[lang].commands) {
        if (command.result.kind === 'clear') continue
        for (const line of command.result.lines) if (line.href) expect(line.href).toMatch(new RegExp(`^/${lang}/portfolio/\\d+$`))
      }
    }
  })
})

describe('resolver lo que se escribe (FR-461)', () => {
  const inputs = [
    'help',
    'whoami',
    'cat principles.md',
    'cat lemas.md',
    'ls projects/',
    'ls synergos/',
    'git log --oneline -1',
    'clear',
    '  WHOAMI  ',
    'LS   PROJECTS/',
    'Git Log --ONELINE -1',
    'sudo rm -rf /',
    '<img src=x onerror=alert(1)>',
    `whoami${' '.repeat(TERMINAL_MAX_INPUT)}tail`,
    'x'.repeat(200),
  ]

  it.each(LANGS)('%s: da lo mismo que runTerminal para cualquier entrada que no sea un lóbulo', (lang) => {
    for (const input of inputs) expect(resolveBrainCommand(input, tables[lang], LOBES), input).toEqual(runTerminal(input, lang))
  })

  it('cada comando responde en su idioma con el copy de contenido.md §15', () => {
    const es = (input: string) => resolveBrainCommand(input, tables.es, LOBES)
    const en = (input: string) => resolveBrainCommand(input, tables.en, LOBES)
    expect(es('whoami')).toEqual({ kind: 'output', lines: [{ text: `arquitecto · padre adoptivo de ${synergosFacts.capabilities} capacidades · sobrino de Uncle Bob` }] })
    expect(en('whoami')).toEqual({ kind: 'output', lines: [{ text: `architect · foster parent of ${synergosFacts.capabilities} capabilities · Uncle Bob's nephew` }] })
    expect(es('git log --oneline -1')).toEqual({ kind: 'output', lines: [{ text: 'feat(arquitecto): decidió salir a producción desde el celular' }] })
    expect(en('git log --oneline -1')).toEqual({ kind: 'output', lines: [{ text: 'feat(architect): decided to ship to production from his phone' }] })
    expect(es('help')).toMatchObject({ kind: 'output', lines: [{ text: expect.stringMatching(/^Comandos: whoami · .*cat <lóbulo>\.lobe · clear$/) }] })
    expect(en('help')).toMatchObject({ kind: 'output', lines: [{ text: expect.stringMatching(/^Commands: whoami · .*cat <lobe>\.lobe · clear$/) }] })
    expect(es('clear')).toEqual({ kind: 'clear' })
  })

  it('cat principles.md numera los cinco principios y cat lemas.md marca el latín solo en la línea 2', () => {
    const principles = resolveBrainCommand('cat principles.md', tables.en, LOBES)
    expect(principles).toEqual({ kind: 'output', lines: site.about.principles!.map((principle, index) => ({ text: `${index + 1}. ${principle.full.en}` })) })
    const mottos = resolveBrainCommand('cat lemas.md', tables.es, LOBES)
    expect(mottos).toEqual({
      kind: 'output',
      lines: [{ text: '1. Siembra bondad, cosecha excelencia.' }, { text: '2. Veni, vidi, vici.', lang: 'la' }],
    })
    expect(now.mottos.filter((motto) => motto.lang === 'la')).toHaveLength(1)
  })

  it('ls projects/ sale de projects.ts en el orden del portafolio y enlaza cada caso; ls synergos/ de la fuente única', () => {
    const list = resolveBrainCommand('ls projects/', tables.es, LOBES)
    const ordered = [...projects].sort((a, b) => a.order - b.order)
    expect(list.kind).toBe('output')
    if (list.kind !== 'output') return
    expect(list.lines).toHaveLength(projects.length)
    expect(list.lines.map((line) => line.href)).toEqual(ordered.map((project) => `/es/portfolio/${project.id}`))
    expect(list.lines[0]!.text).toBe('synergos/')
    const synergos = resolveBrainCommand('ls synergos/', tables.en, LOBES)
    expect(synergos).toEqual({
      kind: 'output',
      lines: [
        {
          text: `cms/  capabilities/ (${synergosFacts.capabilities})  orchestrators/ (${synergosFacts.orchestrators})  proxy/  design-system/ (${formatFloor(synergosFacts.designSystemAtLeast, 'en')})  adr/ (${formatFloor(synergosFacts.adrsAtLeast, 'en')})`,
        },
      ],
    })
  })

  it('un comando desconocido sugiere help y devuelve la entrada como texto, cortada a 80', () => {
    expect(resolveBrainCommand('sudo', tables.es, LOBES)).toEqual({ kind: 'unknown', lines: [{ text: 'comando no encontrado: sudo. Prueba con help' }] })
    expect(resolveBrainCommand('sudo', tables.en, LOBES)).toEqual({ kind: 'unknown', lines: [{ text: 'command not found: sudo. Try help' }] })
    const long = resolveBrainCommand('y'.repeat(200), tables.en, LOBES)
    expect(long.kind).toBe('unknown')
    if (long.kind === 'unknown') expect(long.lines[0]!.text).toBe(`command not found: ${'y'.repeat(TERMINAL_MAX_INPUT)}. Try help`)
  })

  it('cat <lóbulo>.lobe sigue funcionando, sin distinguir mayúsculas; un lóbulo inexistente no', () => {
    for (const id of LOBES) expect(resolveBrainCommand(lobeCommand(id), tables.es, LOBES)).toEqual({ kind: 'lobe', id })
    expect(resolveBrainCommand('  CAT   Architecture.LOBE ', tables.en, LOBES)).toEqual({ kind: 'lobe', id: 'architecture' })
    expect(resolveBrainCommand('cat craft.lobe', tables.es, LOBES)).toEqual({ kind: 'unknown', lines: [{ text: 'comando no encontrado: cat craft.lobe. Prueba con help' }] })
  })

  it('Enter con la entrada vacía no escribe nada', () => {
    expect(resolveBrainCommand('   ', tables.es, LOBES)).toEqual({ kind: 'empty' })
  })
})

describe('Tab completa solo con una coincidencia única (FR-461)', () => {
  const names = terminalNames(tables.es, LOBES)
  const complete = (input: string) => completeBrainInput(input, names, TERMINAL_MAX_INPUT)

  it('completa comandos y lóbulos', () => {
    expect(complete('he')).toBe('help')
    expect(complete('WHO')).toBe('whoami')
    expect(complete('ls p')).toBe('ls projects/')
    expect(complete('ls s')).toBe('ls synergos/')
    expect(complete('git')).toBe('git log --oneline -1')
    expect(complete('cat l')).toBe('cat lemas.md')
    expect(complete('cat f')).toBe('cat frontend.lobe')
    expect(complete('cat ba')).toBe('cat backend-cloud.lobe')
    expect(complete('cat bu')).toBe('cat business.lobe')
  })

  it('devuelve null para dejar pasar el Tab: vacía, ambigua o sin coincidencia', () => {
    for (const input of ['', '   ', 'ls', 'cat ', 'cat p', 'cat a', 'cat b', 'zzz', 'help me']) expect(complete(input), input).toBeNull()
  })

  it('coincide con completeTerminalInput de P0 en todo prefijo que no choca con un lóbulo', () => {
    const prefixes = terminalCommands.flatMap((command) => [...command.name].map((_, index) => command.name.slice(0, index + 1)))
    for (const prefix of prefixes) {
      const lobeHit = LOBES.some((id) => lobeCommand(id).startsWith(prefix.toLowerCase().trim()))
      if (!lobeHit) expect(complete(prefix), prefix).toBe(completeTerminalInput(prefix))
    }
  })
})
