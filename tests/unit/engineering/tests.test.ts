import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { countByKind, idIndex, testKind, traceRequirements } from '@/lib/engineering/tests'
import { listTracked, trackedReader } from '@/lib/engineering/tracked'

const ROOT = process.cwd()

const id = (kind: 'FR' | 'SC', digits: string) => `${kind}-${digits}`

function walk(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const relative = `${dir}/${name}`
    return statSync(join(ROOT, relative)).isDirectory() ? walk(relative) : [relative]
  })
}

describe('archivos de prueba por tipo (FR-4505)', () => {
  it('clasifica unitarias, de contrato y e2e por carpeta y sufijo, y deja fuera los apoyos', () => {
    expect(testKind('tests/unit/engineering/tests.test.ts')).toBe('unit')
    expect(testKind('tests/contract/tokens.test.ts')).toBe('contract')
    expect(testKind('tests/e2e/integration/mobile-budgets.spec.ts')).toBe('e2e')
    expect(testKind('tests/e2e/integration/support/pages.ts')).toBeNull()
    expect(testKind('tests/contract/repos.contract.ts')).toBeNull()
    expect(testKind('tests/unit/l3/request-mocks.ts')).toBeNull()
    expect(countByKind(['tests/unit/a.test.ts', 'tests/unit/b/c.test.ts', 'tests/contract/d.test.ts', 'tests/e2e/e.spec.ts', 'tests/e2e/f.ts'])).toEqual({ unit: 2, contract: 1, e2e: 1 })
  })

  it('el conteo coincide con un recorrido aparte del árbol versionado', () => {
    const tracked = listTracked(ROOT, ['tests'])
    const counted = countByKind(tracked.files)
    const onDisk = new Set(walk('tests'))
    const byHand = {
      unit: tracked.files.filter((file) => onDisk.has(file) && file.startsWith('tests/unit/') && file.endsWith('.test.ts')).length,
      contract: tracked.files.filter((file) => onDisk.has(file) && file.startsWith('tests/contract/') && file.endsWith('.test.ts')).length,
      e2e: tracked.files.filter((file) => onDisk.has(file) && file.startsWith('tests/e2e/') && file.endsWith('.spec.ts')).length,
    }
    expect(counted).toEqual(byHand)
    expect(counted.unit).toBeGreaterThan(100)
    expect(counted.e2e).toBeGreaterThan(50)
  })
})

describe('requisitos nombrados en alguna prueba (FR-4505)', () => {
  it('busca los ids tal cual, con borde de palabra, y no confunde un id con otro más largo', () => {
    const files = { 'tests/unit/a.test.ts': `it('cumple (${id('FR', '9901')}, ${id('SC', '9901')})')`, 'tests/e2e/b.spec.ts': `test('${id('FR', '99010')}')`, 'lib/c.ts': id('FR', '9902') }
    const index = idIndex(Object.keys(files), (file) => files[file as keyof typeof files] ?? null)
    expect(index.get(id('FR', '9901'))).toEqual(['tests/unit/a.test.ts'])
    expect(index.get(id('SC', '9901'))).toEqual(['tests/unit/a.test.ts'])
    expect(index.get(id('FR', '9902'))).toBeUndefined()
    const trace = traceRequirements([id('FR', '9901'), id('FR', '9902'), id('SC', '9901')], index)
    expect(trace.tested.map((item) => item.id)).toEqual([id('FR', '9901'), id('SC', '9901')])
    expect(trace.untested).toEqual([id('FR', '9902')])
  })

  it('la 006 tiene requisitos citados en tests/e2e/integration/mobile-budgets.spec.ts', () => {
    const tracked = listTracked(ROOT, ['tests'])
    const index = idIndex(tracked.files, trackedReader(ROOT, tracked))
    expect(index.get(id('FR', '602'))).toContain('tests/e2e/integration/mobile-budgets.spec.ts')
    expect(index.get(id('SC', '602'))).toContain('tests/e2e/integration/mobile-budgets.spec.ts')
  })
})
