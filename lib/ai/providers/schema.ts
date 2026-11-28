import { z } from 'zod'

type Json = Record<string, unknown>

export const SCHEMA_ISSUES_MAX = 3

function record(value: unknown): Json | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : null
}

export function jsonSchemaOf(schema: z.ZodType<unknown>): Json {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'output', unrepresentable: 'any', reused: 'inline' }) as Json
  return rest
}

const GEMINI_TYPES: Readonly<Record<string, string>> = {
  string: 'STRING',
  number: 'NUMBER',
  integer: 'INTEGER',
  boolean: 'BOOLEAN',
  object: 'OBJECT',
  array: 'ARRAY',
}

const SAFE_LIMIT = Number.MAX_SAFE_INTEGER

function literalType(value: unknown): string {
  if (typeof value === 'number') return Number.isInteger(value) ? 'INTEGER' : 'NUMBER'
  if (typeof value === 'boolean') return 'BOOLEAN'
  return 'STRING'
}

export function toGeminiSchema(node: unknown): Json {
  const schema = record(node)
  if (!schema) return { type: 'STRING' }
  const out: Json = {}
  if (typeof schema.description === 'string') out.description = schema.description

  const variants = Array.isArray(schema.anyOf) ? schema.anyOf : Array.isArray(schema.oneOf) ? schema.oneOf : null
  if (variants) {
    const solid = variants.filter((variant) => record(variant)?.type !== 'null')
    const nullable = solid.length < variants.length
    if (solid.length === 1) return { ...toGeminiSchema(solid[0]), ...out, ...(nullable ? { nullable: true } : {}) }
    return { ...out, anyOf: solid.map(toGeminiSchema), ...(nullable ? { nullable: true } : {}) }
  }

  if (schema.const !== undefined) return { ...out, type: literalType(schema.const), enum: [String(schema.const)] }
  if (Array.isArray(schema.enum)) {
    const values = schema.enum.filter((value) => value !== null)
    return { ...out, type: literalType(values[0]), enum: values.map(String), ...(values.length < schema.enum.length ? { nullable: true } : {}) }
  }

  const declared = Array.isArray(schema.type) ? schema.type : [schema.type]
  const types = declared.filter((type): type is string => typeof type === 'string' && type !== 'null')
  if (types.length < declared.length) out.nullable = true
  const type = types[0] ?? 'string'
  out.type = GEMINI_TYPES[type] ?? 'STRING'

  if (type === 'object') {
    const properties = record(schema.properties) ?? {}
    out.properties = Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, toGeminiSchema(value)]))
    if (Array.isArray(schema.required) && schema.required.length) out.required = schema.required
    out.propertyOrdering = Object.keys(properties)
  } else if (type === 'array') {
    out.items = toGeminiSchema(schema.items)
    if (typeof schema.minItems === 'number') out.minItems = schema.minItems
    if (typeof schema.maxItems === 'number') out.maxItems = schema.maxItems
  } else if (type === 'number' || type === 'integer') {
    if (typeof schema.minimum === 'number' && Math.abs(schema.minimum) < SAFE_LIMIT) out.minimum = schema.minimum
    if (typeof schema.maximum === 'number' && Math.abs(schema.maximum) < SAFE_LIMIT) out.maximum = schema.maximum
  }
  return out
}

export type ParsedOutput<T> = { ok: true; data: T } | { ok: false; reason: string }

export function parseStructured<T>(text: string, schema: z.ZodType<T>): ParsedOutput<T> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: text.trim() ? 'la salida no es JSON' : 'la salida llegó vacía' }
  }
  const parsed = schema.safeParse(raw)
  if (parsed.success) return { ok: true, data: parsed.data }
  return { ok: false, reason: schemaIssues(parsed.error) }
}

export function schemaIssues(error: z.ZodError): string {
  const issues = error.issues.slice(0, SCHEMA_ISSUES_MAX).map((issue) => `${issue.path.join('.') || 'raíz'}: ${issue.message}`)
  return `no cumple el esquema (${issues.join('; ')})`
}

export function retryNote(reason: string): string {
  return `\n\nTu respuesta anterior no sirvió: ${reason}. Responde otra vez, solo con JSON que cumpla el esquema pedido.`
}
