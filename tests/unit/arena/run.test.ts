import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { arenaRunSchema } from '@/content/ailab/arena/results'
import { caseCostUsd } from '@/content/ailab/arena/view'
import { appendArenaRun, readArenaResults, runPregenerated, runSummary } from '@/lib/ai/providers/arena-run'
import { USD_TO_COP } from '@/lib/ai/pricing'
import { PAID_PROVIDERS } from '@/lib/ai/providers/types'
import { arenaPort, type ArenaCall } from './support'

const ROOT = process.cwd()

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function tempResults(): string {
  const dir = mkdtempSync(join(tmpdir(), 'arena-'))
  dirs.push(dir)
  const path = join(dir, 'results.json')
  writeFileSync(path, '{ "runs": [] }\n')
  return path
}

describe('corrida pregenerada con dobles (FR-4314, SC-4308)', () => {
  it('suma un registro válido con costo total en USD y COP, y el juez contra inyección', async () => {
    const calls: ArenaCall[] = []
    const run = await runPregenerated({ generate: arenaPort(PAID_PROVIDERS, calls, { score: 0 }).generateJson, now: () => new Date('2026-11-28T12:00:00.000Z') })
    expect(arenaRunSchema.parse(run)).toEqual(run)
    expect(run).toMatchObject({ mode: 'pregenerada', simulated: false, at: '2026-11-28T12:00:00.000Z', models: { gemini: 'gemini-3.8-flash', claude: 'claude-sonnet-5-5', openai: 'gpt-6.2-sol' } })
    expect(run.cases).toHaveLength(12)
    expect(run.redTeam).toHaveLength(12)
    expect(run.redTeam.every((item) => item.pass)).toBe(true)
    const expected = run.cases.reduce((sum, entry) => sum + caseCostUsd(entry), 0) + run.redTeam.reduce((sum, item) => sum + item.costUsd, 0)
    expect(run.totalUsd).toBeCloseTo(expected, 6)
    expect(run.totalCop).toBe(Math.round(run.totalUsd * USD_TO_COP))
    expect(run.totalUsd).toBeLessThanOrEqual(0.5)
    expect(calls.filter((call) => !call.judge)).toHaveLength(36)
    expect(runSummary(run)[0]).toContain('12 casos')
  })

  it('guarda las últimas 10 en el archivo', async () => {
    const path = tempResults()
    const run = await runPregenerated({ generate: arenaPort(['gemini', 'claude']).generateJson, now: () => new Date('2026-11-28T12:00:00.000Z'), redTeam: [] })
    for (let index = 0; index < 11; index++) appendArenaRun(path, { ...run, id: `corrida-${index}` })
    const saved = readArenaResults(path)
    expect(saved.runs).toHaveLength(10)
    expect(saved.runs[0]!.id).toBe('corrida-10')
    expect(readFileSync(path, 'utf8').endsWith('\n')).toBe(true)
  })

  it('nunca corre en las pruebas ni en el build: solo con el comando a mano', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(pkg.scripts['arena:run']).toBe('vitest run --config vitest.evals.config.ts evals/arena.eval.ts')
    expect(pkg.scripts['evals:agent']).toBe('vitest run --config vitest.evals.config.ts evals/agent.eval.ts')
    for (const script of ['test', 'prebuild', 'build', 'verify']) expect(pkg.scripts[script] ?? '', script).not.toContain('evals')
    const unit = readFileSync(join(ROOT, 'vitest.config.ts'), 'utf8')
    expect(unit).toContain("include: ['tests/unit/**/*.test.ts', 'tests/contract/**/*.test.ts']")
    const evalsConfig = readFileSync(join(ROOT, 'vitest.evals.config.ts'), 'utf8')
    expect(evalsConfig).toContain("['GEMINI_', 'ANTHROPIC_', 'OPENAI_']")
    expect(evalsConfig).not.toMatch(/console\.|print/)
  })
})
