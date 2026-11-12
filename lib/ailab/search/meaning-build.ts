import 'server-only'
import path from 'node:path'
import type { Locale } from '@/lib/i18n/config'
import { buildSearchIndex } from '@/lib/search/build-index'
import { isIndexedDoc } from './glassbox'
import { logServerError } from '@/lib/security/log'
import {
  encodeVector,
  MEANING_DIMS,
  MEANING_DTYPE,
  MEANING_MODEL,
  MEANING_VECTORS_VERSION,
  passageText,
  quantize,
  type MeaningVectors,
} from './meaning'

type Tensor = { data: Float32Array; dims: number[] }

type Extractor = (texts: string[], options: { pooling: 'mean'; normalize: true }) => Promise<Tensor>

let extractor: Promise<Extractor> | null = null

async function loadExtractor(): Promise<Extractor> {
  const { env, pipeline } = await import('@huggingface/transformers')
  env.cacheDir = path.join(process.cwd(), '.next', 'cache', 'transformers')
  env.allowLocalModels = false
  return (await pipeline('feature-extraction', MEANING_MODEL, { dtype: MEANING_DTYPE })) as unknown as Extractor
}

export async function buildMeaningVectors(lang: Locale): Promise<MeaningVectors> {
  const empty: MeaningVectors = { version: MEANING_VECTORS_VERSION, lang, model: MEANING_MODEL, dims: MEANING_DIMS, docs: [] }
  try {
    const docs = (await buildSearchIndex(lang)).docs.filter(isIndexedDoc)
    extractor ??= loadExtractor()
    const embed = await extractor
    const out: MeaningVectors['docs'] = []
    for (let start = 0; start < docs.length; start += 16) {
      const batch = docs.slice(start, start + 16)
      const tensor = await embed(batch.map(passageText), { pooling: 'mean', normalize: true })
      const dims = tensor.dims.at(-1) ?? MEANING_DIMS
      batch.forEach((doc, row) => out.push({ id: doc.id, v: encodeVector(quantize(tensor.data.subarray(row * dims, (row + 1) * dims))) }))
    }
    return { ...empty, docs: out }
  } catch (error) {
    extractor = null
    logServerError('ailab.meaning.build', error)
    return empty
  }
}
