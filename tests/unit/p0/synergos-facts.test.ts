import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { formatFact, formatFloor, synergosFacts } from '@/content/synergos'
import { runTerminal } from '@/content/terminal'

const ROOT = process.cwd()
const SOURCE_DIRS = ['content', 'components', 'lib', 'app']
const SINGLE_SOURCE = join('content', 'synergos.ts')

const LITERALS: RegExp[] = [
  /\b2[.,]?300\b/,
  /\b130\s?\+/,
  /\bmás de 130\b/i,
  /\b31\s+(piezas|deployable)/i,
  /\b20\s+(capacidades|capabilities)/i,
  /\b9\s+(orquestadores|orchestrators)/i,
]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx|json)$/.test(name) ? [path] : []
  })
}

const synergos = projects.find((project) => project.id === '12')!
const career = site.about.career.find((entry) => entry.id === 'synergos-labs')!

describe('cifras de Synergos con una sola fuente (FR-441, E-09)', () => {
  it('trae los conteos exactos y los pisos con sus fechas', () => {
    expect(synergosFacts).toEqual({
      countedAt: '2026-11-01',
      pieces: 31,
      capabilities: 20,
      orchestrators: 9,
      measuredAt: '2026-08-06',
      testsAtLeast: 2300,
      adrsAtLeast: 130,
      designSystemAtLeast: 130,
    })
    expect(synergosFacts.pieces).toBe(1 + synergosFacts.capabilities + synergosFacts.orchestrators + 1)
  })

  it('formatea según el idioma: 2.300 en ES y 2,300+ en EN', () => {
    expect(formatFact(2300, 'es')).toBe('2.300')
    expect(formatFact(2300, 'en')).toBe('2,300')
    expect(formatFloor(130, 'en')).toBe('130+')
  })

  it('ningún otro archivo de código o diccionario repite las cifras como literal', () => {
    const offenders: string[] = []
    for (const file of SOURCE_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir)))) {
      const path = relative(ROOT, file)
      if (path === SINGLE_SOURCE) continue
      const text = readFileSync(file, 'utf8')
      for (const pattern of LITERALS) if (pattern.test(text)) offenders.push(`${path}: ${pattern}`)
    }
    expect(offenders).toEqual([])
  })

  it('la regla de literales detecta una cifra copiada a mano', () => {
    const copied = ['Más de 2.300 tests', '130+ ADRs', '31 piezas desplegables', '9 orchestrators']
    for (const text of copied) expect(LITERALS.some((pattern) => pattern.test(text)), text).toBe(true)
  })

  it('el caso, la carrera y la terminal dicen las mismas cifras (FR-414, FR-440)', () => {
    const tests = { es: `más de ${formatFact(synergosFacts.testsAtLeast, 'es')} tests`, en: `${formatFloor(synergosFacts.testsAtLeast, 'en')} automated tests` }
    for (const lang of ['es', 'en'] as const) {
      expect(career.description[lang].toLowerCase()).toContain(tests[lang])
      expect(synergos.result?.[lang].toLowerCase()).toContain(tests[lang])
      for (const text of [career.description[lang], synergos.result?.[lang] ?? '']) {
        expect(text).toContain(`${synergosFacts.pieces} `)
        expect(text).toContain(`${synergosFacts.capabilities} `)
        expect(text).toContain(`${synergosFacts.orchestrators} `)
      }
    }
    expect(career.description.es).toContain('Proyecto propio. Diseño y construyo Synergos, una plataforma de composición donde el octavo vertical de negocio cuesta menos que el primero: 31 piezas desplegables (un CMS, 20 capacidades, 9 orquestadores y un proxy), más de 2.300 tests automatizados y más de 130 decisiones de arquitectura documentadas.')
    expect(career.description.en).toContain('31 deployable pieces (a CMS, 20 capabilities, 9 orchestrators and a proxy), 2,300+ automated tests and 130+ documented architecture decisions.')
    const listing = runTerminal('ls synergos/', 'es')
    expect(listing).toEqual({ kind: 'output', lines: [{ text: 'cms/  capabilities/ (20)  orchestrators/ (9)  proxy/  design-system/ (130+)  adr/ (130+)' }] })
  })
})
