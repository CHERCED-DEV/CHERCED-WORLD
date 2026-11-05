import 'server-only'
import { ObjectId, type Sort } from 'mongodb'
import { MESSAGE_TRANSITIONS, type MessageRepo, type MessageSort, type MessageStatus } from '@/lib/data/types'
import { messagesCollection, type DbProvider, type MessageDoc } from './collections'
import {
  LEGACY_MESSAGE_STATUS,
  MESSAGE_STATUSES,
  statusFilter,
  toMessageRecord,
  toObjectId,
  transitionSources,
} from './mappers'

const SORTS: Record<MessageSort, Sort> = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { name: 1, createdAt: -1, _id: -1 },
}

function byStatus(status: MessageStatus | 'all' | undefined): Record<string, unknown> {
  if (!status || status === 'all') return {}
  return statusFilter(MESSAGE_STATUSES, LEGACY_MESSAGE_STATUS, [status])
}

export function createMongoMessageRepo(db: DbProvider): MessageRepo {
  return {
    async create(input) {
      const now = new Date()
      const doc: MessageDoc = {
        _id: new ObjectId(),
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        interest: input.interest ?? null,
        status: 'unread',
        consentAt: input.consentAt,
        createdAt: now,
        updatedAt: now,
      }
      await (await messagesCollection(db)).insertOne(doc)
      return toMessageRecord(doc)
    },
    async list({ status, sort }) {
      const docs = await (await messagesCollection(db))
        .find(byStatus(status), { collation: { locale: 'es' } })
        .sort(SORTS[sort])
        .toArray()
      return docs.map(toMessageRecord)
    },
    async setStatus(id, status) {
      const _id = toObjectId(id)
      if (!_id) return false
      const sources = transitionSources(MESSAGE_STATUSES, MESSAGE_TRANSITIONS, status)
      const result = await (await messagesCollection(db)).updateOne(
        { _id, ...statusFilter(MESSAGE_STATUSES, LEGACY_MESSAGE_STATUS, sources) },
        { $set: { status, updatedAt: new Date() } },
      )
      return result.matchedCount === 1
    },
    async remove(id) {
      const _id = toObjectId(id)
      if (!_id) return false
      const result = await (await messagesCollection(db)).deleteOne({ _id })
      return result.deletedCount === 1
    },
    async countUnread() {
      return (await messagesCollection(db)).countDocuments({ status: 'unread' })
    },
    async changedSince(since) {
      const docs = await (await messagesCollection(db))
        .find({ updatedAt: { $gt: since } })
        .sort({ updatedAt: 1, _id: 1 })
        .toArray()
      return docs.map(toMessageRecord)
    },
  }
}
