import 'server-only'
import {
  canTransition,
  MESSAGE_TRANSITIONS,
  type MessageRecord,
  type MessageRepo,
  type MessageStatus,
} from '../types'
import { clone, newId } from './ids'

export function createMemoryMessageRepo(): MessageRepo {
  const store = new Map<string, MessageRecord>()
  let sequence = 0
  const order = new Map<string, number>()

  const byCreated = (a: MessageRecord, b: MessageRecord) =>
    a.createdAt.getTime() - b.createdAt.getTime() || (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)

  return {
    async create(input) {
      const now = new Date()
      const record: MessageRecord = {
        id: newId(),
        name: input.name,
        email: input.email,
        phone: input.phone,
        message: input.message,
        status: 'unread',
        consentAt: input.consentAt,
        createdAt: now,
        updatedAt: now,
      }
      store.set(record.id, record)
      order.set(record.id, sequence++)
      return clone(record)
    },
    async list({ status, sort }) {
      const all = [...store.values()].filter((m) => !status || status === 'all' || m.status === status)
      if (sort === 'name') all.sort((a, b) => a.name.localeCompare(b.name, 'es') || byCreated(b, a))
      else if (sort === 'oldest') all.sort(byCreated)
      else all.sort((a, b) => byCreated(b, a))
      return all.map(clone)
    },
    async setStatus(id, status: MessageStatus) {
      const record = store.get(id)
      if (!record || !canTransition(MESSAGE_TRANSITIONS, record.status, status)) return false
      record.status = status
      record.updatedAt = new Date()
      return true
    },
    async remove(id) {
      order.delete(id)
      return store.delete(id)
    },
    async countUnread() {
      return [...store.values()].filter((m) => m.status === 'unread').length
    },
    async changedSince(since) {
      return [...store.values()]
        .filter((m) => m.updatedAt.getTime() > since.getTime())
        .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
        .map(clone)
    },
  }
}
