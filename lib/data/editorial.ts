import 'server-only'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { getDb, mongoUri } from './mongo/client'
import { canEditDraft, type DraftAuthor, type DraftInput, type DraftReview, type EditorialDraft } from '@/lib/editorial/model'

export class DraftConflict extends Error {}

export class DraftForbidden extends Error {}

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

export async function listDrafts(guest: DraftAuthor | null = null): Promise<EditorialDraft[]> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new Error('EditorialUnavailable')
  if (storage === 'mongo') return (await getDb()).collection<EditorialDraft>('editorialDrafts').find(guest ? { 'author.id': guest.id } : {}, { projection: { _id: 0 } }).sort({ updatedAt: -1 }).limit(200).toArray()
  return (await readLocal()).filter((draft) => canEditDraft(draft, guest)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getDraft(id: string): Promise<EditorialDraft | null> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new Error('EditorialUnavailable')
  if (storage === 'mongo') return (await getDb()).collection<EditorialDraft>('editorialDrafts').findOne({ id }, { projection: { _id: 0 } })
  return (await readLocal()).find((draft) => draft.id === id) ?? null
}

function lockedLocal<T>(task: (drafts: EditorialDraft[]) => Promise<{ drafts: EditorialDraft[]; value: T }>): Promise<T> {
  const holder = globalThis as Holder
  const result = (holder[KEY] ?? Promise.resolve()).catch(() => {}).then(async () => {
    const { drafts, value } = await task(await readLocal())
    await mkdir(path.dirname(LOCAL), { recursive: true })
    await writeFile(`${LOCAL}.pending`, JSON.stringify(drafts), { encoding: 'utf8', mode: 0o600 })
    await rename(`${LOCAL}.pending`, LOCAL)
    return value
  })
  holder[KEY] = result
  return result
}

async function draftsCollection() {
  const collection = (await getDb()).collection<EditorialDraft>('editorialDrafts')
  await collection.createIndex({ id: 1 }, { unique: true })
  return collection
}

export async function saveDraft(input: DraftInput, guest: DraftAuthor | null = null): Promise<EditorialDraft> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new Error('EditorialUnavailable')
  const now = new Date().toISOString()
  if (storage === 'mongo') {
    const collection = await draftsCollection()
    if (input.version === 0) {
      const draft: EditorialDraft = { ...input, version: 1, createdAt: now, updatedAt: now, ...(guest ? { author: guest } : {}) }
      try { await collection.insertOne({ ...draft }); return draft }
      catch (error) { if ((error as { code?: number }).code === 11000) throw new DraftConflict(); throw error }
    }
    if (guest && !canEditDraft(await collection.findOne({ id: input.id }, { projection: { _id: 0, author: 1 } }), guest)) throw new DraftForbidden()
    const draft = await collection.findOneAndUpdate({ id: input.id, version: input.version }, { $set: { ...input, version: input.version + 1, updatedAt: now } }, { returnDocument: 'after', projection: { _id: 0 } })
    if (!draft) throw new DraftConflict()
    return draft
  }
  return lockedLocal(async (drafts) => {
    const existing = drafts.find(item => item.id === input.id)
    if (existing && !canEditDraft(existing, guest)) throw new DraftForbidden()
    if ((existing?.version ?? 0) !== input.version) throw new DraftConflict()
    const author = existing ? existing.author : guest
    const draft: EditorialDraft = { ...existing, ...input, version: input.version + 1, createdAt: existing?.createdAt ?? now, updatedAt: now, ...(author ? { author } : {}) }
    return { drafts: [...drafts.filter(item => item.id !== draft.id), draft], value: draft }
  })
}

export async function setDraftReview(id: string, review: DraftReview | null): Promise<EditorialDraft | null> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new Error('EditorialUnavailable')
  if (storage === 'mongo') return (await draftsCollection()).findOneAndUpdate({ id }, { $set: { review } }, { returnDocument: 'after', projection: { _id: 0 } })
  return lockedLocal(async (drafts) => {
    const existing = drafts.find(item => item.id === id)
    if (!existing) return { drafts, value: null }
    const draft: EditorialDraft = { ...existing, review }
    return { drafts: drafts.map(item => item.id === id ? draft : item), value: draft }
  })
}
