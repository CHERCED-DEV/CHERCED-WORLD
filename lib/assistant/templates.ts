import { t, type Dictionary } from '@/lib/i18n/translate'

export const ASSISTANT_TEMPLATE_KEYS = [
  'assistant.unknown',
  'assistant.outOfScope',
  'assistant.link.live',
  'assistant.link.github',
  'assistant.tpl.greeting',
  'assistant.tpl.topics',
  'assistant.tpl.thanks',
  'assistant.tpl.technologies',
  'assistant.tpl.strongest',
  'assistant.tpl.techKnown',
  'assistant.tpl.techLevel',
  'assistant.tpl.techProjects',
  'assistant.tpl.techNoProjects',
  'assistant.tpl.techMention',
  'assistant.tpl.techUnknown',
  'assistant.tpl.projects',
  'assistant.tpl.projectsWithTech',
  'assistant.tpl.projectTech',
  'assistant.tpl.caseDetail',
  'assistant.tpl.adr',
  'assistant.tpl.experience',
  'assistant.tpl.present',
  'assistant.tpl.services',
  'assistant.tpl.hire',
  'assistant.tpl.education',
  'assistant.tpl.courses',
  'assistant.tpl.languages',
  'assistant.tpl.contact',
  'assistant.tpl.contactForm',
  'assistant.tpl.socials',
  'assistant.tpl.blog',
  'assistant.tpl.search',
  'assistant.tpl.refusal',
  'assistant.tpl.askDirect',
  'assistant.tpl.and',
] as const

export type AssistantTemplateKey = (typeof ASSISTANT_TEMPLATE_KEYS)[number]

export type AssistantTemplates = Record<AssistantTemplateKey, string>

export function pickAssistantTemplates(dict: Dictionary): AssistantTemplates {
  return Object.fromEntries(ASSISTANT_TEMPLATE_KEYS.map((key) => [key, t(dict, key)])) as AssistantTemplates
}

export function render(templates: AssistantTemplates, key: AssistantTemplateKey, vars?: Record<string, string | number>): string {
  return t(templates, key, vars)
}
