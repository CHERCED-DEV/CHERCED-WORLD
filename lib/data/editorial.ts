import 'server-only'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { getDb, mongoUri } from './mongo/client'
import type { DraftInput, EditorialDraft } from '@/lib/editorial/model'

export class DraftConflict extends Error {}

const LOCAL = path.join(process.cwd(), '.local', 'editorial-drafts.json')
const KEY = Symbol.for('cherced-world.editorial-lock')
type Holder = typeof globalThis & { [KEY]?: Promise<unknown> }

export function editorialStorage(): 'mongo' | 'local' | 'unavailable' {
  return mongoUri() ? 'mongo' : process.env.VERCEL ? 'unavailable' : 'local'
}

async function readLocal(): Promise<EditorialDraft[]> {
  try { return JSON.parse(await readFile(LOCAL, 'utf8')) as EditorialDraft[] }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

export async function listDrafts(): Promise<EditorialDraft[]> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new Error('EditorialUnavailable')
  if (storage === 'mongo') return (await getDb()).collection<EditorialDraft>('editorialDrafts').find({}, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).limit(200).toArray()
  return (await readLocal()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getDraft(id: string): Promise<EditorialDraft | null> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new Error('EditorialUnavailable')
  if (storage === 'mongo') return (await getDb()).collection<EditorialDraft>('editorialDrafts').findOne({ id }, { projection: { _id: 0 } })
  return (await readLocal()).find((draft) => draft.id === id) ?? null
}

export async function saveDraft(input: DraftInput): Promise<EditorialDraft> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new Error('EditorialUnavailable')
  const now = new Date().toISOString()
  if (storage === 'mongo') {
    const collection = (await getDb()).collection<EditorialDraft>('editorialDrafts')
    await collection.createIndex({ id: 1 }, { unique: true })
    if (input.version === 0) {
      const draft = { ...input, version: 1, createdAt: now, updatedAt: now }
      try { await collection.insertOne({ ...draft }); return draft }
      catch (error) { if ((error as { code?: number }).code === 11000) throw new DraftConflict(); throw error }
    }
    const draft = await collection.findOneAndUpdate({ id: input.id, version: input.version }, { $set: { ...input, version: input.version + 1, updatedAt: now } }, { returnDocument: 'after', projection: { _id: 0 } })
    if (!draft) throw new DraftConflict()
    return draft
  }
  const holder = globalThis as Holder
  const result = (holder[KEY] ?? Promise.resolve()).catch(() => {}).then(async () => {
    const drafts = await readLocal()
    const existing = drafts.find(item => item.id === input.id)
    if ((existing?.version ?? 0) !== input.version) throw new DraftConflict()
    const draft = { ...input, version: input.version + 1, createdAt: existing?.createdAt ?? now, updatedAt: now }
    const next = [...drafts.filter(item => item.id !== draft.id), draft]
    await mkdir(path.dirname(LOCAL), { recursive: true })
    await writeFile(`${LOCAL}.pending`, JSON.stringify(next), { encoding: 'utf8', mode: 0o600 })
    await rename(`${LOCAL}.pending`, LOCAL)
    return draft
  })
  holder[KEY] = result
  return result
}
