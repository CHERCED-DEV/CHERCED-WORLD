import { join } from 'node:path'
import { expect, it } from 'vitest'

const { appendArenaRun, runPregenerated, runSummary } = await import('@/lib/ai/providers/arena-run')
const { availableProviders, generateJson, providersMode } = await import('@/lib/ai/providers/port')

const RESULTS = join(process.cwd(), 'content', 'ailab', 'arena', 'results.json')

it('corre la arena contra los proveedores reales y suma la corrida a results.json', async () => {
  if (providersMode() !== 'live') {
    throw new Error('Faltan las llaves en .env.local (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY): la arena llama a los proveedores reales y gasta (unos 0,16 USD más OpenAI).')
  }
  console.log(`Proveedores activos: ${availableProviders().join(', ')}`)
  const run = await runPregenerated({ generate: generateJson, now: () => new Date() })
  appendArenaRun(RESULTS, run)
  for (const line of runSummary(run)) console.log(line)
  expect(run.cases).toHaveLength(12)
  expect(run.totalUsd, 'SC-4308: la corrida completa debería costar 0,50 USD o menos').toBeLessThanOrEqual(0.5)
})
