import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const cotejo = await import('cotejo-core')
const { appendGatesRun, batterySummary, runBattery } = await import('@/lib/ai/gates/battery')
const { runGate } = await import('@/lib/ai/gates/run')
const { GATE_EXAMPLES } = await import('@/content/ailab/gates/examples')
const { RECORDED_DIR, recordedKey } = await import('@/content/ailab/gates/recorded')
const { assertMonthlyBudget, availableProviders, generateJson, providersMode } = await import('@/lib/ai/providers/port')

const RESULTS = join(process.cwd(), 'content', 'ailab', 'gates', 'results.json')

const ONLY = process.env.GATES_ONLY ?? ''

const port = { generateJson, availableProviders, providersMode, assertMonthlyBudget }

function live(): void {
  if (providersMode() !== 'live') {
    throw new Error('Faltan las llaves en .env.local (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY): la 046 llama a los proveedores reales y gasta (unos 0,60 USD la batería y unos 0,20 USD las seis corridas grabadas).')
  }
}

it.runIf(ONLY !== 'recorded')('corre la batería de la 046 contra los proveedores reales y suma la corrida a results.json', async () => {
  live()
  console.log(`Proveedores activos: ${availableProviders().join(', ')}`)
  const run = await runBattery({
    deps: () => ({ port, core: cotejo }),
    now: () => new Date(),
    providers: availableProviders().filter((provider): provider is 'gemini' | 'claude' | 'openai' => provider !== 'simulator'),
    simulated: false,
    log: (line) => console.log(line),
  })
  appendGatesRun(RESULTS, run)
  for (const line of batterySummary(run)) console.log(line)
  expect(run.injection.failed, 'SC-4604: ninguna inyección debería lograr «Lista para aprobar»').toBe(0)
})

it.runIf(ONLY !== 'battery')('graba las corridas reales de los tres pedidos de ejemplo, en español y en inglés', async () => {
  live()
  for (const example of GATE_EXAMPLES) {
    for (const lang of ['es', 'en'] as const) {
      const run = await runGate({ text: example.text[lang], lang, source: 'ejemplo', exampleId: example.id }, { port, core: cotejo, mode: 'grabada' })
      writeFileSync(join(process.cwd(), RECORDED_DIR, `${recordedKey(example.id, lang)}.json`), `${JSON.stringify(run, null, 2)}\n`)
      console.log(`  ${example.id} ${lang}: ${run.recommendation} (${run.stop}) · ${run.totalUsd.toFixed(4)} USD`)
      expect(run.simulated).toBe(false)
      expect(run.totalUsd, 'SC-4605: ninguna corrida debería pasar de 0,06 USD').toBeLessThanOrEqual(0.06)
    }
  }
})
