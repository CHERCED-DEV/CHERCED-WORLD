import { randomBytes } from 'node:crypto'
import { MongoClient, ObjectId } from 'mongodb'
import { describe, expect, it } from 'vitest'
import { createMongoRepos } from '@/lib/data/mongo'
import {
  statusFilter,
  toCommentRecord,
  toMessageRecord,
  toObjectId,
  toPublicComment,
  transitionSources,
} from '@/lib/data/mongo/mappers'
import { rateLimitPipeline, rateLimitResult } from '@/lib/data/mongo/rate-limits'
import { COMMENT_TRANSITIONS, MESSAGE_TRANSITIONS } from '@/lib/data/types'
import { runRepoContract } from '../../contract/repos.contract'

const uri = process.env.MONGODB_INTEGRAL_DB
const runAgainstMongo = Boolean(uri) && !process.env.VERCEL && !process.env.CI

describe.runIf(runAgainstMongo)('Mongo real (solo en local, base temporal)', () => {
  let client: MongoClient
  let dbName = ''

  runRepoContract('mongo', {
    setup: async () => {
      client = new MongoClient(uri ?? '', { serverSelectionTimeoutMS: 5000 })
      await client.connect()
      dbName = `cw_contract_${process.pid}_${randomBytes(4).toString('hex')}`
      const db = client.db(dbName)
      return createMongoRepos(async () => db)
    },
    teardown: async () => {
      if (dbName.startsWith('cw_contract_')) await client.db(dbName).dropDatabase()
      await client.close()
    },
  })
})

describe('valores por defecto de los documentos 2023', () => {
  const _id = new ObjectId('6469f5a2c1f4a2b3c4d5e6f7')

  it('un mensaje sin status es leído y conserva el teléfono numérico', () => {
    const record = toMessageRecord({
      _id,
      name: 'Visitante 2023',
      email: 'v2023@example.com',
      phone: 3001234567,
      message: 'Hola',
      createdAt: new Date('2023-05-21T10:00:00Z'),
      updatedAt: new Date('2023-05-21T10:00:00Z'),
    })
    expect(record).toEqual({
      id: '6469f5a2c1f4a2b3c4d5e6f7',
      name: 'Visitante 2023',
      email: 'v2023@example.com',
      phone: 3001234567,
      message: 'Hola',
      status: 'read',
      consentAt: null,
      createdAt: new Date('2023-05-21T10:00:00Z'),
      updatedAt: new Date('2023-05-21T10:00:00Z'),
    })
  })

  it('un comentario sin status es aprobado y sin respuesta del autor', () => {
    const record = toCommentRecord({
      _id,
      postId: 'post1',
      userName: 'Lector',
      email: 'lector@example.com',
      comment: 'Buen post',
      date: 'Sun May 21 2023',
      createdAt: new Date('2023-05-21T10:00:00Z'),
      updatedAt: new Date('2023-05-21T10:00:00Z'),
    })
    expect(record.status).toBe('approved')
    expect(record.lang).toBeNull()
    expect(record.consentAt).toBeNull()
    expect(record.authorReply).toBeNull()
  })

  it('sin timestamps usa la fecha 2023 o la del ObjectId, y tolera campos ausentes', () => {
    const fromDate = toCommentRecord({ _id, date: 'Sun May 21 2023' })
    expect(fromDate.createdAt.getFullYear()).toBe(2023)
    expect(fromDate.updatedAt).toEqual(fromDate.createdAt)
    const bare = toMessageRecord({ _id })
    expect(bare.createdAt).toEqual(_id.getTimestamp())
    expect(bare.name).toBe('')
    expect(bare.phone).toBeNull()
  })

  it('un status desconocido cae al valor histórico', () => {
    expect(toMessageRecord({ _id, status: 'spam' }).status).toBe('read')
    expect(toCommentRecord({ _id, status: 42 }).status).toBe('approved')
  })

  it('la proyección pública no tiene correo ni consentimiento', () => {
    const item = toPublicComment({
      _id,
      userName: 'Lector',
      comment: 'Buen post',
      createdAt: new Date('2023-05-21T10:00:00Z'),
      authorReply: { text: 'Gracias', createdAt: new Date('2026-11-01T00:00:00Z'), updatedAt: new Date('2026-11-01T00:00:00Z') },
    })
    expect(Object.keys(item).sort()).toEqual(['authorReply', 'comment', 'createdAt', 'id', 'userName'])
    expect(item.authorReply?.text).toBe('Gracias')
  })

  it('descarta respuestas del autor mal formadas', () => {
    expect(toCommentRecord({ _id, authorReply: { text: 3 } }).authorReply).toBeNull()
    expect(toCommentRecord({ _id, authorReply: 'hola' }).authorReply).toBeNull()
  })
})

