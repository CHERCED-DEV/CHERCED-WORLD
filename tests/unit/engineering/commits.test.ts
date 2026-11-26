import { describe, expect, it } from 'vitest'
import history from '@/content/engineering/history.json'
import { commitsBySpec, commitType, daysBetween, firstFeat, specsInSubject, weeklyCounts, type Commit } from '@/lib/engineering/commits'
import { parseHistory } from '@/lib/engineering/history'

function commit(sha: string, date: string, subject: string): Commit {
  return { sha, date, subject }
}

describe('asuntos de commit a specs (FR-4504)', () => {
  it('lee el número entre paréntesis, con varias specs, carriles y rangos', () => {
    expect(specsInSubject('fix(018, 022): castaño con más canas')).toEqual(['018', '022'])
    expect(specsInSubject('feat(004/P0): identidad')).toEqual(['004'])
    expect(specsInSubject('feat(004/P3-compat): compatibilidad')).toEqual(['004'])
    expect(specsInSubject('feat(030)!: cambio que rompe')).toEqual(['030'])
    expect(specsInSubject('docs(041-050): upstream de la línea')).toEqual(['041', '042', '043', '044', '045', '046', '047', '048', '049', '050'])
  })

  it('no cuenta carriles sin número, números fuera del paréntesis ni merges', () => {
    expect(specsInSubject('feat(x0): base de Gemini')).toEqual([])
    expect(specsInSubject('docs(012): R0 cerrado (011 validada)')).toEqual(['012'])
    expect(specsInSubject("Merge branch 'main' into dev")).toEqual([])
    expect(specsInSubject('footer with structure & data. done')).toEqual([])
    expect(commitType('feat(030): algo')).toBe('feat')
    expect(commitType('sin tipo')).toBeNull()
  })

  it('un commit que nombra varias specs cuenta para cada una, y solo para specs que existen', () => {
    const commits = [
      commit('aaaaaaa', '2026-11-26T07:41:45-05:00', 'fix(018, 022): ajuste'),
      commit('bbbbbbb', '2026-11-25T07:41:45-05:00', 'feat(022): pixel'),
      commit('ccccccc', '2026-11-24T07:41:45-05:00', 'feat(999): no existe'),
    ]
    const bySpec = commitsBySpec(commits, new Set(['018', '022']))
    expect(bySpec.get('018')?.map((item) => item.sha)).toEqual(['aaaaaaa'])
    expect(bySpec.get('022')?.map((item) => item.sha)).toEqual(['aaaaaaa', 'bbbbbbb'])
    expect(bySpec.has('999')).toBe(false)
  })
})

describe('días de la spec a su primer feat (FR-4504)', () => {
  it('toma el feat más viejo e ignora fix y docs', () => {
    const feat = firstFeat([
      commit('aaaaaaa', '2026-11-16T10:00:00-05:00', 'feat(030): reanudar'),
      commit('bbbbbbb', '2026-11-14T10:00:00-05:00', 'docs(030): spec'),
      commit('ccccccc', '2026-11-15T10:00:00-05:00', 'feat(030): modo entrevista'),
    ])
    expect(feat?.sha).toBe('ccccccc')
    expect(firstFeat([commit('bbbbbbb', '2026-11-14T10:00:00-05:00', 'docs(030): spec')])).toBeNull()
  })

  it('cuenta días de calendario en Bogotá y no inventa un tiempo cuando falta una fecha o el feat es anterior', () => {
    expect(daysBetween('2026-11-14T13:37:49-05:00', '2026-11-15T10:00:00-05:00')).toBe(1)
    expect(daysBetween('2026-11-14T08:00:00-05:00', '2026-11-14T22:00:00-05:00')).toBe(0)
    expect(daysBetween('2026-11-14T23:30:00-05:00', '2026-11-15T00:30:00-05:00')).toBe(1)
    expect(daysBetween('2026-11-12T10:00:00-05:00', '2026-11-11T10:00:00-05:00')).toBeNull()
    expect(daysBetween(null, '2026-11-15T10:00:00-05:00')).toBeNull()
    expect(daysBetween('2026-11-14T10:00:00-05:00', null)).toBeNull()
  })

  it('con el historial versionado, la 030 pasó de spec a su primer feat en 1 día', () => {
    const parsed = parseHistory(history)
    expect(parsed).not.toBeNull()
    const commits = commitsBySpec(parsed!.commits).get('030') ?? []
    expect(commits.length).toBeGreaterThan(0)
    const feat = firstFeat(commits)
    expect(feat?.date.slice(0, 10)).toBe('2026-11-15')
    expect(parsed!.specCreated['030']?.slice(0, 10)).toBe('2026-11-14')
    expect(daysBetween(parsed!.specCreated['030']!, feat!.date)).toBe(1)
  })
})

describe('commits por semana (FR-4511)', () => {
  it('arma 8 semanas de lunes a domingo en Bogotá, la última hasta la fecha del historial', () => {
    const weeks = weeklyCounts(
      [
        commit('aaaaaaa', '2026-11-23T08:00:00-05:00', 'feat(045): lunes'),
        commit('bbbbbbb', '2026-11-22T23:59:00-05:00', 'feat(045): domingo de la semana anterior'),
        commit('ccccccc', '2026-11-26T11:00:00-05:00', 'feat(045): jueves'),
        commit('ddddddd', '2026-10-04T12:00:00-05:00', 'feat(045): fuera de la ventana'),
        commit('eeeeeee', '2026-11-27T12:00:00-05:00', 'feat(045): después del historial'),
      ],
      '2026-11-26T12:00:00-05:00',
    )
    expect(weeks).toHaveLength(8)
    expect(weeks[0]).toEqual({ start: '2026-10-05', end: '2026-10-11', count: 0 })
    expect(weeks[6]).toEqual({ start: '2026-11-16', end: '2026-11-22', count: 1 })
    expect(weeks[7]).toEqual({ start: '2026-11-23', end: '2026-11-26', count: 2 })
  })
})
