export const SKILL_FILE_NAME = 'SKILL.md'

export const SKILL_NAME_MAX = 64

export const SKILL_DESCRIPTION_MAX = 1024

export const SKILL_RESERVED_WORDS = ['anthropic', 'claude'] as const

export const SKILL_FIELDS = ['name', 'description', 'steps'] as const

export type SkillField = (typeof SKILL_FIELDS)[number]

export type SkillErrorCode = 'required' | 'tooLong' | 'format' | 'reserved' | 'markup'

export type SkillErrors = Partial<Record<SkillField, SkillErrorCode>>

export type SkillInput = { name: string; description: string; steps: string }

export type SkillDraft = { name: string; description: string; steps: string[] }

export type SkillCheck = { ok: true; skill: SkillDraft; errors: SkillErrors } | { ok: false; skill: SkillDraft; errors: SkillErrors }

export type SkillFileError = 'missing' | 'unclosed' | 'syntax'

export type SkillFileCheck = {
  ok: boolean
  name: string | null
  description: string | null
  errors: { frontmatter?: SkillFileError; name?: SkillErrorCode; description?: SkillErrorCode }
}

export type SkillMarkdownOptions = { stepsHeading: string }

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MARKUP = /[<>]/
const LIST_MARKER = /^\s*(?:[-*+•]|\d{1,3}[.)])\s+/
const YAML_WORDS = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off', 'y', 'n'])
const KEY_LINE = /^([A-Za-z][\w-]*):(?:[ \t]+(.*))?$/

function printable(char: string): boolean {
  const code = char.codePointAt(0) ?? 0
  return code >= 0x20 && !(code >= 0x7f && code <= 0x9f) && !(code >= 0xd800 && code <= 0xdfff)
}

function length(value: string): number {
  return [...value].length
}

export function cleanLine(value: string): string {
  return [...value.replace(/\s+/g, ' ')].filter(printable).join('').trim()
}

export function parseSteps(value: string): string[] {
  return value
    .split(/\r?\n|\r/)
    .map((line) => cleanLine(line.replace(LIST_MARKER, '')))
    .filter((line) => line.length > 0)
}

export function toDraft(input: SkillInput): SkillDraft {
  return { name: input.name.trim(), description: cleanLine(input.description), steps: parseSteps(input.steps) }
}

export function nameError(name: string): SkillErrorCode | undefined {
  if (name.length === 0) return 'required'
  if (length(name) > SKILL_NAME_MAX) return 'tooLong'
  if (!NAME_PATTERN.test(name)) return 'format'
  if (SKILL_RESERVED_WORDS.some((word) => name.includes(word))) return 'reserved'
  return undefined
}

export function descriptionError(description: string): SkillErrorCode | undefined {
  if (description.trim().length === 0) return 'required'
  if (length(description) > SKILL_DESCRIPTION_MAX) return 'tooLong'
  if (MARKUP.test(description)) return 'markup'
  return undefined
}

export function stepsError(steps: readonly string[]): SkillErrorCode | undefined {
  return steps.length === 0 ? 'required' : undefined
}

export function checkSkill(input: SkillInput): SkillCheck {
  const skill = toDraft(input)
  const errors: SkillErrors = {}
  const name = nameError(skill.name)
  const description = descriptionError(skill.description)
  const steps = stepsError(skill.steps)
  if (name) errors.name = name
  if (description) errors.description = description
  if (steps) errors.steps = steps
  return Object.keys(errors).length === 0 ? { ok: true, skill, errors } : { ok: false, skill, errors }
}

export function suggestName(raw: string): string | null {
  const slug = raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(new RegExp(SKILL_RESERVED_WORDS.join('|'), 'g'), ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SKILL_NAME_MAX)
    .replace(/-+$/, '')
  if (slug === raw.trim() || nameError(slug)) return null
  return slug
}

export function skillTitle(name: string): string {
  const words = name.split('-').filter(Boolean).join(' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function yamlName(name: string): string {
  return /^[0-9]/.test(name) || YAML_WORDS.has(name) ? yamlString(name) : name
}

export function generateSkillMd(skill: SkillDraft, options: SkillMarkdownOptions): string {
  const steps = skill.steps.map(cleanLine).filter(Boolean).map((step, index) => `${index + 1}. ${step}`)
  return [
    '---',
    `name: ${yamlName(skill.name)}`,
    `description: ${yamlString(cleanLine(skill.description))}`,
    '---',
    '',
    `# ${skillTitle(skill.name)}`,
    '',
    `## ${options.stepsHeading}`,
    '',
    ...steps,
    '',
  ].join('\n')
}

function unescapeDouble(body: string): string | null {
  let out = ''
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index]!
    if (char === '"') return null
    if (char !== '\\') {
      out += char
      continue
    }
    const next = body[index + 1]
    index += 1
    if (next === '\\' || next === '"' || next === '/') out += next
    else if (next === 'n') out += '\n'
    else if (next === 't') out += '\t'
    else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(body.slice(index + 1, index + 5))) {
      out += String.fromCharCode(Number.parseInt(body.slice(index + 1, index + 5), 16))
      index += 4
    } else return null
  }
  return out
}

type Scalar = { value: string; quoted: boolean }

function readScalar(raw: string): Scalar | null {
  const value = raw.trim()
  if (value.startsWith('"')) {
    if (value.length < 2 || !value.endsWith('"')) return null
    const body = unescapeDouble(value.slice(1, -1))
    return body === null ? null : { value: body, quoted: true }
  }
  if (value.startsWith("'")) {
    if (value.length < 2 || !value.endsWith("'")) return null
    const body = value.slice(1, -1)
    if (/(^|[^'])'([^']|$)/.test(body)) return null
    return { value: body.replace(/''/g, "'"), quoted: true }
  }
  if (/^[[\]{},&*!|>%@`]/.test(value) || /:(\s|$)/.test(value)) return null
  return { value: value.replace(/\s+#.*$/, ''), quoted: false }
}

export function readFrontmatter(text: string): { fields: Record<string, Scalar>; error?: SkillFileError } {
  const lines = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n')
  if (lines[0] !== '---') return { fields: {}, error: 'missing' }
  const end = lines.indexOf('---', 1)
  if (end === -1) return { fields: {}, error: 'unclosed' }
  const fields: Record<string, Scalar> = {}
  for (const line of lines.slice(1, end)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue
    if (/^\s/.test(line)) continue
    const match = KEY_LINE.exec(line)
    if (!match) return { fields, error: 'syntax' }
    const key = match[1]!
    if (Object.prototype.hasOwnProperty.call(fields, key)) return { fields, error: 'syntax' }
    const scalar = readScalar(match[2] ?? '')
    if (!scalar) {
      if (key === 'name' || key === 'description') return { fields, error: 'syntax' }
      continue
    }
    fields[key] = scalar
  }
  return { fields }
}

export function validateSkillMd(text: string): SkillFileCheck {
  const { fields, error } = readFrontmatter(text)
  if (error) return { ok: false, name: null, description: null, errors: { frontmatter: error } }
  const errors: SkillFileCheck['errors'] = {}
  const name = fields.name ?? null
  const description = fields.description ?? null
  const nameProblem = name ? (!name.quoted && /^[0-9]|^(true|false|null|yes|no|on|off|y|n|~)$/i.test(name.value) ? 'format' : nameError(name.value)) : 'required'
  const descriptionProblem = description ? descriptionError(description.value) : 'required'
  if (nameProblem) errors.name = nameProblem
  if (descriptionProblem) errors.description = descriptionProblem
  return { ok: Object.keys(errors).length === 0, name: name?.value ?? null, description: description?.value ?? null, errors }
}
