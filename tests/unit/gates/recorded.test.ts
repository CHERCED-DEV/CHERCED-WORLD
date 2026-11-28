import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GATE_EXAMPLE_IDS, gateExample } from '@/content/ailab/gates/examples'
import { loadRecorded, RECORDED_DIR, recordedKey } from '@/content/ailab/gates/recorded'
import { runGate } from '@/lib/ai/gates/run'
import { gateRunSchema, type GateRun } from '@/lib/ai/gates/schema'
import { gateDeps, localPort } from './support'

const WRITE = process.env.GATES_WRITE_RECORDED === '1'

const CASES = GATE_EXAMPLE_IDS.flatMap((id) => (['es', 'en'] as const).map((lang) => [id, lang] as const))

async function simulated(id: (typeof GATE_EXAMPLE_IDS)[number], lang: 'es' | 'en', at: Date): Promise<GateRun> {
  const example = gateExample(id)!
  return runGate({ text: example.text[lang], lang, source: 'ejemplo', exampleId: id }, gateDeps(localPort(), [], { mode: 'grabada', now: () => at }))
}

function comparable(run: GateRun): unknown {
  return JSON.parse(JSON.stringify({ ...run, id: null, at: null, steps: run.steps.map((step) => ({ ...step, latencyMs: 0, attempts: step.attempts.map((attempt) => ({ ...attempt, latencyMs: 0 })) })) }))
}

describe('corridas grabadas (FR-4614)', () => {
  it.each(CASES)('%s en %s: una por pedido de ejemplo e idioma, con el formato de GateRun y marcada como simulada hasta que el autor grabe la real', async (id, lang) => {
    const path = join(process.cwd(), RECORDED_DIR, `${recordedKey(id, lang)}.json`)
    if (WRITE) {
      const run = await simulated(id, lang, new Date())
      writeFileSync(path, `${JSON.stringify(run, null, 2)}\n`)
    }
    const saved = gateRunSchema.parse(JSON.parse(readFileSync(path, 'utf8')))
    expect(await loadRecorded(id, lang)).toEqual(saved)
    expect(saved).toMatchObject({ mode: 'grabada', request: { lang, source: 'ejemplo', exampleId: id } })
    if (saved.simulated) {
      expect(saved.totalUsd).toBe(0)
      expect(saved.steps.every((step) => step.provider === 'simulator' || step.provider === 'deterministic')).toBe(true)
      expect(comparable(saved)).toEqual(comparable(await simulated(id, lang, new Date(saved.at))))
    } else {
      expect(saved.steps.some((step) => step.provider === 'simulator')).toBe(false)
    }
    expect(saved.steps.filter((step) => step.kind === 'revisar').every((step) => step.seat !== saved.writer.seat)).toBe(true)
  })
})
