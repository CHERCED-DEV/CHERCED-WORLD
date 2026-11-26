import { z } from 'zod'

export type JsonSchema = Record<string, unknown>

function clean(schema: JsonSchema): JsonSchema {
  const { $schema: _dialect, ...rest } = schema
  return rest
}

export function inputJsonSchema(schema: z.ZodType): JsonSchema {
  const json = clean(z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as JsonSchema)
  return json.type === 'object' ? json : { type: 'object', properties: {}, additionalProperties: false }
}

export function outputJsonSchema(schema: z.ZodType): JsonSchema {
  return clean(z.toJSONSchema(schema, { io: 'output', unrepresentable: 'any' }) as JsonSchema)
}

export function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 6)
    .map((issue) => {
      const path = issue.path.map(String).join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')
}
