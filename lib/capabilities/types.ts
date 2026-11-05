import type { Localized } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export const READ_CAPABILITIES = [
  'search_portfolio',
  'get_project',
  'list_projects',
  'get_experience',
  'get_skills',
  'list_posts',
  'get_cv',
] as const

export const CAPABILITY_NAMES = [...READ_CAPABILITIES, 'set_preferences'] as const

export type CapabilityName = (typeof CAPABILITY_NAMES)[number]

export type CapabilityEffect = 'read' | 'view' | 'draft'

export type JsonSchema = { readonly [key: string]: unknown }

export type CapabilityContext = { lang: Locale }

export type Capability<I = unknown, O = unknown> = {
  name: CapabilityName
  description: Localized
  inputSchema: JsonSchema
  effect: CapabilityEffect
  execute(input: I, context: CapabilityContext): Promise<O>
}

export type CapabilityErrorCode = 'invalid_input' | 'not_found' | 'unavailable'

export class CapabilityError extends Error {
  readonly code: CapabilityErrorCode

  constructor(code: CapabilityErrorCode, message: string) {
    super(message)
    this.name = 'CapabilityError'
    this.code = code
  }
}

export function isCapabilityName(value: unknown): value is CapabilityName {
  return typeof value === 'string' && (CAPABILITY_NAMES as readonly string[]).includes(value)
}
