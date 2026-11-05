import { z } from 'zod'
import type { CapabilityName, JsonSchema } from './types'

export const CAPABILITY_LIMITS = {
  query: 100,
  limitMin: 1,
  limitMax: 10,
  limitDefault: 5,
  text: 60,
} as const

const ID_PATTERN = /^[A-Za-z0-9_-]{1,40}$/

export type CapabilityInput = { json: JsonSchema; zod: z.ZodType }

export type CapabilityInputs = Record<CapabilityName, CapabilityInput>

const EMPTY: CapabilityInput = {
  json: { type: 'object', properties: {}, additionalProperties: false },
  zod: z.object({}).strict(),
}

function areaInput(areas: readonly string[]): CapabilityInput {
  const [first, ...rest] = areas
  if (first === undefined) {
    return {
      json: {
        type: 'object',
        properties: { area: { type: 'string', maxLength: CAPABILITY_LIMITS.text } },
        additionalProperties: false,
      },
      zod: z.object({ area: z.string().max(CAPABILITY_LIMITS.text).optional() }).strict(),
    }
  }
  const values: [string, ...string[]] = [first, ...rest]
  return {
    json: {
      type: 'object',
      properties: { area: { type: 'string', enum: values } },
      additionalProperties: false,
    },
    zod: z.object({ area: z.enum(values).optional() }).strict(),
  }
}

function optionalText(key: string): CapabilityInput {
  return {
    json: {
      type: 'object',
      properties: { [key]: { type: 'string', minLength: 1, maxLength: CAPABILITY_LIMITS.text } },
      additionalProperties: false,
    },
    zod: z.object({ [key]: z.string().trim().min(1).max(CAPABILITY_LIMITS.text).optional() }).strict(),
  }
}

export function capabilityInputs(areas: readonly string[]): CapabilityInputs {
  return {
    search_portfolio: {
      json: {
        type: 'object',
        properties: {
          query: { type: 'string', minLength: 1, maxLength: CAPABILITY_LIMITS.query },
          limit: {
            default: CAPABILITY_LIMITS.limitDefault,
            type: 'integer',
            minimum: CAPABILITY_LIMITS.limitMin,
            maximum: CAPABILITY_LIMITS.limitMax,
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      zod: z
        .object({
          query: z.string().trim().min(1).max(CAPABILITY_LIMITS.query),
          limit: z
            .number()
            .int()
            .min(CAPABILITY_LIMITS.limitMin)
            .max(CAPABILITY_LIMITS.limitMax)
            .default(CAPABILITY_LIMITS.limitDefault),
        })
        .strict(),
    },
    get_project: {
      json: {
        type: 'object',
        properties: { id: { type: 'string', pattern: ID_PATTERN.source } },
        required: ['id'],
        additionalProperties: false,
      },
      zod: z.object({ id: z.string().regex(ID_PATTERN) }).strict(),
    },
    list_projects: optionalText('technology'),
    get_experience: EMPTY,
    get_skills: areaInput(areas),
    list_posts: optionalText('tag'),
    get_cv: EMPTY,
    set_preferences: {
      json: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['es', 'en'] },
          theme: { type: 'string', enum: ['light', 'dark'] },
        },
        additionalProperties: false,
      },
      zod: z.object({ language: z.enum(['es', 'en']).optional(), theme: z.enum(['light', 'dark']).optional() }).strict(),
    },
  }
}
