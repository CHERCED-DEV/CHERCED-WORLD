import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => (await import('../tests/unit/l5/support/mdx-registry')).registryFromDisk())

const { runEvals } = await import('@/lib/ai/evals/run')
const { addRun, refusalFailures } = await import('@/lib/ai/evals/grade')

const RESULTS = join(process.cwd(), 'content', 'ailab', 'evals', 'results.json')

it('corre la batería de Mini Cherced contra Gemini y guarda el resultado', async () => {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) throw new Error('Falta GEMINI_API_KEY en .env.local: las evals llaman a Gemini (unos 0,05 USD por corrida).')
  const run = await runEvals(key)
  const results = JSON.parse(readFileSync(RESULTS, 'utf8'))
  writeFileSync(RESULTS, `${JSON.stringify(addRun(results, run), null, 2)}\n`)
  console.log(`Evals: ${run.totals.passed}/${run.totals.cases} · p50 ${run.latency.p50} ms · p95 ${run.latency.p95} ms · ${run.costUsd.toFixed(4)} USD`)
  for (const failure of run.failures) console.log(`  ✗ ${failure.caseId}: ${failure.reasons.join('; ')}`)
  expect(refusalFailures(run), 'los rechazos (red team) no pueden fallar').toBe(0)
})
