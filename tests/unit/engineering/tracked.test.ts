import { describe, expect, it } from 'vitest'
import { isReadablePath, listTracked, toPosix, trackedReader } from '@/lib/engineering/tracked'

const ROOT = process.cwd()

describe('archivos versionados que el tablero puede leer (FR-4507)', () => {
  it('nunca lee carpetas privadas, artefactos del build, secretos ni rutas fuera del repo', () => {
    for (const blocked of [
      'specs/041-pruebame-en-vivo/privado/informe.md',
      'content/mini-cherced/privado/guest-persona.md',
      'specs/045-tablero-de-ingenieria/Privado/notas.md',
      '.engineering/vitest.json',
      'tests/.env.local',
      'node_modules/vitest/index.js',
      '.next/BUILD_ID',
      '.worktrees/L1-ruta/specs/042-ruta-de-10-minutos/spec.md',
      'test-results/captura.png',
      '../fuera/spec.md',
      '/etc/passwd',
      'C:/Users/alguien/spec.md',
      '',
    ]) {
      expect(isReadablePath(blocked), blocked).toBe(false)
    }
    for (const allowed of ['specs/045-tablero-de-ingenieria/spec.md', 'tests/unit/engineering/tracked.test.ts', 'tests/e2e/integration/mobile-budgets.spec.ts']) {
      expect(isReadablePath(allowed), allowed).toBe(true)
    }
    expect(toPosix('.\\specs\\045-tablero-de-ingenieria\\spec.md')).toBe('specs/045-tablero-de-ingenieria/spec.md')
  })

  it('con git usa git ls-files y descarta lo privado, lo que no está bajo specs/ o tests/ y lo que ya no existe', () => {
    const tracked = listTracked(ROOT, ['specs', 'tests'], {
      gitLsFiles: () => [
        'specs/045-tablero-de-ingenieria/spec.md',
        'specs/041-pruebame-en-vivo/privado/nombres.txt',
        'tests/unit/engineering/tracked.test.ts',
        'tests/unit/engineering/tracked.test.ts',
        'lib/engineering/tracked.ts',
        'specs/999-borrada/spec.md',
      ],
      exists: (file) => !file.startsWith('specs/999'),
    })
    expect(tracked.source).toBe('git')
    expect(tracked.files).toEqual(['specs/045-tablero-de-ingenieria/spec.md', 'tests/unit/engineering/tracked.test.ts'])
  })

  it('sin git (un build sin la carpeta .git) recorre el árbol con las mismas exclusiones', () => {
    const tracked = listTracked(ROOT, ['specs'], {
      gitLsFiles: () => null,
      walk: () => ['specs/045-tablero-de-ingenieria/spec.md', 'specs/045-tablero-de-ingenieria/privado/borrador.md'],
      exists: () => true,
    })
    expect(tracked.source).toBe('tree')
    expect(tracked.files).toEqual(['specs/045-tablero-de-ingenieria/spec.md'])
  })

  it('el árbol real de specs/ y tests/ trae esta spec y esta prueba, y nada privado', () => {
    const tracked = listTracked(ROOT)
    expect(tracked.files).toContain('specs/045-tablero-de-ingenieria/spec.md')
    expect(tracked.files.some((file) => file.includes('/privado/'))).toBe(false)
    expect(tracked.files.every((file) => file.startsWith('specs/') || file.startsWith('tests/'))).toBe(true)
  })

  it('el lector solo abre archivos de la lista', () => {
    const read = trackedReader(ROOT, { source: 'tree', files: ['specs/045-tablero-de-ingenieria/spec.md'] })
    expect(read('specs/045-tablero-de-ingenieria/spec.md')).toContain('# 045')
    expect(read('package.json')).toBeNull()
    expect(read('specs/041-pruebame-en-vivo/privado/nombres-prohibidos.txt')).toBeNull()
  })
})
