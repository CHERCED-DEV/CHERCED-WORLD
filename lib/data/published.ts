import 'server-only'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { postIds } from '@/lib/content'
import type { EditorialDraft } from '@/lib/editorial/model'
import { catalogTags, publishedId, type PublishedPost } from '@/lib/editorial/published'
import { editorialStorage } from './editorial'
import { getDb } from './mongo/client'

const LOCAL = path.join(process.cwd(), '.local', 'editorial-published.json')
const COLLECTION = 'editorialPublished'
const KEY = Symbol.for('cherced-world.published-lock')
type Holder = typeof globalThis & { [KEY]?: Promise<unknown> }

export class PublishingUnavailable extends Error {}

async function readLocal(): Promise<PublishedPost[]> {
  try {
    return JSON.parse(await readFile(LOCAL, 'utf8')) as PublishedPost[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

async function writeLocal(posts: PublishedPost[]): Promise<void> {
  await mkdir(path.dirname(LOCAL), { recursive: true })
  await writeFile(`${LOCAL}.pending`, JSON.stringify(posts), { encoding: 'utf8', mode: 0o600 })
  await rename(`${LOCAL}.pending`, LOCAL)
}

function locked<T>(task: () => Promise<T>): Promise<T> {
  const holder = globalThis as Holder
  const result = (holder[KEY] ?? Promise.resolve()).catch(() => {}).then(task)
  holder[KEY] = result
  return result
}

async function collection() {
  const posts = (await getDb()).collection<PublishedPost>(COLLECTION)
  await posts.createIndex({ id: 1 }, { unique: true })
  await posts.createIndex({ draftId: 1 }, { unique: true })
  return posts
}

export async function listPublished(): Promise<PublishedPost[]> {
  const storage = editorialStorage()
  if (storage === 'unavailable') return []
  if (storage === 'mongo') return (await collection()).find({}, { projection: { _id: 0 } }).sort({ date: -1 }).limit(500).toArray()
  return readLocal()
}

function nextPost(draft: EditorialDraft, existing: PublishedPost | undefined, taken: ReadonlySet<string>, now: Date): PublishedPost {
  const stamp = now.toISOString()
  const day = stamp.slice(0, 10)
  const base = {
    draftId: draft.id,
    lang: draft.lang,
    title: draft.title.trim(),
    description: draft.description.trim(),
    tags: catalogTags(draft.tags, draft.lang).kept,
    body: draft.body,
    updatedAt: stamp,
    ...(draft.author ? { author: draft.author.name } : {}),
  }
  if (existing) return { ...existing, ...base, ...(day > existing.date ? { updated: day } : {}) }
  return { ...base, id: publishedId(draft.title, taken), date: day, publishedAt: stamp }
}

export async function publishPost(draft: EditorialDraft, now: Date): Promise<PublishedPost> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new PublishingUnavailable()
  const registry = postIds()
  if (storage === 'mongo') {
    const posts = await collection()
    const existing = (await posts.findOne({ draftId: draft.id }, { projection: { _id: 0 } })) ?? undefined
    const taken = new Set([...registry, ...(await posts.distinct('id'))])
    const post = nextPost(draft, existing, taken, now)
    await posts.replaceOne({ draftId: draft.id }, post, { upsert: true })
    return post
  }
  return locked(async () => {
    const posts = await readLocal()
    const existing = posts.find((item) => item.draftId === draft.id)
    const taken = new Set([...registry, ...posts.map((item) => item.id)])
    const post = nextPost(draft, existing, taken, now)
    await writeLocal([...posts.filter((item) => item.draftId !== draft.id), post])
    return post
  })
}

export async function unpublishPost(draftId: string): Promise<PublishedPost | null> {
  const storage = editorialStorage()
  if (storage === 'unavailable') throw new PublishingUnavailable()
  if (storage === 'mongo') return (await collection()).findOneAndDelete({ draftId }, { projection: { _id: 0 } })
  return locked(async () => {
    const posts = await readLocal()
    const removed = posts.find((item) => item.draftId === draftId) ?? null
    if (removed) await writeLocal(posts.filter((item) => item.draftId !== draftId))
    return removed
  })
}
