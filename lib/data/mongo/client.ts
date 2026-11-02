import 'server-only'
import { MongoClient, type Db } from 'mongodb'
import { DATABASE_ENV } from '@/lib/security/keys'
import { logServerError } from '@/lib/security/log'
import { ensureIndexes } from './indexes'

type MongoState = {
  client: MongoClient | null
  connecting: Promise<MongoClient> | null
  indexes: Promise<void> | null
}

const STATE_KEY = Symbol.for('cherced-world.mongo')

function state(): MongoState {
  const holder = globalThis as typeof globalThis & { [STATE_KEY]?: MongoState }
  holder[STATE_KEY] ??= { client: null, connecting: null, indexes: null }
  return holder[STATE_KEY]
}

export function mongoUri(): string | null {
  return process.env[DATABASE_ENV] || null
}

async function connect(uri: string): Promise<MongoClient> {
  const client = new MongoClient(uri, {
    appName: 'cherced-world',
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxPoolSize: 5,
  })
  await client.connect()
  return client
}

export async function getMongoClient(): Promise<MongoClient> {
  const current = state()
  if (current.client) return current.client
  const uri = mongoUri()
  if (!uri) throw new Error('MongoNotConfigured')
  current.connecting ??= connect(uri).then(
    (client) => {
      current.client = client
      return client
    },
    (error: unknown) => {
      current.connecting = null
      throw error
    },
  )
  return current.connecting
}

export async function getDb(): Promise<Db> {
  const db = (await getMongoClient()).db()
  const current = state()
  current.indexes ??= ensureIndexes(db).catch((error: unknown) => {
    current.indexes = null
    logServerError('mongo.indexes', error)
  })
  await current.indexes
  return db
}

export async function closeMongoClient(): Promise<void> {
  const current = state()
  const client = current.client
  current.client = null
  current.connecting = null
  current.indexes = null
  await client?.close()
}
