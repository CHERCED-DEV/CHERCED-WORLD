import 'server-only'
import type { AvatarImage, ProfileConsent, ProfilePatch, ProfileRecord, ProfileRepo } from '../types'
import { clone } from './ids'

type Stored = { record: ProfileRecord; image: Uint8Array | null }

export function emptyProfile(accountId: string, consent: ProfileConsent, now: Date): ProfileRecord {
  return {
    accountId,
    country: null,
    city: null,
    role: null,
    company: null,
    linkedin: null,
    github: null,
    languages: [],
    reason: null,
    reasonNote: null,
    preferences: { lang: null, theme: null },
    photo: 'google',
    avatar: null,
    consent: { version: consent.version, acceptedAt: new Date(consent.acceptedAt) },
    createdAt: new Date(now),
    updatedAt: new Date(now),
  }
}

export function createMemoryProfileRepo(): ProfileRepo {
  const profiles = new Map<string, Stored>()

  return {
    async get(accountId) {
      const stored = profiles.get(accountId)
      return stored ? clone(stored.record) : null
    },
    async getMany(accountIds) {
      return accountIds.flatMap((id) => {
        const stored = profiles.get(id)
        return stored ? [clone(stored.record)] : []
      })
    },
    async save(accountId, patch: ProfilePatch, now, consent) {
      const existing = profiles.get(accountId)
      if (!existing && !consent) return null
      const stored: Stored = existing ?? { record: emptyProfile(accountId, consent!, now), image: null }
      const { avatar, ...fields } = patch
      Object.assign(stored.record, clone(fields), { updatedAt: new Date(now) })
      if (avatar === null) {
        stored.record.avatar = null
        stored.image = null
      } else if (avatar) {
        stored.image = new Uint8Array(avatar.data)
        stored.record.avatar = { type: avatar.type, bytes: avatar.data.byteLength, updatedAt: new Date(now) }
      }
      profiles.set(accountId, stored)
      return clone(stored.record)
    },
    async getAvatar(accountId) {
      const stored = profiles.get(accountId)
      if (!stored?.image || !stored.record.avatar) return null
      const image: AvatarImage = { ...clone(stored.record.avatar), data: new Uint8Array(stored.image) }
      return image
    },
    async remove(accountId) {
      return profiles.delete(accountId)
    },
  }
}
