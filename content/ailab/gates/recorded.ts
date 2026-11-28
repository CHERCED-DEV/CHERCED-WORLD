import { gateRunSchema, type GateLang, type GateRun } from '@/lib/ai/gates/schema'
import { GATE_EXAMPLE_IDS, type GateExampleId } from './examples'

export type RecordedKey = `${GateExampleId}-${GateLang}`

export const RECORDED_DIR = 'content/ailab/gates/recorded'

const LOADERS: Readonly<Record<RecordedKey, () => Promise<{ default: unknown }>>> = {
  'contacto-es': () => import('./recorded/contacto-es.json'),
  'contacto-en': () => import('./recorded/contacto-en.json'),
  'citas-es': () => import('./recorded/citas-es.json'),
  'citas-en': () => import('./recorded/citas-en.json'),
  'panaderia-es': () => import('./recorded/panaderia-es.json'),
  'panaderia-en': () => import('./recorded/panaderia-en.json'),
}

export function recordedKey(id: GateExampleId, lang: GateLang): RecordedKey {
  return `${id}-${lang}`
}

export function recordedKeys(): RecordedKey[] {
  return GATE_EXAMPLE_IDS.flatMap((id) => (['es', 'en'] as const).map((lang) => recordedKey(id, lang)))
}

export async function loadRecorded(id: GateExampleId, lang: GateLang): Promise<GateRun> {
  const loaded = await LOADERS[recordedKey(id, lang)]()
  return gateRunSchema.parse(loaded.default)
}
