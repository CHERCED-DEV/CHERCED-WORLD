import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { classifyStatus, declaredIds, idsIn, ownsId, readSpecs, specFolders, specTitle, statusLine } from '@/lib/engineering/specs'
import { listTracked, trackedReader } from '@/lib/engineering/tracked'

const ROOT = process.cwd()

const id = (kind: 'FR' | 'SC', digits: string) => `${kind}-${digits}`

function spec(file: string): string {
  return readFileSync(join(ROOT, file), 'utf8')
}

const tracked = listTracked(ROOT, ['specs'])
const read = trackedReader(ROOT, tracked)
const specs = readSpecs(tracked.files, read)
const byNumber = new Map(specs.map((item) => [item.number, item]))

describe('estado de cada spec desde su línea «Estado:» (FR-4504)', () => {
  it('clasifica las líneas reales de la 017, la 030 y la 040, y las variantes viejas de la 009 y la 013', () => {
    expect(classifyStatus(statusLine(spec('specs/017-cuentas-e-ingreso/spec.md')))).toBe('building')
    expect(classifyStatus(statusLine(spec('specs/030-modo-entrevista/spec.md')))).toBe('built')
    expect(classifyStatus(statusLine(spec('specs/040-mi-cuenta-como-panel/spec.md')))).toBe('built')
    expect(classifyStatus(statusLine(spec('specs/009-synergos-showcase/spec.md')))).toBe('draft')
    expect(classifyStatus(statusLine(spec('specs/013-scroll-driven/spec.md')))).toBe('building')
  })

  it('cubre los siete estados por palabras clave, sin importar tildes ni mayúsculas', () => {
    expect(classifyStatus('Construida el 2026-11-15 (ver «Cómo quedó»).')).toBe('built')
    expect(classifyStatus('fases 1 y 2 construidas detrás de una bandera')).toBe('built')
    expect(classifyStatus('en construccion, pendiente de revisión')).toBe('building')
    expect(classifyStatus('fase 1 construida; fase 2 en construcción')).toBe('building')
    expect(classifyStatus('aprobada por el autor el 2026-11-14')).toBe('approved')
    expect(classifyStatus('borrador para aprobación del autor')).toBe('draft')
    expect(classifyStatus('Draft, aprobado en boceto por el autor')).toBe('draft')
    expect(classifyStatus('propuesta en revisión')).toBe('proposal')
    expect(classifyStatus(null)).toBe('none')
    expect(classifyStatus('pausada hasta enero')).toBe('other')
  })

  it('lee «Estado:» y «Status:» con o sin negrita, y quita el Markdown del texto', () => {
    expect(statusLine('# 099 — Demo\n\n**Estado:** en curso, ver [el plan](./plan.md).')).toBe('en curso, ver el plan.')
    expect(statusLine('# Demo\n\n**Status**: Draft')).toBe('Draft')
    expect(statusLine('# Demo\n\n| Ola | Qué | Estado |')).toBeNull()
    expect(statusLine(null)).toBeNull()
  })

  it('una carpeta sin spec.md sale como «propuesta» (014, con propuesta.md) o «sin estado» (015, con notas.md), sin error', () => {
    expect(byNumber.get('014')?.status).toBe('proposal')
    expect(byNumber.get('014')?.main).toBe('specs/014-gestor-de-specs/propuesta.md')
    expect(byNumber.get('015')?.status).toBe('none')
    expect(byNumber.get('015')?.main).toBe('specs/015-no-tocar/notas.md')
    expect(byNumber.get('015')?.statusText).toBeNull()
  })

  it('lista todas las carpetas numeradas de specs/, de la 001 a la 050, con su título', () => {
    expect(specs.length).toBeGreaterThanOrEqual(50)
    expect(specs.map((item) => item.number)).toEqual([...new Set(specs.map((item) => item.number))].sort())
    expect(byNumber.get('030')?.title).toBe('Modo entrevista con Mini Cherced')
    expect(byNumber.get('001')?.title).toBe('Evolutivo CHERCED-WORLD 2026')
    expect(byNumber.get('017')?.title).toBe('Cuentas e ingreso con Google')
    expect(specTitle('# Propuesta 014: Cotejo, un gestor', 'gestor-de-specs')).toBe('Cotejo, un gestor')
    expect(specTitle(null, 'release-1')).toBe('release 1')
  })
})

describe('requisitos que declara cada carpeta (FR-4504)', () => {
  it('un id es de la spec cuando su número empieza con el de la spec', () => {
    expect(ownsId('045', id('FR', '4599'))).toBe(true)
    expect(ownsId('045', id('FR', '4199'))).toBe(false)
    expect(ownsId('004', id('FR', '499'))).toBe(true)
    expect(ownsId('004', id('FR', '4099'))).toBe(false)
    expect(ownsId('001', id('FR', '099'))).toBe(true)
    expect(ownsId('001', id('SC', '199'))).toBe(true)
    expect(ownsId('001', id('FR', '299'))).toBe(false)
    expect(ownsId('010', id('FR', '1099'))).toBe(true)
    expect(ownsId('010', id('FR', '199'))).toBe(false)
  })

  it('junta los ids de todos los .md de la carpeta, no solo de spec.md, y deja fuera los que cita de otras specs', () => {
    const own = id('FR', '9901')
    const contract = id('FR', '9902')
    const success = id('SC', '9901')
    const foreign = id('FR', '4199')
    expect(declaredIds('099', [`- **${own}** algo`, `En el contrato: ${contract} y ${success}; ver ${foreign} de la 041.`, null])).toEqual([own, contract, success])
    expect(idsIn(`(${own}, ${success}) y ${own}`)).toEqual([own, success])
  })

  it('la 006 trae también los ids que aparecen en contracts-m0.md', () => {
    const contracts = idsIn(spec('specs/006-movil-vivo/contracts-m0.md')).filter((item) => ownsId('006', item))
    expect(contracts.length).toBeGreaterThan(0)
    const declared = new Set(byNumber.get('006')?.requirements)
    for (const item of contracts) expect(declared.has(item), item).toBe(true)
  })

  it('nunca lee una carpeta privada', () => {
    const folders = specFolders(['specs/099-demo/spec.md', 'specs/099-demo/contracts.md'])
    expect(folders).toEqual([{ number: '099', slug: 'demo', dir: 'specs/099-demo', files: ['specs/099-demo/contracts.md', 'specs/099-demo/spec.md'], main: 'specs/099-demo/spec.md' }])
    expect(specs.every((item) => !item.main?.includes('/privado/'))).toBe(true)
  })
})