describe('filtros de estado con históricos', () => {
  it('el estado histórico incluye documentos sin status', () => {
    expect(statusFilter(['unread', 'read', 'archived'], 'read', ['read'])).toEqual({ status: { $nin: ['unread', 'archived'] } })
    expect(statusFilter(['unread', 'read', 'archived'], 'read', ['unread'])).toEqual({ status: { $in: ['unread'] } })
    expect(statusFilter(['pending', 'approved', 'rejected'], 'approved', ['approved'])).toEqual({
      status: { $nin: ['pending', 'rejected'] },
    })
  })

  it('calcula desde qué estados se puede llegar a cada uno', () => {
    expect(transitionSources(['unread', 'read', 'archived'], MESSAGE_TRANSITIONS, 'unread').sort()).toEqual(['read', 'unread'])
    expect(transitionSources(['unread', 'read', 'archived'], MESSAGE_TRANSITIONS, 'read').sort()).toEqual(['archived', 'read', 'unread'])
    expect(transitionSources(['pending', 'approved', 'rejected'], COMMENT_TRANSITIONS, 'pending')).toEqual(['pending'])
    expect(transitionSources(['pending', 'approved', 'rejected'], COMMENT_TRANSITIONS, 'approved').sort()).toEqual([
      'approved',
      'pending',
      'rejected',
    ])
  })

  it('ignora ids que no son ObjectId', () => {
    expect(toObjectId('000000000000000000000000')).toBeInstanceOf(ObjectId)
    expect(toObjectId('no-es-un-id')).toBeNull()
    expect(toObjectId('{"$gt":""}')).toBeNull()
  })
})

describe('rate limit en Mongo: resultado a partir del documento', () => {
  const now = new Date('2026-11-01T00:10:00Z')
  const contact = { limit: 3, windowMs: 600_000 }
  const login = { limit: 5, windowMs: 900_000, blockMs: 900_000 }

  it('permite mientras la cuenta no supera el límite', () => {
    expect(rateLimitResult({ count: 3, windowStart: new Date('2026-11-01T00:09:00Z'), blockedUntil: null }, contact, now)).toEqual({
      allowed: true,
      retryAfterMs: 0,
    })
  })

  it('sin bloqueo responde con lo que falta de la ventana', () => {
    expect(rateLimitResult({ count: 4, windowStart: new Date('2026-11-01T00:09:00Z'), blockedUntil: null }, contact, now)).toEqual({
      allowed: false,
      retryAfterMs: 540_000,
    })
  })

  it('con bloqueo vigente responde con lo que falta del bloqueo', () => {
    expect(
      rateLimitResult({ count: 6, windowStart: now, blockedUntil: new Date(now.getTime() + 900_000) }, login, now),
    ).toEqual({ allowed: false, retryAfterMs: 900_000 })
  })

  it('el pipeline solo agrega la etapa de bloqueo si la regla la tiene', () => {
    expect(rateLimitPipeline(contact, now)).toHaveLength(5)
    expect(rateLimitPipeline(login, now)).toHaveLength(6)
    expect(JSON.stringify(rateLimitPipeline(login, now))).toContain('"$unset":["__blocked","__fresh"]')
  })
})
