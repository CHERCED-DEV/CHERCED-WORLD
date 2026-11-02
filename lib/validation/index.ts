import { z } from 'zod'

export const LIMITS = {
  name: 60,
  email: 100,
  message: 1000,
  comment: 1000,
  reply: 1000,
  passwordMin: 12,
  passwordMax: 256,
} as const

export const PHONE_PATTERN = /^\+?[0-9 ()-]{6,20}$/

export const SETUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const SETUP_CODE_LENGTH = 8

export const ERROR_KEYS = {
  required: 'form.required',
  email: 'form.email.invalid',
  tooLong: 'form.tooLong',
  phone: 'form.phone.invalid',
  consent: 'privacy.required',
  passwordTooShort: 'form.password.tooShort',
  passwordMismatch: 'form.password.mismatch',
  code: 'form.code.invalid',
} as const

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS]

const requiredText = (max: number) =>
  z
    .string({ error: ERROR_KEYS.required })
    .trim()
    .min(1, { error: ERROR_KEYS.required })
    .max(max, { error: ERROR_KEYS.tooLong })

const email = z
  .string({ error: ERROR_KEYS.required })
  .trim()
  .min(1, { error: ERROR_KEYS.required })
  .max(LIMITS.email, { error: ERROR_KEYS.tooLong })
  .pipe(z.email({ error: ERROR_KEYS.email }))

const phone = z.preprocess(
  (value) => (typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : (value ?? null)),
  z.string({ error: ERROR_KEYS.phone }).regex(PHONE_PATTERN, { error: ERROR_KEYS.phone }).nullable(),
)

const consent = z.preprocess(
  (value) => value === true || value === 'on' || value === 'true',
  z.literal(true, { error: ERROR_KEYS.consent }),
)

export const contactSchema = z.object({
  name: requiredText(LIMITS.name),
  email,
  phone,
  message: requiredText(LIMITS.message),
  consent,
})

export const commentSchema = z.object({
  postId: z.string({ error: ERROR_KEYS.required }).trim().min(1, { error: ERROR_KEYS.required }),
  userName: requiredText(LIMITS.name),
  email,
  comment: requiredText(LIMITS.comment),
  consent,
})

export const passwordSchema = z
  .string({ error: ERROR_KEYS.required })
  .min(LIMITS.passwordMin, { error: ERROR_KEYS.passwordTooShort })
  .max(LIMITS.passwordMax, { error: ERROR_KEYS.tooLong })

const setupCodePattern = new RegExp(`^[${SETUP_CODE_ALPHABET}]{${SETUP_CODE_LENGTH}}$`)

export function normalizeSetupCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export const setupSchema = z
  .object({
    code: z
      .string({ error: ERROR_KEYS.required })
      .transform(normalizeSetupCode)
      .pipe(z.string().regex(setupCodePattern, { error: ERROR_KEYS.code })),
    password: passwordSchema,
    confirm: z.string({ error: ERROR_KEYS.required }),
  })
  .refine((value) => value.password === value.confirm, {
    error: ERROR_KEYS.passwordMismatch,
    path: ['confirm'],
  })

export const replySchema = z.object({
  text: requiredText(LIMITS.reply),
})

export type ContactInput = z.infer<typeof contactSchema>
export type CommentInput = z.infer<typeof commentSchema>
export type SetupInput = z.infer<typeof setupSchema>
export type ReplyInput = z.infer<typeof replySchema>

export type FieldErrors = Record<string, ErrorKey | string>

export type ParseResult<T> = { success: true; data: T } | { success: false; fieldErrors: FieldErrors }

export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !(key in result)) result[key] = value
  }
  return result
}

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : '_form'
    if (!(field in errors)) errors[field] = issue.message
  }
  return errors
}

export function parseInput<S extends z.ZodType>(schema: S, input: unknown): ParseResult<z.output<S>> {
  const result = schema.safeParse(input)
  if (result.success) return { success: true, data: result.data }
  return { success: false, fieldErrors: fieldErrorsFrom(result.error) }
}

export function parseForm<S extends z.ZodType>(schema: S, formData: FormData): ParseResult<z.output<S>> {
  return parseInput(schema, formDataToObject(formData))
}
