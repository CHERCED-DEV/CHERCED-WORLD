import 'server-only'
import { Binary } from 'mongodb'
import { isLocale } from '@/lib/i18n/config'
import {
  AVATAR_TYPES,
  PHOTO_SOURCES,
  PROFILE_REASONS,
  type AvatarType,
  type PhotoSource,
  type ProfileReason,
  type ProfileRecord,
  type ProfileRepo,
} from '@/lib/data/types'
import { profilesCollection, type DbProvider, type ProfileDoc } from './collections'

const WITHOUT_IMAGE = { 'avatar.data': 0 } as const

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function dateOr(value: unknown, fallback: Date): Date {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value : fallback
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | null {
  return list.includes(value as T) ? (value as T) : null
}

export function toProfileRecord(doc: ProfileDoc): ProfileRecord {
  const createdAt = dateOr(doc.createdAt, new Date(0))
  const avatarType = oneOf<AvatarType>(AVATAR_TYPES, doc.avatar?.type)
  const theme = doc.preferences?.theme
  const lang = doc.preferences?.lang
  return {
    accountId: doc._id,
    country: textOrNull(doc.country),
    city: textOrNull(doc.city),
    role: textOrNull(doc.role),
    company: textOrNull(doc.company),
    linkedin: textOrNull(doc.linkedin),
    github: textOrNull(doc.github),
    languages: Array.isArray(doc.languages) ? doc.languages.filter((item): item is string => typeof item === 'string') : [],
    reason: oneOf<ProfileReason>(PROFILE_REASONS, doc.reason),
    reasonNote: textOrNull(doc.reasonNote),
    preferences: {
      lang: typeof lang === 'string' && isLocale(lang) ? lang : null,
      theme: theme === 'dark' || theme === 'light' ? theme : null,
    },
    photo: oneOf<PhotoSource>(PHOTO_SOURCES, doc.photo) ?? 'google',
    avatar:
      doc.avatar && avatarType && typeof doc.avatar.bytes === 'number'
        ? { type: avatarType, bytes: doc.avatar.bytes, updatedAt: dateOr(doc.avatar.updatedAt, createdAt) }
        : null,
    consent: {
      version: typeof doc.consent?.version === 'string' ? doc.consent.version : '',
      acceptedAt: dateOr(doc.consent?.acceptedAt, createdAt),
    },
    createdAt,
    updatedAt: dateOr(doc.updatedAt, createdAt),
  }
}

export function createMongoProfileRepo(db: DbProvider): ProfileRepo {
  return {
    async get(accountId) {
      const doc = await (await profilesCollection(db)).findOne({ _id: accountId }, { projection: WITHOUT_IMAGE })
      return doc ? toProfileRecord(doc) : null
    },
    async getMany(accountIds) {
      if (accountIds.length === 0) return []
      const docs = await (await profilesCollection(db))
        .find({ _id: { $in: [...accountIds] } }, { projection: WITHOUT_IMAGE })
        .limit(accountIds.length)
        .toArray()
      return docs.map(toProfileRecord)
    },
    async save(accountId, patch, now, consent) {
      const { avatar, ...fields } = patch
      const set: Record<string, unknown> = { ...fields, updatedAt: now }
      if (avatar === null) set.avatar = null
      else if (avatar) set.avatar = { data: new Binary(avatar.data), type: avatar.type, bytes: avatar.data.byteLength, updatedAt: now }
      const update: Record<string, unknown> = { $set: set }
      if (consent) {
        const defaults: Record<string, unknown> = {
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
          consent: { version: consent.version, acceptedAt: consent.acceptedAt },
          createdAt: now,
        }
        for (const key of Object.keys(set)) delete defaults[key]
        update.$setOnInsert = defaults
      }
      const doc = await (await profilesCollection(db)).findOneAndUpdate({ _id: accountId }, update, {
        upsert: Boolean(consent),
        returnDocument: 'after',
        projection: WITHOUT_IMAGE,
      })
      return doc ? toProfileRecord(doc) : null
    },
    async getAvatar(accountId) {
      const doc = await (await profilesCollection(db)).findOne({ _id: accountId }, { projection: { avatar: 1 } })
      const avatar = doc?.avatar
      const type = oneOf<AvatarType>(AVATAR_TYPES, avatar?.type)
      if (!avatar?.data || !type) return null
      const data = avatar.data.value()
      return { type, bytes: data.byteLength, updatedAt: dateOr(avatar.updatedAt, new Date(0)), data }
    },
    async remove(accountId) {
      const result = await (await profilesCollection(db)).deleteOne({ _id: accountId })
      return result.deletedCount === 1
    },
  }
}
