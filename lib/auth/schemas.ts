import { z } from 'zod'
import { ERROR_KEYS, LIMITS, passwordSchema } from '@/lib/validation'

export const loginSchema = z.object({
  password: z
    .string({ error: ERROR_KEYS.required })
    .min(1, { error: ERROR_KEYS.required })
    .max(LIMITS.passwordMax, { error: ERROR_KEYS.tooLong }),
})

export const changePasswordSchema = z
  .object({
    current: z
      .string({ error: ERROR_KEYS.required })
      .min(1, { error: ERROR_KEYS.required })
      .max(LIMITS.passwordMax, { error: ERROR_KEYS.tooLong }),
    password: passwordSchema,
    confirm: z.string({ error: ERROR_KEYS.required }),
  })
  .refine((value) => value.password === value.confirm, {
    error: ERROR_KEYS.passwordMismatch,
    path: ['confirm'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
