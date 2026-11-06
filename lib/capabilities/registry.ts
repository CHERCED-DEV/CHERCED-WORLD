import type { Localized } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import type { SearchIndex } from '@/lib/search/types'
import {
  getCv,
  getExperience,
  getProject,
  getSkills,
  listPosts,
  listProjects,
  searchPortfolio,
  setPreferences,
  type HandlerEnv,
} from './handlers'
import type { PreferencesPort } from './preferences'
import { capabilityInputs, type CapabilityInputs } from './schemas'
import { CAPABILITY_NAMES, CapabilityError, type Capability, type CapabilityEffect, type CapabilityName } from './types'

export const CAPABILITY_EFFECTS: Readonly<Record<CapabilityName, CapabilityEffect>> = {
  search_portfolio: 'read',
  get_project: 'read',
  list_projects: 'read',
  get_experience: 'read',
  get_skills: 'read',
  list_posts: 'read',
  get_cv: 'read',
  set_preferences: 'view',
}

export const CAPABILITY_UI: Readonly<Record<CapabilityName, string>> = {
  search_portfolio: 'palette',
  get_project: '/portfolio/[id]',
  list_projects: '/portfolio',
  get_experience: '/aboutMe',
  get_skills: '/aboutMe#lobe-<id>',
  list_posts: '/blog',
  get_cv: 'CvLink',
  set_preferences: 'ThemeToggle, LangSwitch',
}

export type CapabilityDescriptions = Record<CapabilityName, Localized>

export function capabilityDescriptions(es: Dictionary, en: Dictionary): CapabilityDescriptions {
  return Object.fromEntries(
    CAPABILITY_NAMES.map((name) => [name, { es: t(es, `capability.${name}`), en: t(en, `capability.${name}`) }]),
  ) as CapabilityDescriptions
}

export type CapabilityDeps = {
  loadIndex: (lang: Locale) => Promise<SearchIndex>
  descriptions: CapabilityDescriptions
  areas: readonly string[]
  origin?: string | null
  preferences?: PreferencesPort | null
}

type Run = (input: never, index: () => Promise<SearchIndex>) => unknown

function runners(env: HandlerEnv, preferences: PreferencesPort | null): Record<CapabilityName, Run> {
  return {
    search_portfolio: async (input: { query: string; limit: number }, index) => searchPortfolio(await index(), input, env),
    get_project: async (input: { id: string }, index) => getProject(await index(), input, env),
    list_projects: async (input: { technology?: string }, index) => listProjects(await index(), input, env),
    get_experience: async (_input: object, index) => getExperience(await index()),
    get_skills: async (input: { area?: string }, index) => getSkills(await index(), input, env),
    list_posts: async (input: { tag?: string }, index) => listPosts(await index(), input, env),
    get_cv: async (_input: object, index) => getCv(await index(), env),
    set_preferences: async (input: { language?: Locale; theme?: 'light' | 'dark' }) => setPreferences(preferences, input),
  }
}

function describeIssues(error: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> }): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.map(String).join('.') : 'input'}: ${issue.message}`)
    .join('; ')
}

export function createCapabilities(deps: CapabilityDeps): Capability[] {
  const inputs: CapabilityInputs = capabilityInputs(deps.areas)
  const run = runners({ origin: deps.origin ?? null }, deps.preferences ?? null)
  return CAPABILITY_NAMES.map((name) => ({
    name,
    description: deps.descriptions[name],
    inputSchema: inputs[name].json,
    effect: CAPABILITY_EFFECTS[name],
    async execute(input: unknown, context) {
      const parsed = inputs[name].zod.safeParse(input ?? {})
      if (!parsed.success) throw new CapabilityError('invalid_input', describeIssues(parsed.error))
      return run[name](parsed.data as never, () => deps.loadIndex(context.lang))
    },
  }))
}

export function findCapability(capabilities: readonly Capability[], name: CapabilityName): Capability {
  const found = capabilities.find((capability) => capability.name === name)
  if (!found) throw new CapabilityError('not_found', `Unknown capability "${name}"`)
  return found
}
