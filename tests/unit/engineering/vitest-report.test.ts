import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseVitestReport, readVitestReport, VITEST_REPORT_PATH } from '@/lib/engineering/vitest-report'

const REPORT = {
  numTotalTestSuites: 6,
  numPassedTestSuites: 6,
  numFailedTestSuites: 0,
  numPendingTestSuites: 0,
  numTotalTests: 12,
  numPassedTests: 10,
  numFailedTests: 0,
  numPendingTests: 1,
  numTodoTests: 1,
  startTime: Date.parse('2026-11-26T16:27:09Z'),
  success: true,
  testResults: [
    { status: 'passed', name: 'C:/Users/alguien/repo/tests/unit/a.test.ts', assertionResults: [] },
    { status: 'passed', name: '/vercel/path0/tests/unit/b.test.ts', assertionResults: [] },
  ],
}

describe('reporte JSON de Vitest del prebuild (FR-4503)', () => {
  it('saca los totales, los omitidos, los archivos y la hora, sin rutas absolutas ni nombres de pruebas', () => {
    const summary = parseVitestReport(REPORT)
    expect(summary).toEqual({ total: 12, passed: 10, failed: 0, skipped: 2, files: 2, startedAt: '2026-11-26T16:27:09.000Z', success: true })
    expect(JSON.stringify(summary)).not.toMatch(/alguien|vercel\/path0|\.test\.ts/)
  })

  it('sin el archivo de resultados por archivo, no inventa cuántos archivos hubo', () => {
    const { testResults: _testResults, ...rest } = REPORT
    expect(parseVitestReport(rest)?.files).toBeNull()
  })

  it('con otra forma o con totales que no cuadran, no muestra un número', () => {
    expect(parseVitestReport({ tests: 12, ok: true })).toBeNull()
    expect(parseVitestReport({ ...REPORT, numPassedTests: 20 })).toBeNull()
    expect(parseVitestReport({ ...REPORT, numTotalTests: -1 })).toBeNull()
    expect(parseVitestReport(null)).toBeNull()
    expect(parseVitestReport('{"numTotalTests":1}')).toBeNull()
  })

  it('sin el archivo (un build local sin prebuild) o con JSON roto, devuelve null', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cw-vitest-report-'))
    try {
      expect(readVitestReport(dir)).toBeNull()
      writeFileSync(join(dir, 'roto.json'), '{ no es json')
      expect(readVitestReport(dir, 'roto.json')).toBeNull()
      writeFileSync(join(dir, 'bueno.json'), JSON.stringify(REPORT))
      expect(readVitestReport(dir, 'bueno.json')?.passed).toBe(10)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('lee el mismo archivo que escribe el prebuild de package.json', () => {
    const scripts = (JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts
    expect(scripts.prebuild).toContain('--reporter=json')
    expect(scripts.prebuild).toContain(`--outputFile.json=${VITEST_REPORT_PATH}`)
  })
})
